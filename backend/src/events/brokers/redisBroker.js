// Redis Broker - Event Broker Implementation
// Implementación del broker Redis Streams con DLQ y retry mechanism

console.log("🔴 Redis Broker - Event Broker Implementation");

const { EventBrokerInterface } = require('./broker.interface');
const { redisClient } = require('../../config/redis.client');

/**
 * Broker Redis Streams con DLQ y circuit breaker
 * Implementa el sistema distribuido real con retry automático
 */
class RedisBroker extends EventBrokerInterface {
  constructor(config = {}) {
    super('redis', config);
    this.redisClient = redisClient;
    this.streamPrefix = config.streamPrefix || 'events';
    this.consumerGroups = new Map();
    this.deadLetterQueue = [];
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.dlqMaxSize = config.dlqMaxSize || 1000;
    
    // Stream mappings
    this.streamMappings = {
      'auth': 'auth.events',
      'booking': 'booking.events', 
      'professional': 'professional.events',
      'system': 'system.events'
    };
    
    // Consumer group mappings
    this.consumerGroupMappings = {
      'auth.events': 'auth-consumers',
      'booking.events': 'booking-consumers',
      'professional.events': 'professional-consumers',
      'system.events': 'system-consumers'
    };
  }

  /**
   * Inicializar el broker Redis
   */
  async initialize() {
    try {
      console.log(`🔴 [RedisBroker] Initializing Redis broker...`);
      
      // Verificar conexión Redis
      if (!this.redisClient.isAvailable()) {
        throw new Error('Redis client is not available');
      }
      
      // Crear consumer groups
      await this.setupConsumerGroups();
      
      this.isInitialized = true;
      this.isConnected = true;
      
      console.log(`🔴 [RedisBroker] Redis broker initialized successfully`);
      return true;
    } catch (error) {
      console.error(`🔴 [RedisBroker] Failed to initialize:`, error.message);
      return false;
    }
  }

  /**
   * Conectar al broker Redis
   */
  async connect() {
    try {
      console.log(`🔴 [RedisBroker] Connecting to Redis broker...`);
      
      // Verificar salud de Redis
      const health = await this.redisClient.healthCheck();
      
      if (health.status !== 'healthy') {
        throw new Error(`Redis health check failed: ${health.error}`);
      }
      
      this.isConnected = true;
      
      console.log(`🔴 [RedisBroker] Connected to Redis broker`);
      console.log(`🔴 [RedisBroker] Redis latency: ${health.latency.ping}`);
      
      return true;
    } catch (error) {
      console.error(`🔴 [RedisBroker] Failed to connect:`, error.message);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Desconectar del broker Redis
   */
  async disconnect() {
    try {
      console.log(`🔴 [RedisBroker] Disconnecting from Redis broker...`);
      
      this.isConnected = false;
      
      console.log(`🔴 [RedisBroker] Disconnected from Redis broker`);
    } catch (error) {
      console.error(`🔴 [RedisBroker] Error during disconnect:`, error.message);
    }
  }

  /**
   * Publicar un evento en Redis Streams
   */
  async publish(eventName, payload, metadata = {}) {
    const startTime = Date.now();
    this.stats.total++;
    
    try {
      // Validar inputs
      if (!this.validateEventName(eventName)) {
        throw new Error(`Invalid event name: ${eventName}`);
      }
      
      if (!this.validatePayload(payload)) {
        throw new Error(`Invalid payload for event: ${eventName}`);
      }
      
      // Crear evento estructurado
      const structuredEvent = this.createStructuredEvent(eventName, payload, metadata);
      
      // Determinar stream name
      const streamName = this.getStreamName(eventName);
      
      // Publicar con retry y circuit breaker
      const result = await this.withCircuitBreaker(async () => {
        return await this.retryWithBackoff(async () => {
          return await this.publishToStream(streamName, structuredEvent);
        }, this.maxRetries, this.retryDelay);
      });
      
      this.stats.published++;
      const duration = Date.now() - startTime;
      
      this.logPublish(eventName, { success: true, eventId: structuredEvent.id, streamName }, duration);
      
      return {
        success: true,
        eventId: structuredEvent.id,
        messageId: result.messageId,
        streamName,
        broker: this.name,
        duration,
        timestamp: structuredEvent.timestamp
      };
      
    } catch (error) {
      this.stats.failed++;
      const duration = Date.now() - startTime;
      
      this.logError(eventName, error);
      
      // Agregar a DLQ
      await this.addToDeadLetterQueue(eventName, payload, metadata, error);
      
      return {
        success: false,
        error: error.message,
        broker: this.name,
        duration,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Publicar a un stream específico
   */
  async publishToStream(streamName, structuredEvent) {
    try {
      // Aplanar objeto para Redis Streams
      const flattenedData = this.flattenObject(structuredEvent);
      
      // Agregar al stream
      const messageId = await this.redisClient.addToStream(streamName, flattenedData);
      
      console.log(`🔴 [RedisBroker] Published to stream ${streamName} with message ID: ${messageId}`);
      
      return { messageId, streamName };
    } catch (error) {
      console.error(`🔴 [RedisBroker] Failed to publish to stream ${streamName}:`, error.message);
      throw error;
    }
  }

  /**
   * Suscribir a eventos en Redis Streams
   */
  async subscribe(eventName, handler, options = {}) {
    try {
      // Validar inputs
      if (!this.validateEventName(eventName)) {
        throw new Error(`Invalid event name: ${eventName}`);
      }
      
      if (typeof handler !== 'function') {
        throw new Error(`Handler must be a function for event: ${eventName}`);
      }
      
      // Determinar stream y consumer group
      const streamName = this.getStreamName(eventName);
      const groupName = this.consumerGroupMappings[streamName] || 'default-consumers';
      const consumerName = options.consumerName || `consumer-${process.pid}`;
      
      // Crear consumer group si no existe
      await this.redisClient.createConsumerGroup(streamName, groupName);
      
      // Iniciar consumer en background
      this.startStreamConsumer(streamName, groupName, consumerName, handler, options);
      
      // Guardar referencia
      this.consumerGroups.set(`${streamName}:${groupName}`, {
        streamName,
        groupName,
        consumerName,
        handler,
        options
      });
      
      console.log(`🔴 [RedisBroker] Subscribed to stream: ${streamName} (group: ${groupName})`);
      
      return {
        success: true,
        eventName,
        streamName,
        groupName,
        consumerName,
        broker: this.name,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`🔴 [RedisBroker] Failed to subscribe to ${eventName}:`, error.message);
      
      return {
        success: false,
        error: error.message,
        eventName,
        broker: this.name,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Iniciar consumer de stream
   */
  async startStreamConsumer(streamName, groupName, consumerName, handler, options = {}) {
    const { blockTime = 5000, maxRetries = 3 } = options;
    
    const consumeMessages = async () => {
      while (this.isConnected) {
        try {
          const result = await this.redisClient.readFromGroup(streamName, groupName, consumerName, {
            count: 10,
            block: blockTime
          });
          
          if (result && result.length > 0) {
            const [, messages] = result[0];
            
            // Procesar cada mensaje
            for (const message of messages) {
              await this.processStreamMessage(message, handler, streamName, groupName);
            }
          }
        } catch (error) {
          console.error(`🔴 [RedisBroker] Consumer error for ${streamName}:`, error.message);
          
          // Esperar antes de reintentar
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    };
    
    // Iniciar consumo en background
    consumeMessages().catch(error => {
      console.error(`🔴 [RedisBroker] Consumer crashed for ${streamName}:`, error);
    });
  }

  /**
   * Procesar mensaje de stream
   */
  async processStreamMessage(message, handler, streamName, groupName) {
    const [messageId, fields] = message;
    
    try {
      // Parsear campos del mensaje
      const eventData = this.parseMessageFields(fields);
      
      console.log(`🔴 [RedisBroker] EVENT_DELIVERED target=redis-stream event=${eventData.eventName} id=${messageId}`);
      
      // Llamar handler con payload y metadata
      await handler(eventData.payload, eventData.metadata);
      
      // Acknowledge mensaje
      await this.redisClient.acknowledgeMessage(streamName, groupName, messageId);
      
      console.log(`🔴 [RedisBroker] EVENT_ACK event=${eventData.eventName} id=${messageId}`);
      
    } catch (error) {
      console.error(`🔴 [RedisBroker] EVENT_FAILED event processing error id=${messageId}:`, error.message);
      
      // No acknowledge - el mensaje será reintentado
      // Si falla demasiadas veces, eventualmente irá a DLQ
    }
  }

  /**
   * Parsear campos de mensaje de Redis Stream
   */
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

  /**
   * Aplanar objeto para Redis Streams
   */
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

  /**
   * Obtener nombre del stream para un evento
   */
  getStreamName(eventName) {
    // Extraer dominio del evento (ej: AUTH_USER_REGISTERED -> auth)
    const domain = eventName.split('_')[0].toLowerCase();
    
    return this.streamMappings[domain] || `${this.streamPrefix}.default`;
  }

  /**
   * Setup de consumer groups
   */
  async setupConsumerGroups() {
    try {
      console.log(`🔴 [RedisBroker] Setting up consumer groups...`);
      
      for (const [streamName, groupName] of Object.entries(this.consumerGroupMappings)) {
        await this.redisClient.createConsumerGroup(streamName, groupName);
        console.log(`🔴 [RedisBroker] Consumer group ${groupName} created for stream ${streamName}`);
      }
      
      console.log(`🔴 [RedisBroker] Consumer groups setup completed`);
    } catch (error) {
      console.error(`🔴 [RedisBroker] Error setting up consumer groups:`, error.message);
    }
  }

  /**
   * Agregar evento a Dead Letter Queue
   */
  async addToDeadLetterQueue(eventName, payload, metadata, error) {
    try {
      const dlqEntry = {
        id: this.generateEventId(),
        eventName,
        payload,
        metadata,
        error: error.message,
        timestamp: new Date().toISOString(),
        broker: this.name,
        retryCount: 0
      };
      
      this.deadLetterQueue.push(dlqEntry);
      
      // Limitar tamaño de DLQ
      if (this.deadLetterQueue.length > this.dlqMaxSize) {
        this.deadLetterQueue.shift(); // Remover el más antiguo
      }
      
      console.warn(`🔴 [RedisBroker] DLQ event stored for ${eventName}: ${error.message}`);
      
      // Opcional: guardar a archivo para persistencia
      if (this.config.persistDLQ) {
        await this.persistDLQToFile(dlqEntry);
      }
      
    } catch (dlqError) {
      console.error(`🔴 [RedisBroker] Failed to add to DLQ:`, dlqError.message);
    }
  }

  /**
   * Persistir DLQ a archivo
   */
  async persistDLQToFile(dlqEntry) {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const dlqFile = path.join(process.cwd(), 'logs', 'failed-events.log');
      const logEntry = `${new Date().toISOString()} [DLQ] ${JSON.stringify(dlqEntry)}\n`;
      
      await fs.appendFile(dlqFile, logEntry);
    } catch (error) {
      console.error(`🔴 [RedisBroker] Failed to persist DLQ to file:`, error.message);
    }
  }

  /**
   * Verificar salud del broker Redis
   */
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return {
          status: 'unhealthy',
          broker: this.name,
          error: 'Not connected to Redis',
          timestamp: new Date().toISOString()
        };
      }
      
      // Verificar salud de Redis
      const redisHealth = await this.redisClient.healthCheck();
      
      if (redisHealth.status !== 'healthy') {
        return {
          status: 'unhealthy',
          broker: this.name,
          error: redisHealth.error,
          timestamp: new Date().toISOString()
        };
      }
      
      // Obtener estadísticas de streams
      const streamStats = await this.getStreamStats();
      
      return {
        status: 'healthy',
        broker: this.name,
        connected: this.isConnected,
        initialized: this.isInitialized,
        redis: redisHealth,
        streams: streamStats,
        dlq: {
          size: this.deadLetterQueue.length,
          maxSize: this.dlqMaxSize
        },
        circuitBreaker: this.getCircuitBreakerStatus(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        broker: this.name,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Obtener estadísticas de streams
   */
  async getStreamStats() {
    const stats = {};
    
    for (const streamName of Object.values(this.streamMappings)) {
      try {
        const info = await this.redisClient.getStreamInfo(streamName);
        stats[streamName] = {
          length: info[1],
          groups: info[3],
          firstId: info[5],
          lastId: info[7]
        };
      } catch (error) {
        stats[streamName] = { error: error.message };
      }
    }
    
    return stats;
  }

  /**
   * Obtener información detallada del broker
   */
  getInfo() {
    return {
      name: this.name,
      type: 'redis-streams',
      initialized: this.isInitialized,
      connected: this.isConnected,
      stats: this.getStats(),
      streams: Object.fromEntries(Object.entries(this.streamMappings)),
      consumerGroups: Object.fromEntries(Object.entries(this.consumerGroupMappings)),
      dlq: {
        size: this.deadLetterQueue.length,
        maxSize: this.dlqMaxSize
      },
      circuitBreaker: this.getCircuitBreakerStatus(),
      config: this.config,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Obtener eventos en Dead Letter Queue
   */
  getDeadLetterQueue() {
    return [...this.deadLetterQueue];
  }

  /**
   * Procesar eventos en Dead Letter Queue
   */
  async processDeadLetterQueue() {
    const processed = [];
    const failed = [];
    
    for (const entry of this.deadLetterQueue) {
      try {
        // Reintentar publicación
        const result = await this.publish(entry.eventName, entry.payload, entry.metadata);
        
        if (result.success) {
          processed.push(entry);
          console.log(`🔴 [RedisBroker] DLQ event processed: ${entry.eventName}`);
        } else {
          failed.push(entry);
          console.error(`🔴 [RedisBroker] DLQ event failed: ${entry.eventName}`);
        }
      } catch (error) {
        failed.push(entry);
        console.error(`🔴 [RedisBroker] DLQ processing error:`, error.message);
      }
    }
    
    // Limpiar DLQ de eventos procesados
    this.deadLetterQueue = this.deadLetterQueue.filter(entry => !processed.includes(entry));
    
    return { processed, failed };
  }

  /**
   * Limpiar Dead Letter Queue
   */
  clearDeadLetterQueue() {
    const cleared = this.deadLetterQueue.length;
    this.deadLetterQueue = [];
    console.log(`🔴 [RedisBroker] DLQ cleared: ${cleared} events removed`);
    return cleared;
  }
}

module.exports = {
  RedisBroker
};
