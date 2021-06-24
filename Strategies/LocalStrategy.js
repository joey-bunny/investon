const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const UserModel = require('../Models/user.model');
const bcrypt = require('bcrypt');

passport.use('local', new LocalStrategy(
    {
        usernameField: 'email',
    },
    // function of username, password, done(callback)
    function(email, password, done) {
      // look for the user data
      UserModel.findOne({ email: email }, async (err, user) => {
        // if there is an error
        if (err) { return done(err); }
        // if user doesn't exist
        if (!user) { return done(null, false, { message: 'User not found.' }); }
        // if the password isn't correct
        const match = await bcrypt.compare(password, user.password);
        if (!match) { return done(null, false, {   
        message: 'Invalid password.' }); }
        // if the user is properly authenticated
        // AuthModel.findOne()
        return done(null, user);
      });
    }
  ));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
    done(err, user);
     });
  })