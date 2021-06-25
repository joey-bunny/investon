require('dotenv/config')
require('./strategies/google0auth.strategy')
const express = require('express');
const passport = require('passport');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const mongoose = require('mongoose');
const flash = require('connect-flash');

const authRoute = require('./Routes/auth');
const investmentRoute = require('./Routes/core.services');
const dbUrl = require('./mongoDbConn.database').DB_URL;
const UserModel = require('./Models/user.model');

const app = express();
const port = process.env.PORT || 3000;
/*
**DATABASE
*/
const mongoUrl = process.env.MONGODB_URL;
mongoose.connect(mongoUrl, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.connection.on('connected', () => {
    console.log('connected to mongoDB');
});

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

require('./Strategies/LocalStrategy');
require('./Strategies/authJwt.strategy');

/*
**ROUTES
*/
app.use('/auth', authRoute);
app.use('/', passport.authenticate('jwt', { session: false }),investmentRoute);

app.listen(port, () => {console.log(`Example app listening at http://localhost:${port}`)});