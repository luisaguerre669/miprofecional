/**
 * MongoDB Atlas Connection Diagnostic Tool
 * 
 * Este script diagnostica y resuelve problemas de conexión con MongoDB Atlas
 * 
 * Uso: node scripts/mongodb-atlas-setup.js
 */

const mongoose = require('mongoose');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}========================================${colors.reset}`);
console.log(`${colors.cyan}  MongoDB Atlas Connection Diagnostic  ${colors.reset}`);
console.log(`${colors.cyan}========================================${colors.reset}\n`);

// Función para hacer preguntas
function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

// Función para codificar caracteres especiales en la contraseña
function encodePassword(password) {
  return encodeURIComponent(password);
}

// Función para construir URI de Atlas
function buildAtlasURI(username, password, cluster, database = 'miprofesional') {
  const encodedPassword = encodePassword(password);
  return `mongodb+srv://${username}:${encodedPassword}@${cluster}.mongodb.net/${database}?retryWrites=true&w=majority`;
}

// Función para probar conexión
async function testConnection(uri, name = 'Test') {
  console.log(`\n${colors.yellow}Probando conexión: ${name}${colors.reset}`);
  console.log(`URI: ${uri.replace(/\/\/.*@/, '//***:***@')}`);
  
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    
    const adminDb = mongoose.connection.getClient().db("admin");
    await adminDb.command({ ping: 1 });
    
    console.log(`${colors.green}✅ Conexión exitosa!${colors.reset}`);
    console.log(`${colors.green}   Database: ${mongoose.connection.name}${colors.reset}`);
    console.log(`${colors.green}   Host: ${mongoose.connection.host}${colors.reset}`);
    
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ Error de conexión:${colors.reset}`);
    console.log(`${colors.red}   ${error.message}${colors.reset}`);
    
    // Análisis de errores comunes
    if (error.message.includes('bad auth')) {
      console.log(`\n${colors.yellow}⚠️  CAUSA PROBABLE: Autenticación fallida${colors.reset}`);
      console.log(`${colors.yellow}   Soluciones:${colors.reset}`);
      console.log(`${colors.yellow}   1. Verifica que el usuario exista en Database Access${colors.reset}`);
      console.log(`${colors.yellow}   2. Asegúrate de que la contraseña sea correcta${colors.reset}`);
      console.log(`${colors.yellow}   3. Si la contraseña tiene caracteres especiales, deben estar URL-encoded${colors.reset}`);
    } else if (error.message.includes('IP')) {
      console.log(`\n${colors.yellow}⚠️  CAUSA PROBABLE: IP no permitida${colors.reset}`);
      console.log(`${colors.yellow}   Solución: Añade tu IP en Network Access → IP Access List${colors.reset}`);
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.log(`\n${colors.yellow}⚠️  CAUSA PROBABLE: Cluster no encontrado${colors.reset}`);
      console.log(`${colors.yellow}   Solución: Verifica que el nombre del cluster sea correcto${colors.reset}`);
    }
    
    return false;
  }
}

// Menú principal
async function main() {
  console.log(`${colors.blue}Selecciona una opción:${colors.reset}\n`);
  console.log('1. Probar conexión con URI existente (MONGODB_URI en .env)');
  console.log('2. Configurar nueva conexión MongoDB Atlas');
  console.log('3. Verificar y reparar URI actual');
  console.log('4. Salir\n');
  
  const option = await ask('Opción (1-4): ');
  
  switch(option.trim()) {
    case '1':
      await testExistingConnection();
      break;
    case '2':
      await setupNewConnection();
      break;
    case '3':
      await verifyAndRepairURI();
      break;
    case '4':
      console.log(`\n${colors.green}¡Hasta luego!${colors.reset}`);
      process.exit(0);
    default:
      console.log(`\n${colors.red}Opción inválida${colors.reset}`);
  }
  
  rl.close();
}

// Opción 1: Probar conexión existente
async function testExistingConnection() {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
  
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  
  if (!uri) {
    console.log(`\n${colors.red}❌ No se encontró MONGODB_URI ni MONGO_URI en .env${colors.reset}`);
    console.log(`${colors.yellow}Por favor configura tu archivo .env primero${colors.reset}`);
    return;
  }
  
  const success = await testConnection(uri, 'Conexión existente');
  
  if (success) {
    console.log(`\n${colors.green}✅ Tu conexión a MongoDB Atlas está funcionando correctamente!${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️  Hay problemas con tu conexión. Ejecuta la opción 3 para reparar.${colors.reset}`);
  }
}

// Opción 2: Configurar nueva conexión
async function setupNewConnection() {
  console.log(`\n${colors.cyan}--- Configuración de MongoDB Atlas ---${colors.reset}\n`);
  
  console.log(`${colors.yellow}Instrucciones:${colors.reset}`);
  console.log('1. Ve a https://cloud.mongodb.com');
  console.log('2. Crea un cluster (M0 gratis es suficiente)');
  console.log('3. En "Database Access", crea un usuario');
  console.log('4. En "Network Access", añade tu IP (o 0.0.0.0/0)');
  console.log('5. En "Clusters", haz click en "Connect" → "Connect your application"');
  console.log('6. Copia el nombre del cluster (ej: cluster0.xxxxx)\n');
  
  const username = await ask('Username: ');
  const password = await ask('Password: ');
  const cluster = await ask('Cluster (ej: cluster0.abc123): ');
  const database = await ask('Database name (default: miprofesional): ') || 'miprofesional';
  
  const uri = buildAtlasURI(username, password, cluster, database);
  
  console.log(`\n${colors.cyan}URI generada:${colors.reset}`);
  console.log(uri.replace(/\/\/.*@/, '//***:***@'));
  
  const testNow = await ask('\n¿Probar conexión ahora? (s/n): ');
  
  if (testNow.toLowerCase() === 's') {
    const success = await testConnection(uri, 'Nueva configuración');
    
    if (success) {
      const save = await ask('\n¿Guardar en archivo .env? (s/n): ');
      if (save.toLowerCase() === 's') {
        await saveToEnv(uri);
      }
    }
  }
}

// Opción 3: Verificar y reparar URI
async function verifyAndRepairURI() {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
  
  let uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  
  if (!uri) {
    console.log(`\n${colors.red}❌ No se encontró URI en .env${colors.reset}`);
    return;
  }
  
  console.log(`\n${colors.cyan}--- Análisis de URI ---${colors.reset}`);
  console.log(`URI actual: ${uri.replace(/\/\/.*@/, '//***:***@')}`);
  
  // Verificar formato
  const issues = [];
  
  if (!uri.includes('mongodb+srv://') && !uri.includes('mongodb://')) {
    issues.push('❌ El protocolo debe ser mongodb+srv:// o mongodb://');
  }
  
  if (!uri.includes('@')) {
    issues.push('❌ Falta el separador @ entre credenciales y host');
  }
  
  if (!uri.includes('?retryWrites=true')) {
    issues.push('⚠️  Falta retryWrites=true (recomendado)');
  }
  
  if (!uri.includes('w=majority')) {
    issues.push('⚠️  Falta w=majority (recomendado)');
  }
  
  if (issues.length > 0) {
    console.log(`\n${colors.yellow}Problemas encontrados:${colors.reset}`);
    issues.forEach(issue => console.log(`  ${issue}`));
  } else {
    console.log(`\n${colors.green}✅ Formato de URI correcto${colors.reset}`);
  }
  
  // Extraer componentes
  try {
    const match = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/([^?]+)\??(.*)/);
    if (match) {
      const [, username, password, cluster, database, params] = match;
      
      console.log(`\n${colors.cyan}Componentes detectados:${colors.reset}`);
      console.log(`  Username: ${username}`);
      console.log(`  Password: ${'*'.repeat(password.length)}`);
      console.log(`  Cluster: ${cluster}`);
      console.log(`  Database: ${database}`);
      console.log(`  Params: ${params || 'ninguno'}`);
      
      // Verificar si la contraseña necesita encoding
      const specialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
      if (specialChars.test(password) && !password.includes('%')) {
        console.log(`\n${colors.yellow}⚠️  La contraseña contiene caracteres especiales que pueden causar problemas${colors.reset}`);
        const fix = await ask('¿Codificar caracteres especiales? (s/n): ');
        
        if (fix.toLowerCase() === 's') {
          const newUri = buildAtlasURI(username, password, cluster, database);
          console.log(`\n${colors.green}Nueva URI generada con encoding correcto${colors.reset}`);
          
          const test = await ask('¿Probar nueva URI? (s/n): ');
          if (test.toLowerCase() === 's') {
            const success = await testConnection(newUri, 'URI reparada');
            if (success) {
              const save = await ask('¿Guardar cambios? (s/n): ');
              if (save.toLowerCase() === 's') {
                await saveToEnv(newUri);
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.log(`\n${colors.red}❌ No se pudo parsear la URI${colors.reset}`);
  }
}

// Guardar URI en .env
async function saveToEnv(uri) {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '../.env');
  
  try {
    let content = '';
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf8');
    }
    
    // Reemplazar o añadir MONGODB_URI
    if (content.includes('MONGODB_URI=') || content.includes('MONGO_URI=')) {
      content = content.replace(/MONGODB_URI=.*/g, `MONGODB_URI=${uri}`);
      content = content.replace(/MONGO_URI=.*/g, `# MONGO_URI=${uri}`);
    } else {
      content += `\nMONGODB_URI=${uri}\n`;
    }
    
    fs.writeFileSync(envPath, content);
    console.log(`\n${colors.green}✅ Configuración guardada en .env${colors.reset}`);
  } catch (error) {
    console.log(`\n${colors.red}❌ Error guardando .env: ${error.message}${colors.reset}`);
  }
}

// Ejecutar
main().catch(console.error);
