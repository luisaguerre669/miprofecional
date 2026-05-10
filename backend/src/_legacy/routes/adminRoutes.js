const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');

/**
 * Middleware para verificar si el usuario es administrador
 */
const requireAdmin = (req, res, next) => {
  // Verificar si existe usuario autenticado
  if (!req.usuario) {
    return res.status(401).json({
      success: false,
      message: "Usuario no autenticado"
    });
  }

  // Verificar si el usuario es administrador
  // Por ahora, verificamos si el email es de administrador
  // TODO: Implementar campo 'role' en el modelo User para mejor gestión
  const adminEmails = [
    'admin@miprofesional.com',
    'luis@miprofesional.com',
    'contacto@miprofesional.com'
  ];

  if (!adminEmails.includes(req.usuario.email)) {
    return res.status(403).json({
      success: false,
      message: "Acceso denegado. Se requieren privilegios de administrador."
    });
  }

  next();
};

/**
 * GET /admin/subscriptions-summary
 * Endpoint administrativo para consultar resumen de suscripciones
 * Requiere autenticación de administrador
 */
router.get('/subscriptions-summary', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const currentDate = new Date();
    
    // Calcular fechas límite para los diferentes períodos
    const sevenDaysFromNow = new Date(currentDate);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const threeDaysFromNow = new Date(currentDate);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const oneDayFromNow = new Date(currentDate);
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

    // Obtener estadísticas de suscripciones
    const [
      totalUsers,
      activeSubscriptions,
      expiringIn7Days,
      expiringIn3Days,
      expiringIn1Day,
      expiredSubscriptions
    ] = await Promise.all([
      // Total de usuarios
      User.countDocuments({}),
      
      // Suscripciones activas
      User.countDocuments({ subscriptionStatus: 'active' }),
      
      // Suscripciones que vencen en <= 7 días
      User.countDocuments({
        subscriptionStatus: 'active',
        subscriptionEndDate: {
          $gte: currentDate,
          $lte: sevenDaysFromNow
        }
      }),
      
      // Suscripciones que vencen en <= 3 días
      User.countDocuments({
        subscriptionStatus: 'active',
        subscriptionEndDate: {
          $gte: currentDate,
          $lte: threeDaysFromNow
        }
      }),
      
      // Suscripciones que vencen en <= 1 día
      User.countDocuments({
        subscriptionStatus: 'active',
        subscriptionEndDate: {
          $gte: currentDate,
          $lte: oneDayFromNow
        }
      }),
      
      // Suscripciones vencidas
      User.countDocuments({ subscriptionStatus: 'expired' })
    ]);

    // Construir respuesta
    const summary = {
      totalUsers: totalUsers,
      activeSubscriptions: activeSubscriptions,
      expiringIn7Days: expiringIn7Days,
      expiringIn3Days: expiringIn3Days,
      expiringIn1Day: expiringIn1Day,
      expiredSubscriptions: expiredSubscriptions,
      
      // Métricas adicionales para análisis
      metrics: {
        activeSubscriptionRate: totalUsers > 0 ? ((activeSubscriptions / totalUsers) * 100).toFixed(2) + '%' : '0%',
        expiredSubscriptionRate: totalUsers > 0 ? ((expiredSubscriptions / totalUsers) * 100).toFixed(2) + '%' : '0%',
        pendingUsers: totalUsers - activeSubscriptions - expiredSubscriptions
      }
    };

    res.status(200).json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting subscriptions summary:', error);
    res.status(500).json({
      success: false,
      message: "Error consultando resumen de suscripciones"
    });
  }
});

/**
 * GET /admin/users-summary
 * Endpoint administrativo para consultar resumen general de usuarios
 */
router.get('/users-summary', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      verifiedUsers,
      unverifiedUsers,
      pendingVerification,
      companyUsers,
      personUsers,
      activeUsers,
      inactiveUsers
    ] = await Promise.all([
      // Total de usuarios
      User.countDocuments({}),
      
      // Usuarios verificados
      User.countDocuments({ isVerified: true }),
      
      // Usuarios no verificados
      User.countDocuments({ isVerified: false }),
      
      // Usuarios con verificación pendiente
      User.countDocuments({ verificationStatus: 'pending' }),
      
      // Usuarios de tipo empresa
      User.countDocuments({ accountType: 'company' }),
      
      // Usuarios de tipo persona
      User.countDocuments({ accountType: 'person' }),
      
      // Usuarios activos
      User.countDocuments({ isActive: true }),
      
      // Usuarios inactivos
      User.countDocuments({ isActive: false })
    ]);

    const summary = {
      totalUsers: totalUsers,
      verifiedUsers: verifiedUsers,
      unverifiedUsers: unverifiedUsers,
      pendingVerification: pendingVerification,
      companyUsers: companyUsers,
      personUsers: personUsers,
      activeUsers: activeUsers,
      inactiveUsers: inactiveUsers,
      
      metrics: {
        verificationRate: totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(2) + '%' : '0%',
        companyRate: totalUsers > 0 ? ((companyUsers / totalUsers) * 100).toFixed(2) + '%' : '0%',
        activationRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(2) + '%' : '0%'
      }
    };

    res.status(200).json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting users summary:', error);
    res.status(500).json({
      success: false,
      message: "Error consultando resumen de usuarios"
    });
  }
});

/**
 * GET /admin/system-health
 * Endpoint administrativo para verificar salud del sistema
 */
router.get('/system-health', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      activeSubscriptions,
      expiredSubscriptions,
      verifiedUsers,
      recentRegistrations
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ subscriptionStatus: 'active' }),
      User.countDocuments({ subscriptionStatus: 'expired' }),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 días
        }
      })
    ]);

    const health = {
      status: 'healthy',
      database: 'connected',
      metrics: {
        totalUsers: totalUsers,
        activeSubscriptions: activeSubscriptions,
        expiredSubscriptions: expiredSubscriptions,
        verifiedUsers: verifiedUsers,
        recentRegistrations: recentRegistrations
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: health
    });

  } catch (error) {
    console.error('❌ Error checking system health:', error);
    res.status(500).json({
      success: false,
      message: "Error verificando salud del sistema"
    });
  }
});

module.exports = router;
