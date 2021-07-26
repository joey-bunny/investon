/*
 **USER ROUTER
 */
const { Router } = require('express')
const router = Router()
const UserModel = require('../Models/user.model')
const bcrypt = require('bcrypt')

/**
 **VIEW MY PROFILE
 */
router.get('/', async (req, res) => {
  try {
    // Request required data
    const userID = req.user._id;

    // Get user details
    const user = await UserModel.findById(userID).select([ '-password', '-transactions' ])

    if (!user) return res.status(400).send({
      statusCode: 400,
      message: 'User not found'
    })

    // Return response
    return res.status(200).send({
      statusCode: 200,
      message: 'User profile found',
      data: user
    })
  } catch (err) {
    // Return error response
    return err;
  }
})

/**
 **VIEW OTHER USERS PROFILE
 */
router.get('/:username', async (req, res) => {
  try {
    // Request required data
    const { username } = req.params;

    // Find user
    const user = await UserModel.findOne({ username: username }).select([ '-password', '-transactions', '-_id' ])

    // Confirm if user exist
    if (!user) return res.status(400).send({ statusCode: 400, message: 'User not found' })

    // Return response
    return res.status(200).send({
      statusCode: 200,
      message: 'User profile found',
      data: user
    })
  } catch (err) {
    // Return error response
    return err;
  }
})

/*
 **CHANGE USER PASSWORD
 */
router.post('/changepassword', async (req, res) => {
  try {
    // Request required data
    const { password, newPassword } = req.body;
    const userID = req.user._id;

    // Validate input values
    if (!password) return res.status(400).send({ statusCode: 400, message: 'input password' })
    if (!newPassword) return res.status(400).send({ statusCode: 400, message: 'input new password' })
    if (password === newPassword) return res.status(400).send({ statusCode: 400, message: 'New password must be different from current password' })

  
    // Get user profile
    const user = await UserModel.findById(userID).exec()

    // Compare passwords
    const match = await bcrypt.compare(password, user.password)

    // Validate password match
    if (!match) return res.json({ message: 'Incorrect password' })

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update new password
    UserModel.findByIdAndUpdate( userID, { password: hashedPassword }, { new: true }, function (err, users) {
      // Confirm query response
      if (err || !users) return res.status(400).send({
        statusCode: 400,
        message: err || 'User not found'
      })

      // Return response
      return res.status(200).send({
        statusCode: 200,
        message: 'Password successfully changed'
      })
    })

  } catch (err) {
    // Return response
    return err;
  }
})

/*
 **CHANGE USER MOBILE NUMBER
 */
router.post('/changemobile', async (req, res) => {
  // Request required data
  const { mobile } = req.body;
  const userID = req.user._id;

  // Validate input data
  if (!mobile) return res.status(400).send({ statusCode: 400, message: 'input password' })

  try {
    // Update user data
    UserModel.findByIdAndUpdate( userID, { mobile: mobile }, { new: true }, function (err, user) {
      // Confirm query response
      if (err) return res.status(400).send({statusCode: 400, message: err })
      if (!user) return res.status(400).send({ statusCode: 400, message: 'User not found' })

      // Return response
      return res.status(200).send({
        statusCode: 200,
        message: 'Mobile number changed successfully'
      })
    })
  } catch (err) {
    // Return response
    res.send(err)
  }
})

module.exports = router;
