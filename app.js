const express = require('express');
const handlebars = require('express-handlebars');
const path = require('path');
const passport = require('passport');
require('./src/config/passport'); // Importa tu configuración de passport

// Importar los routers
const productsRouter = require('./src/routes/product.router');
const cartsRouter = require('./src/routes/cart.router');
const viewsRouter = require('./src/routes/views.router');
const sessionsRouter = require('./src/routes/sessions.router');
const usersRouter = require('./src/routes/users.router');

const app = express();

// --- Middlewares globales para Express ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());

// --- Configuración del Motor de Plantillas Handlebars ---
app.engine('handlebars', handlebars.engine({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, '/src/views/layouts/'),
    partialsDir: path.join(__dirname, '/src/views/partials/'),
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
    },
    helpers: {
        eq: function (a, b) { return a === b; },
        gt: (a, b) => a > b,
        lt: (a, b) => a < b
    }
}));

app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, '/src/views/'));

// --- Definición de Rutas de la Aplicación ---
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
app.use('/', viewsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/users', usersRouter);

// --- Manejador de Errores Global ---
app.use((err, req, res, next) => {
    console.error('🚨 Error detectado:', err);
    res.status(err.statusCode || 500).render('error', { message: err.message || 'Error interno del servidor' });
});

module.exports = app;