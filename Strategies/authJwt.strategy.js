const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const passport = require('passport');
passport.use(new JwtStrategy(
    {
        secretOrKey: 'your_jwt_secret',
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    },
    async (token, done) => {
        try{
            return  done(null, token.user);
        } catch (err) {
            done(err);
        }
    }
))