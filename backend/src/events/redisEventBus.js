// Redis Event Bus - Distributed Event Streams Layer
// Evolución del eventBus actual hacia Redis Streams

console.log("🌊 Redis Event Bus - Distributed Event Streams Layer");

const { redisConfig } = require('../config/redis');
const { AUTH_EVENTS, BOOKING_EVENTS, PROFESSIONAL_EVENTS, SYSTEM_EVENTS } = require('./eventTypes');

class RedisEventBus {
  constructor() {
    this.redisConfig = redisConfig;
    this.isRedisAvailable = false;
    this.fallbackBus = null; // Will be set to the original eventBus
    this.streamMappings = new Map();
    this.consumerGroups = new Map();
    this.publishStats = {
      success: 0,
      failed: 0,
      fallback: 0,
      total: 0
    };
    
    // Stream names for each event type
    this.streamNames = {
      // Auth events
      [AUTH_EVENTS.USER_REGISTERED]: 'auth:user:registered',
      [AUTH_EVENTS.USER_LOGGED_IN]: 'auth:user:logged_in',
      [AUTH_EVENTS.USER_LOGGED_OUT]: 'auth:user:logged_out',
      [AUTH_EVENTS.TOKEN_REFRESHED]: 'auth:token:refreshed',
      [AUTH_EVENTS.LOGIN_FAILED]: 'auth:login:failed',
      [AUTH_EVENTS.REGISTRATION_FAILED]: 'auth:registration:failed',
      
      // Booking events
      [BOOKING_EVENTS.CREATED]: 'booking:created',
      [BOOKING_EVENTS.UPDATED]: 'booking:updated',
      [BOOKING_EVENTS.CANCELLED]: 'booking:cancelled',
      [BOOKING_EVENTS.CONFIRMED]: 'booking:confirmed',
      [BOOKING_EVENTS.COMPLETED]: 'booking:completed',
      [BOOKING_EVENTS.STATUS_CHANGED]: 'booking:status:changed',
      
      // Professional events
      [PROFESSIONAL_EVENTS.LOCATION_UPDATED]: 'professional:location:updated',
      [PROFESSIONAL_EVENTS.REGISTERED]: 'professional:registered',
      [PROFESSIONAL_EVENTS.VERIFIED]: 'professional:verified',
      
      // System events
      [SYSTEM_EVENTS.ERROR_OCCURRED]: 'system:error:occurred',
      [SYSTEM_EVENTS.SERVICE_STARTED]: 'system:service:started',
      [SYSTEM_EVENTS.SERVICE_STOPPED]: 'system:service:stopped'
    };
    
    this.setupStreamMappings();
    this.initializeRedisConnection();
  }

  setupStreamMappings() {
    // Create reverse mapping for stream names to event types
    for (const [eventType, streamName] of Object.entries(this.streamNames)) {
      this.streamMappings.set(streamName, eventType);
    }
  }

  async initializeRedisConnection() {
    try {
      // Check if Redis is available
      if (this.redisConfig.isReady()) {
        this.isRedisAvailable = true;
        console.log('🌊 [RedisEventBus] Redis is available - using distributed mode');
        await this.setupConsumerGroups();
      } else {
        console.log('🌊 [RedisEventBus] Redis not available - using fallback mode');
        this.isRedisAvailable = false;
      }
    } catch (error) {
      console.error('🌊 [RedisEventBus] Error checking Redis availability:', error.message);
      this.isRedisAvailable = false;
    }
  }

  async setupConsumerGroups() {
    try {
      // Create consumer groups for each stream
      const consumerGroups = [
        { stream: 'auth:*', group: 'auth-workers' },
        { stream: 'booking:*', group: 'booking-workers' },
        { stream: 'professional:*', group: 'geo-workers' },
        { stream: 'system:*', group: 'system-workers' }
      ];

      for (const { stream, group } of consumerGroups) {
        try {
          // This will create the group for all matching streams
          await this.redisConfig.createConsumerGroup(stream, group);
          this.consumerGroups.set(group, stream);
        } catch (error) {
          // Group might already exist, which is fine
          if (!error.message.includes('BUSYGROUP')) {
            console.error(`🌊 [RedisEventBus] Error creating group ${group}:`, error.message);
          }
        }
      }
      
      console.log('🌊 [RedisEventBus] Consumer groups setup completed');
    } catch (error) {
      console.error('🌊 [RedisEventBus] Error setting up consumer groups:', error.message);
    }
  }

  setFallbackBus(eventBus) {
    this.fallbackBus = eventBus;
    console.log('🌊 [RedisEventBus] Fallback bus configured');
  }

  async emit(eventName, payload = {}, metadata = {}) {
    const startTime = Date.now();
    this.publishStats.total++;
    
    try {
      // Try Redis first if available
      if (this.isRedisAvailable) {
        await this.publishToRedisStream(eventName, payload, metadata);
        this.publishStats.success++;
        
        const duration = Date.now() - startTime;
        console.log(`🌊 [RedisEventBus] EVENT_PUBLISHED: ${eventName} (${duration}ms)`);
        
        return { 
          emitted: true, 
          method: 'redis',
          duration,
          streamName: this.streamNames[eventName]
        };
      } else {
        throw new Error('Redis not available');
      }
      
    } catch (error) {
      // Fallback to memory bus
      console.warn(`🌊 [RedisEventBus] Redis publish failed for ${eventName}: ${error.message}`);
      console.log(`🌊 [RedisEventBus] FALLBACK_TO_MEMORY_BUS: ${eventName}`);
      
      this.publishStats.fallback++;
      
      if (this.fallbackBus) {
        const result = await this.fallbackBus.emit(eventName, payload, metadata);
        const duration = Date.now() - startTime;
        
        return { 
          emitted: true, 
          method: 'fallback',
          duration,
          fallbackResult: result
        };
      } else {
        this.publishStats.failed++;
        throw error;
      }
    }
  }

  async publishToRedisStream(eventName, payload, metadata) {
    const streamName = this.streamNames[eventName];
    
    if (!streamName) {
      throw new Error(`No stream mapping found for event: ${eventName}`);
    }

    // Prepare event data for Redis Streams
    const eventData = {
      eventName,
      payload: JSON.stringify(payload),
      metadata: JSON.stringify(metadata),
      timestamp: new Date().toISOString(),
      source: 'api-gateway'
    };

    // Add to Redis Stream with timeout
    const messageId = await this.redisConfig.addToStream(streamName, eventData);
    
    return {
      messageId,
      streamName,
      eventName
    };
  }

  async subscribe(eventName, handler, options = {}) {
    const streamName = this.streamNames[eventName];
    
    if (!streamName) {
      throw new Error(`No stream mapping found for event: ${eventName}`);
    }

    const { groupName, consumerName } = options;
    
    if (groupName && consumerName) {
      // Subscribe to consumer group
      return this.subscribeToGroup(streamName, groupName, consumerName, handler);
    } else {
      // Simple stream reading
      return this.subscribeToStream(streamName, handler);
    }
  }

  async subscribeToStream(streamName, handler) {
    console.log(`🌊 [RedisEventBus] Subscribing to stream: ${streamName}`);
    
    const processStream = async () => {
      try {
        while (this.isRedisAvailable) {
          const result = await this.redisConfig.readFromStream(streamName, { 
            count: 10, 
            block: 5000 // 5 seconds block
          });
          
          if (result && result.length > 0) {
            const [, messages] = result[0];
            
            for (const message of messages) {
              await this.processMessage(message, handler);
            }
          }
        }
      } catch (error) {
        console.error(`🌊 [RedisEventBus] Error reading from stream ${streamName}:`, error.message);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    };

    // Start processing in background
    processStream().catch(error => {
      console.error(`🌊 [RedisEventBus] Stream processing error for ${streamName}:`, error);
    });
    
    return { streamName, subscribed: true };
  }

  async subscribeToGroup(streamName, groupName, consumerName, handler) {
    console.log(`🌊 [RedisEventBus] Subscribing to group ${groupName} as ${consumerName} for stream: ${streamName}`);
    
    const processGroup = async () => {
      try {
        while (this.isRedisAvailable) {
          const result = await this.redisConfig.readFromGroup(streamName, groupName, consumerName, {
            count: 10,
            block: 5000 // 5 seconds block
          });
          
          if (result && result.length > 0) {
            const [, messages] = result[0];
            
            for (const message of messages) {
              await this.processGroupMessage(message, handler, streamName, groupName);
            }
          }
        }
      } catch (error) {
        console.error(`🌊 [RedisEventBus] Error reading from group ${groupName}:`, error.message);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    };

    // Start processing in background
    processGroup().catch(error => {
      console.error(`🌊 [RedisEventBus] Group processing error for ${groupName}:`, error);
    });
    
    return { streamName, groupName, consumerName, subscribed: true };
  }

  async processMessage(message, handler) {
    try {
      const [, fields] = message;
      const eventData = this.parseMessageFields(fields);
      
      console.log(`🌊 [RedisEventBus] EVENT_CONSUMED: ${eventData.eventName}`);
      
      // Call handler with parsed data
      await handler(eventData.payload, eventData.metadata);
      
    } catch (error) {
      console.error(`🌊 [RedisEventBus] EVENT_FAILED: Processing error:`, error.message);
    }
  }

  async processGroupMessage(message, handler, streamName, groupName) {
    try {
      const [messageId, fields] = message;
      const eventData = this.parseMessageFields(fields);
      
      console.log(`🌊 [RedisEventBus] EVENT_CONSUMED: ${eventData.eventName} (group: ${groupName})`);
      
      // Call handler with parsed data
      await handler(eventData.payload, eventData.metadata);
      
      // Acknowledge message
      await this.redisConfig.acknowledgeMessage(streamName, groupName, messageId);
      
    } catch (error) {
      console.error(`🌊 [RedisEventBus] EVENT_FAILED: Group processing error:`, error.message);
      // Don't acknowledge failed messages - they will be retried
    }
  }

  parseMessageFields(fields) {
    const data = {};
    
    for (let i = 0; i < fields.length; i += 2) {
      const key = fields[i];
      const value = fields[i + 1];
      
      if (key === 'payload' || key === 'metadata') {
        try {
          data[key] = JSON.parse(value);
        } catch (error) {
          data[key] = value;
        }
      } else {
        data[key] = value;
      }
    }
    
    return data;
  }

  // Get stream statistics
  async getStreamStats(streamName) {
    try {
      if (!this.isRedisAvailable) {
        return { status: 'redis_unavailable' };
      }
      
      const info = await this.redisConfig.getStreamInfo(streamName);
      return {
        status: 'available',
        streamName,
        length: info[1], // Stream length
        groups: info[3], // Number of groups
        firstId: info[5], // First message ID
        lastId: info[7]   // Last message ID
      };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  // Get all stream statistics
  async getAllStreamStats() {
    const stats = {};
    
    for (const streamName of Object.values(this.streamNames)) {
      stats[streamName] = await this.getStreamStats(streamName);
    }
    
    return stats;
  }

  // Get publishing statistics
  getPublishStats() {
    return {
      ...this.publishStats,
      successRate: this.publishStats.total > 0 ? 
        (this.publishStats.success / this.publishStats.total * 100).toFixed(2) + '%' : '0%',
      fallbackRate: this.publishStats.total > 0 ? 
        (this.publishStats.fallback / this.publishStats.total * 100).toFixed(2) + '%' : '0%'
    };
  }

  // Check Redis availability
  async checkRedisAvailability() {
    try {
      const health = await this.redisConfig.healthCheck();
      this.isRedisAvailable = health.status === 'healthy';
      
      if (this.isRedisAvailable && !this.consumerGroups.size) {
        await this.setupConsumerGroups();
      }
      
      return health;
    } catch (error) {
      this.isRedisAvailable = false;
      return { status: 'unhealthy', error: error.message };
    }
  }

  // Get connection info
  getConnectionInfo() {
    return {
      redisAvailable: this.isRedisAvailable,
      redisInfo: this.redisConfig.getConnectionInfo(),
      streamMappings: Object.fromEntries(this.streamMappings),
      consumerGroups: Object.fromEntries(this.consumerGroups),
      publishStats: this.getPublishStats()
    };
  }

  // Reset statistics
  resetStats() {
    this.publishStats = {
      success: 0,
      failed: 0,
      fallback: 0,
      total: 0
    };
  }

  // Graceful shutdown
  async shutdown() {
    console.log('🌊 [RedisEventBus] Shutting down...');
    
    // Disconnect from Redis
    await this.redisConfig.disconnect();
    
    console.log('🌊 [RedisEventBus] Shutdown completed');
  }
}

// Create singleton instance
const redisEventBus = new RedisEventBus();

// Export the Redis event bus and class
module.exports = {
  RedisEventBus,
  redisEventBus
};
