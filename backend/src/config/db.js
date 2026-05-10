require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");

// Cargar dotenv desde la ubicación correcta
dotenv.config({ path: path.join(__dirname, "../../.env") });

const connectDB = async () => {
  try {
    // Support both MONGODB_URI and MONGO_URI for compatibility
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!uri) {
      console.error("❌ ERROR: MONGODB_URI no está definida en .env");
      console.error("   Crea un archivo .env basado en .env.example");
      console.error("   O ejecuta: node scripts/mongodb-atlas-setup.js");
      process.exit(1);
    }

    const isAtlas = uri.includes('mongodb+srv://');
    const displayUri = uri.replace(/\/\/.*@/, '//***:***@');

    console.log("🔌 Conectando a MongoDB...");
    console.log(`   Tipo: ${isAtlas ? '🌐 MongoDB Atlas' : '🗄️  MongoDB Local'}`);
    console.log(`   URI: ${displayUri}`);
    
    const options = {
      serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 15000),
      connectTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS || 15000),
    };

    if (isAtlas) {
      options.retryWrites = true;
      options.w = 'majority';
    }
    
    await mongoose.connect(uri, options);

    // Verify connection with ping
    const adminDb = mongoose.connection.getClient().db("admin");
    await adminDb.command({ ping: 1 });
    
    console.log("✅ MongoDB conectado correctamente");
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);

  } catch (error) {
    console.error("\n❌ MongoDB connection error:");
    console.error(`   ${error.message}`);
    
    if (error.message.includes('bad auth') || error.message.includes('authentication failed')) {
      console.error("\n🔴 ERROR DE AUTENTICACIÓN");
      console.error("   → Verifica usuario/contraseña en MongoDB Atlas");
      console.error("   → Si la contraseña tiene caracteres especiales, codifícalos:");
      console.error("     @ → %40, # → %23, $ → %24, % → %25, & → %26");
      console.error("   → Ejecuta: node scripts/mongodb-atlas-setup.js");
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;