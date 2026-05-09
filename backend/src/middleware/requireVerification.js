// Require Verification Middleware - Middleware obligatorio para endpoints críticos
// Bloquea acceso a usuarios no verificados

const User = require('../models/User');
const Professional = require('../models/Professional');

const requireVerification = (req, res, next) => {
  try {
    const userId = req.usuario?.id;
    const userType = req.usuario?.userType || 'user';
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Autenticación requerida"
      });
    }
    
    // Para usuarios, verificar el campo isVerified
    if (userType === 'user') {
      if (!req.usuario.isVerified) {
        return res.status(403).json({
          success: false,
          message: "Cuenta no verificada. Debes completar tu perfil.",
          verificationStatus: req.usuario.verificationStatus || "unverified",
          requiresVerification: true
        });
      }
    }
    
    // Para profesionales, verificar both isVerified y verificationStatus
    if (userType === 'professional') {
      if (!req.usuario.isVerified || req.usuario.verificationStatus !== 'verified') {
        return res.status(403).json({
          success: false,
          message: "Cuenta profesional no verificada. Debes completar tu perfil de profesional.",
          verificationStatus: req.usuario.verificationStatus || "unverified",
          isVerified: req.usuario.isVerified,
          requiresVerification: true
        });
      }
    }
    
    // Usuario verificado, continuar
    next();
    
  } catch (error) {
    console.error('❌ Require verification middleware error:', error);
    res.status(500).json({
      success: false,
      message: "Error al verificar estado de cuenta"
    });
  }
};

// Versión mejorada con verificación de base de datos
const requireVerificationDB = async (req, res, next) => {
  try {
    const userId = req.usuario?.id;
    const userType = req.usuario?.userType || 'user';
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Autenticación requerida"
      });
    }
    
    let user;
    
    if (userType === 'user') {
      user = await User.findById(userId);
    } else if (userType === 'professional') {
      user = await Professional.findById(userId);
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }
    
    // Verificación para usuarios
    if (userType === 'user') {
      if (!user.isVerified) {
        return res.status(403).json({
          success: false,
          message: "Cuenta no verificada. Debes completar tu perfil.",
          verificationStatus: user.verificationStatus || "unverified",
          accountType: user.accountType || "person",
          requiresVerification: true,
          nextSteps: [
            "Completa tu información personal",
            "Verifica tu correo electrónico",
            "Verifica tu número de teléfono",
            "Sube tus documentos de identidad"
          ]
        });
      }
    }
    
    // Verificación para profesionales (más estricta)
    if (userType === 'professional') {
      if (!user.isVerified || user.verificationStatus !== 'verified') {
        return res.status(403).json({
          success: false,
          message: "Cuenta profesional no verificada. Debes completar tu perfil de profesional.",
          verificationStatus: user.verificationStatus || "unverified",
          isVerified: user.isVerified,
          businessName: user.businessName,
          requiresVerification: true,
          nextSteps: [
            "Completa información de tu empresa",
            "Sube tu licencia profesional",
            "Verifica tu registro comercial",
            "Verifica correo y teléfono"
          ]
        });
      }
    }
    
    // Actualizar req.usuario con datos frescos
    req.usuario = { ...req.usuario, ...user.toObject() };
    
    next();
    
  } catch (error) {
    console.error('❌ Require verification DB middleware error:', error);
    res.status(500).json({
      success: false,
      message: "Error al verificar estado de cuenta"
    });
  }
};

// Middleware para verificar solo si el usuario existe (menos estricto)
const checkVerificationStatus = async (req, res, next) => {
  try {
    const userId = req.usuario?.id;
    const userType = req.usuario?.userType || 'user';
    
    if (!userId) {
      return next();
    }
    
    let user;
    
    if (userType === 'user') {
      user = await User.findById(userId);
    } else if (userType === 'professional') {
      user = await Professional.findById(userId);
    }
    
    if (!user) {
      return next();
    }
    
    // Agregar información de verificación al request sin bloquear
    req.verificationInfo = {
      isVerified: user.isVerified,
      verificationStatus: user.verificationStatus || "unverified",
      accountType: user.accountType || "person",
      requiresVerification: !user.isVerified,
      userType
    };
    
    next();
    
  } catch (error) {
    console.error('❌ Check verification status middleware error:', error);
    next(); // No bloquear si hay error
  }
};

module.exports = {
  requireVerification,
  requireVerificationDB,
  checkVerificationStatus
};
