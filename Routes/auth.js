const { Router } = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = Router();

const UserModel = require('../Models/user.model');
const InvestmentModel = require('../Models/investment.model');
const { array } = require('joi');
// const AuthModel = require('../Models/auth.model');
// const LocalStrategy = require('../Strategies/LocalStrategy');

const isAuthenticated = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        res.sendStatus(401);
    }
}


/*
** Register new user
*/
router.post('/register', async (req, res) => {
    const { name, email, mobile, password } = req.body;
    
    if (!name || name === null) res.json({'message':'username empty'});
    if (!email || email === null) res.json({'message':'email empty'});
    if (!mobile || mobile === null) res.json({'message':'mobile empty'});
    if (!password || password === null) res.json({'message':'password empty'});

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        UserModel.create({
            name,
            email,
            mobile,
            password: hashedPassword
        }, function (err, user) {
            const token = jwt.sign({ user }, process.env.PASSPORT_SIGNATURE, { expiresIn: '1d'});
            console.log(token);
            res.json({ 'message': 'User created', 'token': token });
        })
    } catch (err) {
        console.log(err);
        res.json(err);
    }
})

/*
** Google auth call route
*/
router.get('/googleauth', passport.authenticate('google', {scope: ['profile', 'email']}))

/*
** Google auth Webhook route
*/
router.get('/googleauth/registerCallback?',
    passport.authenticate('google', {failureRedirect: 'http://localhost:3000/auth/loginfailed'}), function( req, res ) {
        res.redirect('http://localhost:3000/auth/loginsuccess');
})

/*
** Google auth failed route
*/
router.get('/loginfailed', ( req, res ) => {
    res.json({'message': 'Login failed'});
})

/*
** Google auth Success route
*/
router.get('/loginsuccess', isAuthenticated, async ( req, res ) => {
    console.log(req.user[0]['_json']['email']);
    const user = await UserModel.findOne({email: req.user[0]['_json']['email']}, function (err, user){
        const token = jwt.sign({user}, process.env.PASSPORT_SIGNATURE, { expiresIn: '1d'});
        console.log(token);
        res.json({'token': token});
    })
})

/*
** Local Login route
*/
router.post('/login', function (req, res) {
    passport.authenticate('local', {session: false}, (err, user, info) => {
        if (err || !user) {
            return res.status(400).json({
                message: 'Invalid credentials',
            });
        }
       req.login(user, {session: false}, (err) => {
           if (err) {
               res.send(err);
           }
           // generate a signed son web token with the contents of user object and return it in the response
           const token = jwt.sign({user}, process.env.PASSPORT_SIGNATURE, { expiresIn: '1d'});
            // AuthModel.findOne({userId: user._id}, function (err){})
           console.log(user._id);
           return res.json({'tokens': token});
        });
    })(req, res);
});

/*
** Logout of account
*/
router.get('/logout', function(req, res){
    req.logout();
    res.json({'message': 'logout successful'});
  })

/*
** Profile route
*/
router.post('/profile', passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        console.log('here nows');
        // InvestmentModel.findOne({name: 'AIG Bonds'}).populate('creator').exec(function (err, investment) {
        //     if (err) return handleError(err);
        //     console.log('The Creator is %s', investment);
        //     res.send('ok');
        // });

        UserModel.findOne({name: 'ubani uche'}).populate('transactions', 'amount').exec(function (err, creator) {
            if (err) return handleError(err);
            const counts = creator.transactions;
            const cases = counts.length;
            for(a = 0; a < cases; a++) {
                console.log(creator.transactions[a]['amount']);
            }
            console.log('The Creator is %s', cases);
            res.send({data: creator});
        });
        
    }
);

router.get('/game', async (req, res) => {
    res.send('Working page');
});

router.post('/test', async (req, res) => {
    console.log(req.body);
    return res.send(req.body);
})

module.exports = router;
