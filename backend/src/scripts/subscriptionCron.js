// Script para iniciar el sistema de suscripciones automáticas
const SubscriptionService = require('../services/subscriptionService');
const logger = require('../utils/logger');

async function startSubscriptionSystem() {
  try {
    logger.info('Starting MiProfesional Subscription System...');
    
    // Iniciar cron jobs para suscripciones
    SubscriptionService.startSubscriptionCron();
    
    logger.info('Subscription system started successfully');
    
    // Mantener el proceso corriendo
    process.on('SIGINT', () => {
      logger.info('Subscription system shutting down...');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      logger.info('Subscription system shutting down...');
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Error starting subscription system:', error);
    process.exit(1);
  }
}

// Iniciar el sistema si este script se ejecuta directamente
if (require.main === module) {
  startSubscriptionSystem();
}

module.exports = { startSubscriptionSystem };
