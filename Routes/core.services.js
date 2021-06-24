/*
 **Investment Creation and management Router
 */
const {
    Router
} = require('express');
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
    const userID = req.user._id;
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
            creator: userID
        }, function (err, investment) {
            if (err) res.send(err);
            const investmentID = investment._id;
            UserModel.findByIdAndUpdate(userID, { $push: { investments: investmentID }}, function (err, docs) {
                if (err) res.send(err);
                console.log(investmentID);
                console.log(docs);
                return res.json({message: 'Investment created', data: investment});
            })
            return res.send('ok');
        })
    } catch (err) {
        res.send(err);
    }
});

/*
**Make Investment Route
*/
router.post('/makeInvestment', async (req, res) => {
    const {
        invName,
        amount
    } = req.body;
    if (!invName) res.send('insert investment name');
    if (!amount) res.send('insert investment amount');

    const userID = req.user._id;

    const investment = await InvestmentModel.findOneAndUpdate({ name: invName }, { $push: { investors: userID }});

    if (!investment) res.send('Investment not found');
    const investmentId = investment._id;

    const transaction = await TransactionModel.create({
        userID,
        investmentId,
        amount
    });

    if (!transaction) res.send('transaction incomplete');

    console.log(transaction._id);

    const transactionId = transaction._id;
    const updateInvestor = await UserModel.findByIdAndUpdate(userID, {
        $push: {
            transactions: transactionId
        }
    })

    console.log(transaction);
    console.log(updateInvestor);
    res.send(investment);
})

module.exports = router;