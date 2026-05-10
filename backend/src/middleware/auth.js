const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function authMiddleware(req, res, next) {
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
    const decoded = jwt.verify(tokenSinBearer, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id || decoded.sub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Token invalido o expirado.'
      });
    }

    const user = await User.findById(userId).select('+password +refreshToken');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o inactivo.'
      });
    }

    req.usuario = decoded;
    req.usuario.id = user._id.toString();
    req.usuario.role = user.role;
    req.usuario.userType = user.role;
    req.user = user;
    req.userId = user._id;
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
