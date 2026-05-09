const { MongoClient, ServerApiVersion } = require('mongodb');

// URI de MongoDB Atlas proporcionada por el usuario
const atlasUri = "mongodb+srv://miprofesional_luis:Luisaguerre1966@miprofesional-cluster.zhkc2iq.mongodb.net/miprofesional?appName=miprofesional-cluster";

// URI de MongoDB local para comparación
const localUri = "mongodb://localhost:27017/miprofesional";

async function testConnection(uri, name) {
  console.log(`\n🔍 Probando conexión a ${name}...`);
  console.log(`📡 URI: ${uri}`);
  
  try {
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });

    console.log(`⏳ Conectando a ${name}...`);
    await client.connect();
    
    // Ping a la base de datos admin para verificar conexión
    const adminDb = client.db("admin");
    const result = await adminDb.command({ ping: 1 });
    
    console.log(`✅ ${name} - Conexión exitosa!`);
    console.log(`📊 Ping result:`, result);
    
    // Listar bases de datos disponibles
    const databases = await client.db().admin().listDatabases();
    console.log(`📋 Bases de datos disponibles en ${name}:`);
    databases.databases.forEach(db => {
      console.log(`   - ${db.name} (${db.sizeOnDisk} bytes)`);
    });
    
    await client.close();
    console.log(`🔒 Conexión a ${name} cerrada exitosamente`);
    
  } catch (error) {
    console.error(`❌ ${name} - Error de conexión:`, error.message);
    console.error(`🔍 Tipo de error:`, error.name);
    
    if (error.message.includes('Text record may only set any of: authSource, replicaSet, loadBalanced')) {
      console.error(`⚠️  Error específico de MongoDB Atlas - Posibles causas:`);
      console.error(`   1. La URI contiene parámetros no compatibles con SRV records`);
      console.error(`   2. El cluster name es incorrecto`);
      console.error(`   3. Los parámetros de conexión están mal formados`);
      console.error(`   4. Problemas con DNS SRV resolution`);
    }
    
    return false;
  }
  
  return true;
}

async function runDiagnostics() {
  console.log('🚀 INICIANDO DIAGNÓSTICO DE CONEXIÓN MONGODB');
  console.log('=' .repeat(60));
  
  // Probar conexión local primero
  const localSuccess = await testConnection(localUri, 'MongoDB Local');
  
  // Probar conexión Atlas
  const atlasSuccess = await testConnection(atlasUri, 'MongoDB Atlas');
  
  console.log('\n📊 RESUMEN DE DIAGNÓSTICO');
  console.log('=' .repeat(60));
  console.log(`MongoDB Local: ${localSuccess ? '✅ CONECTADO' : '❌ ERROR'}`);
  console.log(`MongoDB Atlas: ${atlasSuccess ? '✅ CONECTADO' : '❌ ERROR'}`);
  
  if (!atlasSuccess) {
    console.log('\n🔧 RECOMENDACIONES PARA MONGODB ATLAS:');
    console.log('1. Verificar que el cluster name sea correcto');
    console.log('2. Simplificar la URI sin parámetros extra');
    console.log('3. Verificar credenciales (usuario y contraseña)');
    console.log('4. Configurar IP whitelist en MongoDB Atlas');
    console.log('5. Probar con URI básica: mongodb+srv://usuario:password@cluster.mongodb.net/dbname');
  }
  
  console.log('\n🎯 ESTADO ACTUAL DEL SISTEMA:');
  console.log(`- Servidor backend: ${localSuccess ? '✅ Funcionando con MongoDB Local' : '❌ Sin conexión'}`);
  console.log(`- MongoDB Atlas: ${atlasSuccess ? '✅ Listo para producción' : '❌ Requiere configuración'}`);
}

runDiagnostics().catch(console.error);
