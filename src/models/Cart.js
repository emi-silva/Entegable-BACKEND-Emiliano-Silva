const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartSchema = new Schema({
    
    userId: {
        type: String, 
        default: 'guest', // Valor por defecto si el usuario no está logueado
        index: true // Para búsquedas eficientes por userId
    },
    products: [
        {
            product: {
                type: Schema.Types.ObjectId,
                ref: 'Product', // Referencia al modelo de Producto
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1 // Asegura que la cantidad sea al menos 1
            },
            _id: false // Evita que Mongoose cree un _id para cada subdocumento de producto
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware para actualizar 'updatedAt' antes de guardar
cartSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
