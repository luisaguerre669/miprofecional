// Redis Configuration - Distributed Event Streams Layer
// Conexión a Redis con reconexión automática y logging

console.log("🔴 Redis Configuration - Distributed Event Streams Layer");

const Redis = require('ioredis');

class RedisConfig {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000; // 1 second
    this.connectionTimeout = 5000; // 5 seconds
    this.commandTimeout = 100; // 100ms for event operations
    
    // Redis connection options
    this.redisOptions = {
      // Connection
      connectTimeout: this.connectionTimeout,
      commandTimeout: this.commandTimeout,
      lazyConnect: true,
      
      // Retry and reconnection
      maxRetriesPerRequest: 1,
      retryDelayOnFailover: 100,
      enableOfflineQueue: false,
      
      // Performance
      enableReadyCheck: true,
      maxLoadingTimeout: 5000,
      
      // Logging
      showFriendlyErrorStack: process.env.NODE_ENV === 'development'
    };
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // This will be attached to the Redis client when created
    this.eventHandlers = {
      connect: () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('🔴 [Redis] Connected successfully');
        console.log(`🔴 [Redis] Redis version: ${this.client.serverInfo?.redis_version || 'unknown'}`);
      },
      
      ready: () => {
        console.log('🔴 [Redis] Ready for commands');
      },
      
      error: (error) => {
        console.error('🔴 [Redis] Connection error:', error.message);
        this.isConnected = false;
        
        // Log specific error types
        if (error.code === 'ECONNREFUSED') {
          console.error('🔴 [Redis] Connection refused - Redis server not running');
        } else if (error.code === 'ENOTFOUND') {
          console.error('🔴 [Redis] Host not found - check REDIS_URL');
        } else if (error.code === 'ETIMEDOUT') {
          console.error('🔴 [Redis] Connection timeout');
        }
      },
      
      close: () => {
        console.log('🔴 [Redis] Connection closed');
        this.isConnected = false;
      },
      
      reconnecting: () => {
        this.reconnectAttempts++;
        console.log(`🔴 [Redis] Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('🔴 [Redis] Max reconnection attempts reached - giving up');
        }
      },
      
      end: () => {
        console.log('🔴 [Redis] Connection ended');
        this.isConnected = false;
      }
    };
  }

  async connect() {
    try {
      const redisUrl = process.env.REDIS_URL;
      
      if (!redisUrl) {
        console.warn('🔴 [Redis] REDIS_URL not configured - Redis disabled');
        return false;
      }

      console.log(`🔴 [Redis] Connecting to: ${redisUrl.replace(/\/\/.*@/, '//***:***@')}`);
      
      // Create Redis client
      this.client = new Redis(redisUrl, this.redisOptions);
      
      // Attach event handlers
      Object.entries(this.eventHandlers).forEach(([event, handler]) => {
        this.client.on(event, handler);
      });
      
      // Test connection
      await this.client.connect();
      
      // Test basic command
      const pong = await this.client.ping();
      console.log(`🔴 [Redis] Ping response: ${pong}`);
      
      return true;
      
    } catch (error) {
      console.error('🔴 [Redis] Failed to connect:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.quit();
        this.client = null;
        this.isConnected = false;
        console.log('🔴 [Redis] Disconnected gracefully');
      }
    } catch (error) {
      console.error('🔴 [Redis] Error during disconnect:', error.message);
    }
  }

  getClient() {
    return this.client;
  }

  isReady() {
    return this.isConnected && this.client && this.client.status === 'ready';
  }

  getConnectionInfo() {
    return {
      connected: this.isConnected,
      status: this.client?.status || 'disconnected',
      reconnectAttempts: this.reconnectAttempts,
      serverInfo: this.client?.serverInfo || {},
      config: {
        connectionTimeout: this.connectionTimeout,
        commandTimeout: this.commandTimeout,
        maxRetriesPerRequest: this.redisOptions.maxRetriesPerRequest
      }
    };
  }

  // Health check for Redis
  async healthCheck() {
    try {
      if (!this.isReady()) {
        return {
          status: 'unhealthy',
          error: 'Redis not ready',
          timestamp: new Date().toISOString()
        };
      }

      const startTime = Date.now();
      await this.client.ping();
      const latency = Date.now() - startTime;
      
      return {
        status: 'healthy',
        latency: `${latency}ms`,
        timestamp: new Date().toISOString(),
        info: this.getConnectionInfo()
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Execute command with timeout and retry
  async executeCommand(command, ...args) {
    if (!this.isReady()) {
      throw new Error('Redis not ready for commands');
    }

    try {
      const result = await this.client[command](...args);
      return result;
    } catch (error) {
      console.error(`🔴 [Redis] Command ${command} failed:`, error.message);
      throw error;
    }
  }

  // Redis Streams operations
  async addToStream(streamName, data) {
    try {
      const result = await this.executeCommand('xadd', streamName, '*', ...this.flattenObject(data));
      return result;
    } catch (error) {
      console.error(`🔴 [Redis] Failed to add to stream ${streamName}:`, error.message);
      throw error;
    }
  }

  async readFromStream(streamName, options = {}) {
    try {
      const { count = 1, block = null } = options;
      const args = ['COUNT', count];
      
      if (block !== null) {
        args.push('BLOCK', block);
      }
      
      args.push('STREAMS', streamName, '$');
      
      const result = await this.executeCommand('xread', ...args);
      return result;
    } catch (error) {
      console.error(`🔴 [Redis] Failed to read from stream ${streamName}:`, error.message);
      throw error;
    }
  }

  async createConsumerGroup(streamName, groupName) {
    try {
      await this.executeCommand('xgroup', 'CREATE', streamName, groupName, '0', 'MKSTREAM');
      console.log(`🔴 [Redis] Consumer group ${groupName} created for stream ${streamName}`);
    } catch (error) {
      if (error.message.includes('BUSYGROUP')) {
        console.log(`🔴 [Redis] Consumer group ${groupName} already exists for stream ${streamName}`);
      } else {
        throw error;
      }
    }
  }

  async readFromGroup(streamName, groupName, consumerName, options = {}) {
    try {
      const { count = 1, block = 1000 } = options;
      const args = ['GROUP', groupName, consumerName, 'COUNT', count, 'BLOCK', block, 'STREAMS', streamName, '>'];
      
      const result = await this.executeCommand('xreadgroup', ...args);
      return result;
    } catch (error) {
      console.error(`🔴 [Redis] Failed to read from group ${groupName}:`, error.message);
      throw error;
    }
  }

  async acknowledgeMessage(streamName, groupName, messageId) {
    try {
      await this.executeCommand('xack', streamName, groupName, messageId);
      return true;
    } catch (error) {
      console.error(`🔴 [Redis] Failed to acknowledge message:`, error.message);
      throw error;
    }
  }

  // Helper to flatten object for Redis Streams
  flattenObject(obj, prefix = '') {
    const flattened = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        flattened.push(...this.flattenObject(value, newKey));
      } else {
        flattened.push(newKey, String(value));
      }
    }
    
    return flattened;
  }

  // Get stream info
  async getStreamInfo(streamName) {
    try {
      const info = await this.executeCommand('xinfo', 'stream', streamName);
      return info;
    } catch (error) {
      console.error(`🔴 [Redis] Failed to get stream info for ${streamName}:`, error.message);
      throw error;
    }
  }

  // Get consumer group info
  async getGroupInfo(streamName, groupName) {
    try {
      const info = await this.executeCommand('xinfo', 'groups', streamName);
      const groupInfo = info.find(group => group[1] === groupName);
      return groupInfo;
    } catch (error) {
      console.error(`🔴 [Redis] Failed to get group info for ${groupName}:`, error.message);
      throw error;
    }
  }
}

// Create singleton instance
const redisConfig = new RedisConfig();

// Auto-connect if REDIS_URL is configured
if (process.env.REDIS_URL && process.env.REDIS_ENABLED !== 'false') {
  redisConfig.connect().catch(error => {
    console.error('🔴 [Redis] Auto-connect failed:', error.message);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔴 [Redis] SIGINT received, shutting down...');
  await redisConfig.disconnect();
});

process.on('SIGTERM', async () => {
  console.log('🔴 [Redis] SIGTERM received, shutting down...');
  await redisConfig.disconnect();
});

module.exports = {
  RedisConfig,
  redisConfig
};
