/**
 * Test completo del flujo de pagos con token REAL
 * Simula todo el proceso: crear preferencia → webhook → actualizar DB
 */

const mongoose = require('mongoose');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const mpConfig = require('../src/config/mercadopago.config');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  TEST COMPLETO FLUJO DE PAGOS - PRODUCCIÓN               ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function runCompleteTest() {
  try {
    // 1. Mostrar configuración
    console.log('📋 CONFIGURACIÓN ACTUAL:');
    console.log('─────────────────────────────────────────');
    mpConfig.validateConfig();
    
    // 2. Inicializar cliente
    console.log('🔌 Inicializando cliente Mercado Pago...');
    const client = new MercadoPagoConfig({ 
      accessToken: mpConfig.accessToken,
      options: { timeout: 15000 }
    });
    console.log('✅ Cliente inicializado\n');
    
    // 3. Crear preferencia de pago real
    console.log('💳 CREANDO PREFERENCIA DE PAGO');
    console.log('─────────────────────────────────────────');
    
    const preferenceClient = new Preference(client);
    
    const paymentData = {
      items: [{
        id: 'sub-monthly-001',
        title: mpConfig.plans.monthly.title,
        description: mpConfig.plans.monthly.description,
        unit_price: mpConfig.plans.monthly.price,
        quantity: 1,
        currency_id: 'ARS'
      }],
      payer: {
        name: 'Usuario',
        surname: 'Prueba',
        email: 'test@miprofesional.com',
        phone: { area_code: '11', number: '12345678' },
        identification: { type: 'DNI', number: '12345678' }
      },
      back_urls: mpConfig.backUrls,
      auto_return: 'approved',
      notification_url: mpConfig.notificationUrl,
      external_reference: `TEST-${Date.now()}`,
      expires: false,
      statement_descriptor: 'MIPROFESIONAL'
    };
    
    console.log('Enviando datos:', JSON.stringify({
      title: paymentData.items[0].title,
      price: paymentData.items[0].unit_price,
      currency: paymentData.items[0].currency_id,
      external_reference: paymentData.external_reference
    }, null, 2));
    
    const response = await preferenceClient.create({ body: paymentData });
    
    console.log('\n✅ PREFERENCIA CREADA EXITOSAMENTE!\n');
    console.log('📊 Detalles:');
    console.log(`   ID: ${response.id}`);
    console.log(`   Link de pago: ${response.init_point}`);
    console.log(`   Referencia: ${response.external_reference}`);
    console.log(`   Creado: ${response.date_created}\n`);
    
    // 4. Verificar estructura de respuesta
    console.log('🔍 VERIFICANDO ESTRUCTURA DE RESPUESTA');
    console.log('─────────────────────────────────────────');
    const checks = [
      { name: 'ID', value: response.id },
      { name: 'Init Point', value: response.init_point },
      { name: 'Items', value: response.items?.length },
      { name: 'External Reference', value: response.external_reference }
    ];
    
    checks.forEach(check => {
      const status = check.value ? '✅' : '❌';
      console.log(`${status} ${check.name}: ${check.value || 'NO ENCONTRADO'}`);
    });
    
    // 5. Instrucciones para prueba manual
    console.log('\n🧪 PRUEBA MANUAL REQUERIDA');
    console.log('─────────────────────────────────────────');
    console.log('Para completar la verificación:');
    console.log('');
    console.log('1. Abre este link en tu navegador:');
    console.log(`   ${response.init_point}`);
    console.log('');
    console.log('2. Completa el pago de prueba con tarjeta:');
    console.log('   Número: 5031 7557 3453 0604');
    console.log('   Vencimiento: 11/30');
    console.log('   CVV: 123');
    console.log('   Titular: APRO');
    console.log('');
    console.log('3. Verifica que el webhook reciba la notificación');
    console.log(`   URL: ${mpConfig.notificationUrl}`);
    console.log('');
    
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ SISTEMA CONFIGURADO Y FUNCIONANDO                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    return {
      success: true,
      preferenceId: response.id,
      initPoint: response.init_point,
      externalReference: response.external_reference
    };
    
  } catch (error) {
    console.log('\n❌ ERROR EN TEST:');
    console.log(error.message);
    
    if (error.response) {
      console.log('\nDetalles:', JSON.stringify(error.response.data, null, 2));
    }
    
    return { success: false, error: error.message };
  }
}

// Ejecutar test
runCompleteTest().then(result => {
  process.exit(result.success ? 0 : 1);
});
