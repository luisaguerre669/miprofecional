// Events Index - Unified Event-Driven Architecture Entry Point
// Centralizes event system setup with broker abstraction and safe migration
// HYBRID MODE: Memory (fallback) + Redis/Kafka (distributed) via Event Dispatcher

console.log("🎯 Events Index - Unified Event-Driven Architecture Entry Point");

const { eventDispatcher } = require('./eventDispatcher');
const { eventBus } = require('./eventBus');
const { AUTH_EVENTS, BOOKING_EVENTS, PROFESSIONAL_EVENTS, SYSTEM_EVENTS } = require('./eventTypes');
const { analyticsListener } = require('./listeners/analytics.listener');
const { notificationListener } = require('./listeners/notification.listener');

class EventSystem {
  constructor() {
    this.eventDispatcher = eventDispatcher;
    this.eventBus = eventBus;
    this.analyticsListener = analyticsListener;
    this.notificationListener = notificationListener;
    this.isInitialized = false;
    this.brokerType = process.env.EVENT_BROKER_TYPE || 'memory';
    
    console.log(`🎯 [events] Event Broker Type: ${this.brokerType}`);
  }

  // Initialize the event system with broker abstraction
  async initialize() {
    if (this.isInitialized) {
      console.log('🎯 [events] Event system already initialized');
      return;
    }

    console.log('🎯 [events] Initializing unified event-driven system...');
    
    // Initialize event dispatcher with broker abstraction
    await this.eventDispatcher.initialize();
    
    // Connect event dispatcher
    await this.eventDispatcher.connect();
    
    // Register analytics listeners on memory bus (always for compatibility)
    this.registerAnalyticsListeners();
    
    // Register notification listeners on memory bus (always for compatibility)
    this.registerNotificationListeners();
    
    this.isInitialized = true;
    
    // Log system status
    const dispatcherInfo = this.eventDispatcher.getInfo();
    const health = await this.eventDispatcher.healthCheck();
    
    console.log('✅ [events] Unified event system initialized successfully');
    console.log(`🎯 [events] Broker Type: ${this.brokerType}`);
    console.log(`🎯 [events] Primary Broker: ${dispatcherInfo.dispatcher.primaryBroker}`);
    console.log(`🎯 [events] Fallback Broker: ${dispatcherInfo.dispatcher.fallbackBroker}`);
    console.log(`🎯 [events] Overall Health: ${health.status}`);
    console.log(`📊 [events] Analytics listeners: ${this.getAnalyticsListenerCount()}`);
    console.log(`📬 [events] Notification listeners: ${this.getNotificationListenerCount()}`);
    console.log(`🎯 [events] Total events registered: ${this.getTotalEventCount()}`);
  }

  // Register analytics listeners
  registerAnalyticsListeners() {
    // Auth events
    this.eventBus.on(AUTH_EVENTS.USER_REGISTERED, this.analyticsListener.handleUserRegistered.bind(this.analyticsListener), {
      name: 'analytics-user-registered'
    });
    
    this.eventBus.on(AUTH_EVENTS.USER_LOGGED_IN, this.analyticsListener.handleUserLoggedIn.bind(this.analyticsListener), {
      name: 'analytics-user-logged-in'
    });

    // Booking events
    this.eventBus.on(BOOKING_EVENTS.CREATED, this.analyticsListener.handleBookingCreated.bind(this.analyticsListener), {
      name: 'analytics-booking-created'
    });
    
    this.eventBus.on(BOOKING_EVENTS.UPDATED, this.analyticsListener.handleBookingUpdated.bind(this.analyticsListener), {
      name: 'analytics-booking-updated'
    });
    
    this.eventBus.on(BOOKING_EVENTS.CANCELLED, this.analyticsListener.handleBookingCancelled.bind(this.analyticsListener), {
      name: 'analytics-booking-cancelled'
    });

    // Professional events
    this.eventBus.on(PROFESSIONAL_EVENTS.LOCATION_UPDATED, this.analyticsListener.handleProfessionalLocationUpdated.bind(this.analyticsListener), {
      name: 'analytics-location-updated'
    });

    // System events
    this.eventBus.on(SYSTEM_EVENTS.ERROR_OCCURRED, this.analyticsListener.handleSystemError.bind(this.analyticsListener), {
      name: 'analytics-system-error'
    });

    console.log('📊 [events] Analytics listeners registered');
  }

  // Register notification listeners
  registerNotificationListeners() {
    // Auth events
    this.eventBus.on(AUTH_EVENTS.USER_REGISTERED, this.notificationListener.handleUserRegistered.bind(this.notificationListener), {
      name: 'notification-user-registered'
    });
    
    this.eventBus.on(AUTH_EVENTS.USER_LOGGED_IN, this.notificationListener.handleUserLoggedIn.bind(this.notificationListener), {
      name: 'notification-user-logged-in'
    });

    // Booking events
    this.eventBus.on(BOOKING_EVENTS.CREATED, this.notificationListener.handleBookingCreated.bind(this.notificationListener), {
      name: 'notification-booking-created'
    });
    
    this.eventBus.on(BOOKING_EVENTS.UPDATED, this.notificationListener.handleBookingUpdated.bind(this.notificationListener), {
      name: 'notification-booking-updated'
    });
    
    this.eventBus.on(BOOKING_EVENTS.CANCELLED, this.notificationListener.handleBookingCancelled.bind(this.notificationListener), {
      name: 'notification-booking-cancelled'
    });

    // Professional events
    this.eventBus.on(PROFESSIONAL_EVENTS.LOCATION_UPDATED, this.notificationListener.handleProfessionalLocationUpdated.bind(this.notificationListener), {
      name: 'notification-location-updated'
    });

    // System events
    this.eventBus.on(SYSTEM_EVENTS.ERROR_OCCURRED, this.notificationListener.handleSystemError.bind(this.notificationListener), {
      name: 'notification-system-error'
    });

    console.log('📬 [events] Notification listeners registered');
  }

  // Emit events with convenience methods (broker abstraction with HYBRID MODE)
  async emitAuthUserRegistered(userId, email, name, phone, location, metadata = {}) {
    return await this.eventDispatcher.emit(AUTH_EVENTS.USER_REGISTERED, {
      userId,
      email,
      name,
      phone,
      location
    }, { source: 'auth-service', ...metadata });
  }

  async emitAuthUserLoggedIn(userId, email, rememberMe, metadata = {}) {
    return await this.eventDispatcher.emit(AUTH_EVENTS.USER_LOGGED_IN, {
      userId,
      email,
      rememberMe
    }, { source: 'auth-service', ...metadata });
  }

  async emitBookingCreated(bookingId, userId, professionalId, service, date, price, metadata = {}) {
    return await this.eventDispatcher.emit(BOOKING_EVENTS.CREATED, {
      bookingId,
      userId,
      professionalId,
      service,
      date,
      price
    }, { source: 'booking-service', ...metadata });
  }

  async emitBookingUpdated(bookingId, userId, professionalId, previousStatus, newStatus, metadata = {}) {
    return await this.eventDispatcher.emit(BOOKING_EVENTS.UPDATED, {
      bookingId,
      userId,
      professionalId,
      previousStatus,
      newStatus
    }, { source: 'booking-service', ...metadata });
  }

  async emitBookingCancelled(bookingId, userId, professionalId, reason, metadata = {}) {
    return await this.eventDispatcher.emit(BOOKING_EVENTS.CANCELLED, {
      bookingId,
      userId,
      professionalId,
      reason
    }, { source: 'booking-service', ...metadata });
  }

  async emitProfessionalLocationUpdated(professionalId, location, previousLocation, metadata = {}) {
    return await this.eventDispatcher.emit(PROFESSIONAL_EVENTS.LOCATION_UPDATED, {
      professionalId,
      location,
      previousLocation
    }, { source: 'professional-service', ...metadata });
  }

  async emitSystemError(error, errorType, service, userId, requestId, metadata = {}) {
    return await this.eventDispatcher.emit(SYSTEM_EVENTS.ERROR_OCCURRED, {
      error: error.message || error,
      errorType,
      service,
      userId,
      requestId
    }, { source: service, ...metadata });
  }

  // Get system statistics
  getStats() {
    const eventBusStats = this.eventBus.getStats();
    const eventDispatcherStats = this.eventDispatcher.getStats();
    const analyticsStats = this.analyticsListener.getStats();
    const notificationStats = this.notificationListener.getStats();
    
    return {
      eventSystem: {
        initialized: this.isInitialized,
        brokerType: this.brokerType,
        mode: this.getOperatingMode(),
        ...eventBusStats
      },
      eventDispatcher: eventDispatcherStats,
      analytics: analyticsStats,
      notifications: notificationStats,
      timestamp: new Date().toISOString()
    };
  }

  // Get operating mode based on broker configuration
  getOperatingMode() {
    switch (this.brokerType) {
      case 'memory':
        return 'memory_only';
      case 'redis':
        return 'distributed_redis';
      case 'kafka':
        return 'distributed_kafka';
      default:
        return 'memory_only';
    }
  }

  // Get listener counts
  getAnalyticsListenerCount() {
    return 6; // Number of analytics listeners registered
  }

  getNotificationListenerCount() {
    return 6; // Number of notification listeners registered
  }

  getTotalEventCount() {
    return this.eventBus.getEventNames().length;
  }

  // Reset all event systems
  reset() {
    console.log('🔄 [events] Resetting unified event system...');
    
    this.eventBus.clear();
    this.eventDispatcher.resetStats();
    this.analyticsListener.reset();
    this.notificationListener.reset();
    this.isInitialized = false;
    
    console.log('✅ [events] Unified event system reset');
  }

  // Wait for all events to be processed
  async waitForProcessing(timeout = 10000) {
    // Wait for memory event bus
    await this.eventBus.waitForProcessing(timeout);
    
    // Distributed brokers process events asynchronously by workers
    console.log('🔄 [events] Memory events processed, distributed events processed by workers');
    
    return true;
  }

  // Switch broker type (for migration strategy)
  async switchBroker(newBrokerType) {
    console.log(`🎯 [events] Switching broker from ${this.brokerType} to ${newBrokerType}`);
    
    const result = await this.eventDispatcher.switchBroker(newBrokerType);
    
    if (result.success) {
      this.brokerType = newBrokerType;
      console.log(`🎯 [events] Broker switched successfully to ${newBrokerType}`);
    } else {
      console.error(`🎯 [events] Failed to switch broker: ${result.error}`);
    }
    
    return result;
  }

  // Get migration status
  getMigrationStatus() {
    const dispatcherMigration = this.eventDispatcher.getMigrationStatus();
    
    return {
      current: this.brokerType,
      available: dispatcherMigration.available,
      canSwitchTo: dispatcherMigration.canSwitchTo,
      recommendations: dispatcherMigration.recommendations,
      phases: dispatcherMigration.phases,
      operatingMode: this.getOperatingMode(),
      timestamp: new Date().toISOString()
    };
  }

  // Get migration recommendation
  getMigrationRecommendation() {
    const recommendations = [];
    
    switch (this.brokerType) {
      case 'memory':
        recommendations.push({
          phase: 2,
          action: 'Enable Redis broker for dual write mode',
          command: 'EVENT_BROKER_TYPE=redis',
          description: 'Start writing to both memory and Redis streams'
        });
        break;
      case 'redis':
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
        break;
      case 'kafka':
        recommendations.push({
          phase: 5,
          action: 'Optimize Kafka configuration',
          description: 'Fine-tune Kafka topics and consumer groups'
        });
        break;
    }
    
    return recommendations;
  }
}

// Create singleton instance
const eventSystem = new EventSystem();

// Auto-initialize (async)
eventSystem.initialize().catch(error => {
  console.error('🎯 [events] Auto-initialization failed:', error.message);
});

// Export the event system and components
module.exports = {
  EventSystem,
  eventSystem,
  eventDispatcher,
  eventBus,
  analyticsListener,
  notificationListener
};
