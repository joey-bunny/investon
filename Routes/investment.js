/*
 **INVESTMENT ROUTER
 */
const axios = require('axios')
const { Router } = require('express')
const router = Router()
const InvestmentModel = require('../models/investment.model')
const UserModel = require('../models/user.model')
const TransactionModel = require('../models/transaction.model')
const baseUrl = process.env.BASE_URL



/*
 **FUND INVESTMENT ROUTE
 */
router.post('/:id', async (req, res) => {
  try {
    // Request required data
    const { amount } = req.body;
    const id = req.params.id
    const transactionType = 'withdrawal'
    const authorization = req.headers.authorization

    // Confirm User Input
    if (!amount) return res.status(400).send({ statusCode: 400, message: 'insert investment amount' })

    // Get Investment From Database
    const investment = await InvestmentModel.findById(id)
      .populate({ path: 'transactions', select: 'amount' })
      .populate({ path: 'admin', select: 'name' })

    //Confirm Investment Existence
    if (!investment) return res.status(400).send({ statusCode: 400, message: 'Investment not found' })

    // Confirm user has sufficient wallet balance
    const wallet = await axios({
      method: 'get',
      url: `${baseUrl}/wallet`,
      headers: {Authorization: authorization }
    })

    const balance = wallet.data.data

    if ( balance < amount ) return res.status(400).send({ statusCode: 400, message: 'Insufficient funds' })


    let invTotal = [];
    const userId = req.user._id;
    const investmentId = investment._id;
    const investmentTarget = investment.targetAmount;
    const investmentInvestors = investment.investors;
    const minInvestment = investment.minInvestment;
    const transactionsArray = investment.transactions;
    const transCounts = transactionsArray.length;

    // Confirm if investor exist in investment table
    const checkInvestor = investmentInvestors.indexOf(userId)

    // Store Investment Amount In Array
    for (i = 0; i < transCounts; i++) {
      invTotal.push(transactionsArray[i]['amount'])
    }

    // Sum Current Investment Funds
    const currentQuota = invTotal.reduce(function (a, b) {
      return a + b;
    }, 0)

    const remainingQuota = investmentTarget - currentQuota; //Calculate Remaining Quota to meet Target Amount

    // Confirm Minimum Investment Amount Requirement Is Met
    if (amount < minInvestment) return res.status(400).send({ statusCode: 400, message: `Minimum investment amount is ${minInvestment}` })
    if (currentQuota >= investmentTarget) return res.status(400).send({ statusCode: 400, message: `This investment plan is closed as target quota has been met.` })

    
    //Store Transaction In Database
    const transaction = await TransactionModel.create({ userId, investmentId, amount, transactionType })

    const transactionId = transaction._id;

    // Confirm Successful Storage Of Transaction Instance
    if (!transaction) return res.status(400).send({ statusCode: 400, message: 'transaction incomplete' })

    // Confirm if investment exist in user portfolio
    const getUser = await UserModel.findById(userId)
    const getUserInvestments = getUser.investments;
    const checkInvestment = getUserInvestments.indexOf(investmentId)

    // Update both Investment And Transaction In User Model if investment is not in user investment portfolio
    if (checkInvestment === -1) await UserModel.findByIdAndUpdate( userId,
      { $push: { transactions: transactionId, investments: investmentId } },
      { new: true }
    )

    // Update only Transaction In User Model if investment is exist in user investment portfolio
    if (checkInvestment !== -1) await UserModel.findByIdAndUpdate( userId,
        { $push: { transactions: transactionId } },
        { new: true }
      )

    // Update Investor And Transaction In Investment Model if user does not exist in investment plan
    if (checkInvestor === -1) await InvestmentModel.findByIdAndUpdate(id,
        { $push: { investors: userId, transactions: transactionId } },
        { new: true }
      )

    // Update only Transaction In Investment Model if user exist in investment plan
    if (checkInvestor !== -1) await InvestmentModel.findByIdAndUpdate(id,
        { $push: { transactions: transactionId } },
        { new: true }
      )

    // Return Response
    return res.status(200).send({
      statusCode: 200,
      message: `You just successfully invested ${amount} into ${id}`,
    })
  } catch (err) {
    // Return response error
    return err
  }
})

/*
**FETCH MY CURRENT INVESTMENTS ROUTE
*/
router.get('/', async (req, res) => {
  try {
    // Request required data
    const userId = req.user._id;

    // Query UserModel to get user data
    const userData = await UserModel.findById(userId).populate({
      path: 'investments',
      select: '_id, name'
    }).select([ 'investments', '-_id' ])

    const investments = userData.investments

    if (!userData) return res.status(400).send({ statusCode: 400, message: 'User not found' })
    // Return requested data
    return res.status(200).send({
      statusCode: 200,
      message: 'User investment data found',
      data: investments
    })
  } catch (err) {
    // Return error response
    return err
  }
})

/*
**FETCH SINGLE USER INVESTMENT
*/
router.get('/:userId/:id', async ( req, res) => {
  try{
    // Request required data
    const { userId, id } = req.params

    // Query UserModel to get user data
    const userData = await UserModel.findById(userId).populate({
      path: 'investments',
      select: '_id, name',
      match: { _id: id }
    }).populate({
      path: 'transactions',
      match: { investmentId: id },
      select: ['amount', 'timestamp']
    }).select([ 'investments', 'transactions', '-_id' ])

    // Verify query response
    if (!userData) return res.status(400).send({ statusCode: 400, message: 'Unable to get data'})

    const investment = userData.investments[0]
    const transactions = userData.transactions
    const data = { investment, transactions }
    // Return response
    return res.status(200).send({
      statusCode: 200,
      message: 'User data found',
      data
    })

  } catch (err) {
    // Return error response
    return err
  }
})


module.exports = router
