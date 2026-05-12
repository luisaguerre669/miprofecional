// Test de creación de preferencia de pago
require('dotenv').config();
const { MercadoPagoConfig, Preference } = require('mercadopago');

console.log('=== TEST CREACIÓN DE PREFERENCIA ===\n');

async function testCreatePreference() {
  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    
    if (!accessToken || accessToken.includes('tu_access_token')) {
      console.log('⚠️  Usando token de prueba (TEST-...)');
    }
    
    const client = new MercadoPagoConfig({ 
      accessToken: accessToken || 'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000',
      options: { timeout: 10000 }
    });
    
    const preference = new Preference(client);
    
    const preferenceData = {
      items: [
        {
          id: 'test-item-001',
          title: 'Suscripción Premium MiProfesional',
          description: 'Acceso premium por 1 mes',
          quantity: 1,
          currency_id: 'ARS',
          unit_price: 9999.99
        }
      ],
      payer: {
        name: 'Test',
        surname: 'User',
        email: 'test@example.com'
      },
      back_urls: {
        success: 'https://miprofesional.com/payment/success',
        failure: 'https://miprofesional.com/payment/failure',
        pending: 'https://miprofesional.com/payment/pending'
      },
      auto_return: 'approved',
      notification_url: 'https://miprofesional.com/api/webhooks/mercadopago',
      external_reference: 'test-reference-' + Date.now()
    };
    
    console.log('Enviando petición a Mercado Pago...');
    console.log('Datos:', JSON.stringify(preferenceData, null, 2));
    console.log('');
    
    const response = await preference.create({ body: preferenceData });
    
    console.log('✅ PREFERENCIA CREADA EXITOSAMENTE\n');
    console.log('ID:', response.id);
    console.log('Init Point:', response.init_point);
    console.log('Sandbox Init Point:', response.sandbox_init_point);
    console.log('External Reference:', response.external_reference);
    console.log('Date Created:', response.date_created);
    
    console.log('\n=====================================');
    console.log('✅ TEST EXITOSO - PAGO FUNCIONANDO');
    
    return response;
    
  } catch (error) {
    console.log('❌ ERROR AL CREAR PREFERENCIA:\n');
    console.log('Mensaje:', error.message);
    
    if (error.response) {
      console.log('\nDetalles del error:');
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    console.log('\n=====================================');
    console.log('❌ TEST FALLIDO');
    process.exit(1);
  }
}

testCreatePreference();
