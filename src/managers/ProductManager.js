const Product = require('../models/Product');

class ProductManager {
    // El constructor puede recibir 'io' si lo necesitas aquí, pero no es estrictamente necesario para la gestión de DB
    // constructor(io) {
    //     this.io = io;
    // }

    /**
     * Obtiene productos de la base de datos con filtros y paginación.
     * @param {object} filter - Objeto de filtro para la consulta.
     * @param {object} options - Opciones de paginación y ordenamiento.
     * @returns {Promise<object>} Un objeto con los resultados paginados (payload, totalPages, etc.).
     */
    async getProducts(filter = {}, options = {}) {
        try {
            const result = await Product.paginate(filter, options);
            // Formatear el resultado para que coincida con el formato esperado por el router
            return {
                status: 'success',
                payload: result.docs, // Los documentos de los productos
                totalPages: result.totalPages,
                page: result.page,
                hasPrevPage: result.hasPrevPage,
                hasNextPage: result.hasNextPage,
                prevPage: result.prevPage,
                nextPage: result.nextPage,
                // Puedes añadir más propiedades si las necesitas en el frontend
                limit: result.limit,
                totalDocs: result.totalDocs
            };
        } catch (error) {
            console.error('Error en ProductManager.getProducts:', error);
            // Re-lanzar el error o lanzar uno nuevo con un statusCode si es apropiado
            const customError = new Error('Error al obtener productos de la base de datos.');
            customError.statusCode = 500;
            throw customError;
        }
    }

    /**
     * Obtiene un producto específico por su ID.
     * @param {string} id - El ID del producto a buscar.
     * @returns {Promise<object>} Un objeto con el producto (payload).
     * @throws {Error} Si el producto no es encontrado.
     */
    async getProductById(id) {
        const product = await Product.findById(id).lean(); // Usar .lean() para objetos planos
        if (!product) {
            const error = new Error('Producto no encontrado');
            error.statusCode = 404; // Not Found
            throw error;
        }
        return { status: 'success', payload: product };
    }

    /**
     * Agrega un nuevo producto a la base de datos.
     * @param {object} productData - Datos del producto a agregar
     * @returns {Promise<object>} Un objeto con el nuevo producto creado (payload).
     * @throws {Error} Si el código del producto ya existe.
     */
    async addProduct(productData) {
        const exists = await Product.findOne({ code: productData.code });
        if (exists) {
            const error = new Error(`El código '${productData.code}' del producto ya existe.`);
            error.statusCode = 400; // Bad Request
            throw error;
        }

        const newProduct = new Product(productData);
        await newProduct.save();
        return { status: 'success', payload: newProduct.toObject() }; // Convertir a objeto plano
    }

    /**
     * Actualiza un producto existente por su ID.
     * @param {string} id - El ID del producto a actualizar.
     * @param {object} updates - Objeto con los campos a actualizar y sus nuevos valores.
     * @returns {Promise<object>} Un objeto con el producto actualizado (payload).
     * @throws {Error} Si el producto no es encontrado o si el código actualizado ya existe.
     */
    async updateProduct(id, updates) {
        if (updates.code) {
            // Verificar si el nuevo código ya está en uso por otro producto
            const exists = await Product.findOne({ code: updates.code, _id: { $ne: id } });
            if (exists) {
                const error = new Error(`El código '${updates.code}' ya pertenece a otro producto.`);
                error.statusCode = 400; // Bad Request
                throw error;
            }
        }

        const updated = await Product.findByIdAndUpdate(id, updates, { new: true }).lean(); // Usar .lean()
        if (!updated) {
            const error = new Error('Producto no encontrado para actualizar');
            error.statusCode = 404; // Not Found
            throw error;
        }
        return { status: 'success', payload: updated };
    }

    /**
     * Elimina un producto por su ID.
     * @param {string} id - El ID del producto a eliminar.
     * @returns {Promise<object>} Un objeto con el producto eliminado (payload).
     * @throws {Error} Si el producto no es encontrado.
     */
    async deleteProduct(id) {
        const deleted = await Product.findByIdAndDelete(id).lean(); // Usar .lean()
        if (!deleted) {
            const error = new Error('Producto no encontrado para eliminar');
            error.statusCode = 404; // Not Found
            throw error;
        }
        return { status: 'success', payload: deleted };
    }
}

module.exports = ProductManager;