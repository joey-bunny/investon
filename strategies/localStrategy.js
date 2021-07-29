const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy;
const UserModel = require('../models/user.model')
const bcrypt = require('bcrypt')

passport.use('local', new LocalStrategy({ usernameField: 'email' }, function(email, password, done) {
  // look for the user data
  UserModel.findOne({ email: email }, async (err, user) => {
    // if there is an error
    if (err) { return done(err) }
    // if user doesn't exist
    if (!user) { return done(null, false, { statusCode: 400, message: 'Invalid credentials' }) }
    // Confirm user verified status is true
    if(user.verified === false) { return done(null, false, { statusCode: 400, message: 'Confirm your email first. You can do this by checking your email and clicking on the link you recieved from us' }) }
    // if the password isn't correct
    const match = await bcrypt.compare(password, user.password)
    if (!match) { return done(null, false, { statusCode: 400, message: 'Invalid credentials' }) }
    
    // if the user is properly authenticated
    return done(null, user)
  })
}))

  passport.serializeUser((user, done) => {
    done(null, user.id)
  })

  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      done(err, user)
    })
  })