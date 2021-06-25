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
            if (err) return res.send(err);
            const investmentID = investment._id;
            UserModel.findByIdAndUpdate(userID, { $push: { investments: investmentID }}, function (err, docs) {
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

router.get('/game', async (req, res) => {
    res.send(req.user);
})
/*
**CHANGE USER PASSWORD
*/




/*
**CHANGE USER PASSWORD
*/
router.post('/changepassword', async (req, res) => {
    const bcrypt = require('bcrypt');
    const { password, newPassword } = req.body;
    const userID = req.user._id;

    if (!password) return res.json({message: 'input password'});
    if (!newPassword) return res.json({message: 'input new password'});
    if (password === newPassword) return res.json({message: 'New password must be different from current password'});

    const user = await UserModel.findById(userID).exec();
    const match = await bcrypt.compare(password, user.password);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if(!match) return res.json({message: 'Incorrect password'});

    try{
        UserModel.findByIdAndUpdate(userID, {password: hashedPassword}, {new: true}, function (err, users) {
            console.log('here 1');
            if (err) return res.send(err);
            if (!users) return res.json({message: 'No user'});
            
            console.log(users);
            res.send({message: 'Password successfully changed'});
        });
    } catch (err) {
        console.log('Error catch');
        res.send(err);
    }
});

/*
**CHANGE USER MOBILE NUMBER
*/
router.post('/changemobile', async (req, res) => {
    const { mobile } = req.body;
    const userID = req.user._id;

    if (!mobile) return res.json({message: 'input password'});

    try{
        UserModel.findByIdAndUpdate(userID, {mobile: mobile}, {new: true}, function (err, user) {
            console.log('here 1');
            if (err) return res.send(err);
            if (!user) return res.json({message: 'No user'});
            
            console.log(user);
            return res.json({message: 'Mobile number changed successfully'});
        });
    } catch (err) {
        console.log('Error catch');
        res.send(err);
    }
});
module.exports = router;