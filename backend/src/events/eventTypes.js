// Event Types - Event-Driven Architecture Preparation
// Defines all base events for future microservices migration

/**
 * Base Event Structure
 * All events should follow this structure:
 * {
 *   type: 'event.type',
 *   data: { ...eventData },
 *   timestamp: 'ISO string',
 *   source: 'service.name',
 *   version: '1.0'
 * }
 */

// Booking Events
const BOOKING_EVENTS = {
  CREATED: 'booking.created',
  UPDATED: 'booking.updated',
  CANCELLED: 'booking.cancelled',
  CONFIRMED: 'booking.confirmed',
  COMPLETED: 'booking.completed',
  STATUS_CHANGED: 'booking.status.changed',
  PAYMENT_INITIATED: 'booking.payment.initiated',
  PAYMENT_COMPLETED: 'booking.payment.completed'
};

// Professional Events
const PROFESSIONAL_EVENTS = {
  REGISTERED: 'professional.registered',
  VERIFIED: 'professional.verified',
  LOCATION_UPDATED: 'professional.location.updated',
  STATUS_CHANGED: 'professional.status.changed',
  AVAILABILITY_UPDATED: 'professional.availability.updated',
  RATING_UPDATED: 'professional.rating.updated',
  PROFILE_UPDATED: 'professional.profile.updated'
};

// User Events
const USER_EVENTS = {
  REGISTERED: 'user.registered',
  LOGGED_IN: 'user.logged.in',
  LOGGED_OUT: 'user.logged.out',
  PROFILE_UPDATED: 'user.profile.updated',
  PREFERENCES_UPDATED: 'user.preferences.updated',
  PASSWORD_CHANGED: 'user.password.changed',
  ACCOUNT_SUSPENDED: 'user.account.suspended',
  ACCOUNT_REACTIVATED: 'user.account.reactivated'
};

// Auth Events (specific to authentication flow)
const AUTH_EVENTS = {
  USER_REGISTERED: 'auth.user.registered',
  USER_LOGGED_IN: 'auth.user.logged.in',
  USER_LOGGED_OUT: 'auth.user.logged.out',
  TOKEN_REFRESHED: 'auth.token.refreshed',
  TOKEN_EXPIRED: 'auth.token.expired',
  LOGIN_FAILED: 'auth.login.failed',
  REGISTRATION_FAILED: 'auth.registration.failed'
};

// Geolocation Events
const GEOLOCATION_EVENTS = {
  PROFESSIONAL_NEARBY: 'geolocation.professional.nearby',
  LOCATION_SEARCH_INITIATED: 'geolocation.search.initiated',
  LOCATION_SEARCH_COMPLETED: 'geolocation.search.completed',
  DISTANCE_CALCULATED: 'geolocation.distance.calculated',
  AREA_COVERAGE_UPDATED: 'geolocation.area.coverage.updated'
};

// Real-time Events
const REALTIME_EVENTS = {
  PROFESSIONAL_ONLINE: 'realtime.professional.online',
  PROFESSIONAL_OFFLINE: 'realtime.professional.offline',
  TRACKING_STARTED: 'realtime.tracking.started',
  TRACKING_STOPPED: 'realtime.tracking.stopped',
  CONNECTION_ESTABLISHED: 'realtime.connection.established',
  CONNECTION_LOST: 'realtime.connection.lost'
};

// Notification Events
const NOTIFICATION_EVENTS = {
  BOOKING_REQUESTED: 'notification.booking.requested',
  BOOKING_CONFIRMED: 'notification.booking.confirmed',
  BOOKING_CANCELLED: 'notification.booking.cancelled',
  BOOKING_REMINDER: 'notification.booking.reminder',
  PROFESSIONAL_AVAILABLE: 'notification.professional.available',
  PAYMENT_REQUIRED: 'notification.payment.required',
  SYSTEM_ALERT: 'notification.system.alert'
};

// System Events
const SYSTEM_EVENTS = {
  SERVICE_STARTED: 'system.service.started',
  SERVICE_STOPPED: 'system.service.stopped',
  HEALTH_CHECK: 'system.health.check',
  ERROR_OCCURRED: 'system.error.occurred',
  PERFORMANCE_METRICS: 'system.performance.metrics',
  DATABASE_CONNECTED: 'system.database.connected',
  DATABASE_DISCONNECTED: 'system.database.disconnected'
};

// Event Categories (for organization)
const EVENT_CATEGORIES = {
  BOOKING: 'booking',
  PROFESSIONAL: 'professional',
  USER: 'user',
  AUTH: 'auth',
  GEOLOCATION: 'geolocation',
  REALTIME: 'realtime',
  NOTIFICATION: 'notification',
  SYSTEM: 'system'
};

// Event Priorities
const EVENT_PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Event Schemas (for validation)
const EVENT_SCHEMAS = {
  [BOOKING_EVENTS.CREATED]: {
    required: ['bookingId', 'userId', 'professionalId', 'service', 'date'],
    optional: ['price', 'notes']
  },
  [BOOKING_EVENTS.STATUS_CHANGED]: {
    required: ['bookingId', 'previousStatus', 'newStatus', 'changedBy'],
    optional: ['reason']
  },
  [PROFESSIONAL_EVENTS.LOCATION_UPDATED]: {
    required: ['professionalId', 'location'],
    optional: ['previousLocation']
  },
  [USER_EVENTS.REGISTERED]: {
    required: ['userId', 'email', 'name'],
    optional: ['phone', 'location']
  },
  [REALTIME_EVENTS.PROFESSIONAL_ONLINE]: {
    required: ['professionalId', 'socketId'],
    optional: ['metadata']
  }
};

// Event Registry (for future event bus implementation)
class EventRegistry {
  constructor() {
    this.events = new Map();
    this.handlers = new Map();
    this.registerBaseEvents();
  }

  registerBaseEvents() {
    // Register all event types
    Object.values(BOOKING_EVENTS).forEach(event => {
      this.events.set(event, {
        category: EVENT_CATEGORIES.BOOKING,
        priority: EVENT_PRIORITIES.NORMAL,
        schema: EVENT_SCHEMAS[event] || null
      });
    });

    Object.values(PROFESSIONAL_EVENTS).forEach(event => {
      this.events.set(event, {
        category: EVENT_CATEGORIES.PROFESSIONAL,
        priority: EVENT_PRIORITIES.NORMAL,
        schema: EVENT_SCHEMAS[event] || null
      });
    });

    Object.values(USER_EVENTS).forEach(event => {
      this.events.set(event, {
        category: EVENT_CATEGORIES.USER,
        priority: EVENT_PRIORITIES.NORMAL,
        schema: EVENT_SCHEMAS[event] || null
      });
    });

    Object.values(GEOLOCATION_EVENTS).forEach(event => {
      this.events.set(event, {
        category: EVENT_CATEGORIES.GEOLOCATION,
        priority: EVENT_PRIORITIES.NORMAL,
        schema: EVENT_SCHEMAS[event] || null
      });
    });

    Object.values(REALTIME_EVENTS).forEach(event => {
      this.events.set(event, {
        category: EVENT_CATEGORIES.REALTIME,
        priority: EVENT_PRIORITIES.HIGH,
        schema: EVENT_SCHEMAS[event] || null
      });
    });

    Object.values(NOTIFICATION_EVENTS).forEach(event => {
      this.events.set(event, {
        category: EVENT_CATEGORIES.NOTIFICATION,
        priority: EVENT_PRIORITIES.NORMAL,
        schema: EVENT_SCHEMAS[event] || null
      });
    });

    Object.values(SYSTEM_EVENTS).forEach(event => {
      this.events.set(event, {
        category: EVENT_CATEGORIES.SYSTEM,
        priority: EVENT_PRIORITIES.NORMAL,
        schema: EVENT_SCHEMAS[event] || null
      });
    });
  }

  getEventInfo(eventType) {
    return this.events.get(eventType);
  }

  getAllEvents() {
    return Array.from(this.events.keys());
  }

  getEventsByCategory(category) {
    return Array.from(this.events.entries())
      .filter(([_, info]) => info.category === category)
      .map(([eventType, _]) => eventType);
  }
}

// Event Builder Helper
class EventBuilder {
  static create(type, data, source = 'unknown') {
    return {
      type,
      data,
      timestamp: new Date().toISOString(),
      source,
      version: '1.0',
      id: this.generateEventId()
    };
  }

  static generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static validate(event) {
    const eventType = event.type;
    const schema = EVENT_SCHEMAS[eventType];
    
    if (!schema) {
      return { valid: true, errors: [] }; // No schema defined
    }

    const errors = [];
    
    // Check required fields
    if (schema.required) {
      schema.required.forEach(field => {
        if (!event.data || !event.data[field]) {
          errors.push(`Missing required field: ${field}`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = {
  // Event Types
  BOOKING_EVENTS,
  PROFESSIONAL_EVENTS,
  USER_EVENTS,
  AUTH_EVENTS,
  GEOLOCATION_EVENTS,
  REALTIME_EVENTS,
  NOTIFICATION_EVENTS,
  SYSTEM_EVENTS,

  // Event Organization
  EVENT_CATEGORIES,
  EVENT_PRIORITIES,
  EVENT_SCHEMAS,

  // Event Infrastructure
  EventRegistry,
  EventBuilder
};
