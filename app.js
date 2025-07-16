const express = require('express');
const handlebars = require('express-handlebars');
const path = require('path'); // Módulo 'path' para construir rutas de archivos absolutas

// Importar los routers
// ✅ CORREGIDO: La ruta ahora apunta a 'product.router' (singular)
const productsRouter = require('./src/routes/product.router');
const cartsRouter = require('./src/routes/cart.router');
const viewsRouter = require('./src/routes/views.router');

const app = express();

// --- Middlewares globales para Express ---
// Estos deben ir al principio, antes de tus definiciones de rutas.

// 1. Middleware para parsear cuerpos de solicitud en formato JSON.
// Esto es esencial para que req.body funcione cuando envías datos JSON (ej. con fetch en el frontend).
app.use(express.json());

// 2. Middleware para parsear cuerpos de solicitud de formularios HTML (URL-encoded).
// 'extended: true' permite parsear objetos y arrays en el body.
app.use(express.urlencoded({ extended: true }));

// 3. Middleware para servir archivos estáticos (CSS, JS del cliente, imágenes, etc.).
// Asegúrate de que tu carpeta 'public' exista en la raíz de tu proyecto.
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
        // Helper 'eq' para comparar valores dentro de las plantillas.
        // Útil para seleccionar opciones en <select> o aplicar clases condicionalmente.
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
// Aquí es donde "montas" tus routers en sus respectivas rutas base.

// Rutas para la API de productos (ej. /api/products, /api/products/:id)
app.use('/api/products', productsRouter);
// Rutas para la API de carritos (ej. /api/carts, /api/carts/:cid/products/:pid)
app.use('/api/carts', cartsRouter);
// Rutas para las vistas renderizadas con Handlebars (ej. /, /products, /realtimeproducts)
app.use('/', viewsRouter);


// --- Manejador de Errores Global ---
// Este middleware se ejecuta cuando un error es lanzado (throw error) o
// cuando 'next(error)' es llamado en cualquier parte de la aplicación.
app.use((err, req, res, next) => {
    console.error('🚨 Error detectado:', err); // Log el error para depuración en el servidor

    // Si el error tiene un statusCode, úsalo; de lo contrario, usa 500 (Internal Server Error).
    // Luego, renderiza la vista 'error.handlebars' pasándole el mensaje del error.
    res.status(err.statusCode || 500).render('error', { message: err.message || 'Error interno del servidor' });
});

// Exporta la instancia de la aplicación Express para ser usada en server.cjs
module.exports = app;