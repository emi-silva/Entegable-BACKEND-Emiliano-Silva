// src/routes/product.router.js
const { Router } = require('express');
const ProductManager = require('../managers/ProductManager'); // Importa tu ProductManager
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

// 🟢 GET /api/products — con filtros y paginación
router.get('/', async (req, res, next) => {
    try {
        const { limit = 10, page = 1, sort, query, category, status } = req.query;

        // Construcción del objeto de filtro para Product.paginate
        const filter = {};
        if (query) {
            // Búsqueda por palabra clave en title, description o category (case-insensitive)
            filter.$or = [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { category: { $regex: query, $options: 'i' } }
            ];
        }
        if (category) {
            // Filtro por categoría específica
            filter.category = category;
        }
        if (status !== undefined) {
            // Filtro por estado (true/false), convierte el string a booleano
            filter.status = status === 'true';
        }

        // Construcción del objeto de opciones para Product.paginate
        const options = {
            limit: Number(limit), // Asegura que limit sea un número
            page: Number(page),   // Asegura que page sea un número
            lean: true,           // Devuelve objetos JS planos, no documentos Mongoose completos (más eficiente para vistas)
            sort: {}              // Objeto para el ordenamiento
        };

        // Configuración del ordenamiento por precio
        if (sort === 'asc') {
            options.sort.price = 1;  // Orden ascendente
        } else if (sort === 'desc') {
            options.sort.price = -1; // Orden descendente
        }

        // Llama al ProductManager para obtener los productos paginados
        const result = await productManager.getProducts(filter, options);

        // Si no se encuentran documentos, devuelve un 404 específico
        // Nota: getProducts devuelve un payload vacío si no hay resultados,
        // por lo que esta verificación es más para una respuesta de API específica
        if (result.payload.length === 0 && (query || category || status !== undefined)) {
             // Solo si hay filtros y no se encontraron productos, consideramos un 404
             // Si no hay filtros y el catálogo está vacío, es un 200 con payload vacío
             if (result.totalDocs === 0) { // Si realmente no hay ningún documento en la colección
                const error = new Error('No se encontraron productos que coincidan con los criterios de búsqueda.');
                error.statusCode = 404;
                throw error;
             }
        }

        // Helper para construir los links de paginación
        const buildLink = (targetPage) => {
            const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
            // Crea un nuevo objeto URLSearchParams para manipular los query params
            const params = new URLSearchParams(req.query);
            params.set('page', targetPage); // Actualiza el parámetro 'page'
            return `${baseUrl}?${params.toString()}`;
        };

        // Prepara la respuesta con el formato solicitado
        res.json({
            status: 'success',
            payload: result.payload, // Los documentos de los productos
            totalPages: result.totalPages,
            page: result.page,
            hasPrevPage: result.hasPrevPage,
            hasNextPage: result.hasNextPage,
            prevPage: result.prevPage,
            nextPage: result.nextPage,
            prevLink: result.hasPrevPage ? buildLink(result.prevPage) : null,
            nextLink: result.hasNextPage ? buildLink(result.nextPage) : null
        });

    } catch (error) {
        // Pasa el error al middleware de manejo de errores global en app.js
        // Si el error tiene un statusCode (ej. 400, 404) lo usará, de lo contrario 500.
        next(error);
    }
});

// 🟢 GET /api/products/:id — Obtener un producto por ID
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        validateObjectId(id, 'producto'); // Valida el formato del ID

        const productResult = await productManager.getProductById(id);
        // productManager.getProductById ya lanza un 404 si no lo encuentra.
        res.json({ status: 'success', payload: productResult.payload }); // Asume que getProductById devuelve { payload: product }
    } catch (error) {
        // Pasa el error al middleware de manejo de errores global
        next(error);
    }
});

// 🔵 POST /api/products — Agregar nuevo producto
router.post('/', async (req, res, next) => {
    try {
        const { title, description, code, price, stock, category, thumbnails, status } = req.body;

        // Validaciones básicas de campos obligatorios y tipos
        if (!title || !description || !code || price == null || stock == null || !category) {
            const error = new Error('Faltan campos obligatorios para crear el producto (title, description, code, price, stock, category).');
            error.statusCode = 400;
            throw error;
        }
        if (typeof price !== 'number' || typeof stock !== 'number' || price < 0 || stock < 0) {
            const error = new Error('Price y stock deben ser números válidos y no negativos.');
            error.statusCode = 400;
            throw error;
        }

        // Crea el objeto de datos del producto, asignando valores por defecto si no vienen
        const productData = {
            title,
            description,
            code,
            price,
            stock,
            category,
            thumbnails: thumbnails || [], // Asegura que thumbnails sea un array vacío si no se proporciona
            status: status ?? true        // Usa nullish coalescing para default true
        };

        const newProduct = await productManager.addProduct(productData);

        // 🚀 Emitir actualización vía Socket.io a todos los clientes
        // Se obtiene la instancia de io desde la aplicación Express
        const io = req.app.get('io');
        if (io) {
            // Obtener la primera página de productos para la actualización en tiempo real
            // Esto asegura que la vista 'realTimeProducts' siempre muestre los productos más recientes
            const updatedProductsResult = await productManager.getProducts({}, { limit: 10, page: 1 });
            io.emit('products', updatedProductsResult.payload); // Emitir solo el payload (docs)
        }

        res.status(201).json({ status: 'success', message: 'Producto creado correctamente.', payload: newProduct }); // 201 Created
    } catch (error) {
        // Pasa el error al middleware de manejo de errores global
        next(error);
    }
});

// 🟠 PUT /api/products/:id — Actualizar producto
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        validateObjectId(id, 'producto'); // Valida el formato del ID
        const updates = req.body;

        // Evitar que se modifique el ID del producto
        if ('_id' in updates || 'id' in updates) {
            const error = new Error('No se puede modificar el ID del producto.');
            error.statusCode = 400;
            throw error;
        }

        // Opcional: Validar tipos de datos si se envían en 'updates'
        if (updates.price !== undefined && typeof updates.price !== 'number' || updates.price < 0) {
            const error = new Error('El precio debe ser un número válido y no negativo.');
            error.statusCode = 400;
            throw error;
        }
        if (updates.stock !== undefined && typeof updates.stock !== 'number' || updates.stock < 0) {
            const error = new Error('El stock debe ser un número válido y no negativo.');
            error.statusCode = 400;
            throw error;
        }
        // Puedes añadir más validaciones para otros campos si es necesario.

        const updatedProduct = await productManager.updateProduct(id, updates);
        res.json({ status: 'success', message: 'Producto actualizado correctamente.', payload: updatedProduct });

    } catch (error) {
        // Pasa el error al middleware de manejo de errores global
        next(error);
    }
});

// 🔴 DELETE /api/products/:id — Eliminar producto
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        validateObjectId(id, 'producto'); // Valida el formato del ID

        await productManager.deleteProduct(id);

        // 🚀 Emitir actualización vía Socket.io a todos los clientes
        const io = req.app.get('io');
        if (io) {
            // Obtener la primera página de productos para la actualización en tiempo real
            const updatedProductsResult = await productManager.getProducts({}, { limit: 10, page: 1 });
            io.emit('products', updatedProductsResult.payload); // Emitir solo el payload (docs)
        }

        res.json({ status: 'success', message: 'Producto eliminado correctamente.' });
    } catch (error) {
        // Pasa el error al middleware de manejo de errores global
        next(error);
    }
});

module.exports = router;