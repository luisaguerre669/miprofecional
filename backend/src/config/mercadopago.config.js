/**
 * Configuración centralizada de Mercado Pago
 * Todas las variables en un solo lugar para fácil mantenimiento
 */

// Variables de entorno requeridas
const requiredEnvVars = [
  'MERCADOPAGO_ACCESS_TOKEN',
  'MERCADOPAGO_WEBHOOK_SECRET',
  'BACKEND_URL',
  'FRONTEND_URL'
];

// Verificar variables requeridas
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn('⚠️  Variables de entorno faltantes para Mercado Pago:');
  missingVars.forEach(v => console.warn(`   - ${v}`));
  console.warn('Usando valores por defecto para desarrollo...\n');
}

// Configuración de Mercado Pago
const mpConfig = {
  // Token de acceso (REQUERIDO)
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000',
  
  // Secret para verificar webhooks (REQUERIDO en producción)
  webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || 'miprofesional-webhook-secret',
  
  // URLs
  backendUrl: process.env.BACKEND_URL || 'https://miprofesional-backend.onrender.com',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // Modo sandbox (true = pruebas, false = producción)
  sandbox: process.env.MERCADOPAGO_SANDBOX !== 'false', // Por defecto true para seguridad
  
  // API Base
  apiBase: 'https://api.mercadopago.com/v1',
  
  // Configuración de URLs de retorno
  backUrls: {
    success: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/subscription/success`,
    failure: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/subscription/failure`,
    pending: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/subscription/pending`
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
  const errors = [];
  
  if (mpConfig.accessToken.includes('TEST-000000000')) {
    errors.push('⚠️  Usando token de prueba. Configure MERCADOPAGO_ACCESS_TOKEN con un token real.');
  }
  
  if (mpConfig.webhookSecret === 'miprofesional-webhook-secret') {
    errors.push('⚠️  Usando webhook secret por defecto. Configure MERCADOPAGO_WEBHOOK_SECRET para producción.');
  }
  
  if (!mpConfig.sandbox) {
    console.log('🔴 MODO PRODUCCIÓN ACTIVADO');
  } else {
    console.log('🟡 MODO SANDBOX (PRUEBAS)');
  }
  
  if (errors.length > 0) {
    console.log('\n=== CONFIGURACIÓN MERCADO PAGO ===');
    errors.forEach(e => console.log(e));
    console.log('=====================================\n');
  }
  
  return errors.length === 0;
};

// Exportar configuración
module.exports = {
  ...mpConfig,
  validateConfig,
  isProduction: !mpConfig.sandbox,
  isSandbox: mpConfig.sandbox
};
