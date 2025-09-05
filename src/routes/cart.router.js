const { Router } = require('express');
const { CartManager } = require('../managers/CartManager');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const TicketRepository = require('../repositories/TicketRepository');
const passport = require('passport');

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

// Endpoint de compra: genera ticket, verifica stock y maneja compras incompletas
router.post('/:cid/purchase', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
    try {
        const { cid } = req.params;
        validateObjectId(cid, 'carrito');
        const cart = await cartManager.getCartById(cid);
        if (!cart || !cart.payload) return res.status(404).json({ error: 'Carrito no encontrado' });
        const user = req.user;
        let total = 0;
        let purchasedProducts = [];
        let notPurchased = [];
        for (const item of cart.payload.products) {
            const product = await Product.findById(item.product._id);
            if (product && product.stock >= item.quantity) {
                product.stock -= item.quantity;
                await product.save();
                total += product.price * item.quantity;
                purchasedProducts.push({ product: product._id, quantity: item.quantity });
            } else {
                notPurchased.push({ product: item.product._id, quantity: item.quantity });
            }
        }
        if (purchasedProducts.length === 0) {
            return res.status(400).json({ error: 'No hay productos con stock suficiente para comprar.' });
        }
        // Generar código único para el ticket
        const code = 'TICKET-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
        const ticket = await TicketRepository.create({
            code,
            amount: total,
            purchaser: user.email,
            products: purchasedProducts
        });
        // Eliminar productos comprados del carrito
        cart.payload.products = cart.payload.products.filter(item => notPurchased.some(np => np.product.equals(item.product._id)));
        await cart.payload.save();
        res.json({ status: 'success', ticket, notPurchased });
    } catch (error) {
        next(error);
    }
});
// ...existing code...

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