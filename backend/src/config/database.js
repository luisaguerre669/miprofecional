// Database Configuration for MiProfesional Backend

const mongoose = require('mongoose');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.connection = null;
  }

  // Connect to MongoDB
  async connect() {
    try {
      const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/miprofesional';
      
      console.log("Conectando a MongoDB...");
      console.log("🔗 URI:", mongoUri.includes('localhost') ? 'MongoDB Local' : 'MongoDB Atlas');
      
      // Conexión simple y directa - SIN opciones obsoletas
      this.connection = await mongoose.connect(mongoUri);
      
      console.log("✅ Connected to MongoDB ✔");
      logger.info('Connected to MongoDB successfully');
      
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
      console.error("❌ MongoDB connection error:", error);
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
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
