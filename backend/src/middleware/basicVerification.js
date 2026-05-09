// Basic Verification Middleware - Middleware básico de verificación
// Implementa reglas de seguridad en rutas críticas

const basicVerification = (req, res, next) => {
  try {
    // Verificar si existe usuario autenticado
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado"
      });
    }

    // Verificar si el usuario está verificado
    if (!req.usuario.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Cuenta no verificada",
        verificationStatus: req.usuario.verificationStatus || "unverified",
        requiresVerification: true
      });
    }

    // Usuario verificado, continuar
    next();
    
  } catch (error) {
    console.error('❌ Basic verification middleware error:', error);
    return res.status(500).json({
      success: false,
      message: "Error en verificación de usuario"
    });
  }
};

module.exports = { basicVerification };
