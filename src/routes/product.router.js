const { Router } = require('express');
const { ProductManager } = require('../managers/ProductManager.js');
// o
const { CartManager } = require('../managers/CartManager.js');

const router = Router();
const manager = new ProductManager();

// 🟢 GET /api/products/
router.get('/', async (req, res) => {
  try {
    const products = await manager.getProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos', detail: error.message });
  }
});

// 🟢 GET /api/products/:pid
router.get('/:pid', async (req, res) => {
  const pid = Number(req.params.pid);
  if (isNaN(pid)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const product = await manager.getProductById(pid);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar el producto', detail: error.message });
  }
});

// 🔵 POST /api/products/
router.post('/', async (req, res) => {
  const {
    title,
    description,
    code,
    price,
    status,
    stock,
    category,
    thumbnails
  } = req.body;

  if (!title || !description || !code || price === undefined || stock === undefined || !category) {
    return res.status(400).json({ error: 'Faltan campos obligatorios para crear el producto' });
  }

  try {
    const newProduct = await manager.addProduct({
      title,
      description,
      code,
      price,
      status: status ?? true,
      stock,
      category,
      thumbnails: thumbnails ?? []
    });
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar el producto', detail: error.message });
  }
});

// 🟠 PUT /api/products/:pid
router.put('/:pid', async (req, res) => {
  const pid = Number(req.params.pid);
  if (isNaN(pid)) return res.status(400).json({ error: 'ID inválido' });

  const updates = req.body;
  if ('id' in updates) {
    return res.status(400).json({ error: 'No se puede modificar el ID del producto' });
  }

  try {
    const updatedProduct = await manager.updateProduct(pid, updates);
    if (!updatedProduct) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el producto', detail: error.message });
  }
});

// 🔴 DELETE /api/products/:pid
router.delete('/:pid', async (req, res) => {
  const pid = Number(req.params.pid);
  if (isNaN(pid)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const product = await manager.getProductById(pid);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    await manager.deleteProduct(pid);
    res.json({ status: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el producto', detail: error.message });
  }
});

module.exports = router;
