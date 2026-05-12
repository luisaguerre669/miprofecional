/**
 * Configuración centralizada de Mercado Pago - PRODUCCIÓN
 * Token actualizado: 2026-05-12
 */

// Token REAL de producción proporcionado
const PRODUCTION_TOKEN = 'APP_USR-4157382814247637-051213-d2c7ad23587beeb4a67a42cc9e945292-3397232538';

// Variables de entorno (con fallback al token real)
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || PRODUCTION_TOKEN;

// Configuración de Mercado Pago
const mpConfig = {
  // Token de acceso (PRODUCCIÓN)
  accessToken,
  
  // Secret para verificar webhooks
  webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || 'mp_webhook_secret_miprofesional_2026',
  
  // URLs
  backendUrl: process.env.BACKEND_URL || 'https://miprofesional-backend.onrender.com',
  frontendUrl: process.env.FRONTEND_URL || 'https://miprofesional.vercel.app',
  
  // Modo sandbox (false = producción real)
  sandbox: process.env.MERCADOPAGO_SANDBOX === 'true' || false,
  
  // API Base
  apiBase: 'https://api.mercadopago.com/v1',
  
  // Configuración de URLs de retorno
  backUrls: {
    success: `${process.env.FRONTEND_URL || 'https://miprofesional.vercel.app'}/subscription/success`,
    failure: `${process.env.FRONTEND_URL || 'https://miprofesional.vercel.app'}/subscription/failure`,
    pending: `${process.env.FRONTEND_URL || 'https://miprofesional.vercel.app'}/subscription/pending`
  },
  
  // URL de notificación (webhook)
  notificationUrl: `${process.env.BACKEND_URL || 'https://miprofesional-backend.onrender.com'}/api/v1/mercadopago/webhook`,
  
  // Planes de suscripción
  plans: {
    monthly: {
      title: 'Suscripción Mensual MiProfesional',
      description: 'Acceso premium por 1 mes',
      price: 5000,
      currency: 'ARS',
      duration: 1,
      durationUnit: 'month'
    },
    six_months: {
      title: 'Suscripción Semestral MiProfesional',
      description: 'Acceso premium por 6 meses (17% descuento)',
      price: 25000,
      currency: 'ARS',
      duration: 6,
      durationUnit: 'month'
    }
  }
};

// Validar configuración
const validateConfig = () => {
  console.log('\n=== CONFIGURACIÓN MERCADO PAGO ===');
  console.log(`🔑 Token: ${mpConfig.accessToken.substring(0, 25)}...`);
  console.log(`🌐 Backend: ${mpConfig.backendUrl}`);
  console.log(`💻 Frontend: ${mpConfig.frontendUrl}`);
  console.log(`📡 Webhook: ${mpConfig.notificationUrl}`);
  console.log(`🔒 Modo: ${mpConfig.sandbox ? 'SANDBOX (PRUEBAS)' : 'PRODUCCIÓN (REAL)'}`);
  console.log('=====================================\n');
  
  return true;
};

// Exportar configuración
module.exports = {
  ...mpConfig,
  validateConfig,
  isProduction: !mpConfig.sandbox,
  isSandbox: mpConfig.sandbox
};
