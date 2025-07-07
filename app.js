const express = require('express');
const path = require('path');
const { engine } = require('express-handlebars');

const cartsRouter = require('./src/routes/carts.router.js');
const productRouter = require('./src/routes/product.router.js');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de Handlebars
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'src', 'views'));

// Rutas API
app.use('/api/carts', cartsRouter);
app.use('/api/products', productRouter);

// Ruta para la vista realtimeproducts
app.use('/', require('./src/routes/views.router.js'));

module.exports = app;