/*
**APP DEPENDENCIES
*/
require('dotenv/config')
const express = require('express')
const passport = require('passport')
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

const app = express()
const port = process.env.PORT || 3000

// DATABASE CONNECTION
const mongoUrl = require('./mongoDbConn.database').DB_URL
mongoose.connect(mongoUrl, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})
mongoose.connection.on('connected', () => {
    console.log('connected to mongoDB')
})

// SETUP BODYPARSER
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

/*
**PASSPORT AUTHENTICATION
*/
// PASSPORT INITIALIZE
app.use(passport.initialize())

// PASSPORT STRATEGIES
require('./strategies/google0auth.strategy')
require('./Strategies/LocalStrategy')
require('./Strategies/authJwt.strategy')

/*
**ROUTES
*/
// ROUTE FILES POINTER
const authRoute = require('./Routes/auth')
const userRoute = require('./Routes/user')
const investmentRoute = require('./Routes/investment')
const transactionRoute = require('./Routes/transaction')
const walletRoute = require('./Routes/wallet')

const jwt = require('jsonwebtoken')
const { generateJWT } = require('./utils/functions')
const UserModel = require('./Models/user.model')

// ROUTES
app.get('/', async (req, res) => {
    try{
        // const all = req.headers.authorization
        // const token = all.replace('Bearer ', '')
        // const secretKey = process.env.PASSPORT_SIGNATURE

        const payload = { name: 'uche' }
        const datas = await UserModel.find()

        const tokens = generateJWT(payload)
        // const decode = jwt.verify(token, secretKey)

        return res.status(200).send({
            tokens,
            message: 'Welcome to Investon',
            datas
        })
    } catch (err) {
        return err
    }
})


app.use('/auth', authRoute)
app.use('/users', passport.authenticate('jwt', { session: false }), userRoute)
app.use('/investments', passport.authenticate('jwt', { session: false }), investmentRoute)
app.use('/transactions', passport.authenticate('jwt', { session: false }), transactionRoute)
app.use('/wallet', passport.authenticate('jwt', { session: false }), walletRoute)


app.listen(port, () => {console.log(`Example app listening at http://localhost:${port}`)})

module.exports = app