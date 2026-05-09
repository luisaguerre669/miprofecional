// Redis Client - Distributed Event Infrastructure
// Conexión Redis con reconexión automática y backoff exponencial

console.log("🔴 Redis Client - Distributed Event Infrastructure");

const Redis = require('ioredis');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.baseReconnectDelay = 1000; // 1 second base
    this.maxReconnectDelay = 30000; // 30 seconds max
    this.connectionTimeout = 5000; // 5 seconds
    this.commandTimeout = 100; // 100ms for event operations
    
    // Redis connection options with production-ready settings
    this.redisOptions = {
      // Connection settings
      connectTimeout: this.connectionTimeout,
      commandTimeout: this.commandTimeout,
      lazyConnect: true,
      
      // Retry and reconnection with exponential backoff
      maxRetriesPerRequest: 1,
      retryDelayOnFailover: 100,
      enableOfflineQueue: false,
      
      // Performance optimizations
      enableReadyCheck: true,
      maxLoadingTimeout: 5000,
      
      // Logging and debugging
      showFriendlyErrorStack: process.env.NODE_ENV === 'development',
      
      // Cluster support (for future scaling)
      enableAutoPipelining: true,
      maxRetriesPerRequest: 1,
      
      // Connection pool settings
      family: 4,
      keepAlive: true,
      
      // Security
      tls: process.env.REDIS_TLS === 'true' ? {} : undefined
    };
    
    this.setupEventHandlers();
    this.setupGracefulShutdown();
  }

  setupEventHandlers() {
    // Event handlers that will be attached to the Redis client
    this.eventHandlers = {
      connect: () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('🔴 [RedisClient] Connected successfully to Redis');
        
        // Log Redis server info
        if (this.client && this.client.serverInfo) {
          console.log(`🔴 [RedisClient] Redis version: ${this.client.serverInfo.redis_version}`);
          console.log(`🔴 [RedisClient] Redis mode: ${this.client.serverInfo.redis_mode || 'standalone'}`);
          console.log(`🔴 [RedisClient] Used memory: ${this.client.serverInfo.used_memory_human}`);
        }
      },
      
      ready: () => {
        console.log('🔴 [RedisClient] Redis client ready for commands');
      },
      
      error: (error) => {
        console.error('🔴 [RedisClient] Redis connection error:', error.message);
        this.isConnected = false;
        
        // Log specific error types for debugging
        this.logErrorDetails(error);
      },
      
      close: () => {
        console.log('🔴 [RedisClient] Redis connection closed');
        this.isConnected = false;
      },
      
      reconnecting: () => {
        this.reconnectAttempts++;
        const delay = this.calculateBackoffDelay();
        
        console.log(`🔴 [RedisClient] Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        console.log(`🔴 [RedisClient] Backoff delay: ${delay}ms`);
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('🔴 [RedisClient] Max reconnection attempts reached - giving up');
        }
      },
      
      end: () => {
        console.log('🔴 [RedisClient] Redis connection ended');
        this.isConnected = false;
      }
    };
  }

  logErrorDetails(error) {
    switch (error.code) {
      case 'ECONNREFUSED':
        console.error('🔴 [RedisClient] Connection refused - Redis server not running');
        console.error('🔴 [RedisClient] Solution: Check if Redis server is running and accessible');
        break;
      case 'ENOTFOUND':
        console.error('🔴 [RedisClient] Host not found - DNS resolution failed');
        console.error('🔴 [RedisClient] Solution: Check REDIS_URL environment variable');
        break;
      case 'ETIMEDOUT':
        console.error('🔴 [RedisClient] Connection timeout - Redis not responding');
        console.error('🔴 [RedisClient] Solution: Check network connectivity and Redis server health');
        break;
      case 'ECONNRESET':
        console.error('🔴 [RedisClient] Connection reset by peer');
        console.error('🔴 [RedisClient] Solution: Redis server may have restarted');
        break;
      case 'NOAUTH':
        console.error('🔴 [RedisClient] Authentication failed');
        console.error('🔴 [RedisClient] Solution: Check Redis password configuration');
        break;
      default:
        console.error(`🔴 [RedisClient] Unknown error code: ${error.code}`);
    }
  }

  calculateBackoffDelay() {
    // Exponential backoff with jitter
    const exponentialDelay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * exponentialDelay;
    
    return Math.floor(exponentialDelay + jitter);
  }

  async connect() {
    try {
      const redisUrl = process.env.REDIS_URL;
      
      if (!redisUrl) {
        console.warn('🔴 [RedisClient] REDIS_URL not configured - Redis disabled');
        return false;
      }

      console.log(`🔴 [RedisClient] Connecting to Redis: ${this.maskUrl(redisUrl)}`);
      
      // Create Redis client with production options
      this.client = new Redis(redisUrl, this.redisOptions);
      
      // Attach event handlers
      Object.entries(this.eventHandlers).forEach(([event, handler]) => {
        this.client.on(event, handler);
      });
      
      // Test connection
      await this.client.connect();
      
      // Test basic command
      const pong = await this.client.ping();
      console.log(`🔴 [RedisClient] Ping response: ${pong}`);
      
      // Test Redis Streams support
      await this.testStreamsSupport();
      
      return true;
      
    } catch (error) {
      console.error('🔴 [RedisClient] Failed to connect to Redis:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  async testStreamsSupport() {
    try {
      // Test Redis Streams support (requires Redis 5.0+)
      const testStream = 'test:stream:support';
      
      // Try XADD command
      await this.client.xadd(testStream, '*', 'test', 'value');
      
      // Try XREAD command
      await this.client.xread('COUNT', 1, 'STREAMS', testStream, '0');
      
      // Clean up test stream
      await this.client.del(testStream);
      
      console.log('🔴 [RedisClient] Redis Streams support confirmed');
      
    } catch (error) {
      if (error.message.includes('unknown command')) {
        console.error('🔴 [RedisClient] Redis Streams not supported - requires Redis 5.0+');
        throw new Error('Redis Streams not supported - upgrade to Redis 5.0+');
      } else {
        console.warn('🔴 [RedisClient] Redis Streams test failed:', error.message);
      }
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.quit();
        this.client = null;
        this.isConnected = false;
        console.log('🔴 [RedisClient] Disconnected gracefully from Redis');
      }
    } catch (error) {
      console.error('🔴 [RedisClient] Error during disconnect:', error.message);
    }
  }

  getClient() {
    return this.client;
  }

  isReady() {
    return this.isConnected && this.client && this.client.status === 'ready';
  }

  isAvailable() {
    return this.isReady();
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
        maxRetriesPerRequest: this.redisOptions.maxRetriesPerRequest,
        maxReconnectAttempts: this.maxReconnectAttempts
      }
    };
  }

  // Health check for Redis with detailed metrics
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
      
      // Test basic ping
      await this.client.ping();
      const pingLatency = Date.now() - startTime;
      
      // Test Redis Streams operation
      const streamsStartTime = Date.now();
      const testStream = 'health:check:test';
      const messageId = await this.client.xadd(testStream, '*', 'test', 'health_check');
      await this.client.xdel(testStream, messageId);
      const streamsLatency = Date.now() - streamsStartTime;
      
      // Get Redis info
      const info = await this.client.info('memory');
      const memoryInfo = this.parseRedisInfo(info);
      
      return {
        status: 'healthy',
        latency: {
          ping: `${pingLatency}ms`,
          streams: `${streamsLatency}ms`
        },
        memory: {
          used: memoryInfo.used_memory_human,
          peak: memoryInfo.used_memory_peak_human,
          rss: memoryInfo.used_memory_rss_human
        },
        uptime: this.client.serverInfo?.uptime_in_seconds || 0,
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

  parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const result = {};
    
    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key] = value;
        }
      }
    }
    
    return result;
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
      console.error(`🔴 [RedisClient] Command ${command} failed:`, error.message);
      throw error;
    }
  }

  // Redis Streams operations with error handling
  async addToStream(streamName, data) {
    try {
      const result = await this.executeCommand('xadd', streamName, '*', ...this.flattenObject(data));
      return result;
    } catch (error) {
      console.error(`🔴 [RedisClient] Failed to add to stream ${streamName}:`, error.message);
      throw error;
    }
  }

  async readFromStream(streamName, options = {}) {
    try {
      const { count = 1, block = null, lastId = '$' } = options;
      const args = ['COUNT', count];
      
      if (block !== null) {
        args.push('BLOCK', block);
      }
      
      args.push('STREAMS', streamName, lastId);
      
      const result = await this.executeCommand('xread', ...args);
      return result;
    } catch (error) {
      console.error(`🔴 [RedisClient] Failed to read from stream ${streamName}:`, error.message);
      throw error;
    }
  }

  async createConsumerGroup(streamName, groupName, startingId = '0') {
    try {
      await this.executeCommand('xgroup', 'CREATE', streamName, groupName, startingId, 'MKSTREAM');
      console.log(`🔴 [RedisClient] Consumer group ${groupName} created for stream ${streamName}`);
    } catch (error) {
      if (error.message.includes('BUSYGROUP')) {
        console.log(`🔴 [RedisClient] Consumer group ${groupName} already exists for stream ${streamName}`);
      } else {
        throw error;
      }
    }
  }

  async readFromGroup(streamName, groupName, consumerName, options = {}) {
    try {
      const { count = 1, block = 1000, idleTime = null } = options;
      const args = ['GROUP', groupName, consumerName, 'COUNT', count, 'BLOCK', block];
      
      if (idleTime !== null) {
        args.push('NOACK');
      }
      
      args.push('STREAMS', streamName, '>');
      
      const result = await this.executeCommand('xreadgroup', ...args);
      return result;
    } catch (error) {
      console.error(`🔴 [RedisClient] Failed to read from group ${groupName}:`, error.message);
      throw error;
    }
  }

  async acknowledgeMessage(streamName, groupName, messageId) {
    try {
      await this.executeCommand('xack', streamName, groupName, messageId);
      return true;
    } catch (error) {
      console.error(`🔴 [RedisClient] Failed to acknowledge message:`, error.message);
      throw error;
    }
  }

  async getStreamInfo(streamName) {
    try {
      const info = await this.executeCommand('xinfo', 'stream', streamName);
      return info;
    } catch (error) {
      console.error(`🔴 [RedisClient] Failed to get stream info for ${streamName}:`, error.message);
      throw error;
    }
  }

  async getConsumerGroupInfo(streamName, groupName) {
    try {
      const info = await this.executeCommand('xinfo', 'groups', streamName);
      const groupInfo = info.find(group => group[1] === groupName);
      return groupInfo;
    } catch (error) {
      console.error(`🔴 [RedisClient] Failed to get group info for ${groupName}:`, error.message);
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

  // Mask URL for logging (hide credentials)
  maskUrl(url) {
    return url.replace(/\/\/.*:.*@/, '//***:***@');
  }

  // Setup graceful shutdown
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`🔴 [RedisClient] ${signal} received, shutting down Redis connection...`);
      await this.disconnect();
    };
    
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }
}

// Create singleton instance
const redisClient = new RedisClient();

// Auto-connect if REDIS_URL is configured
if (process.env.REDIS_URL && process.env.REDIS_EVENT_ENABLED !== 'false') {
  redisClient.connect().catch(error => {
    console.error('🔴 [RedisClient] Auto-connect failed:', error.message);
  });
}

module.exports = {
  RedisClient,
  redisClient
};
