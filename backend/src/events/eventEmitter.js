// Event Emitter - Event-Driven Architecture Preparation
// Simple event emitter for future microservices migration (without external dependencies)

const EventEmitter = require('events');
const { EventBuilder, BOOKING_EVENTS, PROFESSIONAL_EVENTS, USER_EVENTS } = require('./eventTypes');

class MiProfesionalEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.eventHistory = [];
    this.maxHistorySize = 1000;
    this.setupEventHandlers();
  }

  // Setup default event handlers for logging
  setupEventHandlers() {
    // Log all events for debugging
    this.onAny((eventName, ...args) => {
      const event = args[0];
      if (event && typeof event === 'object') {
        this.addToHistory(event);
        console.log(`📡 Event Emitted: ${eventName}`, {
          id: event.id,
          source: event.source,
          timestamp: event.timestamp
        });
      }
    });
  }

  // Override emit to add event metadata
  emit(eventName, eventData, options = {}) {
    const event = EventBuilder.create(eventName, eventData, options.source || 'unknown');
    
    // Validate event if schema exists
    const validation = EventBuilder.validate(event);
    if (!validation.valid) {
      console.error(`❌ Invalid Event ${eventName}:`, validation.errors);
      return false;
    }

    return super.emit(eventName, event);
  }

  // Helper method to emit booking events
  emitBookingEvent(eventType, bookingData, source = 'booking-service') {
    if (!Object.values(BOOKING_EVENTS).includes(eventType)) {
      throw new Error(`Invalid booking event type: ${eventType}`);
    }

    return this.emit(eventType, bookingData, { source });
  }

  // Helper method to emit professional events
  emitProfessionalEvent(eventType, professionalData, source = 'professional-service') {
    if (!Object.values(PROFESSIONAL_EVENTS).includes(eventType)) {
      throw new Error(`Invalid professional event type: ${eventType}`);
    }

    return this.emit(eventType, professionalData, { source });
  }

  // Helper method to emit user events
  emitUserEvent(eventType, userData, source = 'user-service') {
    if (!Object.values(USER_EVENTS).includes(eventType)) {
      throw new Error(`Invalid user event type: ${eventType}`);
    }

    return this.emit(eventType, userData, { source });
  }

  // Add event to history (for debugging and analytics)
  addToHistory(event) {
    this.eventHistory.push({
      ...event,
      receivedAt: new Date().toISOString()
    });

    // Limit history size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  // Get event history
  getEventHistory(limit = 100) {
    return this.eventHistory.slice(-limit);
  }

  // Get events by type
  getEventsByType(eventType, limit = 50) {
    return this.eventHistory
      .filter(event => event.type === eventType)
      .slice(-limit);
  }

  // Get events by source
  getEventsBySource(source, limit = 50) {
    return this.eventHistory
      .filter(event => event.source === source)
      .slice(-limit);
  }

  // Get events in time range
  getEventsByTimeRange(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    return this.eventHistory.filter(event => {
      const eventTime = new Date(event.timestamp);
      return eventTime >= start && eventTime <= end;
    });
  }

  // Clear event history
  clearHistory() {
    this.eventHistory = [];
    console.log('📋 Event history cleared');
  }

  // Get event statistics
  getEventStats() {
    const stats = {
      totalEvents: this.eventHistory.length,
      eventsByType: {},
      eventsBySource: {},
      recentEvents: this.getEventHistory(10)
    };

    this.eventHistory.forEach(event => {
      stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1;
      stats.eventsBySource[event.source] = (stats.eventsBySource[event.source] || 0) + 1;
    });

    return stats;
  }

  // Setup event listeners for different modules
  setupBookingListeners(bookingService) {
    this.on(BOOKING_EVENTS.CREATED, (event) => {
      console.log(`📅 New booking created: ${event.data.bookingId}`);
      // Future: Integrate with notification service
    });

    this.on(BOOKING_EVENTS.STATUS_CHANGED, (event) => {
      console.log(`🔄 Booking status changed: ${event.data.bookingId} from ${event.data.previousStatus} to ${event.data.newStatus}`);
      // Future: Integrate with notification service
    });

    this.on(BOOKING_EVENTS.CANCELLED, (event) => {
      console.log(`❌ Booking cancelled: ${event.data.bookingId}`);
      // Future: Integrate with notification service
    });
  }

  setupProfessionalListeners(professionalService) {
    this.on(PROFESSIONAL_EVENTS.LOCATION_UPDATED, (event) => {
      console.log(`📍 Professional location updated: ${event.data.professionalId}`);
      // Future: Integrate with geolocation service
    });

    this.on(PROFESSIONAL_EVENTS.STATUS_CHANGED, (event) => {
      console.log(`👨‍💼 Professional status changed: ${event.data.professionalId}`);
      // Future: Integrate with availability service
    });
  }

  setupUserListeners(userService) {
    this.on(USER_EVENTS.REGISTERED, (event) => {
      console.log(`👤 New user registered: ${event.data.userId}`);
      // Future: Integrate with welcome email service
    });

    this.on(USER_EVENTS.LOGGED_IN, (event) => {
      console.log(`🔐 User logged in: ${event.data.userId}`);
      // Future: Integrate with analytics service
    });
  }

  // Method to listen to any event (for debugging)
  onAny(callback) {
    const originalEmit = this.emit;
    this.emit = function(eventName, ...args) {
      callback(eventName, ...args);
      return originalEmit.call(this, eventName, ...args);
    };
  }
}

// Create singleton instance
const eventEmitter = new MiProfesionalEventEmitter();

module.exports = eventEmitter;
