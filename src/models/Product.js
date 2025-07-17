const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

/*
  Estructura del producto:
  - title: nombre del producto
  - description: descripción
  - code: código único
  - price: precio
  - status: booleano (activo/inactivo)
  - stock: cantidad disponible
  - category: categoría
  - thumbnails: array de URLs de imágenes
*/

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true, // Asegura que el código sea único
    uppercase: true, // Guarda el código en mayúsculas para consistencia
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0 // Asegura que el precio no sea negativo
  },
  status: {
    type: Boolean,
    default: true // Valor por defecto para productos nuevos
  },
  stock: {
    type: Number,
    required: true,
    min: 0 // Asegura que el stock no sea negativo
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  thumbnails: {
    type: [String],
    default: [] 
  }
}, {
  timestamps: true // Agrega campos createdAt y updatedAt automáticamente
});

// Definición de índices para optimizar consultas y ordenamientos
productSchema.index({ category: 1 }); // Índice para búsquedas rápidas por categoría
productSchema.index({ price: 1 });    // Índice para ordenamiento eficiente por precio
productSchema.index({ status: 1 });   // Índice para búsquedas por estado (activo/inactivo)

// Aplicación del plugin de paginación
productSchema.plugin(mongoosePaginate);


module.exports = mongoose.model('Product', productSchema);