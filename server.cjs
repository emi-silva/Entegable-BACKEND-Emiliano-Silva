const express = require('express');
const app = require('./app.js');
const http = require('http');
const { Server } = require('socket.io');
const { ProductManager } = require('./src/managers/ProductManager.js');

const PORT = 8080;
const server = http.createServer(app);
const io = new Server(server);

const manager = new ProductManager();

app.set('io', io);

io.on('connection', async (socket) => {
  // Enviar productos al conectar
  socket.emit('products', await manager.getProducts());
});

server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

