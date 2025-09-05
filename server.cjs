
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const ProductManager = require('./src/managers/ProductManager');
const mongoose = require('mongoose');
const app = require('./app.js');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/backendFinal';
const PORT = process.env.PORT || 8080;
const server = http.createServer(app);
const io = new Server(server);


mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('🟢 Conectado a MongoDB');

        // **2. Instanciar Managers DESPUÉS de asegurar la conexión a la DB**
        const productManagerInstance = new ProductManager(io); 

        // **3. Configuración de Socket.io**
        io.on('connection', async (socket) => {
            console.log(`🧠 Cliente conectado vía Socket.io: ${socket.id}`);

            // Emitir productos iniciales al cliente que se conecta
            try {
                const productos = await productManagerInstance.getProducts({}); // Pasar un objeto vacío si no hay query/limit/page
                socket.emit('products', productos.payload); // Asumiendo que getProducts devuelve el formato esperado {payload: ...}
            } catch (err) {
                console.error('Error al obtener y emitir productos iniciales vía Socket.io:', err);
                socket.emit('error', 'Error al obtener productos iniciales.');
            }

            // Manejadores de eventos de Socket.io
            socket.on('addProduct', async (data) => {
                try {
                    await productManagerInstance.addProduct(data);
                    // Emitir productos actualizados a TODOS los clientes después de una modificación
                    const updatedProducts = await productManagerInstance.getProducts({});
                    io.emit('products', updatedProducts.payload);
                } catch (error) {
                    console.error('Error al agregar producto vía Socket.io:', error);
                    socket.emit('error', error.message || 'Error al agregar producto.');
                }
            });

            socket.on('deleteProduct', async (id) => {
                try {
                    await productManagerInstance.deleteProduct(id);
                    // Emitir productos actualizados a TODOS los clientes después de una modificación
                    const updatedProducts = await productManagerInstance.getProducts({});
                    io.emit('products', updatedProducts.payload);
                } catch (error) {
                    console.error('Error al eliminar producto vía Socket.io:', error);
                    socket.emit('error', error.message || 'Error al eliminar producto.');
                }
            });

            socket.on('disconnect', () => {
                console.log(`🔌 Cliente desconectado: ${socket.id}`);
            });
        });

        // **4. Iniciar el servidor SOLO después de que la base de datos esté conectada**
        server.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        }).on('error', err => {
            console.error('❌ Error al iniciar el servidor:', err.message);
        });

    })
    .catch(err => {
        console.error('🔴 Error de conexión a MongoDB. El servidor NO se iniciará:', err.message);
        process.exit(1); 
    });



