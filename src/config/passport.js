const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const User = require('../models/User');

passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: 'tu_clave_secreta'
}, async (jwt_payload, done) => {
  try {
    const user = await User.findById(jwt_payload.id);
    if (user) return done(null, user);
    return done(null, false);
  } catch (err) {
    return done(err, false);
  }
}));