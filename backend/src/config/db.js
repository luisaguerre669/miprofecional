require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      console.error("ERROR: MONGO_URI no está definida");
      process.exit(1);
    }

    console.log("Conectando a MongoDB...");
    console.log("🔗 URI:", uri.includes('localhost') ? 'MongoDB Local' : 'MongoDB Atlas');
    
    await mongoose.connect(uri);

    // Verificar conexión con ping a admin
    const adminDb = mongoose.connection.getClient().db("admin");
    await adminDb.command({ ping: 1 });
    console.log("MongoDB conectado correctamente");

  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;