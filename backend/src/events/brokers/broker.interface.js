// Broker Interface - Event Broker Abstraction Contract
// Define el contrato base para todos los event brokers

console.log("📋 Broker Interface - Event Broker Abstraction Contract");

/**
 * Interfaz base para todos los event brokers
 * Define el contrato que deben implementar todos los brokers
 * (memory, redis, kafka, etc.)
 */
class EventBrokerInterface {
  constructor(name, config = {}) {
    if (this.constructor === EventBrokerInterface) {
      throw new Error("EventBrokerInterface is an abstract class and cannot be instantiated directly");
    }
    
    this.name = name;
    this.config = config;
    this.isInitialized = false;
    this.isConnected = false;
    this.stats = {
      published: 0,
      failed: 0,
      retried: 0,
      total: 0
    };
  }

  /**
   * Inicializar el broker
   * @returns {Promise<boolean>} - true si se inicializó correctamente
   */
  async initialize() {
    throw new Error("initialize() method must be implemented by subclass");
  }

  /**
   * Conectar al broker
   * @returns {Promise<boolean>} - true si se conectó correctamente
   */
  async connect() {
    throw new Error("connect() method must be implemented by subclass");
  }

  /**
   * Desconectar del broker
   * @returns {Promise<void>}
   */
  async disconnect() {
    throw new Error("disconnect() method must be implemented by subclass");
  }

  /**
   * Publicar un evento
   * @param {string} eventName - Nombre del evento
   * @param {Object} payload - Payload del evento
   * @param {Object} metadata - Metadatos adicionales
   * @returns {Promise<Object>} - Resultado de la publicación
   */
  async publish(eventName, payload, metadata = {}) {
    throw new Error("publish() method must be implemented by subclass");
  }

  /**
   * Suscribir a eventos
   * @param {string} eventName - Nombre del evento
   * @param {Function} handler - Handler del evento
   * @param {Object} options - Opciones de suscripción
   * @returns {Promise<Object>} - Resultado de la suscripción
   */
  async subscribe(eventName, handler, options = {}) {
    throw new Error("subscribe() method must be implemented by subclass");
  }

  /**
   * Verificar salud del broker
   * @returns {Promise<Object>} - Estado de salud del broker
   */
  async healthCheck() {
    throw new Error("healthCheck() method must be implemented by subclass");
  }

  /**
   * Obtener estadísticas del broker
   * @returns {Object} - Estadísticas del broker
   */
  getStats() {
    return {
      name: this.name,
      initialized: this.isInitialized,
      connected: this.isConnected,
      ...this.stats,
      successRate: this.stats.total > 0 ? 
        ((this.stats.published / this.stats.total) * 100).toFixed(2) + '%' : '0%',
      failureRate: this.stats.total > 0 ? 
        ((this.stats.failed / this.stats.total) * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * Resetear estadísticas
   */
  resetStats() {
    this.stats = {
      published: 0,
      failed: 0,
      retried: 0,
      total: 0
    };
  }

  /**
   * Validar payload del evento
   * @param {Object} payload - Payload a validar
   * @returns {boolean} - true si es válido
   */
  validatePayload(payload) {
    return payload !== null && typeof payload === 'object';
  }

  /**
   * Validar nombre del evento
   * @param {string} eventName - Nombre del evento a validar
   * @returns {boolean} - true si es válido
   */
  validateEventName(eventName) {
    return typeof eventName === 'string' && eventName.length > 0;
  }

  /**
   * Crear evento estructurado
   * @param {string} eventName - Nombre del evento
   * @param {Object} payload - Payload del evento
   * @param {Object} metadata - Metadatos adicionales
   * @returns {Object} - Evento estructurado
   */
  createStructuredEvent(eventName, payload, metadata = {}) {
    return {
      id: this.generateEventId(),
      eventName,
      timestamp: new Date().toISOString(),
      broker: this.name,
      payload: this.validatePayload(payload) ? payload : {},
      metadata: {
        source: metadata.source || 'api',
        version: metadata.version || '1.0',
        ...metadata
      }
    };
  }

  /**
   * Generar ID único para evento
   * @returns {string} - ID único
   */
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log de publicación
   * @param {string} eventName - Nombre del evento
   * @param {Object} result - Resultado de la publicación
   * @param {number} duration - Duración en ms
   */
  logPublish(eventName, result, duration) {
    console.log(`[EVENT_BROKER] mode=${this.name} event=${eventName} published=${result.success} duration=${duration}ms`);
  }

  /**
   * Log de error
   * @param {string} eventName - Nombre del evento
   * @param {Error} error - Error ocurrido
   */
  logError(eventName, error) {
    console.error(`[EVENT_BROKER] mode=${this.name} event=${eventName} error="${error.message}"`);
  }

  /**
   * Log de fallback
   * @param {string} eventName - Nombre del evento
   * @param {string} fallbackTarget - Target de fallback
   */
  logFallback(eventName, fallbackTarget) {
    console.warn(`[EVENT_BROKER] mode=${this.name} event=${eventName} fallback=${fallbackTarget}`);
  }

  /**
   * Implementar retry con exponential backoff
   * @param {Function} operation - Operación a reintentar
   * @param {number} maxRetries - Máximo de reintentos
   * @param {number} baseDelay - Delay base en ms
   * @returns {Promise<any>} - Resultado de la operación
   */
  async retryWithBackoff(operation, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 0) {
          console.log(`[EVENT_BROKER] mode=${this.name} retry_success attempt=${attempt}`);
          this.stats.retried++;
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          console.error(`[EVENT_BROKER] mode=${this.name} retry_failed max_attempts=${maxRetries}`);
          break;
        }
        
        // Exponential backoff con jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.warn(`[EVENT_BROKER] mode=${this.name} retry_attempt=${attempt + 1}/${maxRetries} delay=${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Implementar circuit breaker pattern
   * @param {Function} operation - Operación a proteger
   * @param {Object} circuitBreakerConfig - Configuración del circuit breaker
   * @returns {Promise<any>} - Resultado de la operación
   */
  async withCircuitBreaker(operation, circuitBreakerConfig = {}) {
    const {
      failureThreshold = 5,
      recoveryTimeout = 60000,
      expectedRecoveryTime = 30000
    } = circuitBreakerConfig;
    
    if (!this.circuitBreaker) {
      this.circuitBreaker = {
        state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
        failureCount: 0,
        lastFailureTime: null,
        nextAttempt: null
      };
    }
    
    const now = Date.now();
    
    // Check if circuit should transition to HALF_OPEN
    if (this.circuitBreaker.state === 'OPEN' && 
        now - this.circuitBreaker.lastFailureTime > recoveryTimeout) {
      this.circuitBreaker.state = 'HALF_OPEN';
      console.log(`[EVENT_BROKER] mode=${this.name} circuit_breaker=HALF_OPEN`);
    }
    
    // Reject if circuit is OPEN
    if (this.circuitBreaker.state === 'OPEN') {
      throw new Error(`Circuit breaker is OPEN for ${this.name}`);
    }
    
    try {
      const result = await operation();
      
      // Reset on success
      if (this.circuitBreaker.state === 'HALF_OPEN') {
        this.circuitBreaker.state = 'CLOSED';
        this.circuitBreaker.failureCount = 0;
        console.log(`[EVENT_BROKER] mode=${this.name} circuit_breaker=CLOSED`);
      }
      
      return result;
    } catch (error) {
      this.circuitBreaker.failureCount++;
      this.circuitBreaker.lastFailureTime = now;
      
      // Open circuit if threshold reached
      if (this.circuitBreaker.failureCount >= failureThreshold) {
        this.circuitBreaker.state = 'OPEN';
        this.circuitBreaker.nextAttempt = now + recoveryTimeout;
        console.error(`[EVENT_BROKER] mode=${this.name} circuit_breaker=OPEN failures=${this.circuitBreaker.failureCount}`);
      }
      
      throw error;
    }
  }

  /**
   * Obtener estado del circuit breaker
   * @returns {Object} - Estado del circuit breaker
   */
  getCircuitBreakerStatus() {
    return this.circuitBreaker || { state: 'UNKNOWN' };
  }

  /**
   * Resetear circuit breaker
   */
  resetCircuitBreaker() {
    this.circuitBreaker = {
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: null,
      nextAttempt: null
    };
    console.log(`[EVENT_BROKER] mode=${this.name} circuit_breaker=RESET`);
  }
}

module.exports = {
  EventBrokerInterface
};
