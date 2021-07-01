const { Router } = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const transport = require('../utils/mailer.config');

const router = Router();
const baseUrl = process.env.BASE_URL
const baseUrlLocal = process.env.BASE_URL_LOCAL

const UserModel = require('../Models/user.model');
const InvestmentModel = require('../Models/investment.model');
const VerifCodeModel = require('../Models/verification.code.model');

const min = 1000000;
const max = 100000000;
const code = Math.floor(Math.random() * (max - min + 1)) + min;

router.get('', async (req, res) => {
    return res.send({url: process.env.BASE_URL, gang: process.env.GANG});
});

/*
** Register new user
*/
router.post('/register', async (req, res) => {
    // Request required credentials
    const { name, email, mobile, password } = req.body;
    
    // Verify request
    if (!name || name === null) res.json({'message':'username empty'});
    if (!email || email === null) res.json({'message':'email empty'});
    if (!mobile || mobile === null) res.json({'message':'mobile empty'});
    if (!password || password === null) res.json({'message':'password empty'});

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store user in database
    const user = await UserModel.create({
        name,
        email,
        mobile,
        password: hashedPassword
    });

        const userId = user._id;

        // Store verification code
        const storeCode = await VerifCodeModel.create({ userId, code });

        // Confirm storage of verification code
        if(!storeCode) return res.status(400).send({message: 'error'});
        
        
        // Send email verification mail with defined transport object
        const completeRegistrationUrl = `${baseUrlLocal}/auth/completeregistration/${userId}/${code}`
        try {
        // Create user
        const info = await transport.sendMail({
            from: '"Investon" <admin@investon.com>', // sender address
            to: email, // list of receivers
            subject: "Confirm email ✔", // Subject line
            text: `Hello ${name}, follow the link below to complete your registration`, // plain text body
            html: `<p>
                        <b>Hello ${name}, follow the link below to complete your registration</b><br>
                        <a href = '${completeRegistrationUrl}'>Confirm email</a>
                    </p>`, // html body
        });
        

        console.log(info);
        
        // Return response
        return res.status(200).send({ message: 'Confirmation link has been sent to your email'});
    } catch (err) {
        // Return error caught if any
        return res.status(400).send(err);
    }
})

/*
** COMPLETE REGISTRATION ROUTE
*/
router.get('/completeregistration/:userId/:code', async (req, res) => {
    // Request required data
    const { userId, code } = req.params;

    // Check for verification code in database
    VerifCodeModel.findOne({'code': code}, async function (err, keySearch) {
        
        // Confirm verification code existence
        if (err || !keySearch) {
            
            // Check for user in database
            UserModel.findById(userId, async (err, userSearch) => {

                // Confirm user existence
                if (err || !userSearch) return res.status(400).send({message: 'User does not exist, Pls go to the registration page to register'});

                const email = userSearch.email;
                const verified = userSearch.verified;
                
                // Confirm user verification status
                if (verified === true) return res.status(400).send({message: 'Your account has already been verified. Please login to proceed'});

                const completeRegistrationUrl = `${baseUrlLocal}/auth/completeregistration/${userId}/${code}`
                // Send verification mail if user is unverified
                await transport.sendMail({
                from: '"Investon" <admin@investon.com>', // sender address
                to: email, // list of receivers
                subject: "Confirm email ✔", // Subject line
                text: `Hello ${name}, follow the link below to complete your registration`, // plain text body
                html: `<p>
                            <b>Hello ${name}, follow the link below to complete your registration</b><br>
                            <a href = '${completeRegistrationUrl}'>Confirm email</a>
                        </p>`, // html body
                });
                // Return response
                return res.status(400).send({message: 'Link expired. Please check your email for new confirmation link'});
            });
        };

        // Check if userId from url matches the verification code userId from the database
        if (userId !== keySearch.userId) return res.status(400).send({message: 'Invalid link, request for another'});

        // Change user verified status to true
        UserModel.findByIdAndUpdate(userId, {verified: true}, function (err, user) {
            if (err || !user) return res.status(400).send({message: 'error'});

            // Create token
            const token = jwt.sign({ user }, process.env.PASSPORT_SIGNATURE, { expiresIn: '1d'}); 

            // return data
            return res.status(200).send({message: 'Logged in successfully', data: token});
        });
    });
});

/*
** Google auth call route
*/
router.get('/googleauth', passport.authenticate('google', {scope: ['profile', 'email']}))

/*
** Google auth Webhook route
*/
router.get('/googleauth/registerCallback?',
    passport.authenticate('google', {failureRedirect: 'http://localhost:3000/auth/loginfailed'}), async ( req, res ) => {
        // Get user from database
        const user = await UserModel.findOne({email: req.user[0]['_json']['email']});
        console.log('--------------------------------------------------');
        console.log(user);

        // Create user token
        token = jwt.sign({user}, process.env.PASSPORT_SIGNATURE, { expiresIn: '1d'});

        // Redirect user to success page and send token through url
        res.redirect(`http://localhost:3000/auth/loginsuccess/${token}`);
});

/*
** Google auth failed route
*/
router.get('/loginfailed', ( req, res ) => {
    res.json({'message': 'Login failed'});
})

/*
** Google auth Success route
*/
router.get('/loginsuccess/:token', async ( req, res ) => {
    // Extract token from url
    const { token } = req.params;

    // Return token as response
    return res.status(200).json({message: 'Login successfull', token: token});
});

/*
** Local Login route
*/
router.post('/login', function (req, res) {
    // Authenticate request using passport local
    passport.authenticate('local', {session: false}, (err, user, info) => {
        if (err || !user) return res.status(400).send({ message: 'Invalid credentials'});

        // Attempt to login the user if credentials are correct
        req.login(user, {session: false}, (err) => {
            
            // Return error response if any
            if (err) return res.status(400).send(err);

            // Create token
            const token = jwt.sign({user}, process.env.PASSPORT_SIGNATURE, { expiresIn: '1d'});

            // Return response
            return res.status(200).send({'tokens': token});
        });
    })(req, res);
});

/*
** Logout of account
*/
router.get('/logout', function(req, res){
    
    // Attempt user logout
    req.logout();

    // Return response
    res.json({'message': 'logout successful'});
});

/*
** RESET USER PASSWORD ROUTE
*/
router.post('/resetpassword', async (req, res) => {
    
    // Request required credentials
    const { email } = req.body;
    
    // Validate input
    if (!email || email === null) return res.status(400).send({message: 'Input email address'});

    // Get user from database
    UserModel.findOne({email}, async(err, userSearch) => {

        // Confirm user existence and return error message if none
        if(err || !userSearch) return res.status(200).send('Invalid email', err);
        

        const userId = userSearch._id;
console.log('-----------------------------------------');
        console.log(userId);

console.log('-----------------------------------------');
        console.log('Here 2');
        // Create verification code
        const saveCode = await VerifCodeModel.create({ userId, code });

        const url = `${baseUrlLocal}/auth/completeresetpassword/${userSearch._id}/${code}`

        // send mail with defined transport object
        const info = await transport.sendMail({
            from: '"Investon" <admin@investon.com>', // sender address
            to: email, // list of receivers
            subject: "Password reset ✔", // Subject line
            text: "Hello user, follow the link below to reset your password", // plain text body
            html: `<p>
                        <b>Hello user, follow the link below to reset your password</b><br>
                        <a href = '${url}'> Reset Password </a>
                    </p>`, // html body
        });

        console.log("Message sent: %s", info.messageId);
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

        return res.status(200).send({message: 'Mail sent'});
    });
});

/*
**COMPLETE RESET PASSWORD ROUTE
*/
router.post('/completeresetpassword/:userId/:code', async (req, res) => {
    
    // Request required credentials
    const { userId, code } = req.params;
    const { password } = req.body;
    
    // Validate password input
    if (!password) return res.status(400).send({message: 'Input a password'});

    // Check for verification code
    VerifCodeModel.findOne({'code': code}, async function (err, keySearch) {
        
        // Validate query response response
        if (err || !keySearch) return res.status(400).send({message: 'Link expired'});
        if (userId !== keySearch.userId) return res.status(400).send({message: 'Invalid link, request for another'});

        // Check for user
        UserModel.findByIdAndUpdate(userId, {password}, function (err, passChange) {

            // Validate query response response
            if (err || !passChange) return res.status(400).send({message: 'error'});

            // Return response
            return res.status(200).send({message: 'Key found'});
        });
    });
});

/*
** USER SEED
*/
router.post('/userseed', async (req, res) => {
    const fNameArr = ['ares', 'hermes', 'zeus', 'dionysius', 'hades', 'poseidon', 'apollo', 'athena', 'hera', 'athemis'];
    const lNameArr = ['mecury', 'mars', 'gaia', 'venus', 'saturn', 'jupiter', 'uranus', 'neptune', 'pluto', 'cronos'];
    const emailArr = ['ares@gmail.com', 'hermes@gmail.com', 'zeus@gmail.com', 'dionysius@gmail.com', 'hades@gmail.com', 'poseidon@gmail.com', 'apollo@gmail.com', 'athena@gmail.com', 'hera@gmail.com', 'athemis@gmail.com']
    const mobileArr = [09020790850, 09020790841, 09020790842, 09020790843, 09020790844, 09020790845, 09020790846, 09020790847, 09020790848, 09020790849]
    const password = 'secret';
    const hashedPassword = await bcrypt.hash(password, 10);

    let userdata = [];

    for (i=0; i<10; i++) {
        const name = fNameArr[i] + lNameArr[i];
        const email = emailArr[i];
        const mobile = mobileArr[i];
        const datas = {name: name, email: email, mobile: mobile, password: hashedPassword};

        userdata.push(datas);
    }

    try {
        const userInsert = await UserModel.insertMany(userdata);
        if (err || !userInsert) return res.status(400).send(err);
        console.log(userInsert);
        return res.status(200).send({message: 'users seeded successfully'});
    } catch (error) {
        res.status(400).send(error);
    }
});

/*
**VERIFY EMAIL ROUTE
*/
// router.post('/verifyemail', async (req, res) => {
//     const { email, code } = req.body;

//     VerifCodeModel.create({ email, code }, async function (err, verify) {
//         if (err || !verify) return res.status(200).send(err);

//         console.log(verify);
//         return res.status(200).send({message: 'Verification code created'});
//     });
// });

/*
**VERIFY EMAIL ROUTE
*/
// router.get('/verifyemail/:email/:verifCode', async (req, res) => {
//     const { email, verifCode } = req.params;
    
//     VerifCodeModel.findOne({'code': verifCode}, async function (err, keySearch) {
//         if (err || !keySearch) return res.status(400).send({message: 'Link expired'});

//         if (email !== keySearch.email) return res.status(400).send({message: 'Invalid link, request for another'});

//         console.log(keySearch.email);
//         return res.status(200).send({message: 'Key found'});
//     });
// });


module.exports = router;