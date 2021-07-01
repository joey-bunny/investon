/*
 **Investment Creation and management Router
 */
const { Router } = require('express');
const router = Router();
const InvestmentModel = require('../Models/investment.model');
const UserModel = require('../Models/user.model');
const TransactionModel = require('../Models/transaction.model');
/*
 **Create Investment Route
 */
router.post('/createinvestment', async (req, res) => {
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
            fundingOpeningDate,
            fundingClosingDate,
            admin: userId
        }, function (err, investment) {
            if (err) return res.send(err);
            const investmentID = investment._id;
            UserModel.findByIdAndUpdate(userId, { $push: { investments: investmentID }}, function (err, docs) {
                if (err) return res.send(err);
                console.log(docs);
                return res.status(200).json({message: 'Investment created', data: investment});
            });
        });
    } catch (err) {
        res.send(err);
    }
});

/*
**MAKE INVESTMENT ROUTE
*/
router.post('/makeInvestment', async (req, res) => {
    const {
        invName,
        amount
    } = req.body;

    // Confirm User Input
    if (!invName) res.send('insert investment name');
    if (!amount) res.send('insert investment amount');

    // Get Investment From Database
    const investment = await InvestmentModel.findOne({ name: invName }).populate({ path: 'transactions', select: 'amount'}).populate({path: 'admin', select: 'name'});

    //Confirm Investment Existence
    if (!investment) return res.status(400).send('Investment not found');
    
    const userId = req.user._id;
    const investmentId = investment._id;
    const investmentTarget = investment.targetAmount;
    const minInvestment = investment.minInvestment;

    const transactionsArray = investment.transactions;
    const transCounts = transactionsArray.length;
    const admin = investment.admin;

    // Store Investment Amount In Array
    for (i = 0; i < transCounts; i++) {
        invTotal.push(transactionsArray[i]['amount']);
    }

    // Sum Current Investment Funds
    const currentQuota = invTotal.reduce(function (a, b) {
        return a + b;
    }, 0);

    const remainingQuota = targetAmount - currentQuota;//Calculate Remaining Quota to meet Target Amount

    // Confirm Minimum Investment Amount Requirement Is Met
    if (amount < minInvestment) return res.status(400).send({message: `Minimum investment amount is ${minInvestment}`})
    if (currentQuota >= targetAmount) return res.status(400).send({message: `This investment plan is closed as target quota has been met.`})
    //Store Transaction In Database
    const transaction = await TransactionModel.create({
        userId,
        investmentId,
        amount
    });

    // Confirm Successful Storage Of Transaction Instance
    if (!transaction) return res.status(400).send({message: 'transaction incomplete'});

    const transactionId = transaction._id;

    console.log(transactionId)
    // Update Investment And Transaction In User Model
    const updateInvestor = await UserModel.findByIdAndUpdate(userId, { $push: { transactions: transactionId, investments: investmentId}}, {new: true});

    // Update Investor And Transaction In Investment Model
    const investmentUpdate = await InvestmentModel.findOneAndUpdate({ name: invName }, { $push: { investors: userId, transactions: transactionId }}, {new: true});

    // Return Log of transaction for confirmation
    console.log(transaction);
    console.log(updateInvestor);

    // Return Response
    return res.status(200).send(investmentUpdate);
});

/*
**CHECK INVESTMENT STATUS
*/
router.post('/investmentstatus', async (req, res) => {

    const { invName } = req.body;
    let invTotal = [];

    // Find Investment In Database
    const inv = await InvestmentModel.findOne({name: invName}).populate({ path: 'transactions', select: 'amount'}).populate({path: 'admin', select: 'name'});

    // Confirm Investment Existence In Database
    if (!inv) return res.status(400).send({message: `${invName} Investment not found`})

    // Store Investment Data In Variables
    const name = inv.name;
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
    const admin = inv.admin;

    // Store Investment Amount In Array
    for (i = 0; i < transCounts; i++) {
        invTotal.push(transactionsArray[i]['amount']);
    }
    
    // Sum Current Investment Funds
    const currentQuota = invTotal.reduce(function (a, b) {
        return a + b;
    }, 0);


    const remainingQuota = currentQuota - targetAmount;//Calculate Remaining Quota to meet Target Amount

    //Object Of Data To Be Returned
    const data = {
        admin,
        name,
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
        fundingClosingDate
    }

    //Return Response
    return res.status(200).send({data: data});
});

/*
 **CHECK MY CURRENT INVESTMENTS
 */
router.get('/myinvestment', async (req, res) => {
    
    const userId = req.user._id;

    // Query UserModel to get user data
    const userData = await UserModel.findById(userId).populate([
        {
            path: 'transactions',
            populate: [{
                path: 'userId', select: 'name', model: 'users'
            }, {path: 'investmentId', select: 'name', model: 'investments'}]
        }
    ]);

    // Return requested data
    console.log(userData);
    return res.status(200).send({message: userData});
});

/*
 **SEARCH INVESTMENT DATA BY NAME
 */
router.post('/investment', async (req, res) => {
    
    const { invName } = req.body;

    // Get requested investment data
    const investmentData = await InvestmentModel.findOne({name: invName}).populate(
        [
            {
                path: 'investors', select: 'name',
            }
        ]
    );

    // Return requested data
    console.log(investmentData);
    return res.status(200).send({message: investmentData});
});

/*
**DELETE INVESTMENT ROUTE
*/
router.delete('/investment/:invName', async (req, res) => {
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