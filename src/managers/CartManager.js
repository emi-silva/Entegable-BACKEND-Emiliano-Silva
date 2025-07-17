const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

class CartManager {
    async getCarts() {
        try {
            const carts = await Cart.find().populate('products.product').lean();
            return { status: 'success', payload: carts };
        } catch (error) {
            console.error('Error en CartManager.getCarts:', error);
            const customError = new Error('Error al obtener carritos de la base de datos.');
            customError.statusCode = 500;
            throw customError;
        }
    }

    async getCartById(cid) {
        try {
            const cart = await Cart.findById(cid).populate('products.product').lean();
            if (!cart) {
                const error = new Error('Carrito no encontrado');
                error.statusCode = 404;
                throw error;
            }
            return { status: 'success', payload: cart };
        } catch (error) {
            console.error('Error en CartManager.getCartById:', error);
            if (error.name === 'CastError') {
                const customError = new Error('ID de carrito inválido.');
                customError.statusCode = 400;
                throw customError;
            }
            const customError = new Error('Error al obtener el carrito de la base de datos.');
            customError.statusCode = 500;
            throw customError;
        }
    }

    async createCart({ userId = 'guest', products = [] } = {}) {
        try {
            if (!Array.isArray(products) || !products.every(item =>
                item.product && mongoose.Types.ObjectId.isValid(item.product) &&
                typeof item.quantity === 'number' && item.quantity >= 1)) {
                const error = new Error('Formato inicial de productos inválido. Se espera un array de objetos { product: ObjectId, quantity: Number }.');
                error.statusCode = 400;
                throw error;
            }

            const newCart = new Cart({ userId, products });
            await newCart.save();
            return { status: 'success', payload: newCart.toObject() };
        } catch (error) {
            console.error('Error en CartManager.createCart:', error);
            const customError = new Error('Error al crear el carrito en la base de datos.');
            customError.statusCode = 500;
            throw customError;
        }
    }

    async addProductToCart(cid, productId, quantity = 1) {
        try {
            const cart = await Cart.findById(cid);
            if (!cart) {
                const error = new Error('Carrito no encontrado');
                error.statusCode = 404;
                throw error;
            }

            const productToAdd = await Product.findById(productId);
            if (!productToAdd) {
                const error = new Error('Producto no encontrado');
                error.statusCode = 404;
                throw error;
            }

            if (productToAdd.stock < quantity) {
                const error = new Error(`No hay suficiente stock para agregar ${quantity} unidades de ${productToAdd.title}. Stock disponible: ${productToAdd.stock}`);
                error.statusCode = 400;
                throw error;
            }

            const productObjectId = new mongoose.Types.ObjectId(productId);
            const existingProduct = cart.products.find(p => p.product.equals(productObjectId));

            if (existingProduct) {
                if (productToAdd.stock < (existingProduct.quantity + quantity)) {
                    const error = new Error(`No hay suficiente stock para agregar ${quantity} unidades más de ${productToAdd.title}. Stock disponible: ${productToAdd.stock}, ya tienes ${existingProduct.quantity} en el carrito.`);
                    error.statusCode = 400;
                    throw error;
                }
                existingProduct.quantity += quantity;
            } else {
                cart.products.push({ product: productObjectId, quantity });
            }

            await cart.save();
            const updatedCart = await cart.populate('products.product');
            return { status: 'success', payload: updatedCart.toObject() };
        } catch (error) {
            console.error('Error en CartManager.addProductToCart:', error);
            if (!error.statusCode) error.statusCode = 500;
            throw error;
        }
    }

    async updateProductQuantity(cid, productId, quantity) {
        try {
            const cart = await Cart.findById(cid);
            if (!cart) {
                const error = new Error('Carrito no encontrado');
                error.statusCode = 404;
                throw error;
            }

            const productObjectId = new mongoose.Types.ObjectId(productId);
            const productInCart = cart.products.find(p => p.product.equals(productObjectId));

            if (!productInCart) {
                const error = new Error('Producto no encontrado en el carrito');
                error.statusCode = 404;
                throw error;
            }

            const productData = await Product.findById(productId);
            if (!productData) {
                const error = new Error('Detalles del producto no encontrados para validar stock');
                error.statusCode = 404;
                throw error;
            }
            if (productData.stock < quantity) {
                const error = new Error(`No hay suficiente stock para establecer la cantidad a ${quantity} unidades de ${productData.title}. Stock disponible: ${productData.stock}`);
                error.statusCode = 400;
                throw error;
            }

            productInCart.quantity = quantity;
            await cart.save();
            const updatedCart = await cart.populate('products.product');
            return { status: 'success', payload: updatedCart.toObject() };
        } catch (error) {
            console.error('Error en CartManager.updateProductQuantity:', error);
            if (!error.statusCode) error.statusCode = 500;
            throw error;
        }
    }

    async removeProductFromCart(cid, productId) {
        try {
            const cart = await Cart.findById(cid);
            if (!cart) {
                const error = new Error('Carrito no encontrado');
                error.statusCode = 404;
                throw error;
            }

            const initialLength = cart.products.length;
            const productObjectId = new mongoose.Types.ObjectId(productId);
            cart.products = cart.products.filter(p => !p.product.equals(productObjectId));

            if (cart.products.length === initialLength) {
                const error = new Error('Producto no encontrado en el carrito');
                error.statusCode = 404;
                throw error;
            }

            await cart.save();
            const updatedCart = await cart.populate('products.product');
            return { status: 'success', payload: updatedCart.toObject() };
        } catch (error) {
            console.error('Error en CartManager.removeProductFromCart:', error);
            if (!error.statusCode) error.statusCode = 500;
            throw error;
        }
    }

    async updateCartProducts(cid, newProducts) {
        try {
            const cart = await Cart.findById(cid);
            if (!cart) {
                const error = new Error('Carrito no encontrado');
                error.statusCode = 404;
                throw error;
            }

            if (!Array.isArray(newProducts) || !newProducts.every(item =>
                item.product && mongoose.Types.ObjectId.isValid(item.product) &&
                typeof item.quantity === 'number' && item.quantity >= 1)) {
                const error = new Error('Formato de productos inválido. Se espera un array de objetos { product: ObjectId, quantity: Number } donde product sea un ObjectId válido y quantity >= 1.');
                error.statusCode = 400;
                throw error;
            }

            for (const item of newProducts) {
                const productData = await Product.findById(item.product);
                if (!productData) {
                    const error = new Error(`Producto con ID ${item.product} no encontrado.`);
                    error.statusCode = 404;
                    throw error;
                }
                if (productData.stock < item.quantity) {
                    const error = new Error(`No hay suficiente stock para el producto ${productData.title}. Stock disponible: ${productData.stock}, solicitado: ${item.quantity}.`);
                    error.statusCode = 400;
                    throw error;
                }
            }

            cart.products = newProducts.map(item => ({
                product: new mongoose.Types.ObjectId(item.product),
                quantity: item.quantity
            }));
            await cart.save();
            const updatedCart = await cart.populate('products.product');
            return { status: 'success', payload: updatedCart.toObject() };
        } catch (error) {
            console.error('Error en CartManager.updateCartProducts:', error);
            if (!error.statusCode) error.statusCode = 500;
            throw error;
        }
    }

    async clearCart(cid) {
        try {
            const cart = await Cart.findById(cid);
            if (!cart) {
                const error = new Error('Carrito no encontrado');
                error.statusCode = 404;
                throw error;
            }

            cart.products = [];
            await cart.save();
            return { status: 'success', message: 'Carrito vaciado correctamente.' };
        } catch (error) {
            console.error('Error en CartManager.clearCart:', error);
            if (!error.statusCode) error.statusCode = 500;
            throw error;
        }
    }

    async deleteCart(cid) {
        try {
            const result = await Cart.findByIdAndDelete(cid);
            if (!result) {
                const error = new Error('Carrito no encontrado');
                error.statusCode = 404;
                throw error;
            }
            return { status: 'success', message: 'Documento de carrito eliminado correctamente.' };
        } catch (error) {
            console.error('Error en CartManager.deleteCart:', error);
            if (!error.statusCode) error.statusCode = 500;
            throw error;
        }
    }

    /**
     * Simula el proceso de compra de un carrito.
     * - Valida stock de cada producto.
     * - Descuenta el stock de los productos comprados.
     * - Vacía el carrito.
     * - Genera un ID de ticket simulado.
     * @param {string} cid - ID del carrito a comprar.
     * @returns {Promise<object>} Objeto con status y payload (ticketId).
     * @throws {Error} Si el carrito no es encontrado (statusCode 404) o hay problemas de stock (statusCode 400).
     */
    async purchaseCart(cid) {
        try {
            const cart = await Cart.findById(cid).populate('products.product');
            if (!cart) {
                const error = new Error('Carrito no encontrado');
                error.statusCode = 404;
                throw error;
            }

            if (cart.products.length === 0) {
                const error = new Error('El carrito está vacío, no se puede finalizar la compra.');
                error.statusCode = 400;
                throw error;
            }

            const productsToPurchase = [];
            const productsFailedStock = [];

            // 1. Validar stock y separar productos
            for (const item of cart.products) {
                const productDb = await Product.findById(item.product._id); 
                if (!productDb) {
                    productsFailedStock.push({ productId: item.product._id, reason: 'Producto no encontrado en el catálogo.' });
                    continue;
                }

                if (productDb.stock >= item.quantity) {
                    productsToPurchase.push({
                        product: productDb,
                        quantity: item.quantity
                    });
                } else {
                    productsFailedStock.push({ productId: item.product._id, reason: `Stock insuficiente. Disponible: ${productDb.stock}, solicitado: ${item.quantity}.` });
                }
            }

            if (productsToPurchase.length === 0) {
                const error = new Error('Ningún producto en el carrito tiene stock suficiente para la compra.');
                error.statusCode = 400;
                throw error;
            }

            // 2. Descontar stock de los productos comprados
            for (const item of productsToPurchase) {
                await Product.findByIdAndUpdate(item.product._id, { $inc: { stock: -item.quantity } });
            }

            // 3. Vaciar el carrito 
            cart.products = [];
            await cart.save();

            // 4. Generar un ID de ticket simulado
            const ticketId = new mongoose.Types.ObjectId().toString(); // Simula un ID de ticket

            return { status: 'success', payload: { ticketId, productsFailedStock } };

        } catch (error) {
            console.error('Error en CartManager.purchaseCart:', error);
            if (!error.statusCode) error.statusCode = 500;
            throw error;
        }
    }
}

module.exports = { CartManager };