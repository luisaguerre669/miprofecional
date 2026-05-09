// Event Bus - Enterprise In-Process Event System with Priority Queue
// Core del sistema de eventos internos - Async-safe, no bloqueo, con prioridades y retry

console.log("🚌 Event Bus - Enterprise In-Process Event System");

class EventBus {
  constructor() {
    this.listeners = new Map(); // eventName -> [handlers]
    this.onceListeners = new Map(); // eventName -> [handlers]
    this.eventHistory = []; // Store recent events for debugging
    this.maxHistorySize = 1000;
    this.isProcessing = false;
    
    // Priority queues
    this.queues = {
      HIGH: [],     // Critical events (booking creation, payments)
      NORMAL: [],   // Regular events (notifications, analytics)
      LOW: []       // Non-critical events (logging, metrics)
    };
    
    // Event priority mapping
    this.eventPriorities = {
      // Critical events - cannot fail
      'BOOKING_CREATED': 'HIGH',
      'BOOKING_CONFIRMED': 'HIGH',
      'BOOKING_CANCELLED': 'HIGH',
      'PAYMENT_COMPLETED': 'HIGH',
      'USER_REGISTERED': 'HIGH',
      'USER_LOGGED_IN': 'HIGH',
      
      // Regular events - can fail but should retry
      'BOOKING_UPDATED': 'NORMAL',
      'PROFESSIONAL_LOCATION_UPDATED': 'NORMAL',
      'NOTIFICATION_SENT': 'NORMAL',
      'EMAIL_SENT': 'NORMAL',
      
      // Low priority events - analytics and logging
      'ANALYTICS_EVENT': 'LOW',
      'METRICS_COLLECTED': 'LOW',
      'LOG_EVENT': 'LOW'
    };
    
    // Retry configuration
    this.retryConfig = {
      maxRetries: 2,
      retryDelay: 1000, // 1 second base delay
      maxRetryDelay: 10000 // 10 seconds max delay
    };
    
    // Statistics
    this.stats = {
      totalEvents: 0,
      processedEvents: 0,
      failedEvents: 0,
      retryAttempts: 0,
      queueSizes: { HIGH: 0, NORMAL: 0, LOW: 0 },
      processingTimes: {},
      errorRates: {}
    };
    
    // Logging configuration
    this.logger = {
      emit: (eventName, payload, metadata) => {
        console.log(`[eventBus] EVENT_EMITTED: ${eventName}`, {
          payload: typeof payload === 'object' ? JSON.stringify(payload, null, 2) : payload,
          priority: this.eventPriorities[eventName] || 'NORMAL',
          listeners: this.getListenerCount(eventName),
          timestamp: new Date().toISOString(),
          ...metadata
        });
      },
      
      handled: (eventName, handlerName, result, metadata) => {
        console.log(`[eventBus] EVENT_HANDLED: ${eventName} by ${handlerName}`, {
          result: typeof result === 'object' ? JSON.stringify(result, null, 2) : result,
          timestamp: new Date().toISOString(),
          ...metadata
        });
      },
      
      error: (eventName, handlerName, error, metadata) => {
        console.error(`[eventBus] EVENT_ERROR: ${eventName} in ${handlerName}`, {
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
          ...metadata
        });
      },
      
      retry: (eventName, attempt, error) => {
        console.warn(`[eventBus] EVENT_RETRY: ${eventName} attempt ${attempt}`, {
          error: error.message,
          timestamp: new Date().toISOString()
        });
      },
      
      queue: (eventName, priority, queueSize) => {
        console.log(`[eventBus] EVENT_QUEUED: ${eventName} (${priority})`, {
          queueSize,
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  // Emit event - async-safe, no bloqueo, con prioridades y retry
  async emit(eventName, payload = {}, metadata = {}) {
    try {
      // Update statistics
      this.stats.totalEvents++;
      
      // Add to event history
      this.addToHistory(eventName, payload);
      
      // Log event emission
      this.logger.emit(eventName, payload, metadata);
      
      // Get all listeners for this event
      const regularListeners = this.listeners.get(eventName) || [];
      const onceListeners = this.onceListeners.get(eventName) || [];
      
      const allListeners = [...regularListeners, ...onceListeners];
      
      if (allListeners.length === 0) {
        return { emitted: true, listeners: 0 };
      }
      
      // Determine event priority
      const priority = this.eventPriorities[eventName] || 'NORMAL';
      
      // Add to appropriate priority queue
      this.addToQueue({
        eventName,
        payload,
        metadata,
        listeners: [...listeners], // Copy to avoid mutation
        timestamp: Date.now(),
        priority,
        retryCount: 0,
        maxRetries: this.retryConfig.maxRetries
      });
      
      // Start processing if not already processing
      if (!this.isProcessing) {
        this.processQueues();
      }
      
      return { 
        emitted: true, 
        listeners: allListeners.length,
        priority,
        queued: true 
      };
      
    } catch (error) {
      this.logger.error(eventName, 'emit', error, metadata);
      throw error;
    }
  }

  // Add event to priority queue
  addToQueue(event) {
    const queue = this.queues[event.priority];
    queue.push(event);
    
    // Update queue size statistics
    this.stats.queueSizes[event.priority] = queue.length;
    
    // Log queue addition
    this.logger.queue(event.eventName, event.priority, queue.length);
  }

  // Process priority queues in order: HIGH → NORMAL → LOW
  async processQueues() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      while (this.hasEventsInQueues()) {
        // Process HIGH priority first
        if (this.queues.HIGH.length > 0) {
          const event = this.queues.HIGH.shift();
          await this.executeEventWithRetry(event);
          this.stats.queueSizes.HIGH = this.queues.HIGH.length;
          continue;
        }
        
        // Process NORMAL priority
        if (this.queues.NORMAL.length > 0) {
          const event = this.queues.NORMAL.shift();
          await this.executeEventWithRetry(event);
          this.stats.queueSizes.NORMAL = this.queues.NORMAL.length;
          continue;
        }
        
        // Process LOW priority
        if (this.queues.LOW.length > 0) {
          const event = this.queues.LOW.shift();
          await this.executeEventWithRetry(event);
          this.stats.queueSizes.LOW = this.queues.LOW.length;
          continue;
        }
      }
    } catch (error) {
      console.error('[eventBus] Queue processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Check if any queues have events
  hasEventsInQueues() {
    return this.queues.HIGH.length > 0 || 
           this.queues.NORMAL.length > 0 || 
           this.queues.LOW.length > 0;
  }

  // Execute event with retry mechanism
  async executeEventWithRetry(event) {
    const { eventName, retryCount, maxRetries } = event;
    
    try {
      const startTime = Date.now();
      await this.executeListeners(event);
      const duration = Date.now() - startTime;
      
      // Update statistics
      this.stats.processedEvents++;
      this.stats.processingTimes[eventName] = this.stats.processingTimes[eventName] || [];
      this.stats.processingTimes[eventName].push(duration);
      
      // Keep only last 100 processing times per event
      if (this.stats.processingTimes[eventName].length > 100) {
        this.stats.processingTimes[eventName] = this.stats.processingTimes[eventName].slice(-100);
      }
      
      // Update error rate
      this.updateErrorRate(eventName, false);
      
    } catch (error) {
      // Update error rate
      this.updateErrorRate(eventName, true);
      
      // Check if we should retry
      if (retryCount < maxRetries) {
        // Calculate retry delay with exponential backoff
        const retryDelay = Math.min(
          this.retryConfig.retryDelay * Math.pow(2, retryCount),
          this.retryConfig.maxRetryDelay
        );
        
        // Log retry attempt
        this.logger.retry(eventName, retryCount + 1, error);
        
        // Update statistics
        this.stats.retryAttempts++;
        
        // Re-queue event with retry count incremented
        const retryEvent = {
          ...event,
          retryCount: retryCount + 1,
          timestamp: Date.now()
        };
        
        // Wait for retry delay
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        // Add back to queue
        this.addToQueue(retryEvent);
        
      } else {
        // Max retries reached - log and move on
        console.error(`[eventBus] EVENT_FAILED_PERMANENTLY: ${eventName} after ${maxRetries} retries`, {
          error: error.message,
          timestamp: new Date().toISOString()
        });
        
        // Update statistics
        this.stats.failedEvents++;
      }
    }
  }

  // Update error rate for an event
  updateErrorRate(eventName, isError) {
    if (!this.stats.errorRates[eventName]) {
      this.stats.errorRates[eventName] = { total: 0, errors: 0 };
    }
    
    this.stats.errorRates[eventName].total++;
    if (isError) {
      this.stats.errorRates[eventName].errors++;
    }
  }

  // Execute all listeners for an event
  async executeListeners(event) {
    const { eventName, payload, metadata, listeners } = event;
    
    // Execute all listeners in parallel with error isolation
    const promises = listeners.map(async (listenerInfo, index) => {
      try {
        const result = await this.executeListener(listenerInfo, eventName, payload, metadata);
        
        // Remove once listeners after execution
        if (listenerInfo.once) {
          this.removeListener(eventName, listenerInfo.handler, true);
        }
        
        return { success: true, result, handlerName: listenerInfo.name };
      } catch (error) {
        // Error isolation - one listener failure doesn't affect others
        this.logger.error(eventName, listenerInfo.name || `listener-${index}`, error, metadata);
        return { success: false, error, handlerName: listenerInfo.name };
      }
    });
    
    // Wait for all listeners to complete (or fail)
    const results = await Promise.allSettled(promises);
    
    // Log summary
    const successful = results.filter(r => r.value?.success).length;
    const failed = results.filter(r => !r.value?.success).length;
    
    if (failed > 0) {
      console.warn(`[eventBus] ${eventName}: ${successful} handlers succeeded, ${failed} failed`);
    }
  }

  // Execute individual listener
  async executeListener(listenerInfo, eventName, payload, metadata) {
    const { handler, name, once } = listenerInfo;
    const startTime = Date.now();
    
    try {
      // Execute handler with timeout protection
      const timeout = 5000; // 5 seconds max per handler
      const result = await this.executeWithTimeout(handler(payload, metadata), timeout);
      
      const duration = Date.now() - startTime;
      this.logger.handled(eventName, name, result, { 
        duration,
        metadata 
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(eventName, name, error, { 
        duration,
        metadata 
      });
      throw error;
    }
  }

  // Execute with timeout protection
  async executeWithTimeout(promise, timeout) {
    if (timeout <= 0) return promise;
    
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Handler timeout')), timeout)
      )
    ]);
  }

  // Register event listener
  on(eventName, handler, options = {}) {
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }
    
    const listenerInfo = {
      handler,
      name: options.name || handler.name || `anonymous-${Date.now()}`,
      once: false,
      registeredAt: Date.now()
    };
    
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    
    this.listeners.get(eventName).push(listenerInfo);
    
    console.log(`[eventBus] LISTENER_REGISTERED: ${eventName} -> ${listenerInfo.name}`);
    
    return listenerInfo;
  }

  // Register one-time event listener
  once(eventName, handler, options = {}) {
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }
    
    const listenerInfo = {
      handler,
      name: options.name || handler.name || `once-${Date.now()}`,
      once: true,
      registeredAt: Date.now()
    };
    
    if (!this.onceListeners.has(eventName)) {
      this.onceListeners.set(eventName, []);
    }
    
    this.onceListeners.get(eventName).push(listenerInfo);
    
    console.log(`[eventBus] ONCE_LISTENER_REGISTERED: ${eventName} -> ${listenerInfo.name}`);
    
    return listenerInfo;
  }

  // Remove event listener
  removeListener(eventName, handler, isOnce = false) {
    const listenersMap = isOnce ? this.onceListeners : this.listeners;
    const listeners = listenersMap.get(eventName) || [];
    
    const index = listeners.findIndex(l => l.handler === handler);
    if (index !== -1) {
      const removed = listeners.splice(index, 1)[0];
      console.log(`[eventBus] LISTENER_REMOVED: ${eventName} -> ${removed.name}`);
      return removed;
    }
    
    return null;
  }

  // Remove all listeners for an event
  removeAllListeners(eventName) {
    const regularCount = (this.listeners.get(eventName) || []).length;
    const onceCount = (this.onceListeners.get(eventName) || []).length;
    
    this.listeners.delete(eventName);
    this.onceListeners.delete(eventName);
    
    console.log(`[eventBus] ALL_LISTENERS_REMOVED: ${eventName} (${regularCount + onceCount} removed)`);
    
    return regularCount + onceCount;
  }

  // Get listener count for an event
  getListenerCount(eventName) {
    const regularCount = (this.listeners.get(eventName) || []).length;
    const onceCount = (this.onceListeners.get(eventName) || []).length;
    return regularCount + onceCount;
  }

  // Get all event names with listeners
  getEventNames() {
    const eventNames = new Set();
    
    for (const eventName of this.listeners.keys()) {
      eventNames.add(eventName);
    }
    
    for (const eventName of this.onceListeners.keys()) {
      eventNames.add(eventName);
    }
    
    return Array.from(eventNames);
  }

  // Get event history
  getEventHistory(limit = 50) {
    return this.eventHistory.slice(-limit);
  }

  // Add event to history
  addToHistory(eventName, payload) {
    this.eventHistory.push({
      eventName,
      payload,
      timestamp: new Date().toISOString(),
      listeners: this.getListenerCount(eventName)
    });
    
    // Trim history if too large
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  // Get comprehensive statistics
  getStats() {
    const stats = {
      ...this.stats,
      isProcessing: this.isProcessing,
      eventNames: this.getEventNames(),
      listenerCounts: {},
      queueSizes: {
        HIGH: this.queues.HIGH.length,
        NORMAL: this.queues.NORMAL.length,
        LOW: this.queues.LOW.length
      },
      totalQueueSize: this.queues.HIGH.length + this.queues.NORMAL.length + this.queues.LOW.length
    };
    
    // Add listener counts
    for (const eventName of stats.eventNames) {
      stats.listenerCounts[eventName] = this.getListenerCount(eventName);
    }
    
    // Calculate error rates as percentages
    for (const eventName in stats.errorRates) {
      const rate = stats.errorRates[eventName];
      stats.errorRates[eventName].errorRate = rate.total > 0 ? 
        (rate.errors / rate.total * 100).toFixed(2) + '%' : '0%';
    }
    
    // Calculate average processing times
    for (const eventName in stats.processingTimes) {
      const times = stats.processingTimes[eventName];
      stats.processingTimes[eventName] = {
        count: times.length,
        average: (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2) + 'ms',
        min: Math.min(...times) + 'ms',
        max: Math.max(...times) + 'ms'
      };
    }
    
    return stats;
  }

  // Clear all listeners, queues, and reset statistics
  clear() {
    this.listeners.clear();
    this.onceListeners.clear();
    this.eventHistory = [];
    
    // Clear priority queues
    this.queues.HIGH = [];
    this.queues.NORMAL = [];
    this.queues.LOW = [];
    
    // Reset processing state
    this.isProcessing = false;
    
    // Reset statistics
    this.stats = {
      totalEvents: 0,
      processedEvents: 0,
      failedEvents: 0,
      retryAttempts: 0,
      queueSizes: { HIGH: 0, NORMAL: 0, LOW: 0 },
      processingTimes: {},
      errorRates: {}
    };
    
    console.log('[eventBus] CLEARED: All listeners, queues, and statistics reset');
  }

  // Wait for all events to be processed (including priority queues)
  async waitForProcessing(timeout = 10000) {
    const startTime = Date.now();
    
    while ((this.isProcessing || this.hasEventsInQueues()) && (Date.now() - startTime < timeout)) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (this.isProcessing || this.hasEventsInQueues()) {
      throw new Error('Event processing timeout');
    }
    
    return true;
  }

  // Get event priority
  getEventPriority(eventName) {
    return this.eventPriorities[eventName] || 'NORMAL';
  }

  // Set event priority
  setEventPriority(eventName, priority) {
    if (!['HIGH', 'NORMAL', 'LOW'].includes(priority)) {
      throw new Error('Priority must be HIGH, NORMAL, or LOW');
    }
    
    this.eventPriorities[eventName] = priority;
    console.log(`[eventBus] PRIORITY_SET: ${eventName} -> ${priority}`);
  }

  // Get retry configuration
  getRetryConfig() {
    return { ...this.retryConfig };
  }

  // Set retry configuration
  setRetryConfig(config) {
    this.retryConfig = { ...this.retryConfig, ...config };
    console.log(`[eventBus] RETRY_CONFIG_UPDATED:`, this.retryConfig);
  }

  // Get queue status by priority
  getQueueStatus() {
    return {
      HIGH: {
        size: this.queues.HIGH.length,
        events: this.queues.HIGH.map(e => ({ eventName: e.eventName, retryCount: e.retryCount }))
      },
      NORMAL: {
        size: this.queues.NORMAL.length,
        events: this.queues.NORMAL.map(e => ({ eventName: e.eventName, retryCount: e.retryCount }))
      },
      LOW: {
        size: this.queues.LOW.length,
        events: this.queues.LOW.map(e => ({ eventName: e.eventName, retryCount: e.retryCount }))
      }
    };
  }
}

// Create singleton instance
const eventBus = new EventBus();

// Export the singleton and class
module.exports = {
  EventBus,
  eventBus
};
