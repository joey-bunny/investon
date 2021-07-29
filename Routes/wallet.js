/*
 **TRANSACTION ROUTER
 */
const { Router } = require('express');
const router = Router();
const UserModel = require('../models/user.model')

router.get('/', async (req, res) => {
  // Request required data
  const userId = req.user._id

  // Request user transactions from database
  const userTransationsSearch = await UserModel.findById(userId).populate({ path: 'transactions' })

  if (!userTransationsSearch) return res.status(400).send({
    statusCode: 400,
    message: 'User not found'
  })

  const userTransaction = userTransationsSearch.transactions
  const transactionCount = userTransaction.length

  let deposit = 0
  let withdrawal = 0

  for (i = 0; i < transactionCount; i++) {
    if(userTransaction[i]['transactionType'] == 'deposit') deposit = deposit + userTransaction[i]['amount']
    if(userTransaction[i]['transactionType'] == 'withdrawal') withdrawal = withdrawal + userTransaction[i]['amount']
  }

  const balance = deposit - withdrawal

  return res.status(200).send({
    statusCode: 200,
    message: 'Account balance collation successful',
    data : balance
  })
})


module.exports = router