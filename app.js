const express = require('express');
const cartsRouter = require('./src/routes/carts.router.js');

const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Rutas
app.use('/api/carts', cartsRouter);

// Exportación para que server.js lo levante
module.exports = app;