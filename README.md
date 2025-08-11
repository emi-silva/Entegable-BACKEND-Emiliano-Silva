# 💥 Proyecto Final Backend - Emiliano Silva

Entrega final del curso de programación backend: una API RESTful diseñada con 💻 **Node.js**, **Express.js** y 🗄️ **MongoDB local** (usando Compass). Testeada con **Postman**, estructurada siguiendo buenas prácticas y pensada para la escalabilidad.

---

## 🚀 Tecnologías Utilizadas

- [x] Node.js
- [x] Express.js
- [x] MongoDB (local con Compass)
- [x] Postman
- [x] Dotenv para gestión de variables de entorno

---

🔌 Conexión a MongoDB
El proyecto está conectado a una instancia local de MongoDB. Se recomienda usar MongoDB Compass para visualizar, editar o importar datos.
- URI local usada en el proyecto:
mongodb://localhost:27017/backendFinal


🧪 Endpoints disponibles para testeo en Postman


| Método | Ruta             | Descripción           | 
| GET    | /api/ejemplo     | Lista todos los datos | 
| POST   | /api/ejemplo     | Crea un nuevo registro| 
| PUT    | /api/ejemplo/:id | Actualiza por ID      | 
| DELETE | /api/ejemplo/:id | Elimina por ID        | 


🧠 Aprendizajes clave
Este proyecto refleja el dominio de:
- Conexión y manipulación de bases de datos con MongoDB.
- Diseño de rutas RESTful con Express.js.
- Uso de Postman para testing y documentación.
- Manejo de variables de entorno con dotenv.
- Organización de código orientada a producción.

BACKEND 2 1er entregable:

### 🔒 Autenticación y Autorización

El proyecto implementa un sistema completo de autenticación y autorización de usuarios utilizando **Passport.js** y **JWT**.  
Incluye:

- Modelo de usuario con contraseña encriptada (bcrypt).
- Registro y login de usuarios con generación de token JWT.
- Estrategia Passport JWT para proteger rutas y validar usuarios autenticados.
- Endpoint `/api/sessions/current` para obtener los datos del usuario logueado mediante el token.

### 👤 CRUD de Usuarios

Se desarrolló un CRUD completo para la gestión de usuarios:

- **Crear** usuario: `POST /api/users`
- **Listar** usuarios: `GET /api/users`
- **Ver** usuario por ID: `GET /api/users/:id`
- **Actualizar** usuario: `PUT /api/users/:id`
- **Eliminar** usuario: `DELETE /api/users/:id`

Esto permite administrar usuarios de forma segura y eficiente, cumpliendo con los requisitos del proyecto.

✍️ Autor
Emiliano Silva
