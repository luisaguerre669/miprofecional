/**
 * Script de prueba del endpoint webhook de Mercado Pago
 * Verifica que la ruta responda correctamente
 */

const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'https://miprofesional-backend.onrender.com';
const WEBHOOK_PATH = '/api/v1/mercadopago/webhook';

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║  PRUEBA ENDPOINT WEBHOOK MERCADO PAGO                         ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log(`🎯 Target: ${BACKEND_URL}${WEBHOOK_PATH}\n`);

// Datos de prueba simulando un webhook de Mercado Pago
const testWebhookData = JSON.stringify({
  action: 'payment.created',
  api_version: 'v1',
  data: {
    id: '1234567890'
  },
  date_created: new Date().toISOString(),
  id: 123456789,
  live_mode: false,
  type: 'payment',
  user_id: '3397232538'
});

function testWebhook() {
  return new Promise((resolve, reject) => {
    const url = new URL(WEBHOOK_PATH, BACKEND_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testWebhookData),
        'User-Agent': 'MercadoPago-WebHook/1.0'
      },
      timeout: 10000
    };

    console.log('📡 Enviando request POST...');
    console.log(`   URL: ${url.href}`);
    console.log(`   Headers: ${JSON.stringify(options.headers, null, 2)}`);
    console.log(`   Body: ${testWebhookData}\n`);

    const protocol = url.protocol === 'https:' ? require('https') : http;
    
    const req = protocol.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📨 Respuesta recibida:');
        console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
        console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);
        
        if (data) {
          try {
            const jsonData = JSON.parse(data);
            console.log(`   Body: ${JSON.stringify(jsonData, null, 2)}`);
          } catch {
            console.log(`   Body: ${data}`);
          }
        }
        
        resolve({
          status: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error en request:', error.message);
      reject(error);
    });

    req.on('timeout', () => {
      console.error('❌ Timeout - El servidor no respondió a tiempo');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(testWebhookData);
    req.end();
  });
}

async function runTest() {
  try {
    const result = await testWebhook();
    
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    
    if (result.status === 200) {
      console.log('║  ✅ WEBHOOK FUNCIONANDO CORRECTAMENTE                         ║');
      console.log('╚════════════════════════════════════════════════════════════════╝');
      console.log('\n📊 Resultado:');
      console.log('   ✅ Endpoint alcanzado');
      console.log('   ✅ Responde con 200 OK');
      console.log('   ✅ Ruta correcta: POST /api/v1/mercadopago/webhook');
      console.log('\n🎯 El webhook está listo para recibir notificaciones de Mercado Pago');
    } else if (result.status === 404) {
      console.log('║  ❌ WEBHOOK NO ENCONTRADO (404)                               ║');
      console.log('╚════════════════════════════════════════════════════════════════╝');
      console.log('\n📊 Resultado:');
      console.log('   ❌ Endpoint no existe');
      console.log('   ❌ Ruta no encontrada');
      console.log('\n💡 Posibles causas:');
      console.log('   - Ruta no montada en Express');
      console.log('   - URL incorrecta');
      console.log('   - Deploy no actualizado');
    } else if (result.status === 500) {
      console.log('║  ⚠️  WEBHOOK CON ERROR INTERNO (500)                          ║');
      console.log('╚════════════════════════════════════════════════════════════════╝');
      console.log('\n📊 Resultado:');
      console.log('   ⚠️  Endpoint existe pero tiene errores');
      console.log('\n💡 Revisar logs del backend');
    } else {
      console.log(`║  ⚠️  WEBHOOK RESPONDE CON STATUS ${result.status}                          ║`);
      console.log('╚════════════════════════════════════════════════════════════════╝');
    }
    
    console.log('');
    process.exit(result.status === 200 ? 0 : 1);
    
  } catch (error) {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  ❌ ERROR AL CONECTAR CON BACKEND                             ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log(`\nError: ${error.message}`);
    console.log('\n💡 Posibles causas:');
    console.log('   - Backend no está corriendo');
    console.log('   - URL incorrecta');
    console.log('   - Problemas de red\n');
    process.exit(1);
  }
}

runTest();
