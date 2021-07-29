const passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const UserModel = require('../models/user.model')

passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
passport.deserializeUser(function(user, done) {
// User.findById(id, function(err, user) {
  done(null, user);
// });
});

passport.use(new GoogleStrategy({
  clientID: process.env.G_CLIENT_ID,
  clientSecret: process.env.G_CLIENT_SECRET,
  callbackURL: process.env.G_CALLBACK_URL_LIVE
  },
  function(accessToken, refreshToken, profile, done) {
    //search for email in database
    findUser = UserModel.findOne({'email': profile._json.email}, function(err, findUser){

      //if email doesn't exist create new user
      if (err || findUser === null) {
        let newUser = new UserModel({
          name: profile._json.name,
          email: profile._json.email,
          google: { 'id': profile._json.sub,
                    'firstName': profile._json.given_name,
                    'lastName': profile._json.family_name,
                    'email': profile._json.email,
                    }
        });
        //Save user data extracted from googleAuth
        newUser.save(function(err, newUser){
          if(err){
            return (err);
          }
          else {
            console.log('here 1');
            console.log(accessToken);
            return done(null, [profile, accessToken]);
          }
        })
      }
      else {
        console.log('here 2');
        console.log(accessToken);
        return done(null, [profile, accessToken]);
      }
    })
  }
));