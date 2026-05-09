// MongoDB Atlas Optimizer - Scaling to 100k Users
// Optimización de MongoDB Atlas para escalar a 100k usuarios

console.log("🗄️ MongoDB Atlas Optimizer - Scaling to 100k Users");

class MongoDbOptimizer {
  constructor(config = {}) {
    this.name = 'mongodb-optimizer';
    this.config = {
      maxPoolSize: config.maxPoolSize || 50,
      minPoolSize: config.minPoolSize || 5,
      maxIdleTimeMS: config.maxIdleTimeMS || 30000,
      serverSelectionTimeoutMS: config.serverSelectionTimeoutMS || 5000,
      socketTimeoutMS: config.socketTimeoutMS || 45000,
      connectTimeoutMS: config.connectTimeoutMS || 10000,
      heartbeatFrequencyMS: config.heartbeatFrequencyMS || 10000,
      retryWrites: config.retryWrites !== false,
      retryReads: config.retryReads !== false,
      readPreference: config.readPreference || 'primary',
      writeConcern: config.writeConcern || { w: 'majority', j: true },
      ...config
    };
    
    console.log(`🗄️ [${this.name}] MongoDB optimizer initialized:`, {
      maxPoolSize: this.config.maxPoolSize,
      minPoolSize: this.config.minPoolSize,
      retryWrites: this.config.retryWrites,
      retryReads: this.config.retryReads
    });
  }

  /**
   * Get optimized MongoDB connection options
   */
  getConnectionOptions() {
    return {
      maxPoolSize: this.config.maxPoolSize,
      minPoolSize: this.config.minPoolSize,
      maxIdleTimeMS: this.config.maxIdleTimeMS,
      serverSelectionTimeoutMS: this.config.serverSelectionTimeoutMS,
      socketTimeoutMS: this.config.socketTimeoutMS,
      connectTimeoutMS: this.config.connectTimeoutMS,
      heartbeatFrequencyMS: this.config.heartbeatFrequencyMS,
      retryWrites: this.config.retryWrites,
      retryReads: this.config.retryReads,
      readPreference: this.config.readPreference,
      writeConcern: this.config.writeConcern,
      // Compression for better performance
      compressors: ['snappy', 'zstd'],
      // Read from secondaries for read operations when possible
      readPreference: 'secondaryPreferred',
      // Enable connection monitoring
      monitorCommands: true
    };
  }

  /**
   * Get required indexes for scaling
   */
  getRequiredIndexes() {
    return [
      // Users collection indexes
      {
        collection: 'users',
        index: { email: 1 },
        options: { unique: true, sparse: true }
      },
      {
        collection: 'users',
        index: { 'location.coordinates': '2dsphere' },
        options: { sparse: true }
      },
      {
        collection: 'users',
        index: { isActive: 1, createdAt: -1 }
      },
      
      // Professionals collection indexes
      {
        collection: 'professionals',
        index: { 'location.coordinates': '2dsphere' },
        options: { sparse: true }
      },
      {
        collection: 'professionals',
        index: { isActive: 1, verification: 1, createdAt: -1 }
      },
      {
        collection: 'professionals',
        index: { categoryId: 1, isActive: 1 }
      },
      {
        collection: 'professionals',
        index: { 'stats.rating': -1, 'stats.reviewCount': -1 }
      },
      
      // Bookings collection indexes (critical for scaling)
      {
        collection: 'bookings',
        index: { user: 1, date: -1 }
      },
      {
        collection: 'bookings',
        index: { professional: 1, date: -1 }
      },
      {
        collection: 'bookings',
        index: { status: 1, date: -1 }
      },
      {
        collection: 'bookings',
        index: { service: 1, status: 1 }
      },
      {
        collection: 'bookings',
        index: { date: 1, status: 1 },
        options: { expireAfterSeconds: 2592000 } // 30 days TTL for old bookings
      },
      
      // Categories collection indexes
      {
        collection: 'categories',
        index: { isActive: 1, order: 1 }
      },
      
      // Reviews collection indexes
      {
        collection: 'reviews',
        index: { professional: 1, createdAt: -1 }
      },
      {
        collection: 'reviews',
        index: { user: 1, professional: 1 },
        options: { unique: true }
      },
      
      // Messages collection indexes (if exists)
      {
        collection: 'messages',
        index: { booking: 1, createdAt: 1 }
      },
      {
        collection: 'messages',
        index: { sender: 1, recipient: 1, createdAt: -1 }
      },
      
      // Compound indexes for complex queries
      {
        collection: 'professionals',
        index: { isActive: 1, 'location.coordinates': '2dsphere', 'stats.rating': -1 }
      },
      {
        collection: 'bookings',
        index: { user: 1, status: 1, date: -1 }
      },
      {
        collection: 'bookings',
        index: { professional: 1, status: 1, date: -1 }
      }
    ];
  }

  /**
   * Generate index creation commands
   */
  generateIndexCommands() {
    const indexes = this.getRequiredIndexes();
    const commands = [];
    
    indexes.forEach(({ collection, index, options = {} }) => {
      const command = `db.${collection}.createIndex(${JSON.stringify(index)}, ${JSON.stringify(options)});`;
      commands.push({
        collection,
        command,
        index,
        options
      });
    });
    
    return commands;
  }

  /**
   * Get aggregation pipelines for optimized queries
   */
  getOptimizedQueries() {
    return {
      // Optimized user bookings with pagination
      getUserBookings: (userId, skip = 0, limit = 20, status = null) => {
        const matchStage = { user: userId };
        if (status) {
          matchStage.status = status;
        }
        
        return [
          { $match: matchStage },
          { $sort: { date: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'professionals',
              localField: 'professional',
              foreignField: '_id',
              as: 'professional',
              pipeline: [
                { $match: { isActive: true } },
                {
                  $project: {
                    businessName: 1,
                    profession: 1,
                    'contact.phone': 1,
                    'location.city': 1,
                    'verification.isVerified': 1
                  }
                }
              ]
            }
          },
          { $unwind: { path: '$professional', preserveNullAndEmptyArrays: false } },
          {
            $project: {
              service: 1,
              date: 1,
              price: 1,
              status: 1,
              notes: 1,
              createdAt: 1,
              professional: 1
            }
          }
        ];
      },
      
      // Optimized nearby professionals with geo aggregation
      getNearbyProfessionals: (lng, lat, maxDistance = 5000, limit = 20) => {
        return [
          {
            $geoNear: {
              near: {
                type: 'Point',
                coordinates: [lng, lat]
              },
              distanceField: 'distance',
              maxDistance: maxDistance,
              spherical: true,
              query: { isActive: true }
            }
          },
          { $limit: limit },
          {
            $lookup: {
              from: 'categories',
              localField: 'categoryId',
              foreignField: '_id',
              as: 'category',
              pipeline: [
                { $project: { title: 1 } }
              ]
            }
          },
          { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              businessName: 1,
              profession: 1,
              'contact.phone': 1,
              'location.address': 1,
              'location.city': 1,
              'location.state': 1,
              'location.coordinates': 1,
              'verification.isVerified': 1,
              'stats.rating': 1,
              'stats.reviewCount': 1,
              'pricing.hourlyRate': 1,
              distance: 1,
              category: 1
            }
          },
          { $sort: { distance: 1, 'stats.rating': -1 } }
        ];
      },
      
      // Optimized professional stats
      getProfessionalStats: (professionalId) => {
        return [
          {
            $match: { professional: professionalId, status: 'completed' }
          },
          {
            $group: {
              _id: '$professional',
              totalBookings: { $sum: 1 },
              totalRevenue: { $sum: '$price' },
              avgRating: { $avg: '$rating' },
              recentBookings: {
                $push: {
                  $filter: {
                    input: '$date',
                    as: 'date',
                    cond: { $gte: ['$$date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] }
                  }
                }
              }
            }
          }
        ];
      }
    };
  }

  /**
   * Get connection pooling recommendations
   */
  getConnectionPoolRecommendations() {
    return {
      // For 10k users
      '10k': {
        maxPoolSize: 20,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
        recommendation: 'Conservative pool size for moderate load'
      },
      
      // For 50k users
      '50k': {
        maxPoolSize: 35,
        minPoolSize: 10,
        maxIdleTimeMS: 25000,
        recommendation: 'Increased pool size for higher concurrency'
      },
      
      // For 100k users
      '100k': {
        maxPoolSize: 50,
        minPoolSize: 15,
        maxIdleTimeMS: 20000,
        recommendation: 'Maximum pool size for enterprise scale'
      }
    };
  }

  /**
   * Get performance monitoring queries
   */
  getPerformanceQueries() {
    return {
      // Check slow queries
      slowQueries: () => ({
        aggregate: 'system.profile',
        pipeline: [
          { $match: { millis: { $gt: 100 } } },
          { $sort: { millis: -1 } },
          { $limit: 10 },
          {
            $project: {
              ts: 1,
              millis: 1,
              command: 1,
              ns: 1
            }
          }
        ]
      }),
      
      // Check index usage
      indexUsage: () => ({
        aggregate: '$collection',
        pipeline: [
          { $indexStats: {} },
          { $sort: { 'ops': -1 } }
        ]
      }),
      
      // Check connection status
      connectionStatus: () => ({
        serverStatus: 1
      })
    };
  }

  /**
   * Get scaling recommendations
   */
  getScalingRecommendations(userCount) {
    const recommendations = [];
    
    if (userCount <= 10000) {
      recommendations.push({
        category: 'connection_pool',
        priority: 'medium',
        action: 'Use maxPoolSize: 20, minPoolSize: 5',
        reason: 'Conservative pool size for 10k users'
      });
    } else if (userCount <= 50000) {
      recommendations.push({
        category: 'connection_pool',
        priority: 'high',
        action: 'Use maxPoolSize: 35, minPoolSize: 10',
        reason: 'Increased pool size for 50k users'
      });
    } else {
      recommendations.push({
        category: 'connection_pool',
        priority: 'critical',
        action: 'Use maxPoolSize: 50, minPoolSize: 15',
        reason: 'Maximum pool size for 100k+ users'
      });
    }
    
    // General recommendations
    recommendations.push({
      category: 'indexes',
      priority: 'critical',
      action: 'Ensure all required indexes are created',
      reason: 'Critical for query performance at scale'
    });
    
    recommendations.push({
      category: 'read_preference',
      priority: 'medium',
      action: 'Use secondaryPreferred for read operations',
      reason: 'Distribute read load across replica set'
    });
    
    recommendations.push({
      category: 'compression',
      priority: 'medium',
      action: 'Enable compression (snappy/zstd)',
      reason: 'Reduce network bandwidth usage'
    });
    
    if (userCount > 50000) {
      recommendations.push({
        category: 'sharding',
        priority: 'high',
        action: 'Consider sharding for bookings collection',
        reason: 'Distribute write load for high volume'
      });
    }
    
    return recommendations;
  }

  /**
   * Generate MongoDB Atlas configuration
   */
  generateAtlasConfiguration(userCount) {
    const baseConfig = {
      clusterType: userCount > 50000 ? 'REPLICASET' : 'REPLICASET',
      providerSettings: {
        providerName: 'AWS',
        regionName: 'us-east-1',
        instanceType: userCount > 50000 ? 'M30' : 'M20'
      },
      connectionOptions: this.getConnectionOptions(),
      indexes: this.getRequiredIndexes()
    };
    
    if (userCount > 50000) {
      baseConfig.autoScaling = {
        enabled: true,
        compute: {
          enabled: true,
          scaleDownEnabled: true,
          minInstanceSize: 'M20',
          maxInstanceSize: 'M40'
        }
      };
    }
    
    return baseConfig;
  }

  /**
   * Validate current configuration
   */
  validateConfiguration(currentConfig) {
    const issues = [];
    const recommendations = [];
    
    // Check connection pool settings
    if (!currentConfig.maxPoolSize || currentConfig.maxPoolSize < 10) {
      issues.push('Connection pool size too small for scaling');
      recommendations.push('Set maxPoolSize to at least 20 for 10k+ users');
    }
    
    // Check retry settings
    if (!currentConfig.retryWrites || !currentConfig.retryReads) {
      issues.push('Retry settings not enabled');
      recommendations.push('Enable retryWrites and retryReads for reliability');
    }
    
    // Check timeout settings
    if (!currentConfig.serverSelectionTimeoutMS || currentConfig.serverSelectionTimeoutMS > 10000) {
      issues.push('Server selection timeout too high');
      recommendations.push('Set serverSelectionTimeoutMS to 5000ms');
    }
    
    return {
      valid: issues.length === 0,
      issues,
      recommendations
    };
  }
}

// Create singleton instance
const mongoDbOptimizer = new MongoDbOptimizer({
  maxPoolSize: process.env.MONGO_MAX_POOL_SIZE ? parseInt(process.env.MONGO_MAX_POOL_SIZE) : 50,
  minPoolSize: process.env.MONGO_MIN_POOL_SIZE ? parseInt(process.env.MONGO_MIN_POOL_SIZE) : 5,
  retryWrites: process.env.MONGO_RETRY_WRITES !== 'false',
  retryReads: process.env.MONGO_RETRY_READS !== 'false'
});

module.exports = {
  MongoDbOptimizer,
  mongoDbOptimizer
};
