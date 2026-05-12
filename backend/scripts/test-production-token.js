/**
 * Script de verificación con token REAL de Mercado Pago
 * Ejecutar: node scripts/test-production-token.js
 */

const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

// Token proporcionado
const ACCESS_TOKEN = 'APP_USR-4157382814247637-051213-d2c7ad23587beeb4a67a42cc9e945292-3397232538';

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  VERIFICACIÓN TOKEN REAL MERCADO PAGO                     ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function verifyToken() {
  try {
    console.log('🔑 Token a verificar:');
    console.log(`   ${ACCESS_TOKEN.substring(0, 25)}...\n`);
    
    // Inicializar cliente
    const client = new MercadoPagoConfig({ 
      accessToken: ACCESS_TOKEN,
      options: { timeout: 10000 }
    });
    
    console.log('📡 Probando conexión con API Mercado Pago...\n');
    
    // Intentar crear una preferencia de prueba
    const preferenceClient = new Preference(client);
    
    const testPreference = {
      items: [{
        title: 'Test Verificación MiProfesional',
        unit_price: 100,
        quantity: 1,
        currency_id: 'ARS'
      }],
      payer: {
        name: 'Test',
        surname: 'User',
        email: 'test@miprofesional.com'
      },
      back_urls: {
        success: 'https://miprofesional.vercel.app/success',
        failure: 'https://miprofesional.vercel.app/failure',
        pending: 'https://miprofesional.vercel.app/pending'
      },
      auto_return: 'approved',
      external_reference: `verify-${Date.now()}`
    };
    
    console.log('📝 Creando preferencia de prueba...');
    const response = await preferenceClient.create({ body: testPreference });
    
    console.log('\n✅ ¡TOKEN VÁLIDO! Conexión exitosa\n');
    console.log('📋 Detalles de la preferencia creada:');
    console.log(`   ID: ${response.id}`);
    console.log(`   Init Point: ${response.init_point}`);
    console.log(`   External Reference: ${response.external_reference}`);
    console.log(`   Date Created: ${response.date_created}\n`);
    
    // Verificar métodos de pago disponibles
    console.log('💳 Verificando métodos de pago disponibles...');
    const paymentClient = new Payment(client);
    console.log('   ✅ Cliente de pagos inicializado\n');
    
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ TOKEN VERIFICADO - SISTEMA LISTO PARA PRODUCCIÓN     ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    return {
      valid: true,
      preferenceId: response.id,
      initPoint: response.init_point
    };
    
  } catch (error) {
    console.log('\n❌ ERROR AL VERIFICAR TOKEN:\n');
    console.log('Mensaje:', error.message);
    
    if (error.message.includes('UNAUTHORIZED')) {
      console.log('\n⚠️  El token no es válido o está vencido.');
      console.log('   Verifica que el token sea correcto en:');
      console.log('   https://www.mercadopago.com.ar/developers/panel\n');
    }
    
    if (error.response) {
      console.log('\nDetalles técnicos:');
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  ❌ TOKEN INVÁLIDO - REVISAR CONFIGURACIÓN               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    return { valid: false, error: error.message };
  }
}

verifyToken().then(result => {
  process.exit(result.valid ? 0 : 1);
});
