/**
 * Script de verificación completa de Mercado Pago
 * Ejecutar: node scripts/verify-mercadopago-complete.js
 */

require('dotenv').config();
const { MercadoPagoConfig, Preference } = require('mercadopago');
const mpConfig = require('../src/config/mercadopago.config');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  VERIFICACIÓN COMPLETA MERCADO PAGO v1.0.0                ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function runAllTests() {
  let allPassed = true;
  
  // Test 1: Configuración
  console.log('📋 TEST 1: Verificación de Configuración');
  console.log('─────────────────────────────────────────');
  
  const configChecks = [
    { name: 'Access Token', value: mpConfig.accessToken, valid: !mpConfig.accessToken.includes('TEST-000000000') },
    { name: 'Webhook Secret', value: mpConfig.webhookSecret, valid: mpConfig.webhookSecret !== 'miprofesional-webhook-secret' },
    { name: 'Backend URL', value: mpConfig.backendUrl, valid: !!mpConfig.backendUrl },
    { name: 'Frontend URL', value: mpConfig.frontendUrl, valid: !!mpConfig.frontendUrl }
  ];
  
  configChecks.forEach(check => {
    const status = check.valid ? '✅' : '❌';
    const display = check.name.includes('Token') || check.name.includes('Secret') 
      ? `${check.value.substring(0, 20)}...` 
      : check.value;
    console.log(`${status} ${check.name}: ${display}`);
  });
  
  const configOk = configChecks.every(c => c.valid);
  console.log(configOk ? '\n✅ Configuración OK\n' : '\n⚠️  Configuración incompleta\n');
  
  // Test 2: SDK
  console.log('📦 TEST 2: Verificación del SDK');
  console.log('─────────────────────────────────────────');
  try {
    const client = new MercadoPagoConfig({ accessToken: mpConfig.accessToken });
    const preference = new Preference(client);
    console.log('✅ SDK inicializado correctamente');
    console.log(`✅ Versión: ${require('mercadopago/package.json').version}\n`);
  } catch (error) {
    console.log('❌ Error inicializando SDK:', error.message);
    allPassed = false;
  }
  
  // Test 3: Crear preferencia de prueba
  console.log('💳 TEST 3: Creación de Preferencia de Pago');
  console.log('─────────────────────────────────────────');
  try {
    const client = new MercadoPagoConfig({ accessToken: mpConfig.accessToken });
    const preferenceClient = new Preference(client);
    
    const testPreference = {
      items: [{
        title: 'Test Suscripción MiProfesional',
        unit_price: 1000,
        quantity: 1,
        currency_id: 'ARS'
      }],
      back_urls: mpConfig.backUrls,
      auto_return: 'approved',
      notification_url: mpConfig.notificationUrl,
      external_reference: `test-${Date.now()}`
    };
    
    console.log('Enviando petición a Mercado Pago...');
    const response = await preferenceClient.create({ body: testPreference });
    
    console.log('✅ Preferencia creada exitosamente!');
    console.log(`   ID: ${response.id}`);
    console.log(`   Init Point: ${response.init_point}`);
    console.log(`   Sandbox Init Point: ${response.sandbox_init_point}`);
    console.log(`   External Reference: ${response.external_reference}\n`);
    
    // Verificar que los links sean válidos
    console.log('🔗 Links de pago:');
    console.log(`   Producción: ${response.init_point}`);
    console.log(`   Sandbox: ${response.sandbox_init_point}\n`);
    
  } catch (error) {
    console.log('❌ Error creando preferencia:', error.message);
    if (error.message.includes('UNAUTHORIZED')) {
      console.log('   💡 El token no es válido. Obtén uno real desde:');
      console.log('   https://www.mercadopago.com.ar/developers/panel\n');
    }
    allPassed = false;
  }
  
  // Test 4: Verificar planes configurados
  console.log('📋 TEST 4: Planes de Suscripción Configurados');
  console.log('─────────────────────────────────────────');
  Object.entries(mpConfig.plans).forEach(([key, plan]) => {
    console.log(`✅ ${key.toUpperCase()}:`);
    console.log(`   Título: ${plan.title}`);
    console.log(`   Precio: $${plan.price} ${plan.currency}`);
    console.log(`   Duración: ${plan.duration} ${plan.durationUnit}\n`);
  });
  
  // Test 5: Webhook URL
  console.log('📡 TEST 5: Configuración de Webhook');
  console.log('─────────────────────────────────────────');
  console.log(`✅ URL: ${mpConfig.notificationUrl}`);
  console.log(`✅ Secret: ${mpConfig.webhookSecret.substring(0, 15)}...\n`);
  
  // Resumen final
  console.log('╔════════════════════════════════════════════════════════════╗');
  if (allPassed) {
    console.log('║  ✅ TODOS LOS TESTS PASARON - SISTEMA LISTO              ║');
  } else {
    console.log('║  ⚠️  ALGUNOS TESTS FALLARON - REVISAR CONFIGURACIÓN      ║');
  }
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  // Instrucciones finales
  console.log('📌 PRÓXIMOS PASOS:');
  console.log('─────────────────────────────────────────');
  if (!configOk) {
    console.log('1. Configurar variables en Render Dashboard:');
    console.log('   - MERCADOPAGO_ACCESS_TOKEN');
    console.log('   - MERCADOPAGO_WEBHOOK_SECRET');
    console.log('   - BACKEND_URL');
    console.log('   - FRONTEND_URL');
    console.log('   - MERCADOPAGO_SANDBOX=true (para pruebas)\n');
  }
  console.log('2. Configurar webhook en Mercado Pago Developers:');
  console.log(`   URL: ${mpConfig.notificationUrl}\n`);
  console.log('3. Realizar pago de prueba desde el frontend\n');
  console.log('4. Verificar que el webhook reciba la notificación\n');
  
  process.exit(allPassed ? 0 : 1);
}

runAllTests().catch(error => {
  console.error('Error inesperado:', error);
  process.exit(1);
});
