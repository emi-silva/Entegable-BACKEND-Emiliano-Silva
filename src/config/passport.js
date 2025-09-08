const passport = require('passport');
require('dotenv').config();
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const User = require('../models/User');

const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

// Estrategia Local para login
passport.use('local', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = await User.findOne({ email });
    if (!user) return done(null, false, { message: 'Usuario no encontrado' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return done(null, false, { message: 'Contraseña incorrecta' });
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// Estrategia JWT usando cookie y clave desde .env
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromExtractors([
    (req) => {
      // Prioridad: Authorization header Bearer token
      if (req && req.headers && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
          console.log('JWT extraído del header Authorization:', authHeader.replace('Bearer ', ''));
          return authHeader.replace('Bearer ', '');
        }
      }
      if (req && req.cookies && req.cookies['jwt']) {
        console.log('JWT extraído de la cookie:', req.cookies['jwt']);
        return req.cookies['jwt'];
      }
      console.log('No se encontró JWT en header ni cookie');
      return null;
    }
  ]),
  secretOrKey: process.env.JWT_SECRET
}, async (jwt_payload, done) => {
  try {
    console.log('Payload JWT recibido:', jwt_payload);
    const user = await User.findById(jwt_payload.id);
    if (user) {
      console.log('Usuario autenticado:', user.email, 'Rol:', user.role);
      return done(null, user);
    }
    console.log('Usuario no encontrado con el id:', jwt_payload.id);
    return done(null, false);
  } catch (err) {
    console.log('Error en la estrategia JWT:', err);
    return done(err, false);
  }
}));