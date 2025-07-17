const express = require('express');
const handlebars = require('express-handlebars');
const path = require('path'); // Módulo 'path' para construir rutas de archivos absolutas

// Importar los routers

const productsRouter = require('./src/routes/product.router');
const cartsRouter = require('./src/routes/cart.router');
const viewsRouter = require('./src/routes/views.router');

const app = express();

// --- Middlewares globales para Express ---


// 1. Middleware para parsear cuerpos de solicitud en formato JSON.
app.use(express.json());

// 2. Middleware para parsear cuerpos de solicitud de formularios HTML (URL-encoded).
app.use(express.urlencoded({ extended: true }));

// 3. Middleware para servir archivos estáticos (CSS, JS del cliente, imágenes, etc.).
app.use(express.static(path.join(__dirname, 'public')));


// --- Configuración del Motor de Plantillas Handlebars ---

app.engine('handlebars', handlebars.engine({
    // Layout principal que se usará por defecto si no se especifica otro.
    defaultLayout: 'main',
    // Directorio donde se encuentran los layouts.
    layoutsDir: path.join(__dirname, '/src/views/layouts/'),
    // Directorio donde se encuentran los parciales (fragmentos reutilizables de HTML).
    partialsDir: path.join(__dirname, '/src/views/partials/'),
    // OPCIONES DE TIEMPO DE EJECUCIÓN PARA CONTROLAR EL ACCESO A PROPIEDADES
    // Esto desactiva las advertencias de "Access has been denied to resolve the property..."
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
    },
    // Helpers personalizados para Handlebars.
    helpers: {
       
        eq: function (a, b) {
            return a === b;
        },
        // Helper 'gt' para "mayor que"
        gt: (a, b) => a > b,
        // Helper 'lt' para "menor que"
        lt: (a, b) => a < b
    }
}));

// Establece Handlebars como el motor de vistas de Express.
app.set('view engine', 'handlebars');
// Establece el directorio donde Express buscará tus plantillas de vistas.
app.set('views', path.join(__dirname, '/src/views/'));


// --- Definición de Rutas de la Aplicación ---

// Rutas para la API de productos (ej. /api/products, /api/products/:id)
app.use('/api/products', productsRouter);
// Rutas para la API de carritos (ej. /api/carts, /api/carts/:cid/products/:pid)
app.use('/api/carts', cartsRouter);
// Rutas para las vistas renderizadas con Handlebars (ej. /, /products, /realtimeproducts)
app.use('/', viewsRouter);


// --- Manejador de Errores Global ---

app.use((err, req, res, next) => {
    console.error('🚨 Error detectado:', err); // Log el error para depuración en el servidor

    res.status(err.statusCode || 500).render('error', { message: err.message || 'Error interno del servidor' });
});

module.exports = app;