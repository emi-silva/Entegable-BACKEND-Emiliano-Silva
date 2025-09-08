const express = require('express');
const User = require('../models/User');
const router = express.Router();

// CREATE - Registrar usuario
router.post('/', async (req, res) => {
  try {
  const { first_name, last_name, email, age, password, cart, role } = req.body;
  console.log('Valor recibido en role:', role);
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ error: 'El email ya está registrado' });
  const hashedPassword = await require('bcrypt').hash(password, 10);
  const user = new User({ first_name, last_name, email, age, password: hashedPassword, cart, role: role || 'user' });
  await user.save();
  console.log('Valor guardado en role:', user.role);
  res.status(201).json({ status: 'success', user });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear usuario', detail: error.message });
  }
});

// READ - Listar todos los usuarios
router.get('/', async (req, res) => {
  try {
    const users = await User.find().populate('cart');
    res.json({ status: 'success', users });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios', detail: error.message });
  }
});

// READ - Obtener usuario por ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('cart');
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ status: 'success', user });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuario', detail: error.message });
  }
});

// UPDATE - Actualizar usuario por ID
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ status: 'success', user });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar usuario', detail: error.message });
  }
});

// DELETE - Eliminar usuario por ID
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ status: 'success', message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar usuario', detail: error.message });
  }
});

module.exports = router;