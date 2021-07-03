/*
**APP DEPENDENCIES
*/
require('dotenv/config')
const express = require('express');
const passport = require('passport');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;

// DATABASE CONNECTION
const mongoUrl = require('./mongoDbConn.database').DB_URL;
mongoose.connect(mongoUrl, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});
mongoose.connection.on('connected', () => {
    console.log('connected to mongoDB');
});

// SETUP BODYPARSER
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/*
**PASSPORT AUTHENTICATION
*/
// PASSPORT INITIALIZE
app.use(passport.initialize());

// PASSPORT STRATEGIES
require('./strategies/google0auth.strategy')
require('./Strategies/LocalStrategy');
require('./Strategies/authJwt.strategy');

/*
**ROUTES
*/
// ROUTE FILES POINTER
const authRoute = require('./Routes/auth');
const userRoute = require('./Routes/user');
const investmentRoute = require('./Routes/investment');
const transactionRoute = require('./Routes/transaction');

// ROUTES
app.get('/api', async (req, res) => { return res.status(200).send({message: 'Welcome to Investon'})});
app.use('/api/auth', authRoute);
app.use('/api/user', passport.authenticate('jwt', { session: false }), userRoute);
app.use('/api/investment', passport.authenticate('jwt', { session: false }), investmentRoute);
app.use('/api/transaction', passport.authenticate('jwt', { session: false }), transactionRoute);


app.listen(port, () => {console.log(`Example app listening at http://localhost:${port}`)});