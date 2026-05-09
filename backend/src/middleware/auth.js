const { verificarToken } = require('../config/jwt');

function authMiddleware(req, res, next) {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Acceso denegado. No se proporcionó token.' 
    });
  }

  // Eliminar "Bearer " del token si existe
  const tokenSinBearer = token.replace('Bearer ', '');

  try {
    const decoded = verificarToken(tokenSinBearer);
    req.usuario = decoded;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Token inválido o expirado.' 
    });
  }
}

module.exports = authMiddleware;
module.exports.requireAuth = authMiddleware;
