// Event Dispatcher - Unified Event Dispatching System
// Orquesta la publicación de eventos a múltiples brokers con fallback automático

console.log("🚀 Event Dispatcher - Unified Event Dispatching System");

const { InMemoryBroker } = require('./brokers/inMemoryBroker');
const { RedisBroker } = require('./brokers/redisBroker');
const { KafkaBroker } = require('./brokers/kafkaBroker');

/**
 * Event Dispatcher unificado que gestiona múltiples brokers
 * Implementa HYBRID MODE con fallback automático
 */
class EventDispatcher {
  constructor(config = {}) {
    this.config = config;
    this.brokerType = config.brokerType || process.env.EVENT_BROKER_TYPE || 'memory';
    this.brokers = new Map();
    this.primaryBroker = null;
    this.fallbackBroker = null;
    this.isInitialized = false;
    
    // Estadísticas del dispatcher
    this.stats = {
      totalDispatched: 0,
      successful: 0,
      failed: 0,
      fallbackUsed: 0,
      brokerStats: {}
    };
    
    // Configuración de brokers
    this.brokerConfigs = {
      memory: {
        // In-memory broker no necesita configuración especial
      },
      redis: {
        streamPrefix: 'events',
        maxRetries: 3,
        retryDelay: 1000,
        dlqMaxSize: 1000,
        persistDLQ: true,
        ...config.redis
      },
      kafka: {
        partitions: 3,
        replicationFactor: 1,
        ...config.kafka
      }
    };
    
    this.setupBrokers();
  }

  /**
   * Configurar brokers según el tipo seleccionado
   */
  setupBrokers() {
    try {
      console.log(`🚀 [EventDispatcher] Setting up brokers with type: ${this.brokerType}`);
      
      // Siempre crear broker en memoria como fallback
      const memoryBroker = new InMemoryBroker(this.brokerConfigs.memory);
      this.brokers.set('memory', memoryBroker);
      
      // Crear broker primario según configuración
      switch (this.brokerType) {
        case 'redis':
          const redisBroker = new RedisBroker(this.brokerConfigs.redis);
          this.brokers.set('redis', redisBroker);
          this.primaryBroker = redisBroker;
          this.fallbackBroker = memoryBroker;
          break;
          
        case 'kafka':
          const kafkaBroker = new KafkaBroker(this.brokerConfigs.kafka);
          this.brokers.set('kafka', kafkaBroker);
          this.primaryBroker = kafkaBroker;
          this.fallbackBroker = memoryBroker;
          break;
          
        case 'memory':
        default:
          this.primaryBroker = memoryBroker;
          this.fallbackBroker = null; // No hay fallback si solo memory
          break;
      }
      
      console.log(`🚀 [EventDispatcher] Primary broker: ${this.primaryBroker.name}`);
      console.log(`🚀 [EventDispatcher] Fallback broker: ${this.fallbackBroker?.name || 'none'}`);
      
    } catch (error) {
      console.error(`🚀 [EventDispatcher] Error setting up brokers:`, error.message);
      throw error;
    }
  }

  /**
   * Inicializar el dispatcher y todos los brokers
   */
  async initialize() {
    try {
      console.log(`🚀 [EventDispatcher] Initializing event dispatcher...`);
      
      // Inicializar broker primario
      await this.primaryBroker.initialize();
      
      // Inicializar broker de fallback si existe
      if (this.fallbackBroker && this.fallbackBroker !== this.primaryBroker) {
        await this.fallbackBroker.initialize();
      }
      
      // Inicializar otros brokers (para switching dinámico)
      for (const [name, broker] of this.brokers) {
        if (broker !== this.primaryBroker && broker !== this.fallbackBroker) {
          try {
            await broker.initialize();
          } catch (error) {
            console.warn(`🚀 [EventDispatcher] Failed to initialize broker ${name}:`, error.message);
          }
        }
      }
      
      this.isInitialized = true;
      
      console.log(`🚀 [EventDispatcher] Event dispatcher initialized successfully`);
      console.log(`🚀 [EventDispatcher] Active brokers: ${Array.from(this.brokers.keys()).join(', ')}`);
      
      return true;
    } catch (error) {
      console.error(`🚀 [EventDispatcher] Failed to initialize:`, error.message);
      return false;
    }
  }

  /**
   * Conectar todos los brokers
   */
  async connect() {
    try {
      console.log(`🚀 [EventDispatcher] Connecting brokers...`);
      
      // Conectar broker primario
      const primaryConnected = await this.primaryBroker.connect();
      
      // Conectar broker de fallback si existe
      let fallbackConnected = true;
      if (this.fallbackBroker && this.fallbackBroker !== this.primaryBroker) {
        fallbackConnected = await this.fallbackBroker.connect();
      }
      
      console.log(`🚀 [EventDispatcher] Primary broker connected: ${primaryConnected}`);
      console.log(`🚀 [EventDispatcher] Fallback broker connected: ${fallbackConnected}`);
      
      return primaryConnected || fallbackConnected;
    } catch (error) {
      console.error(`🚀 [EventDispatcher] Failed to connect:`, error.message);
      return false;
    }
  }

  /**
   * Desconectar todos los brokers
   */
  async disconnect() {
    try {
      console.log(`🚀 [EventDispatcher] Disconnecting brokers...`);
      
      // Desconectar todos los brokers
      for (const [name, broker] of this.brokers) {
        try {
          await broker.disconnect();
        } catch (error) {
          console.error(`🚀 [EventDispatcher] Error disconnecting broker ${name}:`, error.message);
        }
      }
      
      console.log(`🚀 [EventDispatcher] All brokers disconnected`);
    } catch (error) {
      console.error(`🚀 [EventDispatcher] Error during disconnect:`, error.message);
    }
  }

  /**
   * Publicar evento con estrategia HYBRID MODE
   * LOCAL ALWAYS FIRST + DISTRIBUTED SECONDARY LAYER
   */
  async emit(eventName, payload, metadata = {}) {
    const startTime = Date.now();
    this.stats.totalDispatched++;
    
    try {
      console.log(`🚀 [EventDispatcher] Dispatching event: ${eventName}`);
      
      // Estrategia HYBRID MODE
      const results = [];
      
      // 1. Emit LOCAL (inMemoryBroker) ALWAYS FIRST - NO BREAK PRODUCTION
      console.log(`🚀 [EventDispatcher] Step 1: Emitting to local broker...`);
      const localResult = await this.fallbackBroker?.publish(eventName, payload, metadata) || 
                          await this.primaryBroker.publish(eventName, payload, metadata);
      
      results.push({
        broker: 'local',
        result: localResult,
        success: localResult.success
      });
      
      // 2. IF distributed enabled → publish to distributed broker
      if (this.primaryBroker !== this.fallbackBroker && this.primaryBroker.isConnected) {
        console.log(`🚀 [EventDispatcher] Step 2: Emitting to distributed broker...`);
        
        try {
          const distributedResult = await this.primaryBroker.publish(eventName, payload, metadata);
          
          results.push({
            broker: this.primaryBroker.name,
            result: distributedResult,
            success: distributedResult.success
          });
          
          console.log(`🚀 [EventDispatcher] EVENT_PUBLISHED event=${eventName} target=${this.primaryBroker.name}`);
          
        } catch (distributedError) {
          console.warn(`🚀 [EventDispatcher] Distributed publish failed: ${distributedError.message}`);
          
          results.push({
            broker: this.primaryBroker.name,
            result: { success: false, error: distributedError.message },
            success: false
          });
        }
      } else {
        console.log(`🚀 [EventDispatcher] Step 2: Distributed broker not available - skipping`);
      }
      
      // Evaluar resultados
      const localSuccess = results[0]?.success || false;
      const distributedSuccess = results[1]?.success || false;
      
      if (localSuccess) {
        this.stats.successful++;
        
        if (!distributedSuccess && results.length > 1) {
          this.stats.fallbackUsed++;
          console.log(`🚀 [EventDispatcher] EVENT_FAILED fallback=local event=${eventName}`);
        }
        
        const duration = Date.now() - startTime;
        console.log(`🚀 [EventDispatcher] EVENT_DISPATCHED event=${eventName} success=true duration=${duration}ms`);
        
        return {
          success: true,
          eventName,
          results,
          duration,
          usedFallback: !distributedSuccess && results.length > 1,
          timestamp: new Date().toISOString()
        };
      } else {
        this.stats.failed++;
        throw new Error(`Both local and distributed brokers failed for event: ${eventName}`);
      }
      
    } catch (error) {
      this.stats.failed++;
      const duration = Date.now() - startTime;
      
      console.error(`🚀 [EventDispatcher] EVENT_DISPATCH_FAILED event=${eventName} error="${error.message}"`);
      
      return {
        success: false,
        eventName,
        error: error.message,
        duration,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Suscribir a eventos
   */
  async subscribe(eventName, handler, options = {}) {
    try {
      console.log(`🚀 [EventDispatcher] Subscribing to event: ${eventName}`);
      
      const subscriptions = [];
      
      // Suscribir a broker primario
      const primarySubscription = await this.primaryBroker.subscribe(eventName, handler, options);
      subscriptions.push({
        broker: this.primaryBroker.name,
        subscription: primarySubscription
      });
      
      // Suscribir a broker de fallback si es diferente
      if (this.fallbackBroker && this.fallbackBroker !== this.primaryBroker) {
        const fallbackSubscription = await this.fallbackBroker.subscribe(eventName, handler, options);
        subscriptions.push({
          broker: this.fallbackBroker.name,
          subscription: fallbackSubscription
        });
      }
      
      console.log(`🚀 [EventDispatcher] Subscribed to ${eventName} on ${subscriptions.length} brokers`);
      
      return {
        success: true,
        eventName,
        subscriptions,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`🚀 [EventDispatcher] Failed to subscribe to ${eventName}:`, error.message);
      
      return {
        success: false,
        eventName,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Cambiar broker primario (para migration strategy)
   */
  async switchBroker(newBrokerType) {
    try {
      console.log(`🚀 [EventDispatcher] Switching primary broker from ${this.brokerType} to ${newBrokerType}`);
      
      const oldBroker = this.primaryBroker;
      const newBroker = this.brokers.get(newBrokerType);
      
      if (!newBroker) {
        throw new Error(`Broker ${newBrokerType} not available`);
      }
      
      // Conectar nuevo broker
      await newBroker.connect();
      
      // Cambiar broker primario
      this.primaryBroker = newBroker;
      this.brokerType = newBrokerType;
      
      // Actualizar fallback
      if (newBrokerType === 'memory') {
        this.fallbackBroker = null;
      } else {
        this.fallbackBroker = this.brokers.get('memory');
      }
      
      console.log(`🚀 [EventDispatcher] Successfully switched to ${newBrokerType}`);
      
      return {
        success: true,
        oldBroker: oldBroker.name,
        newBroker: newBroker.name,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`🚀 [EventDispatcher] Failed to switch broker:`, error.message);
      
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Obtener broker por tipo
   */
  getBroker(brokerType) {
    return this.brokers.get(brokerType);
  }

  /**
   * Verificar salud de todos los brokers
   */
  async healthCheck() {
    try {
      const healthResults = {};
      
      for (const [name, broker] of this.brokers) {
        try {
          healthResults[name] = await broker.healthCheck();
        } catch (error) {
          healthResults[name] = {
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
          };
        }
      }
      
      // Determinar salud general
      const primaryHealth = healthResults[this.brokerType];
      const fallbackHealth = this.fallbackBroker ? healthResults[this.fallbackBroker.name] : null;
      
      const overallHealth = {
        status: (primaryHealth?.status === 'healthy' || primaryHealth?.status === 'stub') ? 'healthy' : 'degraded',
        primary: this.brokerType,
        primaryHealth: primaryHealth?.status,
        fallback: this.fallbackBroker?.name,
        fallbackHealth: fallbackHealth?.status,
        brokers: healthResults,
        stats: this.getStats(),
        timestamp: new Date().toISOString()
      };
      
      return overallHealth;
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Obtener estadísticas del dispatcher
   */
  getStats() {
    // Actualizar estadísticas de brokers
    for (const [name, broker] of this.brokers) {
      this.stats.brokerStats[name] = broker.getStats();
    }
    
    return {
      ...this.stats,
      brokerType: this.brokerType,
      primaryBroker: this.primaryBroker.name,
      fallbackBroker: this.fallbackBroker?.name || 'none',
      availableBrokers: Array.from(this.brokers.keys()),
      successRate: this.stats.totalDispatched > 0 ? 
        ((this.stats.successful / this.stats.totalDispatched) * 100).toFixed(2) + '%' : '0%',
      fallbackRate: this.stats.totalDispatched > 0 ? 
        ((this.stats.fallbackUsed / this.stats.totalDispatched) * 100).toFixed(2) + '%' : '0%',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Resetear estadísticas
   */
  resetStats() {
    this.stats = {
      totalDispatched: 0,
      successful: 0,
      failed: 0,
      fallbackUsed: 0,
      brokerStats: {}
    };
    
    // Resetear estadísticas de brokers
    for (const broker of this.brokers.values()) {
      broker.resetStats();
    }
    
    console.log(`🚀 [EventDispatcher] Statistics reset`);
  }

  /**
   * Obtener información detallada del dispatcher
   */
  getInfo() {
    const brokersInfo = {};
    
    for (const [name, broker] of this.brokers) {
      brokersInfo[name] = broker.getInfo();
    }
    
    return {
      dispatcher: {
        type: 'hybrid',
        brokerType: this.brokerType,
        primaryBroker: this.primaryBroker.name,
        fallbackBroker: this.fallbackBroker?.name || 'none',
        initialized: this.isInitialized,
        stats: this.getStats()
      },
      brokers: brokersInfo,
      config: this.config,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Obtener estado de migration
   */
  getMigrationStatus() {
    const availableBrokers = Array.from(this.brokers.keys());
    const currentBroker = this.brokerType;
    
    return {
      current: currentBroker,
      available: availableBrokers,
      canSwitchTo: availableBrokers.filter(b => b !== currentBroker),
      recommendations: this.getMigrationRecommendations(),
      phases: {
        '1': { broker: 'memory', description: 'Memory only (current)', status: currentBroker === 'memory' ? 'active' : 'completed' },
        '2': { broker: 'redis', description: 'Memory + Redis dual write', status: currentBroker === 'redis' ? 'active' : 'pending' },
        '3': { broker: 'redis', description: 'Redis primary + memory fallback', status: 'pending' },
        '4': { broker: 'kafka', description: 'Kafka full distributed system', status: 'pending' }
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Obtener recomendaciones de migration
   */
  getMigrationRecommendations() {
    const recommendations = [];
    
    if (this.brokerType === 'memory') {
      recommendations.push({
        phase: 2,
        action: 'Enable Redis broker for dual write mode',
        command: 'EVENT_BROKER_TYPE=redis',
        description: 'Start writing to both memory and Redis streams'
      });
    }
    
    if (this.brokerType === 'redis') {
      recommendations.push({
        phase: 3,
        action: 'Optimize Redis configuration',
        description: 'Fine-tune Redis streams and consumer groups'
      });
      
      recommendations.push({
        phase: 4,
        action: 'Prepare for Kafka migration',
        description: 'Install Kafka dependencies and configure brokers'
      });
    }
    
    return recommendations;
  }

  /**
   * Exportar estado del dispatcher
   */
  exportState() {
    const brokersState = {};
    
    for (const [name, broker] of this.brokers) {
      brokersState[name] = broker.exportState();
    }
    
    return {
      dispatcher: {
        brokerType: this.brokerType,
        initialized: this.isInitialized,
        stats: this.stats,
        config: this.config
      },
      brokers: brokersState,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Importar estado del dispatcher
   */
  async importState(state) {
    try {
      console.log(`🚀 [EventDispatcher] Importing state...`);
      
      // Importar estado del dispatcher
      if (state.dispatcher) {
        this.stats = { ...this.stats, ...state.dispatcher.stats };
        this.config = { ...this.config, ...state.dispatcher.config };
      }
      
      // Importar estado de brokers
      if (state.brokers) {
        for (const [name, brokerState] of Object.entries(state.brokers)) {
          const broker = this.brokers.get(name);
          if (broker) {
            await broker.importState(brokerState);
          }
        }
      }
      
      console.log(`🚀 [EventDispatcher] State imported successfully`);
      return true;
    } catch (error) {
      console.error(`🚀 [EventDispatcher] Failed to import state:`, error.message);
      return false;
    }
  }
}

// Crear singleton instance
const eventDispatcher = new EventDispatcher();

// Auto-initializar
eventDispatcher.initialize().catch(error => {
  console.error('🚀 [EventDispatcher] Auto-initialization failed:', error.message);
});

module.exports = {
  EventDispatcher,
  eventDispatcher
};
