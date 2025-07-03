const { Router } = require('express');
const { ProductManager } = require('../managers/ProductManager.js');
// o
const { CartManager } = require('../managers/CartManager.js');

const router = Router();
const manager = new CartManager();

// 🟢 GET /api/carts
router.get('/', async (req, res) => {
  try {
    const carts = await manager.getCarts();
    res.json(carts);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los carritos', detail: error.message });
  }
});

// 🟢 GET /api/carts/:cid
router.get('/:cid', async (req, res) => {
  const cid = Number(req.params.cid);
  if (isNaN(cid)) return res.status(400).json({ error: 'ID de carrito inválido' });

  try {
    const cart = await manager.getCartById(cid);
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar el carrito', detail: error.message });
  }
});

// 🔵 POST /api/carts
router.post('/', async (req, res) => {
  const { userId, items } = req.body;

  if (!userId || !Array.isArray(items)) {
    return res.status(400).json({ error: 'userId o items inválidos' });
  }

  try {
    const newCart = await manager.createCart({ userId, items });
    res.status(201).json(newCart);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el carrito', detail: error.message });
  }
});

// 🔵 POST /api/carts/:cid/product/:code
router.post('/:cid/product/:code', async (req, res) => {
  const cid = Number(req.params.cid);
  const code = req.params.code;
  const { quantity } = req.body;

  if (isNaN(cid)) return res.status(400).json({ error: 'ID de carrito inválido' });
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Cantidad inválida' });
  }

  try {
    const updatedCart = await manager.addProductToCart(cid, code, quantity);
    if (!updatedCart) return res.status(404).json({ error: 'Carrito o producto no encontrado' });
    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar producto al carrito', detail: error.message });
  }
});

// 🔴 DELETE /api/carts/:cid
router.delete('/:cid', async (req, res) => {
  const cid = Number(req.params.cid);
  if (isNaN(cid)) return res.status(400).json({ error: 'ID de carrito inválido' });

  try {
    const result = await manager.deleteCart(cid);
    if (!result) return res.status(404).json({ error: 'Carrito no encontrado' });
    res.json({ status: 'Carrito eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el carrito', detail: error.message });
  }
});

module.exports = router;
