const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getSubscriptionInfo } = require('../services/subscriptionService');

/**
 * GET /subscription/status
 * Endpoint para consultar el estado de suscripción del usuario autenticado
 * Requiere autenticación
 */
router.get('/status', authMiddleware, async (req, res) => {
  try {
    // Verificar que exista usuario autenticado
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
        message: "Error consultando estado de suscripción"
      });
    }

    const subscription = subscriptionResult.subscription;
    const currentDate = new Date();

    // Calcular daysRemaining
    let daysRemaining = 0;
    let subscriptionStatus = subscription.status;

    if (subscription.endDate && subscription.status === 'active') {
      const timeDiff = subscription.endDate.getTime() - currentDate.getTime();
      daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      // Si la fecha de fin es menor a hoy, marcar como expired
      if (daysRemaining < 0) {
        subscriptionStatus = 'expired';
        daysRemaining = 0;
        
        // Actualizar automáticamente el estado en la base de datos
        const User = require('../models/User');
        await User.findByIdAndUpdate(req.usuario.id, {
          $set: { subscriptionStatus: 'expired' }
        });
      }
    }

    // Construir respuesta
    const response = {
      subscriptionStatus: subscriptionStatus,
      subscriptionStartDate: subscription.startDate,
      subscriptionEndDate: subscription.endDate,
      daysRemaining: daysRemaining
    };

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('❌ Error getting subscription status:', error);
    res.status(500).json({
      success: false,
      message: "Error consultando estado de suscripción"
    });
  }
});

/**
 * GET /subscription/plan
 * Endpoint para consultar el plan de suscripción actual
 * Requiere autenticación
 */
router.get('/plan', authMiddleware, async (req, res) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado"
      });
    }

    const User = require('../models/User');
    const user = await User.findById(req.usuario.id, 
      'subscriptionPlan subscriptionStatus subscriptionStartDate subscriptionEndDate'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        plan: user.subscriptionPlan || 'monthly',
        status: user.subscriptionStatus || 'pending',
        startDate: user.subscriptionStartDate,
        endDate: user.subscriptionEndDate
      }
    });

  } catch (error) {
    console.error('❌ Error getting subscription plan:', error);
    res.status(500).json({
      success: false,
      message: "Error consultando plan de suscripción"
    });
  }
});

module.exports = router;
