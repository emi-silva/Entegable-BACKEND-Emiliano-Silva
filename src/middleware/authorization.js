// Middleware de autorización por roles
module.exports = function authorizeRole(role) {
  return (req, res, next) => {
    console.log('Middleware autorización - req.user:', req.user);
    if (!req.user || req.user.role !== role) {
      console.log('Acceso denegado. Rol requerido:', role, 'Rol del usuario:', req.user ? req.user.role : undefined);
      return res.status(403).json({ error: 'No tienes permisos para realizar esta acción.' });
    }
    console.log('Acceso permitido. Rol del usuario:', req.user.role);
    next();
  };
};
