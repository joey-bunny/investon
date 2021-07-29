/*
 **TRANSACTION ROUTER
 */
const { Router } = require('express');
const TransactionModel = require('../models/transaction.model');
const router = Router();
const UserModel = require('../models/user.model');

/*
 **USER TRANSACTION HISTORY || baseurl/api/transaction/
 */
router.get('/', async (req, res) => {
  try {
    // Request required data
    const userId = req.user._id;

    // Query current user transaction
    transactionSearch = await UserModel.findById(userId).populate([{ path: 'transactions' }]);

    // Store user transactions
    const userTransaction = transactionSearch.transactions

    //return requested data
    return res.status(200).send({
      statusCode: 200,
      message: 'Transaction history found',
      data: userTransaction
    })
  } catch (err) {
    // Return error response
    return err;
  }
})

/*
 ** FUND WALLET || baseurl/api/transaction/
 */
router.post('/', async ( req, res ) => {
  try {
    // Request required data
    const { amount } = req.body
    const userId = req.user._id
    const transactionType = 'deposit'

    if (!amount || amount == null || undefined) return res.status(400).send({statusCode: 400, message: 'input amount'})

    const transaction = await TransactionModel.create({ userId, amount, transactionType})

    if (!transaction) return res.status(400).send({
      statusCode: 400,
      message: 'Unable to create transaction'
    })

    const transactionId = transaction._id

    const updateUser = await UserModel.findByIdAndUpdate(userId, {$push: { transactions: transactionId}})

    if (!updateUser) return res.status(400).send({
      statusCode: 400,
      message: 'User update failed'
    })

    return res.status(200).send({
      statusCode: 200,
      message: 'Funds deposit successful',
      data: transaction
    })

  } catch (err) {
    console.log(err)
    // Return error response
    return res.status(400).send({
      statusCode: 400,
      message: err
    })
  }
})


module.exports = router;
