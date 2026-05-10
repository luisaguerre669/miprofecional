// Database Configuration for MiProfesional Backend
// MongoDB Atlas compatible con manejo de errores mejorado

const mongoose = require('mongoose');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.connection = null;
  }

  // URL encode password to handle special characters
  encodePassword(password) {
    return encodeURIComponent(password);
  }

  // Fix common URI issues
  fixURI(uri) {
    if (!uri) return uri;
    
    // Ensure we're using MONGODB_URI (support both MONGO_URI and MONGODB_URI)
    uri = uri.trim();
    
    // Check if password needs encoding (contains special chars but no %)
    const passwordMatch = uri.match(/mongodb\+srv:\/\/[^:]+:([^@]+)@/);
    if (passwordMatch) {
      const password = passwordMatch[1];
      const specialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
      
      if (specialChars.test(password) && !password.includes('%')) {
        logger.warn('Password contains special characters that should be URL-encoded');
        // Don't auto-fix, just warn - user should fix in .env
      }
    }
    
    return uri;
  }

  // Connect to MongoDB
  async connect() {
    try {
      // Support both MONGODB_URI and MONGO_URI for compatibility
      let mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/miprofesional';
      
      // Apply fixes
      mongoUri = this.fixURI(mongoUri);
      
      const isAtlas = mongoUri.includes('mongodb+srv://');
      const displayUri = mongoUri.replace(/\/\/.*@/, '//***:***@');
      
      console.log("🔌 Conectando a MongoDB...");
      console.log(`   Tipo: ${isAtlas ? '🌐 MongoDB Atlas' : '🗄️  MongoDB Local'}`);
      console.log(`   URI: ${displayUri}`);
      
      // Connection options optimized for Atlas
      const options = {
        serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 15000),
        connectTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS || 15000),
        socketTimeoutMS: 45000,
      };

      // Atlas-specific options
      if (isAtlas) {
        options.retryWrites = true;
        options.w = 'majority';
      }
      
      try {
        this.connection = await mongoose.connect(mongoUri, options);
      } catch (srvError) {
        // Si falla por error de TXT record, intentar con conexión directa
        if (srvError.message && srvError.message.includes('Text record')) {
          console.log(`   ${'⚠️  Error con SRV, intentando conexión directa...'}`);
          
          // Convertir SRV a conexión directa
          const directUri = await this.convertSRVToDirect(mongoUri);
          if (directUri) {
            console.log(`   ${'🔄 Usando conexión directa'}`);
            this.connection = await mongoose.connect(directUri, options);
          } else {
            throw srvError;
          }
        } else {
          throw srvError;
        }
      }
      
      // Verify connection with ping
      const adminDb = mongoose.connection.getClient().db("admin");
      await adminDb.command({ ping: 1 });
      
      console.log("✅ MongoDB conectado correctamente");
      logger.info('Connected to MongoDB successfully', {
        database: mongoose.connection.name,
        host: mongoose.connection.host,
        type: isAtlas ? 'atlas' : 'local'
      });
      
      // Handle connection events
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });

      return this.connection;
      
    } catch (error) {
      this.handleConnectionError(error);
      throw error;
    }
  }

  // Convert SRV URI to direct connection URI
  async convertSRVToDirect(srvUri) {
    try {
      // Extraer componentes de la URI SRV
      const match = srvUri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)/);
      if (!match) return null;
      
      const [, user, password, host, database] = match;
      
      // Usar los shards conocidos para tu cluster
      // Estos se obtienen del registro SRV: _mongodb._tcp.miprofesional-cluster.zhkc2iq.mongodb.net
      const clusterId = host.split('.')[0]; // miprofesional-cluster
      
      // Construir hosts directos (basado en el patrón típico de Atlas)
      // Nota: Estos valores son específicos de tu cluster
      const directHosts = [
        'ac-iggvqxy-shard-00-00.zhkc2iq.mongodb.net:27017',
        'ac-iggvqxy-shard-00-01.zhkc2iq.mongodb.net:27017',
        'ac-iggvqxy-shard-00-02.zhkc2iq.mongodb.net:27017'
      ].join(',');
      
      // Construir URI directa
      // replicaSet obtenido del registro TXT: atlas-v2tef5-shard-0
      const directUri = `mongodb://${user}:${encodeURIComponent(password)}@${directHosts}/${database}?ssl=true&replicaSet=atlas-v2tef5-shard-0&authSource=admin&retryWrites=true&w=majority`;
      
      return directUri;
    } catch (error) {
      logger.error('Error converting SRV to direct:', error);
      return null;
    }
  }

  // Handle connection errors with helpful messages
  handleConnectionError(error) {
    console.error("\n❌ MongoDB connection error:");
    console.error(`   ${error.message}`);
    
    logger.error('Failed to connect to MongoDB:', error);

    // Provide specific guidance based on error type
    if (error.message.includes('bad auth') || error.message.includes('authentication failed')) {
      console.error("\n🔴 ERROR DE AUTENTICACIÓN (bad auth)");
      console.error("   Causas posibles:");
      console.error("   1. Usuario o contraseña incorrectos");
      console.error("   2. La contraseña contiene caracteres especiales sin URL-encode");
      console.error("   3. El usuario no existe en Database Access");
      console.error("\n   Soluciones:");
      console.error("   → Verifica usuario/contraseña en https://cloud.mongodb.com → Database Access");
      console.error("   → Si la contraseña tiene @ # $ % & + = ?, codifícalos:");
      console.error("     @ → %40, # → %23, $ → %24, % → %25, & → %26");
      console.error("   → Usa el script: node scripts/mongodb-atlas-setup.js");
      
    } else if (error.message.includes('IP') || error.message.includes('whitelist')) {
      console.error("\n🔴 ERROR DE IP NO PERMITIDA");
      console.error("   Solución:");
      console.error("   → Ve a https://cloud.mongodb.com → Network Access");
      console.error("   → Añade tu IP actual o usa 0.0.0.0/0 para permitir todas");
      
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error("\n🔴 ERROR: CLUSTER NO ENCONTRADO");
      console.error("   Solución:");
      console.error("   → Verifica que el nombre del cluster sea correcto");
      console.error("   → Ejemplo correcto: cluster0.abc123.mongodb.net");
      
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('connect ECONNREFUSED')) {
      console.error("\n🔴 ERROR: CONEXIÓN RECHAZADA");
      console.error("   Solución:");
      console.error("   → Si usas MongoDB local, asegúrate de que el servicio esté corriendo");
      console.error("   → Si usas Atlas, verifica tu conexión a internet");
    }
    
    console.error("\n📚 Documentación:");
    console.error("   → Guía completa: https://docs.mongodb.com/guides/cloud/connectionstring/");
    console.error("   → Script de ayuda: node scripts/mongodb-atlas-setup.js");
  }

  // Disconnect from MongoDB
  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        logger.info('Disconnected from MongoDB');
        this.connection = null;
      }
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  // Get connection status
  isConnected() {
    return mongoose.connection.readyState === 1;
  }

  // Get connection stats
  getConnectionStats() {
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    return {
      state: states[state],
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
    };
  }

  // Drop database (for testing)
  async dropDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot drop database in production');
    }

    try {
      await mongoose.connection.db.dropDatabase();
      logger.info('Database dropped successfully');
    } catch (error) {
      logger.error('Error dropping database:', error);
      throw error;
    }
  }

  // Create indexes for better performance
  async createIndexes() {
    try {
      // User indexes
      await mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true });
      await mongoose.connection.db.collection('users').createIndex({ phone: 1 }, { unique: true });
      
      // Professional indexes
      await mongoose.connection.db.collection('professionals').createIndex({ userId: 1 });
      await mongoose.connection.db.collection('professionals').createIndex({ categoryId: 1 });
      await mongoose.connection.db.collection('professionals').createIndex({ location: '2dsphere' });
      await mongoose.connection.db.collection('professionals').createIndex({ isVerified: 1 });
      
      // Category indexes
      await mongoose.connection.db.collection('categories').createIndex({ title: 1 }, { unique: true });
      
      // Booking indexes
      await mongoose.connection.db.collection('bookings').createIndex({ userId: 1 });
      await mongoose.connection.db.collection('bookings').createIndex({ professionalId: 1 });
      await mongoose.connection.db.collection('bookings').createIndex({ date: 1 });
      await mongoose.connection.db.collection('bookings').createIndex({ status: 1 });
      
      // Review indexes
      await mongoose.connection.db.collection('reviews').createIndex({ professionalId: 1 });
      await mongoose.connection.db.collection('reviews').createIndex({ userId: 1 });
      await mongoose.connection.db.collection('reviews').createIndex({ rating: 1 });
      
      logger.info('Database indexes created successfully');
    } catch (error) {
      logger.error('Error creating database indexes:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const stats = this.getConnectionStats();
      const ping = await mongoose.connection.db.admin().ping();
      
      return {
        status: 'healthy',
        mongodb: {
          ...stats,
          ping: ping,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Export singleton instance
module.exports = new Database();
