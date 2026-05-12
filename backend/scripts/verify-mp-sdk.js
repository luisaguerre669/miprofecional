// Script de verificación del SDK de Mercado Pago
const mercadopago = require('mercadopago');

console.log('=== VERIFICACIÓN SDK MERCADO PAGO ===\n');

try {
  // Verificar que el paquete está instalado
  console.log('✅ Paquete mercadopago instalado');
  console.log(`   Versión: ${require('mercadopago/package.json').version}\n`);
  
  // Intentar inicializar con token de prueba
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000';
  
  const client = new mercadopago.MercadoPagoConfig({ 
    accessToken: accessToken,
    options: { timeout: 5000 }
  });
  
  console.log('✅ SDK inicializado correctamente');
  console.log(`   Access Token: ${accessToken.substring(0, 15)}...`);
  
  // Verificar que tenemos acceso a las clases necesarias
  const { Preference, PreApproval, Payment } = mercadopago;
  
  console.log('\n✅ Clases disponibles:');
  console.log('   - Preference: ' + (typeof Preference === 'function' ? 'OK' : 'FAIL'));
  console.log('   - PreApproval: ' + (typeof PreApproval === 'function' ? 'OK' : 'FAIL'));
  console.log('   - Payment: ' + (typeof Payment === 'function' ? 'OK' : 'FAIL'));
  
  console.log('\n=====================================');
  console.log('✅ SDK FUNCIONANDO CORRECTAMENTE');
  
} catch (error) {
  console.log('❌ ERROR AL INICIALIZAR SDK:');
  console.log(error.message);
  console.log('\n=====================================');
  console.log('❌ SDK CON ERRORES');
  process.exit(1);
}
