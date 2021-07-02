/*
 **INVESTMENT ROUTER
 */
const { Router } = require('express');
const router = Router();
const InvestmentModel = require('../Models/investment.model');
const UserModel = require('../Models/user.model');
const TransactionModel = require('../Models/transaction.model');


/*
 **CHECK MY CURRENT INVESTMENTS ROUTE
 */
 router.get('/', async (req, res) => {
    // Request required data
    const userId = req.user._id;

    // Query UserModel to get user data
    const userData = await UserModel.findById(userId).populate([
        {
            path: 'transactions',
            populate: [
                {path: 'userId', select: 'name', model: 'users'},
                {path: 'investmentId', select: 'name', model: 'investments'}
            ]
        }
    ]);

    // Return requested data
    return res.status(200).send({message: userData});
});


/*
 **CREATE INVESTMENT PLAN ROUTE
 */
router.post('/create', async (req, res) => {
    // { 
    //     "name": "AIG Bonds",
    //     "description": "AIG Bonds is an investment package that uses your funds to trade bonds",
    //     "minInvestment": 100000,
    //     "expectedReturn": "37%",
    //     "returnFrequency": "30 days",
    //     "investmentCurrency": "NGN",
    //     "investmentDuration": "3 months",
    //     "targetAmount": 10000000,
    //     "fundingOpeningDate": "23-06-2021",
    //     "fundingClosingDate": "30-06-2021"
    // }
    // Request required data
    const userId = req.user._id;
    const {
        name,
        description,
        minInvestment,
        expectedReturn,
        returnFrequency,
        investmentCurrency,
        investmentDuration,
        targetAmount,
        fundingOpeningDate,
        fundingClosingDate,
    } = req.body;

    // Validate input values
    if (!name || name === null ) return res.status(400).send({message: 'Input investment name'});
    if (!description || description === null ) return res.status(400).send({message: 'Input investment description'});
    if (!minInvestment || minInvestment === null ) return res.status(400).send({message: 'Input minimum investment amount'});
    if (!expectedReturn || expectedReturn === null ) return res.status(400).send({message: 'Input expected investment return'});
    if (!returnFrequency || returnFrequency === null ) return res.status(400).send({message: 'Input investment return frequency'});
    if (!investmentCurrency || investmentCurrency === null ) return res.status(400).send({message: 'Input investment currency'});
    if (!investmentDuration || investmentDuration === null ) return res.status(400).send({message: 'Input investment duration'});
    if (!targetAmount || targetAmount === null ) return res.status(400).send({message: 'Input investment target amount'});
    if (!fundingOpeningDate || fundingOpeningDate === null ) return res.status(400).send({message: 'Input investment funding opening date'});
    if (!fundingClosingDate || fundingClosingDate === null ) return res.status(400).send({message: 'Input investment funding closing date'});

    // Convert date inputs to date format
    const fundingOpeningDateInput = new Date(fundingOpeningDate).toISOString();
    const fundingClosingDateInput = new Date(fundingClosingDate).toISOString();

    try {
        //Insert data into investment model
        InvestmentModel.create({
            name,
            description,
            minInvestment,
            expectedReturn,
            returnFrequency,
            investmentCurrency,
            investmentDuration,
            targetAmount,
            fundingOpeningDate: fundingOpeningDateInput,
            fundingClosingDate: fundingClosingDateInput,
            admin: userId
            }, function (err, investment) {
            // Confirm query result
            if (err || !investment) return res.status(400).send(err);
            
            // Add investment id to user model
            const investmentID = investment._id;
            UserModel.findByIdAndUpdate(userId, { $push: { investments: investmentID }}, function (err, docs) {
                // Confirm query result
                if (err || !docs) return res.status(400).send(err);

                // Return response
                return res.status(200).json({message: 'Investment created', data: investment});
            });
        });
    } catch (err) {
        // Return error if any
        return res.status(400).send(err);
    }
});


/*
**INVEST ROUTE
*/
router.post('/invest', async (req, res) => {
    // Request required data
    const { invName, amount } = req.body;

    // Confirm User Input
    if (!invName) res.send('insert investment name');
    if (!amount) res.send('insert investment amount');

    // Get Investment From Database
    const investment = await InvestmentModel.findOne({ name: invName }).populate({ path: 'transactions', select: 'amount'}).populate({path: 'admin', select: 'name'});

    //Confirm Investment Existence
    if (!investment) return res.status(400).send('Investment not found');
    

    let invTotal = [];
    const userId = req.user._id;
    const investmentId = investment._id;
    const investmentTarget = investment.targetAmount;
    const investmentInvestors = investment.investors;
    const minInvestment = investment.minInvestment;

    const transactionsArray = investment.transactions;
    const transCounts = transactionsArray.length;

    // Confirm if investor exist in investment table
    const checkInvestor = investmentInvestors.indexOf(userId);

    // Store Investment Amount In Array
    for (i = 0; i < transCounts; i++) {
        invTotal.push(transactionsArray[i]['amount']);
    }

    // Sum Current Investment Funds
    const currentQuota = invTotal.reduce(function (a, b) {
        return a + b;
    }, 0);

    const remainingQuota = investmentTarget - currentQuota;//Calculate Remaining Quota to meet Target Amount

    // Confirm Minimum Investment Amount Requirement Is Met
    if (amount < minInvestment) return res.status(400).send({message: `Minimum investment amount is ${minInvestment}`})
    if (currentQuota >= investmentTarget) return res.status(400).send({message: `This investment plan is closed as target quota has been met.`})
    
    //Store Transaction In Database
    const transaction = await TransactionModel.create({
        userId,
        investmentId,
        amount
    });

    const transactionId = transaction._id;

    // Confirm Successful Storage Of Transaction Instance
    if (!transaction) return res.status(400).send({message: 'transaction incomplete'});

    // Confirm if investment exist in user portfolio
    const getUser = await UserModel.findById(userId);
    const getUserInvestments = getUser.investments;
    const checkInvestment = getUserInvestments.indexOf(investmentId);
    
    // Update both Investment And Transaction In User Model if investment is not in user investment portfolio
    if (checkInvestment === -1) await UserModel.findByIdAndUpdate(userId, { $push: { transactions: transactionId, investments: investmentId}}, {new: true});

    // Update only Transaction In User Model if investment is exist in user investment portfolio
    if (checkInvestment !== -1) await UserModel.findByIdAndUpdate(userId, { $push: { transactions: transactionId}}, {new: true});

    // Update Investor And Transaction In Investment Model if user does not exist in investment plan
    if (checkInvestor === -1) await InvestmentModel.findOneAndUpdate({ name: invName }, { $push: { investors: userId, transactions: transactionId }}, {new: true});

    // Update only Transaction In Investment Model if user exist in investment plan
    if (checkInvestor !== -1) await InvestmentModel.findOneAndUpdate({ name: invName }, { $push: { transactions: transactionId }}, {new: true});

    // Return Response
    return res.status(200).send({ message: `You just successfully invested ${amount} into ${invName}` });
});


/*
**VIEW INVESTMENT
*/
router.get('/:invName', async (req, res) => {
    // Request required data
    const { invName } = req.params;
    let invTotal = [];

    // Validate input
    if(!invName || invName == null) return res.status(400).send({message: 'Input investment name'});

    // Find investment in database and populate data
    const inv = await InvestmentModel.findOne({name: invName}).populate({ path: 'transactions', select: 'amount'}).populate({path: 'investors', select: 'name'}).populate({path: 'admin', select: 'name'});

    // Confirm investment existence in database
    if (!inv) return res.status(400).send({message: `${invName} Investment not found`})

    // Store investment data in variables
    const admin = inv.admin;
    const name = inv.name;
    const investors = inv.investors;
    const description = inv.description;
    const minInvestment = inv.minInvestment;
    const expectedReturn = inv.expectedReturn;
    const returnFrequency = inv.returnFrequency;
    const investmentCurrency = inv.investmentCurrency;
    const investmentDuration = inv.investmentDuration;
    const targetAmount = inv.targetAmount;
    const fundingOpeningDate = inv.fundingOpeningDate;
    const fundingClosingDate = inv.fundingClosingDate;

    const transactionsArray = inv.transactions;
    const transCounts = transactionsArray.length;

    // Store investment amount from database in array
    for (i = 0; i < transCounts; i++) {
        invTotal.push(transactionsArray[i]['amount']);
    }
    
    // Sum current investment amounts
    const currentQuota = invTotal.reduce(function (a, b) {
        return a + b;
    }, 0);

    //Calculate Remaining Quota to meet Target Amount
    const remainingQuota = currentQuota - targetAmount;

    let status;
    if (fundingClosingDate > Date.now()) status = 'open';
    if (fundingClosingDate < Date.now()) status = 'closed';

    //Object Of Data To Be Returned
    const data = {
        name,
        admin,
        investors,
        description,
        minInvestment,
        expectedReturn,
        returnFrequency,
        investmentCurrency,
        investmentDuration,
        currentQuota,
        targetAmount,
        remainingQuota,
        fundingOpeningDate,
        fundingClosingDate,
        status
    };

    //Return Response
    return res.status(200).send({data: data});
});


/*
 **GET INVESTMENT BY NAME ROUTE
 */
// router.post('/investment', async (req, res) => {
//     // Request required data
//     const { invName } = req.body;

//     // Get requested investment data
//     const investment = await InvestmentModel.findOne({name: invName}).populate([{ path: 'investors', select: 'name'}]);

//     // Return requested data
//     return res.status(200).send({message: investment});
// });


/*
**DELETE INVESTMENT ROUTE
*/
router.delete('/:invName', async (req, res) => {
    // Request required data
    const userId = req.user._id;
    const{ invName } = req.params;

    // Get investment using investment name
    const investment = await InvestmentModel.findOne({ name: invName });

    // Check if investment exist
    if (!investment) return res.status(400).send({message: 'Investment not found'});

    // Check if current user is the investment user admin
    if (userId != investment.admin) return res.status(401).send({message: 'Only the admin of this investment is authorized to delete it'});

    // Check count of investment transactions
    const invTransactionsCount = (investment.transactions).length;

    // Check if investment transaction is empty
    if (invTransactionsCount > 0) return res.status(401).send({message: 'You can only delete an investment if it has no investments'});

    // Delete investment
    await investment.delete();

    // Return success message
    return res.status(200).send({message: 'Investment deleted'});
});


module.exports = router;