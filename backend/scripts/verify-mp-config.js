// Script de verificación de configuración Mercado Pago
require('dotenv').config();

console.log('=== VERIFICACIÓN CONFIGURACIÓN MERCADO PAGO ===\n');

const checks = {
  'MERCADOPAGO_ACCESS_TOKEN': process.env.MERCADOPAGO_ACCESS_TOKEN,
  'MERCADOPAGO_WEBHOOK_SECRET': process.env.MERCADOPAGO_WEBHOOK_SECRET,
  'MERCADOPAGO_SANDBOX': process.env.MERCADOPAGO_SANDBOX,
  'BACKEND_URL': process.env.BACKEND_URL
};

let allOk = true;
for (const [key, value] of Object.entries(checks)) {
  const status = value ? '✅ CONFIGURADO' : '❌ NO CONFIGURADO';
  const displayValue = value 
    ? (key.includes('TOKEN') ? value.substring(0, 20) + '...' : value)
    : 'NO ENCONTRADO';
  console.log(`${key}:`);
  console.log(`  Estado: ${status}`);
  console.log(`  Valor: ${displayValue}`);
  console.log('');
  if (!value) allOk = false;
}

console.log('=====================================');
console.log(allOk ? '✅ TODAS LAS VARIABLES CONFIGURADAS' : '❌ FALTAN VARIABLES POR CONFIGURAR');
process.exit(allOk ? 0 : 1);
