// Distributed Event Bus - Hybrid Memory + Redis Streams
// Convierte eventBus in-memory existente en sistema distribuido real

console.log("🌊 Distributed Event Bus - Hybrid Memory + Redis Streams");

const { redisClient } = require('../config/redis.client');
const { eventBus } = require('./eventBus');
const { AUTH_EVENTS, BOOKING_EVENTS, PROFESSIONAL_EVENTS, SYSTEM_EVENTS } = require('./eventTypes');

class DistributedEventBus {
  constructor() {
    this.redisClient = redisClient;
    this.memoryBus = eventBus; // EventBus existente como fallback
    this.redisEnabled = process.env.REDIS_EVENT_ENABLED === 'true';
    this.isRedisAvailable = false;
    this.streamPrefix = 'events:';
    this.consumerGroups = new Map();
    this.publishStats = {
      local: 0,
      redis: 0,
      fallback: 0,
      failed: 0,
      total: 0
    };
    
    // Stream mappings for each event type
    this.streamMappings = {
      // Auth events
      [AUTH_EVENTS.USER_REGISTERED]: 'events:AUTH_USER_REGISTERED',
      [AUTH_EVENTS.USER_LOGGED_IN]: 'events:AUTH_USER_LOGGED_IN',
      [AUTH_EVENTS.USER_LOGGED_OUT]: 'events:AUTH_USER_LOGGED_OUT',
      [AUTH_EVENTS.TOKEN_REFRESHED]: 'events:AUTH_TOKEN_REFRESHED',
      [AUTH_EVENTS.LOGIN_FAILED]: 'events:AUTH_LOGIN_FAILED',
      [AUTH_EVENTS.REGISTRATION_FAILED]: 'events:AUTH_REGISTRATION_FAILED',
      
      // Booking events
      [BOOKING_EVENTS.CREATED]: 'events:BOOKING_CREATED',
      [BOOKING_EVENTS.UPDATED]: 'events:BOOKING_UPDATED',
      [BOOKING_EVENTS.CANCELLED]: 'events:BOOKING_CANCELLED',
      [BOOKING_EVENTS.CONFIRMED]: 'events:BOOKING_CONFIRMED',
      [BOOKING_EVENTS.COMPLETED]: 'events:BOOKING_COMPLETED',
      [BOOKING_EVENTS.STATUS_CHANGED]: 'events:BOOKING_STATUS_CHANGED',
      
      // Professional events
      [PROFESSIONAL_EVENTS.LOCATION_UPDATED]: 'events:PROFESSIONAL_LOCATION_UPDATED',
      [PROFESSIONAL_EVENTS.REGISTERED]: 'events:PROFESSIONAL_REGISTERED',
      [PROFESSIONAL_EVENTS.VERIFIED]: 'events:PROFESSIONAL_VERIFIED',
      
      // System events
      [SYSTEM_EVENTS.ERROR_OCCURRED]: 'events:SYSTEM_ERROR_OCCURRED',
      [SYSTEM_EVENTS.SERVICE_STARTED]: 'events:SYSTEM_SERVICE_STARTED',
      [SYSTEM_EVENTS.SERVICE_STOPPED]: 'events:SYSTEM_SERVICE_STOPPED'
    };
    
    // Consumer group mappings
    this.consumerGroupMappings = {
      'events:AUTH_USER_REGISTERED': 'auth-group',
      'events:AUTH_USER_LOGGED_IN': 'auth-group',
      'events:AUTH_USER_LOGGED_OUT': 'auth-group',
      'events:AUTH_TOKEN_REFRESHED': 'auth-group',
      'events:AUTH_LOGIN_FAILED': 'auth-group',
      'events:AUTH_REGISTRATION_FAILED': 'auth-group',
      
      'events:BOOKING_CREATED': 'booking-group',
      'events:BOOKING_UPDATED': 'booking-group',
      'events:BOOKING_CANCELLED': 'booking-group',
      'events:BOOKING_CONFIRMED': 'booking-group',
      'events:BOOKING_COMPLETED': 'booking-group',
      'events:BOOKING_STATUS_CHANGED': 'booking-group',
      
      'events:PROFESSIONAL_LOCATION_UPDATED': 'geo-group',
      'events:PROFESSIONAL_REGISTERED': 'geo-group',
      'events:PROFESSIONAL_VERIFIED': 'geo-group',
      
      'events:SYSTEM_ERROR_OCCURRED': 'system-group',
      'events:SYSTEM_SERVICE_STARTED': 'system-group',
      'events:SYSTEM_SERVICE_STOPPED': 'system-group'
    };
    
    this.initializeRedisConnection();
  }

  async initializeRedisConnection() {
    try {
      // Check Redis availability
      if (this.redisEnabled && this.redisClient.isAvailable()) {
        this.isRedisAvailable = true;
        console.log('🌊 [DistributedEventBus] Redis available - using distributed mode');
        await this.setupConsumerGroups();
      } else {
        this.isRedisAvailable = false;
        console.log('🌊 [DistributedEventBus] Redis not available - using memory fallback mode');
      }
    } catch (error) {
      console.error('🌊 [DistributedEventBus] Error checking Redis availability:', error.message);
      this.isRedisAvailable = false;
    }
  }

  async setupConsumerGroups() {
    try {
      console.log('🌊 [DistributedEventBus] Setting up consumer groups...');
      
      // Create consumer groups for each stream
      const groups = ['auth-group', 'booking-group', 'geo-group', 'system-group'];
      
      for (const group of groups) {
        try {
          // Find all streams for this group
          const streams = Object.entries(this.consumerGroupMappings)
            .filter(([, groupName]) => groupName === group)
            .map(([streamName]) => streamName);
          
          // Create consumer group for each stream
          for (const streamName of streams) {
            await this.redisClient.createConsumerGroup(streamName, group);
            this.consumerGroups.set(group, streams);
          }
          
          console.log(`🌊 [DistributedEventBus] Consumer group ${group} setup completed`);
        } catch (error) {
          if (!error.message.includes('BUSYGROUP')) {
            console.error(`🌊 [DistributedEventBus] Error setting up group ${group}:`, error.message);
          }
        }
      }
      
      console.log('🌊 [DistributedEventBus] Consumer groups setup completed');
    } catch (error) {
      console.error('🌊 [DistributedEventBus] Error setting up consumer groups:', error.message);
    }
  }

  // Dual emit: Redis Streams + Memory Bus
  async emit(eventName, payload = {}, metadata = {}) {
    const startTime = Date.now();
    this.publishStats.total++;
    
    try {
      // Create structured event payload
      const structuredEvent = {
        id: this.generateEventId(),
        eventName,
        timestamp: new Date().toISOString(),
        service: 'backend',
        data: payload,
        metadata: {
          source: metadata.source || 'api',
          ip: metadata.ip,
          userAgent: metadata.userAgent,
          ...metadata
        }
      };

      // Always emit to memory bus first (zero dependency)
      await this.emitToLocalBus(eventName, structuredEvent, metadata);
      console.log(`🌊 [DistributedEventBus] EMIT_LOCAL: ${eventName} (${Date.now() - startTime}ms)`);

      // Emit to Redis if available and enabled
      if (this.redisEnabled && this.isRedisAvailable) {
        await this.emitToRedis(eventName, structuredEvent, metadata);
        console.log(`🌊 [DistributedEventBus] EMIT_REDIS: ${eventName} (${Date.now() - startTime}ms)`);
      } else {
        console.log(`🌊 [DistributedEventBus] REDIS_DISABLED: ${eventName} - using memory only`);
      }

      this.publishStats.local++;
      if (this.redisEnabled && this.isRedisAvailable) {
        this.publishStats.redis++;
      }

      return {
        emitted: true,
        method: this.redisEnabled && this.isRedisAvailable ? 'distributed' : 'memory',
        eventId: structuredEvent.id,
        duration: Date.now() - startTime
      };

    } catch (error) {
      this.publishStats.failed++;
      console.error(`🌊 [DistributedEventBus] Emit failed for ${eventName}:`, error.message);
      
      // Fallback to memory only
      try {
        await this.emitToLocalBus(eventName, payload, metadata);
        this.publishStats.fallback++;
        console.log(`🌊 [DistributedEventBus] FALLBACK_TO_MEMORY: ${eventName}`);
        
        return {
          emitted: true,
          method: 'fallback',
          eventId: this.generateEventId(),
          duration: Date.now() - startTime
        };
      } catch (fallbackError) {
        console.error(`🌊 [DistributedEventBus] Fallback also failed for ${eventName}:`, fallbackError.message);
        throw fallbackError;
      }
    }
  }

  async emitToLocalBus(eventName, structuredEvent, metadata) {
    try {
      // Emit to memory bus with original payload for compatibility
      await this.memoryBus.emit(eventName, structuredEvent.data, metadata);
    } catch (error) {
      console.error(`🌊 [DistributedEventBus] Memory bus emit failed:`, error.message);
      throw error;
    }
  }

  async emitToRedis(eventName, structuredEvent, metadata) {
    try {
      const streamName = this.streamMappings[eventName];
      
      if (!streamName) {
        throw new Error(`No stream mapping found for event: ${eventName}`);
      }

      // Add to Redis Stream
      const messageId = await this.redisClient.addToStream(streamName, structuredEvent);
      
      return {
        messageId,
        streamName,
        eventName
      };
    } catch (error) {
      console.error(`🌊 [DistributedEventBus] Redis emit failed for ${eventName}:`, error.message);
      
      // Mark Redis as unavailable if the error is connection-related
      if (this.isConnectionError(error)) {
        this.isRedisAvailable = false;
        console.log(`🌊 [DistributedEventBus] Redis marked as unavailable due to connection error`);
      }
      
      throw error;
    }
  }

  // Dual subscribe: Redis Streams + Memory Bus
  async subscribe(eventName, handler, options = {}) {
    const streamName = this.streamMappings[eventName];
    const groupName = this.consumerGroupMappings[streamName];
    const consumerName = options.consumerName || `consumer-${process.pid}`;
    
    try {
      // Always subscribe to memory bus
      const memorySubscription = this.memoryBus.on(eventName, handler, options);
      console.log(`🌊 [DistributedEventBus] SUBSCRIBED_LOCAL: ${eventName}`);
      
      // Subscribe to Redis if available
      let redisSubscription = null;
      if (this.redisEnabled && this.isRedisAvailable && streamName && groupName) {
        redisSubscription = await this.subscribeToRedis(streamName, groupName, consumerName, handler, options);
        console.log(`🌊 [DistributedEventBus] SUBSCRIBED_REDIS: ${eventName} (group: ${groupName})`);
      } else {
        console.log(`🌊 [DistributedEventBus] REDIS_SUBSCRIBE_DISABLED: ${eventName}`);
      }
      
      return {
        eventName,
        memorySubscription,
        redisSubscription,
        mode: this.redisEnabled && this.isRedisAvailable ? 'distributed' : 'memory'
      };
    } catch (error) {
      console.error(`🌊 [DistributedEventBus] Subscribe failed for ${eventName}:`, error.message);
      throw error;
    }
  }

  async subscribeToRedis(streamName, groupName, consumerName, handler, options = {}) {
    try {
      console.log(`🌊 [DistributedEventBus] Setting up Redis subscription for ${streamName}`);
      
      // Create consumer group if it doesn't exist
      await this.redisClient.createConsumerGroup(streamName, groupName);
      
      // Start consuming messages in background
      this.startRedisConsumer(streamName, groupName, consumerName, handler, options);
      
      return {
        streamName,
        groupName,
        consumerName,
        subscribed: true
      };
    } catch (error) {
      console.error(`🌊 [DistributedEventBus] Redis subscription failed for ${streamName}:`, error.message);
      throw error;
    }
  }

  async startRedisConsumer(streamName, groupName, consumerName, handler, options = {}) {
    const { blockTime = 5000, maxRetries = 3 } = options;
    
    const consumeMessages = async () => {
      while (this.redisEnabled && this.isRedisAvailable) {
        try {
          const result = await this.redisClient.readFromGroup(streamName, groupName, consumerName, {
            count: 10,
            block: blockTime
          });
          
          if (result && result.length > 0) {
            const [, messages] = result[0];
            
            // Process each message
            for (const message of messages) {
              await this.processRedisMessage(message, handler, streamName, groupName);
            }
          }
        } catch (error) {
          console.error(`🌊 [DistributedEventBus] Consumer error for ${streamName}:`, error.message);
          
          // Check if it's a connection error
          if (this.isConnectionError(error)) {
            this.isRedisAvailable = false;
            console.log(`🌊 [DistributedEventBus] Consumer stopped - Redis unavailable`);
            break;
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    };
    
    // Start consuming in background
    consumeMessages().catch(error => {
      console.error(`🌊 [DistributedEventBus] Consumer crashed for ${streamName}:`, error);
    });
  }

  async processRedisMessage(message, handler, streamName, groupName) {
    const [messageId, fields] = message;
    
    try {
      // Parse message fields
      const eventData = this.parseMessageFields(fields);
      
      console.log(`🌊 [DistributedEventBus] WORKER_CONSUMED: ${eventData.eventName} (id: ${messageId})`);
      
      // Call handler with original payload and metadata
      await handler(eventData.data, eventData.metadata);
      
      // Acknowledge message
      await this.redisClient.acknowledgeMessage(streamName, groupName, messageId);
      
      console.log(`🌊 [DistributedEventBus] WORKER_ACK: ${eventData.eventName} (id: ${messageId})`);
      
    } catch (error) {
      console.error(`🌊 [DistributedEventBus] WORKER_FAILED: Processing error for ${messageId}:`, error.message);
      
      // Don't acknowledge failed messages - they will be retried
      // In a production system, you might want to implement a dead letter queue
    }
  }

  parseMessageFields(fields) {
    const data = {};
    
    for (let i = 0; i < fields.length; i += 2) {
      const key = fields[i];
      const value = fields[i + 1];
      
      if (key === 'data' || key === 'metadata') {
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
      
      const info = await this.redisClient.getStreamInfo(streamName);
      return {
        status: 'available',
        streamName,
        length: info[1],
        groups: info[3],
        firstId: info[5],
        lastId: info[7],
        lastGeneratedId: info[9]
      };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  // Get all stream statistics
  async getAllStreamStats() {
    const stats = {};
    
    for (const streamName of Object.values(this.streamMappings)) {
      stats[streamName] = await this.getStreamStats(streamName);
    }
    
    return stats;
  }

  // Get publishing statistics
  getPublishStats() {
    return {
      ...this.publishStats,
      redisRate: this.publishStats.total > 0 ? 
        (this.publishStats.redis / this.publishStats.total * 100).toFixed(2) + '%' : '0%',
      memoryRate: this.publishStats.total > 0 ? 
        (this.publishStats.local / this.publishStats.total * 100).toFixed(2) + '%' : '0%',
      fallbackRate: this.publishStats.total > 0 ? 
        (this.publishStats.fallback / this.publishStats.total * 100).toFixed(2) + '%' : '0%'
    };
  }

  // Check Redis availability
  async checkRedisAvailability() {
    try {
      const health = await this.redisClient.healthCheck();
      const wasAvailable = this.isRedisAvailable;
      this.isRedisAvailable = health.status === 'healthy';
      
      // Log availability changes
      if (wasAvailable && !this.isRedisAvailable) {
        console.log('🌊 [DistributedEventBus] Redis became unavailable');
      } else if (!wasAvailable && this.isRedisAvailable) {
        console.log('🌊 [DistributedEventBus] Redis became available');
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
      redisEnabled: this.redisEnabled,
      redisAvailable: this.isRedisAvailable,
      redisInfo: this.redisClient.getConnectionInfo(),
      streamMappings: Object.fromEntries(this.streamMappings),
      consumerGroupMappings: Object.fromEntries(this.consumerGroupMappings),
      consumerGroups: Object.fromEntries(this.consumerGroups),
      publishStats: this.getPublishStats()
    };
  }

  // Reset statistics
  resetStats() {
    this.publishStats = {
      local: 0,
      redis: 0,
      fallback: 0,
      failed: 0,
      total: 0
    };
  }

  // Toggle Redis mode (for testing/migration)
  setRedisEnabled(enabled) {
    this.redisEnabled = enabled;
    console.log(`🌊 [DistributedEventBus] Redis enabled: ${enabled}`);
  }

  // Generate unique event ID
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Check if error is connection-related
  isConnectionError(error) {
    const connectionErrors = [
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNRESET',
      'NOAUTH',
      'UNCERTAIN_STATE'
    ];
    
    return connectionErrors.includes(error.code) || 
           error.message.includes('connection') ||
           error.message.includes('timeout');
  }

  // Graceful shutdown
  async shutdown() {
    console.log('🌊 [DistributedEventBus] Shutting down distributed event bus...');
    
    // Disconnect from Redis
    await this.redisClient.disconnect();
    
    console.log('🌊 [DistributedEventBus] Shutdown completed');
  }
}

// Create singleton instance
const distributedEventBus = new DistributedEventBus();

// Export the distributed event bus and class
module.exports = {
  DistributedEventBus,
  distributedEventBus
};
