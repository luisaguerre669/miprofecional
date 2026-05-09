// Core Constants Module - Enterprise System Constants
// Constantes globales del sistema para toda la aplicación

console.log("🔧 Core Constants Module - Enterprise System Constants");

// Application Constants
const APP = {
  NAME: 'MiProfesional',
  VERSION: process.env.APP_VERSION || '1.0.0',
  ENVIRONMENT: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 10000,
  API_PREFIX: '/api',
  API_VERSION: 'v1'
};

// Database Constants
const DATABASE = {
  NAME: 'miprofesional',
  CONNECTION_TIMEOUT: 30000,
  MAX_POOL_SIZE: 10,
  MIN_POOL_SIZE: 2,
  IDLE_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// JWT Constants
const JWT = {
  SECRET: process.env.JWT_SECRET || 'your-secret-key',
  ALGORITHM: 'HS256',
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  ISSUER: 'miprofesional',
  AUDIENCE: 'miprofesional-users'
};

// HTTP Constants
const HTTP = {
  METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
  },
  TIMEOUTS: {
    REQUEST: 30000,
    UPLOAD: 300000, // 5 minutes
    DOWNLOAD: 60000 // 1 minute
  }
};

// Pagination Constants
const PAGINATION = {
  DEFAULT_LIMIT: 20,
  DEFAULT_SKIP: 0,
  MAX_LIMIT: 100,
  DEFAULT_SORT: 'createdAt',
  DEFAULT_ORDER: 'desc'
};

// Booking Constants
const BOOKING = {
  STATUSES: {
    PENDING_LOCK: 'pending_lock',
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed'
  },
  VALID_TRANSITIONS: {
    'pending_lock': ['pending', 'cancelled'],
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['completed', 'cancelled'],
    'cancelled': [],
    'completed': []
  },
  TIME_CONSTRAINTS: {
    MIN_HOURS_AHEAD: 1,
    CANCELLATION_HOURS_AHEAD: 2,
    LOCK_TTL_SECONDS: 10
  },
  PRICING: {
    MIN_PRICE: 0,
    MAX_PRICE: 10000,
    DEFAULT_PRICE: 0
  }
};

// User Constants
const USER = {
  ROLES: {
    USER: 'user',
    PROFESSIONAL: 'professional',
    ADMIN: 'admin'
  },
  STATUSES: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    PENDING_VERIFICATION: 'pending_verification'
  },
  VALIDATION: {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,
    EMAIL_MAX_LENGTH: 100,
    PHONE_MAX_LENGTH: 20,
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128
  }
};

// Professional Constants
const PROFESSIONAL = {
  STATUSES: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    PENDING_VERIFICATION: 'pending_verification',
    VERIFIED: 'verified',
    SUSPENDED: 'suspended'
  },
  VERIFICATION: {
    REQUIRED_DOCUMENTS: ['id', 'license', 'proof_of_address'],
    MAX_UPLOAD_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_FORMATS: ['jpg', 'jpeg', 'png', 'pdf']
  },
  PRICING: {
    MIN_HOURLY_RATE: 0,
    MAX_HOURLY_RATE: 1000,
    DEFAULT_HOURLY_RATE: 50
  },
  AVAILABILITY: {
    MAX_BOOKINGS_PER_DAY: 12,
    MAX_ADVANCE_BOOKING_DAYS: 90,
    WORKING_HOURS_START: 6,
    WORKING_HOURS_END: 22
  }
};

// Service Categories
const CATEGORIES = {
  CONSTRUCTION: 'construction',
  PLUMBING: 'plumbing',
  ELECTRICITY: 'electricity',
  BEAUTY: 'beauty',
  PETS: 'pets',
  CLEANING: 'cleaning',
  GARDENING: 'gardening',
  TECHNOLOGY: 'technology',
  EDUCATION: 'education',
  HEALTH: 'health',
  TRANSPORT: 'transport',
  OTHER: 'other'
};

// Event System Constants
const EVENTS = {
  PRIORITIES: {
    HIGH: 'HIGH',
    NORMAL: 'NORMAL',
    LOW: 'LOW'
  },
  TYPES: {
    // User events
    USER_REGISTERED: 'USER_REGISTERED',
    USER_LOGGED_IN: 'USER_LOGGED_IN',
    USER_LOGGED_OUT: 'USER_LOGGED_OUT',
    USER_UPDATED: 'USER_UPDATED',
    
    // Professional events
    PROFESSIONAL_REGISTERED: 'PROFESSIONAL_REGISTERED',
    PROFESSIONAL_VERIFIED: 'PROFESSIONAL_VERIFIED',
    PROFESSIONAL_LOCATION_UPDATED: 'PROFESSIONAL_LOCATION_UPDATED',
    
    // Booking events
    BOOKING_CREATED: 'BOOKING_CREATED',
    BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
    BOOKING_CANCELLED: 'BOOKING_CANCELLED',
    BOOKING_COMPLETED: 'BOOKING_COMPLETED',
    BOOKING_UPDATED: 'BOOKING_UPDATED',
    
    // System events
    SYSTEM_ERROR: 'SYSTEM_ERROR',
    METRICS_COLLECTED: 'METRICS_COLLECTED',
    ANALYTICS_EVENT: 'ANALYTICS_EVENT'
  },
  RETRY: {
    MAX_ATTEMPTS: 2,
    BASE_DELAY: 1000,
    MAX_DELAY: 10000
  }
};

// Cache Constants
const CACHE = {
  KEYS: {
    USER_PROFILE: 'user:profile:',
    PROFESSIONAL_PROFILE: 'professional:profile:',
    PROFESSIONAL_AVAILABILITY: 'professional:availability:',
    BOOKING_DETAILS: 'booking:details:',
    SEARCH_RESULTS: 'search:results:'
  },
  TTL: {
    SHORT: 300, // 5 minutes
    MEDIUM: 1800, // 30 minutes
    LONG: 3600, // 1 hour
    VERY_LONG: 86400 // 24 hours
  }
};

// Rate Limiting Constants
const RATE_LIMITING = {
  WINDOWS: {
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000
  },
  LIMITS: {
    AUTH: {
      LOGIN: { attempts: 5, window: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
      REGISTER: { attempts: 3, window: 60 * 60 * 1000 } // 3 attempts per hour
    },
    API: {
      GENERAL: { requests: 1000, window: 60 * 1000 }, // 1000 requests per minute
      SEARCH: { requests: 100, window: 60 * 1000 }, // 100 searches per minute
      UPLOAD: { requests: 10, window: 60 * 1000 } // 10 uploads per minute
    }
  }
};

// File Upload Constants
const UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain'
  ],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt'],
  UPLOAD_PATH: './uploads',
  PROFILE_PICTURE_PATH: './uploads/profiles',
  DOCUMENT_PATH: './uploads/documents'
};

// Notification Constants
const NOTIFICATIONS = {
  TYPES: {
    EMAIL: 'email',
    SMS: 'sms',
    PUSH: 'push',
    IN_APP: 'in_app'
  },
  TEMPLATES: {
    BOOKING_CONFIRMED: 'booking_confirmed',
    BOOKING_CANCELLED: 'booking_cancelled',
    BOOKING_REMINDER: 'booking_reminder',
    PROFESSIONAL_VERIFIED: 'professional_verified',
    WELCOME_EMAIL: 'welcome_email'
  },
  RATE_LIMITS: {
    EMAIL: { max: 10, window: 60 * 60 * 1000 }, // 10 per hour
    SMS: { max: 5, window: 60 * 60 * 1000 }, // 5 per hour
    PUSH: { max: 100, window: 60 * 1000 } // 100 per minute
  }
};

// Validation Constants
const VALIDATION = {
  PATTERNS: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^\+?[\d\s\-\(\)]+$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    NAME: /^[a-zA-Z\s\-'\.]+$/,
    URL: /^https?:\/\/.*/,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  },
  LENGTHS: {
    NAME_MIN: 2,
    NAME_MAX: 50,
    DESCRIPTION_MIN: 10,
    DESCRIPTION_MAX: 1000,
    NOTES_MIN: 0,
    NOTES_MAX: 500
  }
};

// Logging Constants
const LOGGING = {
  LEVELS: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
  },
  FORMATS: {
    JSON: 'json',
    TEXT: 'text'
  },
  RETENTION: {
    DAYS: 30,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_FILES: 5
  }
};

// Metrics Constants
const METRICS = {
  COLLECTION_INTERVAL: 60000, // 1 minute
  RETENTION_PERIOD: 24 * 60 * 60 * 1000, // 24 hours
  ALERT_THRESHOLDS: {
    ERROR_RATE: 5, // 5%
    RESPONSE_TIME: 1000, // 1 second
    MEMORY_USAGE: 80, // 80%
    SLOW_QUERIES: 10 // count
  }
};

// Security Constants
const SECURITY = {
  CORS: {
    ALLOWED_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Request-ID'],
    MAX_AGE: 86400 // 24 hours
  },
  HELMET: {
    HSTS_MAX_AGE: 31536000, // 1 year
    CSP_DIRECTIVE: "default-src 'self'"
  },
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  SESSION_SECRET: process.env.SESSION_SECRET || 'your-session-secret'
};

// Business Logic Constants
const BUSINESS = {
  BOOKING: {
    MAX_CANCELLATION_HOURS: 2,
    MIN_ADVANCE_HOURS: 1,
    MAX_FUTURE_DAYS: 90,
    GRACE_PERIOD_MINUTES: 15
  },
  PAYMENT: {
    MIN_AMOUNT: 0,
    MAX_AMOUNT: 10000,
    CURRENCY: 'USD',
    PROCESSING_TIMEOUT: 30000 // 30 seconds
  },
  SEARCH: {
    MAX_RESULTS: 100,
    DEFAULT_RADIUS: 50, // km
    MIN_QUERY_LENGTH: 2
  }
};

// Environment-specific Constants
const ENVIRONMENT = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  
  get: (key, defaultValue = null) => {
    return process.env[key] || defaultValue;
  },
  
  getNumber: (key, defaultValue = 0) => {
    const value = process.env[key];
    return value ? parseInt(value, 10) : defaultValue;
  },
  
  getBoolean: (key, defaultValue = false) => {
    const value = process.env[key];
    return value ? value.toLowerCase() === 'true' : defaultValue;
  }
};

// Error Codes
const ERROR_CODES = {
  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_FIELD: 'MISSING_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_VALUE: 'INVALID_VALUE',
  
  // Authentication errors (401)
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Authorization errors (403)
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ACCESS_DENIED: 'ACCESS_DENIED',
  
  // Not found errors (404)
  NOT_FOUND: 'NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  PROFESSIONAL_NOT_FOUND: 'PROFESSIONAL_NOT_FOUND',
  
  // Conflict errors (409)
  CONFLICT: 'CONFLICT',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  TIME_SLOT_NOT_AVAILABLE: 'TIME_SLOT_NOT_AVAILABLE',
  USER_ALREADY_BOOKED: 'USER_ALREADY_BOOKED',
  
  // Business logic errors (400)
  BUSINESS_LOGIC_ERROR: 'BUSINESS_LOGIC_ERROR',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  LATE_CANCELLATION: 'LATE_CANCELLATION',
  FUTURE_COMPLETION: 'FUTURE_COMPLETION',
  PROFESSIONAL_NOT_AVAILABLE: 'PROFESSIONAL_NOT_AVAILABLE',
  
  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // System errors (500)
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  CIRCUIT_BREAKER_ERROR: 'CIRCUIT_BREAKER_ERROR'
};

// Success Codes
const SUCCESS_CODES = {
  OPERATION_SUCCESSFUL: 'OPERATION_SUCCESSFUL',
  RESOURCE_CREATED: 'RESOURCE_CREATED',
  RESOURCE_UPDATED: 'RESOURCE_UPDATED',
  RESOURCE_DELETED: 'RESOURCE_DELETED',
  PAYMENT_PROCESSED: 'PAYMENT_PROCESSED',
  NOTIFICATION_SENT: 'NOTIFICATION_SENT'
};

// Export all constants
module.exports = {
  APP,
  DATABASE,
  JWT,
  HTTP,
  PAGINATION,
  BOOKING,
  USER,
  PROFESSIONAL,
  CATEGORIES,
  EVENTS,
  CACHE,
  RATE_LIMITING,
  UPLOAD,
  NOTIFICATIONS,
  VALIDATION,
  LOGGING,
  METRICS,
  SECURITY,
  BUSINESS,
  ENVIRONMENT,
  ERROR_CODES,
  SUCCESS_CODES
};
