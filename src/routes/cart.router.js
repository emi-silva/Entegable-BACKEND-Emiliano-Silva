const { Router } = require('express');
const { CartManager } = require('../managers/CartManager');
const mongoose = require('mongoose');

const router = Router();
const cartManager = new CartManager();

// Helper para validar ObjectId
const validateObjectId = (id, paramName) => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error(`ID de ${paramName} inválido o no proporcionado.`);
        error.statusCode = 400;
        throw error;
    }
};

// 🟢 GET /api/carts — Obtener todos los carritos (solo para desarrollo/admin)
router.get('/', async (req, res, next) => {
    try {
        const carts = await cartManager.getCarts();
        res.json(carts); // Ya devuelve { status: 'success', payload: ... }
    } catch (error) {
        next(error);
    }
});

// 🟢 GET /api/carts/:cid — Obtener un carrito por ID (con productos populados)
router.get('/:cid', async (req, res, next) => {
    try {
        const { cid } = req.params;
        validateObjectId(cid, 'carrito');

        const cart = await cartManager.getCartById(cid);
        res.json(cart); // Ya devuelve { status: 'success', payload: ... }
    } catch (error) {
        next(error);
    }
});

// 🔵 POST /api/carts — Crear un nuevo carrito
router.post('/', async (req, res, next) => {
    try {
        const { userId, products } = req.body;

        const newCart = await cartManager.createCart({ userId, products });
        res.status(201).json(newCart); // Ya devuelve { status: 'success', payload: ... }
    } catch (error) {
        next(error);
    }
});

// 🔵 POST /api/carts/:cid/products/:pid — Agregar un producto al carrito (o incrementar cantidad)
router.post('/:cid/products/:pid', async (req, res, next) => {
    try {
        const { cid, pid } = req.params;
        const { quantity = 1 } = req.body;

        validateObjectId(cid, 'carrito');
        validateObjectId(pid, 'producto');

        if (typeof quantity !== 'number' || quantity < 1) {
            const error = new Error('La cantidad debe ser un número positivo.');
            error.statusCode = 400;
            throw error;
        }

        const updatedCart = await cartManager.addProductToCart(cid, pid, quantity);
        res.json(updatedCart); // Ya devuelve { status: 'success', payload: ... }
    } catch (error) {
        next(error);
    }
});

// 🟠 PUT /api/carts/:cid/products/:pid — Actualizar SÓLO la cantidad de un producto en el carrito
router.put('/:cid/products/:pid', async (req, res, next) => {
    try {
        const { cid, pid } = req.params;
        const { quantity } = req.body;

        validateObjectId(cid, 'carrito');
        validateObjectId(pid, 'producto');

        if (typeof quantity !== 'number' || quantity < 1) {
            const error = new Error('La cantidad debe ser un número positivo para actualizar.');
            error.statusCode = 400;
            throw error;
        }

        const updatedCart = await cartManager.updateProductQuantity(cid, pid, quantity);
        res.json(updatedCart); // Ya devuelve { status: 'success', payload: ... }
    } catch (error) {
        next(error);
    }
});

// 🟠 PUT /api/carts/:cid — Actualizar TODOS los productos del carrito con un nuevo array
router.put('/:cid', async (req, res, next) => {
    try {
        const { cid } = req.params;
        const { products } = req.body;

        validateObjectId(cid, 'carrito');

        if (!Array.isArray(products) || !products.every(item =>
            item.product && mongoose.Types.ObjectId.isValid(item.product) &&
            typeof item.quantity === 'number' && item.quantity >= 1)) {
            const error = new Error('Formato de productos inválido. Se espera un array de objetos { product: ObjectId, quantity: Number }.');
            error.statusCode = 400;
            throw error;
        }

        const updatedCart = await cartManager.updateCartProducts(cid, products);
        res.json(updatedCart); // Ya devuelve { status: 'success', payload: ... }
    } catch (error) {
        next(error);
    }
});

// 🔴 DELETE /api/carts/:cid/products/:pid — Eliminar un producto específico del carrito
router.delete('/:cid/products/:pid', async (req, res, next) => {
    try {
        const { cid, pid } = req.params;

        validateObjectId(cid, 'carrito');
        validateObjectId(pid, 'producto');

        const updatedCart = await cartManager.removeProductFromCart(cid, pid);
        res.json(updatedCart); // Ya devuelve { status: 'success', payload: ... }
    } catch (error) {
        next(error);
    }
});

// 🔴 DELETE /api/carts/:cid — Vaciar completamente el carrito (eliminar todos los productos)
router.delete('/:cid', async (req, res, next) => {
    try {
        const { cid } = req.params;
        validateObjectId(cid, 'carrito');

        const result = await cartManager.clearCart(cid);
        res.json(result); // Ya devuelve { status: 'success', message: ... }
    } catch (error) {
        next(error);
    }
});

// 🔵 POST /api/carts/:cid/purchase — Procesar la compra del carrito
router.post('/:cid/purchase', async (req, res, next) => {
    try {
        const { cid } = req.params;
        validateObjectId(cid, 'carrito');

        const purchaseResult = await cartManager.purchaseCart(cid);
        res.json(purchaseResult); // Devuelve { status: 'success', payload: { ticketId, productsFailedStock } }
    } catch (error) {
        next(error);
    }
});

// 🔴 DELETE /api/carts/delete/:cid — Eliminar el documento completo del carrito (para admin)
router.delete('/delete/:cid', async (req, res, next) => {
    try {
        const { cid } = req.params;
        validateObjectId(cid, 'carrito');

        const result = await cartManager.deleteCart(cid);
        res.json(result); // Ya devuelve { status: 'success', message: ... }
    } catch (error) {
        next(error);
    }
});

module.exports = router;