/**
 * Test rápido de conexión a MongoDB Atlas
 * Uso: node scripts/test-mongodb-connection.js
 */

const mongoose = require('mongoose');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function testConnection() {
  console.log(`${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}  Test de Conexión MongoDB Atlas       ${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);

  // Obtener URI
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    console.log(`${colors.red}❌ ERROR: No se encontró MONGODB_URI en .env${colors.reset}`);
    console.log(`${colors.yellow}   Crea un archivo .env basado en .env.example${colors.reset}`);
    process.exit(1);
  }

  const isAtlas = uri.includes('mongodb+srv://');
  const displayUri = uri.replace(/\/\/.*@/, '//***:***@');

  console.log(`${colors.blue}Configuración detectada:${colors.reset}`);
  console.log(`  Tipo: ${isAtlas ? '🌐 MongoDB Atlas' : '🗄️  MongoDB Local'}`);
  console.log(`  URI: ${displayUri}\n`);

  // Verificar formato de URI
  if (isAtlas) {
    const passwordMatch = uri.match(/mongodb\+srv:\/\/[^:]+:([^@]+)@/);
    if (passwordMatch) {
      const password = passwordMatch[1];
      const specialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
      
      if (specialChars.test(password) && !password.includes('%')) {
        console.log(`${colors.yellow}⚠️  ADVERTENCIA:${colors.reset}`);
        console.log(`${colors.yellow}   La contraseña contiene caracteres especiales${colors.reset}`);
        console.log(`${colors.yellow}   que deberían estar URL-encoded.${colors.reset}`);
        console.log(`${colors.yellow}   Esto puede causar el error "bad auth".\n${colors.reset}`);
      }
    }
  }

  console.log(`${colors.blue}Intentando conectar...${colors.reset}\n`);

  try {
    const options = {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    };

    if (isAtlas) {
      options.retryWrites = true;
      options.w = 'majority';
    }

    await mongoose.connect(uri, options);

    // Verificar con ping
    const adminDb = mongoose.connection.getClient().db("admin");
    const pingResult = await adminDb.command({ ping: 1 });

    console.log(`${colors.green}✅ CONEXIÓN EXITOSA!${colors.reset}\n`);
    console.log(`${colors.green}Detalles de la conexión:${colors.reset}`);
    console.log(`  📁 Database: ${mongoose.connection.name}`);
    console.log(`  🖥️  Host: ${mongoose.connection.host}`);
    console.log(`  📊 Puerto: ${mongoose.connection.port || 'N/A (Atlas)'}`);
    console.log(`  ✅ Ping: ${JSON.stringify(pingResult)}`);
    console.log(`  🔌 Estado: ${mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado'}`);

    // Listar colecciones
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n${colors.cyan}Colecciones existentes (${collections.length}):${colors.reset}`);
    collections.forEach(col => {
      console.log(`  • ${col.name}`);
    });

    await mongoose.disconnect();
    console.log(`\n${colors.green}✅ Test completado exitosamente${colors.reset}`);
    process.exit(0);

  } catch (error) {
    console.log(`${colors.red}❌ ERROR DE CONEXIÓN${colors.reset}\n`);
    console.log(`${colors.red}Mensaje: ${error.message}${colors.reset}\n`);

    if (error.message.includes('bad auth') || error.message.includes('authentication failed')) {
      console.log(`${colors.yellow}🔴 ERROR DE AUTENTICACIÓN${colors.reset}`);
      console.log(`${colors.yellow}Soluciones:${colors.reset}`);
      console.log(`${colors.yellow}  1. Verifica usuario/contraseña en MongoDB Atlas${colors.reset}`);
      console.log(`${colors.yellow}  2. Si la contraseña tiene @ # $ % & + = ?${colors.reset}`);
      console.log(`${colors.yellow}     codifícalos: @ → %40, # → %23, $ → %24${colors.reset}`);
      console.log(`${colors.yellow}  3. Ejecuta: node scripts/mongodb-atlas-setup.js${colors.reset}`);
    } else if (error.message.includes('IP') || error.message.includes('whitelist')) {
      console.log(`${colors.yellow}🔴 ERROR DE IP NO PERMITIDA${colors.reset}`);
      console.log(`${colors.yellow}Solución: Añade tu IP en MongoDB Atlas → Network Access${colors.reset}`);
    }

    process.exit(1);
  }
}

testConnection();
