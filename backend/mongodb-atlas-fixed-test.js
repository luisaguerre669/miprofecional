const { MongoClient, ServerApiVersion } = require('mongodb');

// URIs de prueba para MongoDB Atlas con diferentes formatos
const testUris = [
  {
    name: "URI Básica (sin parámetros)",
    uri: "mongodb+srv://miprofesional_luis:Luisaguerre1966@miprofesional-cluster.zhkc2iq.mongodb.net/miprofesional"
  },
  {
    name: "URI con retryWrites",
    uri: "mongodb+srv://miprofesional_luis:Luisaguerre1966@miprofesional-cluster.zhkc2iq.mongodb.net/miprofesional?retryWrites=true"
  },
  {
    name: "URI con w=majority",
    uri: "mongodb+srv://miprofesional_luis:Luisaguerre1966@miprofesional-cluster.zhkc2iq.mongodb.net/miprofesional?w=majority"
  },
  {
    name: "URI con retryWrites&w=majority",
    uri: "mongodb+srv://miprofesional_luis:Luisaguerre1966@miprofesional-cluster.zhkc2iq.mongodb.net/miprofesional?retryWrites=true&w=majority"
  },
  {
    name: "URI con appName (original que falla)",
    uri: "mongodb+srv://miprofesional_luis:Luisaguerre1966@miprofesional-cluster.zhkc2iq.mongodb.net/miprofesional?appName=miprofesional-cluster"
  }
];

async function testConnection(uri, name) {
  console.log(`\n🔍 Probando: ${name}`);
  console.log(`📡 URI: ${uri}`);
  
  try {
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      connectTimeoutMS: 10000, // 10 segundos timeout
      serverSelectionTimeoutMS: 10000
    });

    console.log(`⏳ Conectando...`);
    await client.connect();
    
    // Ping a la base de datos admin
    const adminDb = client.db("admin");
    const result = await adminDb.command({ ping: 1 });
    
    console.log(`✅ ÉXITO! Ping result: ${JSON.stringify(result)}`);
    
    // Intentar acceder a la base de datos miprofesional
    try {
      const db = client.db("miprofesional");
      const collections = await db.listCollections().toArray();
      console.log(`📋 Colecciones en miprofesional: ${collections.length}`);
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
    } catch (dbError) {
      console.log(`⚠️  La base de datos miprofesional no existe o no hay acceso`);
    }
    
    await client.close();
    console.log(`🔒 Conexión cerrada exitosamente`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ ERROR: ${error.message}`);
    
    if (error.message.includes('ENOTFOUND')) {
      console.error(`🔍 DNS Error - El cluster name o dominio no existe`);
    } else if (error.message.includes('authentication')) {
      console.error(`🔍 Authentication Error - Usuario o contraseña incorrectos`);
    } else if (error.message.includes('unauthorized')) {
      console.error(`🔍 Authorization Error - Usuario no tiene permisos`);
    } else if (error.message.includes('Text record may only set')) {
      console.error(`🔍 SRV Record Error - Parámetros no válidos en URI`);
    }
    
    return false;
  }
}

async function runAtlasTests() {
  console.log('🚀 DIAGNÓSTICO COMPLETO DE MONGODB ATLAS');
  console.log('=' .repeat(80));
  
  let successCount = 0;
  
  for (const test of testUris) {
    const success = await testConnection(test.uri, test.name);
    if (success) {
      successCount++;
      console.log(`\n🎯 ¡ESTA URI FUNCIONA! Puedes usar esta configuración:`);
      console.log(`MONGO_URI=${test.uri}`);
      break; // Detenerse al encontrar una que funcione
    }
    console.log('-'.repeat(60));
  }
  
  console.log('\n📊 RESUMEN FINAL');
  console.log('=' .repeat(80));
  console.log(`URIs probadas: ${testUris.length}`);
  console.log(`URIs exitosas: ${successCount}`);
  
  if (successCount > 0) {
    console.log('✅ MongoDB Atlas está configurado correctamente');
    console.log('🔧 Puedes actualizar tu archivo .env con la URI que funcionó');
  } else {
    console.log('❌ Ninguna URI funcionó - Requiere configuración en MongoDB Atlas');
    console.log('\n🔧 ACCIONES RECOMENDADAS:');
    console.log('1. Verificar el nombre exacto del cluster en MongoDB Atlas');
    console.log('2. Confirmar que el usuario miprofesional_luis existe y tiene permisos');
    console.log('3. Configurar IP whitelist (0.0.0.0/0 para acceso desde cualquier lugar)');
    console.log('4. Verificar que el cluster esté activo y no pausado');
  }
}

runAtlasTests().catch(console.error);
