const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const router = express.Router();

// Registro de usuario
router.post('/register', async (req, res) => {
  try {
    const { first_name, last_name, email, age, password } = req.body;
    if (!first_name || !last_name || !email || !age || !password) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'El email ya está registrado' });
    const user = new User({ first_name, last_name, email, age, password });
    await user.save();
    res.status(201).json({ status: 'success', user });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar usuario', detail: error.message });
  }
});

// Login y generación de JWT
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, 'tu_clave_secreta', { expiresIn: '1h' });
  res.json({ token });
});

// Ruta protegida /current
router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;