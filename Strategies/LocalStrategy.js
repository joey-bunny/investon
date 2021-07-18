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
      const user = UserModel.findOne({ email: email }).select('-password')
        
      // if there is an error
      if (err) return done(err)

      // if user doesn't exist
      if (!user) return done(null, false, { message: 'User not found.' })

      // Confirm user verified status is true
      if(user.verified === false) return done(null, false, {
        message: 'Confirm your email first. You can do this by checking your email and clicking on the link you recieved from us'
      })
      // if the password isn't correct
      const match = await bcrypt.compare(password, user.password);

      if (!match) { return done(null, false, {   
      message: 'Invalid password.' }); }
      // if the user is properly authenticated
      // AuthModel.findOne()
      return done(null, user)
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