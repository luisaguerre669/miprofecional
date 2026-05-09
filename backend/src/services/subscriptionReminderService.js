// Subscription Reminder Service - Sistema automático de recordatorio de vencimiento
// Ejecuta automáticamente una vez por día para notificar a usuarios antes del vencimiento

const User = require('../models/User');

/**
 * Sistema automático de recordatorio de vencimiento de suscripción
 * Se ejecuta diariamente para verificar usuarios con suscripción activa
 * y enviar recordatorios según los días restantes
 */
const sendSubscriptionReminders = async () => {
  try {
    console.log('🔄 Starting subscription reminder service...');
    
    const currentDate = new Date();
    const results = {
      totalChecked: 0,
      remindersSent: 0,
      reminders7Days: 0,
      reminders3Days: 0,
      reminders1Day: 0,
      errors: []
    };

    // 1) Buscar usuarios con suscripción activa
    const activeUsers = await User.find({
      subscriptionStatus: 'active',
      subscriptionEndDate: { $exists: true, $ne: null }
    }).select('_id name email phone subscriptionEndDate subscriptionPlan');

    results.totalChecked = activeUsers.length;
    console.log(`📊 Found ${activeUsers.length} users with active subscription`);

    // 2) Procesar cada usuario para calcular días restantes
    for (const user of activeUsers) {
      try {
        // Calcular días restantes
        const timeDiff = user.subscriptionEndDate.getTime() - currentDate.getTime();
        const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        // 3) Verificar si debe enviar recordatorio (7, 3, 1 días)
        if (daysRemaining === 7 || daysRemaining === 3 || daysRemaining === 1) {
          const reminderResult = await sendReminderToUser(user, daysRemaining);
          
          if (reminderResult.success) {
            results.remindersSent++;
            
            if (daysRemaining === 7) results.reminders7Days++;
            else if (daysRemaining === 3) results.reminders3Days++;
            else if (daysRemaining === 1) results.reminders1Day++;
            
            console.log(`✅ Reminder sent to ${user.name} (${daysRemaining} days remaining)`);
          } else {
            results.errors.push(`Failed to send reminder to ${user.name}: ${reminderResult.error}`);
          }
        }

        // Actualizar automáticamente si ya venció
        if (daysRemaining < 0) {
          await User.findByIdAndUpdate(user._id, {
            $set: { subscriptionStatus: 'expired' }
          });
          console.log(`🔄 Updated ${user.name} status to expired`);
        }

      } catch (userError) {
        results.errors.push(`Error processing user ${user.name}: ${userError.message}`);
        console.error(`❌ Error processing user ${user.name}:`, userError);
      }
    }

    console.log('📈 Subscription reminder service completed:', results);
    return results;

  } catch (error) {
    console.error('❌ Critical error in subscription reminder service:', error);
    return {
      success: false,
      error: error.message,
      totalChecked: 0,
      remindersSent: 0,
      errors: [error.message]
    };
  }
};

/**
 * Enviar recordatorio a un usuario específico
 * @param {Object} user - Datos del usuario
 * @param {number} daysRemaining - Días restantes para el vencimiento
 * @returns {Promise} - Resultado del envío
 */
const sendReminderToUser = async (user, daysRemaining) => {
  try {
    // Generar mensaje personalizado
    const message = generateReminderMessage(daysRemaining);
    
    // Aquí se integraría con el servicio de notificaciones
    // Por ahora, solo registramos el recordatorio en consola
    const reminderData = {
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionEndDate: user.subscriptionEndDate,
      daysRemaining: daysRemaining,
      message: message,
      sentAt: new Date(),
      channels: ['email', 'push', 'sms'] // Canales disponibles
    };

    // Simulación de envío de notificaciones
    console.log(`📧 Sending reminder to ${user.name}:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Phone: ${user.phone}`);
    console.log(`   Message: ${message}`);
    console.log(`   Days remaining: ${daysRemaining}`);
    console.log(`   Plan: ${user.subscriptionPlan}`);
    console.log(`   End date: ${user.subscriptionEndDate.toLocaleDateString('es-AR')}`);

    // TODO: Integrar con servicios reales de notificación
    // - Email service (SendGrid, Nodemailer, etc.)
    // - Push notifications (Firebase, OneSignal, etc.)
    // - SMS service (Twilio, etc.)

    return {
      success: true,
      reminderData: reminderData
    };

  } catch (error) {
    console.error(`❌ Error sending reminder to user ${user.name}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generar mensaje personalizado de recordatorio
 * @param {number} daysRemaining - Días restantes
 * @returns {string} - Mensaje personalizado
 */
const generateReminderMessage = (daysRemaining) => {
  const dayText = daysRemaining === 1 ? 'día' : 'días';
  const urgency = daysRemaining === 1 ? '¡Último día!' : daysRemaining === 3 ? '¡Atención!' : 'Recordatorio';
  
  return `${urgency}: Tu suscripción a MiProfesional vence en ${daysRemaining} ${dayText}. Renovala para seguir recibiendo clientes y mantener tu perfil activo.`;
};

/**
 * Programar ejecución diaria automática
 * Se ejecuta todos los días a las 9:00 AM (hora local)
 */
const scheduleDailyReminders = () => {
  // Calcular próxima ejecución (9:00 AM del próximo día)
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0); // 9:00 AM
  
  const msUntil9AM = tomorrow.getTime() - now.getTime();
  
  // Programar primera ejecución
  setTimeout(() => {
    console.log('🕘 Starting daily subscription reminder schedule (9:00 AM)');
    sendSubscriptionReminders();
    
    // Programar ejecución diaria repetitiva
    setInterval(() => {
      console.log('🕘 Running daily subscription reminder check');
      sendSubscriptionReminders();
    }, 24 * 60 * 60 * 1000); // 24 horas
    
  }, msUntil9AM);
  
  console.log(`⏰ Subscription reminders scheduled for daily execution at 9:00 AM`);
  console.log(`📅 First execution: ${tomorrow.toLocaleString('es-AR')}`);
};

/**
 * Ejecución manual para pruebas
 * Permite ejecutar el sistema manualmente para testing
 */
const runManualReminderCheck = async () => {
  console.log('🔧 Running manual subscription reminder check...');
  return await sendSubscriptionReminders();
};

/**
 * Obtener estadísticas de recordatorios
 * @returns {Object} - Estadísticas del sistema
 */
const getReminderStats = async () => {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const stats = {
      totalActiveUsers: await User.countDocuments({ subscriptionStatus: 'active' }),
      usersExpiringIn7Days: await User.countDocuments({
        subscriptionStatus: 'active',
        subscriptionEndDate: {
          $gte: now,
          $lte: sevenDaysFromNow
        }
      }),
      usersExpiringIn3Days: await User.countDocuments({
        subscriptionStatus: 'active',
        subscriptionEndDate: {
          $gte: now,
          $lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
        }
      }),
      usersExpiringIn1Day: await User.countDocuments({
        subscriptionStatus: 'active',
        subscriptionEndDate: {
          $gte: now,
          $lte: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)
        }
      }),
      expiredUsers: await User.countDocuments({ subscriptionStatus: 'expired' })
    };
    
    return {
      success: true,
      stats: stats,
      timestamp: now.toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error getting reminder stats:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendSubscriptionReminders,
  sendReminderToUser,
  generateReminderMessage,
  scheduleDailyReminders,
  runManualReminderCheck,
  getReminderStats
};
