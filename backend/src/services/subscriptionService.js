// Subscription Service - Servicio de suscripción mensual
// Función automática para verificar estado de suscripción

const User = require('../models/User');

/**
 * Función automática checkSubscriptionStatus()
 * Verifica la fecha actual y compara con subscriptionEndDate
 * Si la fecha venció, actualiza subscriptionStatus a "expired"
 */
const checkSubscriptionStatus = async (userId = null) => {
  try {
    console.log('🔄 Checking subscription status...');
    
    const currentDate = new Date();
    let query = {};
    let updateData = {};
    
    if (userId) {
      // Verificar suscripción de un usuario específico
      query = { 
        _id: userId,
        subscriptionStatus: 'active',
        subscriptionEndDate: { $lt: currentDate }
      };
    } else {
      // Verificar suscripción de todos los usuarios activos con fecha vencida
      query = { 
        subscriptionStatus: 'active',
        subscriptionEndDate: { $lt: currentDate }
      };
    }
    
    // Actualizar usuarios con suscripción vencida
    const result = await User.updateMany(
      query,
      { 
        $set: { 
          subscriptionStatus: 'expired'
        }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`✅ Updated ${result.modifiedCount} users to expired subscription status`);
      
      // Si es un usuario específico, devolver información detallada
      if (userId) {
        const user = await User.findById(userId);
        return {
          success: true,
          message: 'Subscription status updated to expired',
          user: {
            id: user._id,
            subscriptionStatus: user.subscriptionStatus,
            subscriptionEndDate: user.subscriptionEndDate
          }
        };
      }
      
      return {
        success: true,
        message: `Updated ${result.modifiedCount} users to expired status`,
        updatedCount: result.modifiedCount
      };
    } else {
      console.log('ℹ️ No users with expired subscriptions found');
      return {
        success: true,
        message: 'No expired subscriptions to update',
        updatedCount: 0
      };
    }
    
  } catch (error) {
    console.error('❌ Error checking subscription status:', error);
    return {
      success: false,
      message: 'Error checking subscription status',
      error: error.message
    };
  }
};

/**
 * Activar suscripción para un usuario
 * @param {string} userId - ID del usuario
 * @param {string} plan - Tipo de plan ("monthly" o "six_months")
 * @returns {Promise} - Resultado de la operación
 */
const activateSubscription = async (userId, plan = 'monthly') => {
  try {
    const startDate = new Date();
    let endDate = new Date(startDate);
    
    // Calcular fecha de fin según el plan
    if (plan === 'six_months') {
      endDate.setMonth(endDate.getMonth() + 6);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          subscriptionStatus: 'active',
          subscriptionStartDate: startDate,
          subscriptionEndDate: endDate,
          subscriptionPlan: plan
        }
      },
      { new: true }
    );
    
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    console.log(`✅ Subscription activated for user ${userId} (${plan} plan)`);
    
    return {
      success: true,
      message: 'Subscription activated successfully',
      subscription: {
        status: user.subscriptionStatus,
        startDate: user.subscriptionStartDate,
        endDate: user.subscriptionEndDate,
        plan: user.subscriptionPlan
      }
    };
    
  } catch (error) {
    console.error('❌ Error activating subscription:', error);
    return {
      success: false,
      message: 'Error activating subscription',
      error: error.message
    };
  }
};

/**
 * Obtener información de suscripción de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise} - Información de suscripción
 */
const getSubscriptionInfo = async (userId) => {
  try {
    const user = await User.findById(userId, 
      'subscriptionStatus subscriptionStartDate subscriptionEndDate subscriptionPlan'
    );
    
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    // Verificar si la suscripción está vencida
    const currentDate = new Date();
    let isActive = user.subscriptionStatus === 'active' && 
                   user.subscriptionEndDate && 
                   user.subscriptionEndDate > currentDate;
    
    // Si está activa pero la fecha pasó, actualizar automáticamente
    if (user.subscriptionStatus === 'active' && !isActive && user.subscriptionEndDate) {
      await User.findByIdAndUpdate(userId, {
        $set: { subscriptionStatus: 'expired' }
      });
      
      user.subscriptionStatus = 'expired';
      isActive = false;
    }
    
    return {
      success: true,
      subscription: {
        status: user.subscriptionStatus,
        isActive: isActive,
        startDate: user.subscriptionStartDate,
        endDate: user.subscriptionEndDate,
        plan: user.subscriptionPlan,
        daysRemaining: user.subscriptionEndDate ? 
          Math.ceil((user.subscriptionEndDate - currentDate) / (1000 * 60 * 60 * 24)) : 
          null
      }
    };
    
  } catch (error) {
    console.error('❌ Error getting subscription info:', error);
    return {
      success: false,
      message: 'Error getting subscription info',
      error: error.message
    };
  }
};

/**
 * Programar verificación automática de suscripciones (se ejecuta diariamente)
 */
const scheduleSubscriptionCheck = () => {
  // Ejecutar checkSubscriptionStatus todos los días a medianoche
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0); // Próxima medianoche
  const msUntilMidnight = midnight.getTime() - Date.now();
  
  setTimeout(() => {
    checkSubscriptionStatus(); // Ejecutar inmediatamente a medianoche
    
    // Programar para que se ejecute todos los días
    setInterval(() => {
      checkSubscriptionStatus();
    }, 24 * 60 * 60 * 1000); // 24 horas
    
    console.log('🕐 Scheduled daily subscription check at midnight');
  }, msUntilMidnight);
};

module.exports = {
  checkSubscriptionStatus,
  activateSubscription,
  getSubscriptionInfo,
  scheduleSubscriptionCheck
};
