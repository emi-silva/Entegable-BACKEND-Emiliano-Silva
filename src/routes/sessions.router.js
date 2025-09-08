const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../utils/mailer');
const router = express.Router();

// Endpoint para solicitar recuperación de contraseña
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  const token = jwt.sign({ id: user._id }, process.env.JWT_RESET_SECRET, { expiresIn: '1h' });
  const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  await sendPasswordResetEmail(email, link);
  res.json({ status: 'success', message: 'Correo de recuperación enviado' });
});

// Endpoint para restablecer contraseña
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const payload = jwt.verify(token, process.env.JWT_RESET_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) return res.status(400).json({ error: 'La nueva contraseña no puede ser igual a la anterior.' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ status: 'success', message: 'Contraseña restablecida correctamente' });
  } catch (err) {
    res.status(400).json({ error: 'Token inválido o expirado' });
  }
});
require('dotenv').config();
// ...existing code...

// Registro de usuario
router.post('/register', async (req, res) => {
  try {
    const { first_name, last_name, email, age, password, role } = req.body;
    if (!first_name || !last_name || !email || !age || !password) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'El email ya está registrado' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ first_name, last_name, email, age, password: hashedPassword, role: role || 'user' });
    await user.save();
    // Emitir JWT en cookie tras registro
      const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.cookie('jwt', token, {
      httpOnly: true,
      maxAge: 60 * 60 * 1000 // 1 hora
    });
    res.status(201).json({ status: 'success', user });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar usuario', detail: error.message });
  }
});
// Logout: eliminar cookie JWT
router.post('/logout', (req, res) => {
  res.clearCookie('jwt');
  res.json({ status: 'success', message: 'Logout exitoso' });
});

// Login y generación de JWT
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.cookie('jwt', token, {
    httpOnly: true,
    maxAge: 60 * 60 * 1000 // 1 hora
  });
  res.json({ status: 'success', message: 'Login exitoso' });
});

// Ruta protegida /current
const UserDTO = require('../dto/UserDTO');
router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {
  const safeUser = new UserDTO(req.user);
  res.json({ user: safeUser });
});

module.exports = router;