const mongoose = require('mongoose');
const Professional = require('../models/Professional');
const User = require('../models/User');

const checkExpiredSubscriptions = async () => {
  console.log('🕒 Running subscription expiration check...');
  
  try {
    const now = new Date();
    
    // Buscar profesionales con suscripción vencida que aún estén activos
    const expiredProfessionals = await Professional.find({
      subscriptionEndDate: { $lt: now },
      subscriptionStatus: 'active'
    });
    
    for (const pro of expiredProfessionals) {
      console.log(`❌ Subscription expired for professional: ${pro._id}`);
      pro.subscriptionStatus = 'expired';
      pro.isActive = false; // Ocultar perfil automáticamente
      pro.visibilityStatus = 'hidden';
      await pro.save();
      
      // Aquí podríamos enviar un email de aviso
    }
    
    console.log(`✅ Finished checking. ${expiredProfessionals.length} subscriptions updated.`);
  } catch (error) {
    console.error('💥 Error checking subscriptions:', error);
  }
};

module.exports = checkExpiredSubscriptions;
