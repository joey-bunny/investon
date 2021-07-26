const { Router } = require('express')
const passport = require('passport')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { sendRegistrationMail, sendVerificationMail, sendPasswordResetEmail } = require('../utils/mailer.config')
const { userDataSeed, randomNumber, generateJWT } = require('../utils/functions')

const router = Router()

const UserModel = require('../Models/user.model')
const VerifCodeModel = require('../Models/verification.code.model')


const complete_local_reg_uri = process.env.COMPLETE_LOCAL_REG_URL
const complete_reset_pass_uri = process.env.COMPLETE_RESET_PASS_URL
const login_failed_uri = process.env.G_LOGIN_FAIL_URL
const login_success_uri = process.env.G_LOGIN_SUCCESS_URL
const code = randomNumber ()

/*
 ** Register new user
 */
router.post('/register', async (req, res) => {
  try {
  // Request required credentials
  const { name, email, mobile, username, password } = req.body

  // Verify request
  if (!name || name === null) return res.status(400).send({ statusCode: 400, message: 'username required' })
  if (!email || email === null) return res.status(400).send({ statusCode: 400, message: 'email required' })
  if (!mobile || mobile === null) return res.status(400).send({ statusCode: 400, message: 'mobile required' })
  if (!password || password === null) return res.status(400).send({ statusCode: 400, message: 'password required' })

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)
    // Store user in database
    const user = await UserModel.create({ name, email, mobile, username, password: hashedPassword })

    // Validate query success
    if(!user) return res.status(400).send({
      statusCode: 400,
      message: 'Unable to create user'
    })
    const userId = user._id

    // Store verification code
    const storeCode = await VerifCodeModel.create({ userId, code })

    // Confirm storage of verification code
    if (!storeCode) return res.status(400).send({ statusCode: 400, message: 'error' })

    // Send email verification mail with defined transport object
    const completeRegistrationUrl = `${complete_local_reg_uri}/${userId}/${code}`

    sendRegistrationMail(name, email, completeRegistrationUrl)//Send the registration emaiil

    // Return response
    return res.status(200).send({ statusCode: 200, message: 'Confirmation link has been sent to your email address' })
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
 ** COMPLETE REGISTRATION ROUTE
 */
router.get('/completeregistration/:userId/:code', async (req, res) => {
  try {
    // Request required data
    const { userId, code } = req.params

    // Check for verification code in database
    const verifyCode = await VerifCodeModel.findOne({ code: code })

    // Confirm verification code existence
    if (!verifyCode) {

      // Check for user in database
      const user = await UserModel.findById(userId)

      // Confirm user existence
      if (!user) return res.status(400).send({
        statusCode: 400,
        message: 'User does not exist, Pls go to the registration page to register',
      })

      const name = user.name
      const email = user.email
      const verified = user.verified

      // Confirm user verification status
      if (verified === true) return res.status(400).send({
        statusCode: 400,
        message: 'Your account has already been verified. Please login to proceed',
      })

      const completeRegistrationUrl = `${complete_local_reg_uri}/${userId}/${code}`
      
      // Send verification mail if user is unverified
      sendVerificationMail(name, email, completeRegistrationUrl)

      // Return response
      return res.status(400).send({
        statusCode: 400,
        message: 'Link expired. Please check your email for new confirmation link',
      })
    }

    // Check if userId from url matches the verification code userId from the database
    if (userId !== verifyCode.userId) return res.status(400).send({ 
      statusCode: 400,
      message: 'Invalid link, request for another'
    })

    // Change user verified status to true
    const updateUser = await UserModel.findByIdAndUpdate( userId, { verified: true }).select('-password')

    // Validate query response
    if (!updateUser) return res.status(400).send({
      statusCode: 400,
      message: 'Update failed'
    })

    await verifyCode.delete()
    // Create token
    const token = jwt.sign({ updateUser }, process.env.PASSPORT_SIGNATURE, { expiresIn: '1d' })

    // return data
    return res.status(200).send({
      statusCode: 200,
      message: 'Logged in successfully',
      data: token
    })
  } catch (err) {
    // return error response
    return err
  }
})

/*
 ** Google auth call route
 */
router.get('/googleauth', passport.authenticate('google', { scope: ['profile', 'email'] }))

/*
 ** Google auth Callback route
 */
router.get('/googleauth/registerCallback?', passport.authenticate('google', { failureRedirect: login_failed_uri }), async (req, res) => {
    try {
      const email = req.user[0]['_json']['email']
      // Get user from database
      const user = await UserModel.findOne({ email: email }).select('-password')

      // Create user token
      token = jwt.sign({ user }, process.env.PASSPORT_SIGNATURE, { expiresIn: '1d' })

      const successUrl = `${login_success_uri}/${token}`
      // Redirect user to success page and send token through url
      res.redirect(successUrl)
    } catch (err) {
      return err
    }
  }
)

/*
 ** Google auth failed route
 */
router.get('/loginfailed', (req, res) => {
  return res.status(400).send({
    statusCode: 400,
    message: 'Login failed'
  })
})

/*
 ** Google auth Success route
 */
router.get('/loginsuccess/:token', async (req, res) => {
  // Extract token from url
  const { token } = req.params

  // Return token as response
  return res.status(200).send({ message: 'Login successfull', token: token })
})

/*
 ** Local Login route
 */
router.post('/login', function (req, res) {
  try {
  // Authenticate request using passport local
  passport.authenticate('local', { session: false }, (err, user, info) => {
    // Validate query request and return any error
    if (err || !user) return res.status(400).send({
      statusCode: 400,
      message: 'Invalid credentials'
    })
    
    // Attempt to login the user if credentials are correct
    req.login(user, { session: false }, (err) => {
      // Return error response if any
      if (err) return res.status(400).send(err)

      // Select required JWT payload
      const {_id, name, email } = user
      const users = { _id, name, email}

      // generate token
      const token = generateJWT(users)

      // Return response
      return res.status(200).send({
        statusCode: 200,
        message: 'Login successful',
        data: { token }
      })
    })
  })(req, res)

} catch (err) {
  // Return error response
  return err
}
})

/*
 ** Logout of account
 */
router.get('/logout', function (req, res) {
  // Attempt user logout
  req.logout()

  // Return response
  return res.status(200).send({
    statusCode: 200,
    message: 'logout successful'
  })
})

/*
 ** RESET USER PASSWORD ROUTE
 */
router.post('/resetpassword', async (req, res) => {
  try {
    // Request required credentials
    const { email } = req.body

    // Validate input
    if (!email || email === null) return res.status(400).send({
      statusCode: 400,
      message: 'Input email address'
    })

    // Get user from database
    UserModel.findOne({ email }, async (err, userSearch) => {

      // Confirm user existence and return error message if none
      if (err || !userSearch) return res.status(400).send('Invalid email', err)

      const userId = userSearch._id

      // Create verification code
      const saveCode = await VerifCodeModel.create({ userId, code })

      const url = `${complete_reset_pass_uri}/${userId}/${code}`

      // send Password reset mail
      sendPasswordResetEmail (email, url)

      return res.status(200).send({
        statusCode: 200,
        message: 'Reset link has been sent to your email.'
      })
    })
  } catch (err) {
    // Return response console.error()
    return err
  }
})

/*
 **COMPLETE RESET PASSWORD ROUTE
 */
router.post('/completeresetpassword/:userId/:code', async (req, res) => {
  try {
    // Request required credentials
    const { userId, code } = req.params
    const { password } = req.body

    // Validate password input
    if (!password) return res.status(400).send({ message: 'Input a password' })

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Check for verification code
    VerifCodeModel.findOne({ code: code }, async function (err, keySearch) {
      
      // Validate query response response
      if (err || !keySearch) return res.status(400).send({
          statusCode: 400,
          message: 'Link expired, please request another link.'
        })

      // Verify if userid matches userid in database and return response
      if (userId !== keySearch.userId) return res.status(400).send({
        statusCode: 400,
        message: 'Invalid link, please request another link'
      })

      // Check for user in database
      UserModel.findByIdAndUpdate( userId, { password: hashedPassword }, function (err, passChange) {
          
        // Validate query response response
        if (err || !passChange) return res.status(400).send({
          statusCode: 400,
          message: 'error'
        })

        // Return response
        return res.status(200).send({
            statusCode: 200,
            message: 'Password successfully changed. Please login to continue',
          })
        })
    })
  } catch (err) {
    return err
  }
})

/*
 ** USER SEED
 */
router.post('/userseed', async (req, res) => {
  // Generate user data
  const userdata = await userDataSeed()

  try {
    // Insert user data into database
    const userInsert = await UserModel.insertMany(userData)

    // Validate user entry
    if (err || !userInsert) return res.status(400).send(err)

    // Return response
    return res.status(200).send({
      statusCode: 200,
      message: 'users seeded successfully'
    })
  } catch (error) {
    // Return error response
    res.status(400).send(error)
  }
})

module.exports = router
