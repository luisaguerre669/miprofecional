// Require Active Subscription Middleware
// Verifica si subscriptionStatus es "active" y bloquea acceso si no lo está

const { getSubscriptionInfo } = require('../services/subscriptionService');

const requireActiveSubscription = async (req, res, next) => {
  try {
    // Verificar si existe usuario autenticado
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado"
      });
    }

    // Obtener información actualizada de suscripción
    const subscriptionResult = await getSubscriptionInfo(req.usuario.id);
    
    if (!subscriptionResult.success) {
      return res.status(500).json({
        success: false,
        message: "Error verificando suscripción"
      });
    }

    const subscription = subscriptionResult.subscription;

    // Verificar si la suscripción está activa
    if (!subscription.isActive || subscription.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: "Tu suscripción está vencida. Renovala para continuar usando el servicio.",
        subscription: {
          status: subscription.status,
          isActive: subscription.isActive,
          endDate: subscription.endDate,
          daysRemaining: subscription.daysRemaining
        },
        requiresSubscription: true
      });
    }

    // Suscripción activa, continuar
    req.subscriptionInfo = subscription;
    next();
    
  } catch (error) {
    console.error('❌ Require active subscription middleware error:', error);
    return res.status(500).json({
      success: false,
      message: "Error en verificación de suscripción"
    });
  }
};

// Versión lightweight que solo verifica el campo sin hacer consulta adicional
const requireActiveSubscriptionLight = (req, res, next) => {
  try {
    // Verificar si existe usuario autenticado
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado"
      });
    }

    // Verificar si la suscripción está activa (sin consulta adicional)
    if (!req.usuario.subscriptionStatus || req.usuario.subscriptionStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: "Tu suscripción está vencida. Renovala para continuar usando el servicio.",
        subscription: {
          status: req.usuario.subscriptionStatus || 'pending',
          endDate: req.usuario.subscriptionEndDate
        },
        requiresSubscription: true
      });
    }

    // Suscripción activa, continuar
    next();
    
  } catch (error) {
    console.error('❌ Require active subscription light middleware error:', error);
    return res.status(500).json({
      success: false,
      message: "Error en verificación de suscripción"
    });
  }
};

module.exports = { 
  requireActiveSubscription,
  requireActiveSubscriptionLight
};
