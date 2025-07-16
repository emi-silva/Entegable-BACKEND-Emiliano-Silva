// src/routes/views.router.js
const { Router } = require('express');
const ProductManager = require('../managers/ProductManager'); // Importa tu ProductManager
const { CartManager } = require('../managers/CartManager'); // Importa tu CartManager (con desestructuración)

const router = Router();
const productManager = new ProductManager();
const cartManager = new CartManager(); // Instancia el CartManager

// Vista de productos paginada con filtros (index.handlebars)
// Responde tanto a la ruta raíz '/' como a '/products'
router.get(['/', '/products'], async (req, res, next) => {
    try {
        const { page = 1, limit = 10, sort, query, category, status } = req.query;

        const filter = {};
        if (query) {
            filter.$or = [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { category: { $regex: query, $options: 'i' } }
            ];
        }
        if (category) filter.category = category;
        // Asegúrate de que `status` se maneje correctamente como booleano
        if (status !== undefined && (status === 'true' || status === 'false')) {
            filter.status = status === 'true';
        }

        const options = {
            page: Number(page),
            limit: Number(limit),
            lean: true, // Importante para Handlebars, devuelve objetos planos
            sort: {}
        };

        if (sort === 'asc') {
            options.sort.price = 1;
        } else if (sort === 'desc') {
            options.sort.price = -1;
        }

        // Utiliza el ProductManager para obtener los productos
        const result = await productManager.getProducts(filter, options);

        console.log('Datos de productos enviados a index.handlebars:', result.payload);
        console.log('Tipo de datos de products:', typeof result.payload, Array.isArray(result.payload) ? 'Es un array' : 'NO es un array');

        // Helper para construir los links de paginación
        const buildLink = (targetPage) => {
            const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
            const params = new URLSearchParams(req.query);
            params.set('page', targetPage);
            // Usamos /products para los links generados para mantener la consistencia en la URL
            const currentPath = req.path === '/' ? '/products' : req.path;
            return `${req.protocol}://${req.get('host')}${currentPath}?${params.toString()}`;
        };

        // Manejo del cartId para las vistas (si se usa express-session)
        // Para esta entrega, el frontend JavaScript gestiona el cartId con localStorage.
        let currentCartId = null;
        if (req.session && req.session.cartId) {
            currentCartId = req.session.cartId;
        }

        res.render('index', {
            products: result.payload, // Los documentos de los productos
            totalPages: result.totalPages,
            page: result.page,
            hasPrevPage: result.hasPrevPage,
            hasNextPage: result.hasNextPage,
            prevPage: result.prevPage,
            nextPage: result.nextPage,
            prevLink: result.hasPrevPage ? buildLink(result.prevPage) : null,
            nextLink: result.hasNextPage ? buildLink(result.nextPage) : null,
            // Pasa los query params actuales para mantener los filtros en los links de paginación
            currentQuery: req.query.query || '',
            currentCategory: req.query.category || '',
            currentStatus: req.query.status || '',
            currentSort: req.query.sort || '',
            limit: Number(limit), // Pasa el límite actual para pre-seleccionar en el input
            cartId: currentCartId // Pasa el cartId si lo tienes (desde sesión/cookie)
        });
    } catch (error) {
        next(error); // Delega al middleware global de errores
    }
});

// Vista en tiempo real (realTimeProducts)
router.get('/realtimeproducts', async (req, res, next) => {
    try {
        // Obtener todos los productos sin paginación para Socket.io
        const productsResult = await productManager.getProducts({});
        res.render('realTimeProducts', { products: productsResult.payload });
    } catch (error) {
        next(error);
    }
});

// Vista de detalle de producto (/products/:pid)
router.get('/products/:pid', async (req, res, next) => {
    try {
        const { pid } = req.params;
        const productResult = await productManager.getProductById(pid);

        // Accede al payload, que es el producto
        const product = productResult.payload;

        // Manejo del cartId para esta vista (si se usa express-session)
        let currentCartId = null;
        if (req.session && req.session.cartId) {
            currentCartId = req.session.cartId;
        }
        // Si no tienes sesiones, el script en productDetail.handlebars
        // intentará gestionar el cartId con localStorage.

        res.render('productDetail', { product: product, cartId: currentCartId });
    } catch (error) {
        next(error); // Delega al middleware global de errores
    }
});

// 🛒 Vista detalle de carrito (/carts/:cid)
router.get('/carts/:cid', async (req, res, next) => {
    try {
        const { cid } = req.params;
        const cartResult = await cartManager.getCartById(cid);
        const cart = cartResult.payload; // Accede al payload, que es el carrito populado

        // *** AGREGAR ESTE CONSOLE.LOG AQUÍ ***
        console.log('Objeto carrito recibido en views.router.js:', cart);
        console.log('Tipo de cart.products:', typeof cart.products, Array.isArray(cart.products) ? 'Es un array' : 'NO es un array');
        // ************************************

        if (!cart) { // Esta verificación puede ser redundante si getCartById ya lanza 404
            return res.status(404).render('error', { message: 'Carrito no encontrado.' });
        }

        // Calcular el total del carrito
        let cartTotal = 0;
        // Asegúrate de que product.price y item.quantity sean números válidos
        cart.products.forEach(item => {
            if (item.product && typeof item.product.price === 'number' && typeof item.quantity === 'number') {
                cartTotal += item.product.price * item.quantity;
            }
        });

        res.render('cartDetail', { cart: cart, cartTotal: cartTotal.toFixed(2) }); // Pasa el carrito y el total formateado
    } catch (error) {
        next(error);
    }
});

// ✅ Vista de compra finalizada
router.get('/checkout', (req, res) => {
    const { orderId } = req.query; // Obtener orderId de los query parameters
    res.render('checkout', { orderId: orderId }); // Pasar orderId a la plantilla
});

module.exports = router;
