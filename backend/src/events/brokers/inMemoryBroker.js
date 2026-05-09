// In-Memory Broker - Event Broker Implementation
// Implementación del broker en memoria (actual eventBus como fallback)

console.log("💾 In-Memory Broker - Event Broker Implementation");

const { EventBrokerInterface } = require('./broker.interface');
const { eventBus } = require('../eventBus');

/**
 * Broker en memoria que envuelve el eventBus actual
 * Mantiene compatibilidad total con el sistema existente
 */
class InMemoryBroker extends EventBrokerInterface {
  constructor(config = {}) {
    super('memory', config);
    this.eventBus = eventBus;
    this.listeners = new Map();
  }

  /**
   * Inicializar el broker en memoria
   */
  async initialize() {
    try {
      console.log(`💾 [InMemoryBroker] Initializing in-memory broker...`);
      
      // El eventBus ya está inicializado en el sistema actual
      this.isInitialized = true;
      this.isConnected = true;
      
      console.log(`💾 [InMemoryBroker] In-memory broker initialized successfully`);
      return true;
    } catch (error) {
      console.error(`💾 [InMemoryBroker] Failed to initialize:`, error.message);
      return false;
    }
  }

  /**
   * Conectar al broker en memoria (siempre conectado)
   */
  async connect() {
    try {
      console.log(`💾 [InMemoryBroker] Connecting to in-memory broker...`);
      
      // El broker en memoria siempre está "conectado"
      this.isConnected = true;
      
      console.log(`💾 [InMemoryBroker] Connected to in-memory broker`);
      return true;
    } catch (error) {
      console.error(`💾 [InMemoryBroker] Failed to connect:`, error.message);
      return false;
    }
  }

  /**
   * Desconectar del broker en memoria
   */
  async disconnect() {
    try {
      console.log(`💾 [InMemoryBroker] Disconnecting from in-memory broker...`);
      
      this.isConnected = false;
      
      console.log(`💾 [InMemoryBroker] Disconnected from in-memory broker`);
    } catch (error) {
      console.error(`💾 [InMemoryBroker] Error during disconnect:`, error.message);
    }
  }

  /**
   * Publicar un evento en el broker en memoria
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
      
      // Publicar en el eventBus actual
      await this.eventBus.emit(eventName, structuredEvent.payload, structuredEvent.metadata);
      
      this.stats.published++;
      const duration = Date.now() - startTime;
      
      this.logPublish(eventName, { success: true, eventId: structuredEvent.id }, duration);
      
      return {
        success: true,
        eventId: structuredEvent.id,
        broker: this.name,
        duration,
        timestamp: structuredEvent.timestamp
      };
      
    } catch (error) {
      this.stats.failed++;
      const duration = Date.now() - startTime;
      
      this.logError(eventName, error);
      
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
   * Suscribir a eventos en el broker en memoria
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
      
      // Crear wrapper para el handler
      const wrappedHandler = async (payload, metadata) => {
        try {
          await handler(payload, metadata);
        } catch (error) {
          console.error(`💾 [InMemoryBroker] Handler error for ${eventName}:`, error.message);
        }
      };
      
      // Suscribir al eventBus actual
      const subscription = this.eventBus.on(eventName, wrappedHandler, {
        name: options.name || `in-memory-${eventName}`,
        ...options
      });
      
      // Guardar referencia para cleanup
      this.listeners.set(eventName, {
        handler: wrappedHandler,
        subscription,
        options
      });
      
      console.log(`💾 [InMemoryBroker] Subscribed to event: ${eventName}`);
      
      return {
        success: true,
        eventName,
        broker: this.name,
        subscription,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`💾 [InMemoryBroker] Failed to subscribe to ${eventName}:`, error.message);
      
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
   * Desuscribir de eventos
   */
  async unsubscribe(eventName) {
    try {
      const listener = this.listeners.get(eventName);
      
      if (listener) {
        // Remover del eventBus
        this.eventBus.off(eventName, listener.handler);
        this.listeners.delete(eventName);
        
        console.log(`💾 [InMemoryBroker] Unsubscribed from event: ${eventName}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`💾 [InMemoryBroker] Failed to unsubscribe from ${eventName}:`, error.message);
      return false;
    }
  }

  /**
   * Verificar salud del broker en memoria
   */
  async healthCheck() {
    try {
      const stats = this.eventBus.getStats();
      
      return {
        status: 'healthy',
        broker: this.name,
        connected: this.isConnected,
        initialized: this.isInitialized,
        stats: {
          eventNames: stats.eventNames || [],
          listenerCount: stats.listenerCount || 0,
          eventHistory: stats.eventHistory || []
        },
        uptime: process.uptime(),
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
   * Obtener información detallada del broker
   */
  getInfo() {
    return {
      name: this.name,
      type: 'in-memory',
      initialized: this.isInitialized,
      connected: this.isConnected,
      stats: this.getStats(),
      listeners: Array.from(this.listeners.keys()),
      circuitBreaker: this.getCircuitBreakerStatus(),
      config: this.config,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Limpiar todas las suscripciones
   */
  async cleanup() {
    try {
      console.log(`💾 [InMemoryBroker] Cleaning up all subscriptions...`);
      
      for (const [eventName, listener] of this.listeners) {
        await this.unsubscribe(eventName);
      }
      
      console.log(`💾 [InMemoryBroker] Cleanup completed`);
    } catch (error) {
      console.error(`💾 [InMemoryBroker] Error during cleanup:`, error.message);
    }
  }

  /**
   * Obtener eventos pendientes (si los hay)
   */
  getPendingEvents() {
    // En el broker en memoria, no hay eventos pendientes
    // Los eventos se procesan inmediatamente
    return {
      count: 0,
      events: []
    };
  }

  /**
   * Forzar procesamiento de eventos pendientes
   */
  async processPendingEvents() {
    // En el broker en memoria, no hay eventos pendientes
    console.log(`💾 [InMemoryBroker] No pending events to process`);
    return {
      processed: 0
    };
  }

  /**
   * Obtener métricas de rendimiento
   */
  getPerformanceMetrics() {
    const stats = this.getStats();
    const uptime = process.uptime();
    
    return {
      broker: this.name,
      uptime: uptime,
      uptimeFormatted: this.formatUptime(uptime),
      eventsPerSecond: uptime > 0 ? (stats.total / uptime).toFixed(2) : '0',
      averageLatency: '0ms', // In-memory events are virtually instant
      memoryUsage: process.memoryUsage(),
      stats,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Formatear uptime
   */
  formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  /**
   * Exportar estado del broker (para debugging)
   */
  exportState() {
    return {
      name: this.name,
      initialized: this.isInitialized,
      connected: this.isConnected,
      stats: this.stats,
      listeners: Array.from(this.listeners.entries()).map(([eventName, listener]) => ({
        eventName,
        options: listener.options
      })),
      circuitBreaker: this.getCircuitBreakerStatus(),
      config: this.config,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Importar estado del broker (para debugging/testing)
   */
  async importState(state) {
    try {
      console.log(`💾 [InMemoryBroker] Importing state...`);
      
      // Solo importar estadísticas y configuración
      if (state.stats) {
        this.stats = { ...this.stats, ...state.stats };
      }
      
      if (state.config) {
        this.config = { ...this.config, ...state.config };
      }
      
      console.log(`💾 [InMemoryBroker] State imported successfully`);
      return true;
    } catch (error) {
      console.error(`💾 [InMemoryBroker] Failed to import state:`, error.message);
      return false;
    }
  }
}

module.exports = {
  InMemoryBroker
};
