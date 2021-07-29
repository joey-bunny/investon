/*
 **PLANS ROUTER
 */
 const axios = require('axios')
 const { Router } = require('express')
 const router = Router()
 const InvestmentModel = require('../models/investment.model')
 const UserModel = require('../models/user.model')


/*
 **CREATE PLAN ROUTE
 */
 router.post('/', async (req, res) => {
  // {
  //     'name': 'AIG Bonds',
  //     'description': 'AIG Bonds is an investment package that uses your funds to trade bonds',
  //     'minInvestment': 100000,
  //     'expectedReturn': '37%',
  //     'returnFrequency': '30 days',
  //     'investmentCurrency': 'NGN',
  //     'investmentDuration': '3 months',
  //     'targetAmount': 10000000,
  //     'fundingOpeningDate': '23-06-2021',
  //     'fundingClosingDate': '30-06-2021'
  // }
  // Request required data
  try {
    const userId = req.user._id;
    const { name, description, minInvestment, expectedReturn, returnFrequency, investmentCurrency, investmentDuration, targetAmount, fundingOpeningDate, fundingClosingDate } = req.body;

    // Validate input values
    if (!name || name === null) return res.status(400).send({ statusCode: 400, message: 'Input investment name' })
    if (!description || description === null) return res.status(400).send({ statusCode: 400, message: 'Input investment description' })
    if (!minInvestment || minInvestment === null) return res.status(400).send({ statusCode: 400, message: 'Input minimum investment amount' })
    if (!expectedReturn || expectedReturn === null) return res.status(400).send({ statusCode: 400, message: 'Input expected investment return' })
    if (!returnFrequency || returnFrequency === null) return res.status(400).send({ statusCode: 400, message: 'Input investment return frequency' })
    if (!investmentCurrency || investmentCurrency === null) return res.status(400).send({ statusCode: 400, message: 'Input investment currency' })
    if (!investmentDuration || investmentDuration === null) return res.status(400).send({ statusCode: 400, message: 'Input investment duration' })
    if (!targetAmount || targetAmount === null) return res.status(400).send({ statusCode: 400, message: 'Input investment target amount' })
    if (!fundingOpeningDate || fundingOpeningDate === null) return res.status(400).send({ statusCode: 400, message: 'Input investment funding opening date' })
    if (!fundingClosingDate || fundingClosingDate === null) return res.status(400).send({ statusCode: 400, message: 'Input investment funding closing date' })

    // Convert date inputs to date format
    const fundingOpeningDateInput = new Date(fundingOpeningDate).toISOString()
    const fundingClosingDateInput = new Date(fundingClosingDate).toISOString()

    //Insert data into investment model
    InvestmentModel.create({ name, description, minInvestment, expectedReturn, returnFrequency, investmentCurrency, investmentDuration, targetAmount, fundingOpeningDate: fundingOpeningDateInput, fundingClosingDate: fundingClosingDateInput, admin: userId },
      function (err, investment) {
        // Confirm query result
        if (err || !investment) {
          // Validate if the error is a mongoose error
          if (err.name === "ValidationError") {
            let errors = {};

            Object.keys(err.errors).forEach((key) => {
              errors[key] = err.errors[key].message;
            })

            // Return error response
            return res.status(400).send({
              statusCode: 400,
              message: errors
            })
          }
          // Return error response
          return res.status(400).send({ statusCode: 400, message: err })
        }

        // Insert investment id to user model
        const investmentID = investment._id;

        UserModel.findByIdAndUpdate( userId, { $push: { investments: investmentID } }, function (err, docs) {
          // Confirm query result
          if (err || !docs) return res.status(400).send({ statusCode: 400, message: err })

          // Return response
          return res.status(200).send({
            statusCode: 200,
            message: 'Investment created',
            data: investment
          })
        })
    })
  } catch (err) {
    // Validate if the error is a mongoose error
    if (err.name === "ValidationError") {
      let errors = {};

      Object.keys(err.errors).forEach((key) => {
        errors[key] = err.errors[key].message;
      })

      // Return error response
      return res.status(400).send({
        statusCode: 400,
        message: errors
      })
    }
    // Return error response
    return res.status(500).send({
      statusCode: 500,
      message: 'Internal server error'
    })
  }
})


/*
 **FETCH ALL PLANS
 */
router.get('/', async (req, res) => {
  try {
    // Fetch all plans in database
    const plans = await InvestmentModel.find().select('-transactions')

    if (!plans) return res.status(200).send({ statusCode: 400, message: 'No investment available'})

    return res.status(200).send({
      statusCode: 200,
      message: 'Investments found',
      data: plans
    })
  } catch (err) {
    return err
  }
})

/*
 **FETCH SINGLE PLAN
 */
 router.get('/:id', async (req, res) => {
  try {
    // Request required data
    const { id } = req.params;
    let invTotal = [];

    // Find investment in database and populate data
    const inv = await InvestmentModel.findById(id)
      .populate({ path: 'transactions', select: 'amount' })
      .populate({ path: 'investors', select: 'name' })
      .populate({ path: 'admin', select: 'name' })

    // Confirm investment existence in database
    if (!inv) return res.status(400).send({
      statusCode: 400,
      message: `Investment plan not found`
    })

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
      invTotal.push(transactionsArray[i]['amount'])
    }

    // Sum current investment amounts
    const currentQuota = invTotal.reduce(function (a, b) {
      return a + b;
    }, 0)

    //Calculate Remaining Quota to meet Target Amount
    const remainingQuota = currentQuota - targetAmount;

    let status;
    if (fundingClosingDate > Date.now()) status = 'open';
    if (fundingClosingDate < Date.now()) status = 'closed';

    //Object Of Data To Be Returned
    const data = { name, admin, investors, description, minInvestment, expectedReturn, returnFrequency, investmentCurrency, investmentDuration, currentQuota, targetAmount, remainingQuota, fundingOpeningDate, fundingClosingDate, status, }

    //Return Response
    return res.status(200).send({
      statusCode: 200,
      message: 'investment found',
      data
    })
  } catch (err) {
    // Return error response
    return err
  }
})


/*
 **DELETE PLAN ROUTE
 */
 router.delete('/:invName', async (req, res) => {
  try {
    // Request required data
    const userId = req.user._id;
    const { invName } = req.params;

    // Get investment using investment name
    const investment = await InvestmentModel.findOne({ name: invName })

    // Check if investment exist
    if (!investment) return res.status(400).send({
      statusCode: 400,
      message: 'Investment not found'
    })

    // Check if current user is the investment user admin
    if (userId != investment.admin) return res.status(401).send({
        statusCode: 401,
        message: 'Only the admin of this investment is authorized to delete it'
      })

    // Check count of investment transactions
    const invTransactionsCount = investment.transactions.length;

    // Check if investment transaction is empty
    if (invTransactionsCount > 0) return res.status(401).send({
      statusCode: 401,
      message: 'You can only delete an investment if it has no investments',
    })

    // Delete investment
    await investment.delete()

    // Return success message
    return res.status(200).send({ message: 'Investment deleted' })
  } catch (err) {
    // Return error response
    return err
  }
})


module.exports = router