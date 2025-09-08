const { Router } = require('express');
const ProductManager = require('../managers/ProductManager'); // Importa ProductManager
const mongoose = require('mongoose'); // Necesario para validar ObjectId

const router = Router();
const productManager = new ProductManager(); // Instancia el ProductManager

// Helper para validar ObjectId
const validateObjectId = (id, paramName) => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error(`ID de ${paramName} inválido o no proporcionado.`);
        error.statusCode = 400; // Bad Request
        throw error;
    }
};

// 🟢 GET /api/products — Obtener todos los productos (DTO)
router.get('/', async (req, res, next) => {
    try {
        const products = await ProductRepository.getAll();
        res.json({ status: 'success', payload: products });
    } catch (error) {
        next(error);
    }
});

// 🟢 GET /api/products/:id — Obtener un producto por ID (DTO)
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        validateObjectId(id, 'producto');
        const product = await ProductRepository.getById(id);
        if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json({ status: 'success', payload: product });
    } catch (error) {
        next(error);
    }
});

// 🔵 POST /api/products — Agregar nuevo producto (solo admin)
const passport = require('passport');
const authorizeRole = require('../middleware/authorization');
const ProductRepository = require('../repositories/ProductRepository');

router.post('/', passport.authenticate('jwt', { session: false }), authorizeRole('admin'), async (req, res, next) => {
    console.log('Petición recibida en /api/products');
    try {
        let productos = Array.isArray(req.body) ? req.body : [req.body];
        let creados = [];
        for (const prod of productos) {
            const { title, description, code, price, stock, category, thumbnails, status } = prod;
            if (!title || !description || !code || price == null || stock == null || !category) {
                return res.status(400).json({ error: 'Faltan campos obligatorios en uno de los productos.' });
            }
            if (typeof price !== 'number' || typeof stock !== 'number' || price < 0 || stock < 0) {
                return res.status(400).json({ error: 'Price y stock deben ser números válidos y no negativos.' });
            }
            const productData = {
                title,
                description,
                code,
                price,
                stock,
                category,
                thumbnails: thumbnails || [],
                status: status ?? true
            };
            const newProduct = await ProductRepository.create(productData);
            creados.push(newProduct);
        }
        // 🚀 Emitir actualización vía Socket.io a todos los clientes
        const io = req.app.get('io');
        if (io) {
            const updatedProducts = await ProductRepository.getAll();
            io.emit('products', updatedProducts);
        }
        res.status(201).json({ status: 'success', message: 'Productos creados correctamente.', payload: creados });
    } catch (error) {
        next(error);
    }
});

// 🟠 PUT /api/products/:id — Actualizar producto (solo admin)
router.put('/:id', passport.authenticate('jwt', { session: false }), authorizeRole('admin'), async (req, res, next) => {
    try {
        const { id } = req.params;
        validateObjectId(id, 'producto');
        const updates = req.body;
        if ('_id' in updates || 'id' in updates) {
            return res.status(400).json({ error: 'No se puede modificar el ID del producto.' });
        }
        if (updates.price !== undefined && (typeof updates.price !== 'number' || updates.price < 0)) {
            return res.status(400).json({ error: 'El precio debe ser un número válido y no negativo.' });
        }
        if (updates.stock !== undefined && (typeof updates.stock !== 'number' || updates.stock < 0)) {
            return res.status(400).json({ error: 'El stock debe ser un número válido y no negativo.' });
        }
        const updatedProduct = await ProductRepository.update(id, updates);
        if (!updatedProduct) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json({ status: 'success', message: 'Producto actualizado correctamente.', payload: updatedProduct });
    } catch (error) {
        next(error);
    }
});

// 🔴 DELETE /api/products/:id — Eliminar producto (solo admin)
router.delete('/:id', passport.authenticate('jwt', { session: false }), authorizeRole('admin'), async (req, res, next) => {
    try {
        const { id } = req.params;
        validateObjectId(id, 'producto');
        await ProductRepository.delete(id);
        // 🚀 Emitir actualización vía Socket.io a todos los clientes
        const io = req.app.get('io');
        if (io) {
            const updatedProducts = await ProductRepository.getAll();
            io.emit('products', updatedProducts);
        }
        res.json({ status: 'success', message: 'Producto eliminado correctamente.' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;