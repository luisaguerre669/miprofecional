// Core Errors Module - Enterprise Error Handling
// Sistema centralizado de errores para toda la aplicación

console.log("🛡️ Core Errors Module - Enterprise Error Handling");

class BaseError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500, metadata = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.metadata = metadata;
    this.timestamp = new Date().toISOString();
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      metadata: this.metadata,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

// Validation Errors
class ValidationError extends BaseError {
  constructor(message, field = null, metadata = {}) {
    super(message, 'VALIDATION_ERROR', 400, { field, ...metadata });
  }
}

class RequiredFieldError extends ValidationError {
  constructor(field, metadata = {}) {
    super(`Field '${field}' is required`, field, metadata);
  }
}

class InvalidFormatError extends ValidationError {
  constructor(field, expectedFormat, metadata = {}) {
    super(`Field '${field}' has invalid format. Expected: ${expectedFormat}`, field, metadata);
  }
}

// Authentication Errors
class AuthenticationError extends BaseError {
  constructor(message = 'Authentication failed', metadata = {}) {
    super(message, 'AUTHENTICATION_ERROR', 401, metadata);
  }
}

class InvalidTokenError extends AuthenticationError {
  constructor(metadata = {}) {
    super('Invalid or expired token', metadata);
  }
}

class InsufficientPermissionsError extends BaseError {
  constructor(resource, action, metadata = {}) {
    super(`Insufficient permissions to ${action} ${resource}`, 'INSUFFICIENT_PERMISSIONS', 403, { resource, action, ...metadata });
  }
}

// Not Found Errors
class NotFoundError extends BaseError {
  constructor(resource, id = null, metadata = {}) {
    const message = id ? `${resource} with ID '${id}' not found` : `${resource} not found`;
    super(message, 'NOT_FOUND', 404, { resource, id, ...metadata });
  }
}

class UserNotFoundError extends NotFoundError {
  constructor(id = null, metadata = {}) {
    super('User', id, metadata);
  }
}

class BookingNotFoundError extends NotFoundError {
  constructor(id = null, metadata = {}) {
    super('Booking', id, metadata);
  }
}

class ProfessionalNotFoundError extends NotFoundError {
  constructor(id = null, metadata = {}) {
    super('Professional', id, metadata);
  }
}

// Conflict Errors
class ConflictError extends BaseError {
  constructor(message, metadata = {}) {
    super(message, 'CONFLICT', 409, metadata);
  }
}

class DuplicateResourceError extends ConflictError {
  constructor(resource, field, value, metadata = {}) {
    super(`Duplicate ${resource} with ${field}: ${value}`, { resource, field, value, ...metadata });
  }
}

class TimeSlotNotAvailableError extends ConflictError {
  constructor(professionalId, date, metadata = {}) {
    super(`Time slot not available for professional ${professionalId} at ${date}`, { professionalId, date, ...metadata });
  }
}

class UserAlreadyBookedError extends ConflictError {
  constructor(date, metadata = {}) {
    super(`User already has a booking at ${date}`, { date, ...metadata });
  }
}

// Business Logic Errors
class BusinessLogicError extends BaseError {
  constructor(message, metadata = {}) {
    super(message, 'BUSINESS_LOGIC_ERROR', 400, metadata);
  }
}

class InvalidStatusTransitionError extends BusinessLogicError {
  constructor(currentStatus, newStatus, metadata = {}) {
    super(`Cannot transition from '${currentStatus}' to '${newStatus}'`, { currentStatus, newStatus, ...metadata });
  }
}

class LateCancellationError extends BusinessLogicError {
  constructor(cutoffTime, metadata = {}) {
    super(`Cannot cancel booking. Must be cancelled at least ${cutoffTime} in advance`, { cutoffTime, ...metadata });
  }
}

class FutureCompletionError extends BusinessLogicError {
  constructor(metadata = {}) {
    super('Cannot complete booking that is scheduled for the future', metadata);
  }
}

class ProfessionalNotAvailableError extends BusinessLogicError {
  constructor(professionalId, metadata = {}) {
    super(`Professional ${professionalId} is not available for bookings`, { professionalId, ...metadata });
  }
}

// System Errors
class SystemError extends BaseError {
  constructor(message, metadata = {}) {
    super(message, 'SYSTEM_ERROR', 500, metadata);
  }
}

class DatabaseError extends SystemError {
  constructor(message, operation, metadata = {}) {
    super(`Database error during ${operation}: ${message}`, { operation, ...metadata });
  }
}

class ExternalServiceError extends SystemError {
  constructor(service, message, metadata = {}) {
    super(`External service '${service}' error: ${message}`, { service, ...metadata });
  }
}

class CircuitBreakerError extends SystemError {
  constructor(service, metadata = {}) {
    super(`Circuit breaker is OPEN for service: ${service}`, { service, ...metadata });
  }
}

// Rate Limiting Errors
class RateLimitError extends BaseError {
  constructor(limit, window, metadata = {}) {
    super(`Rate limit exceeded. Limit: ${limit} requests per ${window}ms`, 'RATE_LIMIT_EXCEEDED', 429, { limit, window, ...metadata });
  }
}

// Timeout Errors
class TimeoutError extends SystemError {
  constructor(operation, timeout, metadata = {}) {
    super(`Operation '${operation}' timed out after ${timeout}ms`, { operation, timeout, ...metadata });
  }
}

// Error Factory
class ErrorFactory {
  static create(errorType, ...args) {
    const errorClasses = {
      ValidationError,
      RequiredFieldError,
      InvalidFormatError,
      AuthenticationError,
      InvalidTokenError,
      InsufficientPermissionsError,
      NotFoundError,
      UserNotFoundError,
      BookingNotFoundError,
      ProfessionalNotFoundError,
      ConflictError,
      DuplicateResourceError,
      TimeSlotNotAvailableError,
      UserAlreadyBookedError,
      BusinessLogicError,
      InvalidStatusTransitionError,
      LateCancellationError,
      FutureCompletionError,
      ProfessionalNotAvailableError,
      SystemError,
      DatabaseError,
      ExternalServiceError,
      CircuitBreakerError,
      RateLimitError,
      TimeoutError
    };

    const ErrorClass = errorClasses[errorType];
    if (!ErrorClass) {
      return new BaseError(...args);
    }

    return new ErrorClass(...args);
  }

  static fromError(error) {
    // Convert plain Error to appropriate error class
    if (error instanceof BaseError) {
      return error;
    }

    // Handle common error patterns
    if (error.name === 'ValidationError') {
      return new ValidationError(error.message);
    }

    if (error.name === 'CastError') {
      return new ValidationError(`Invalid data format: ${error.message}`);
    }

    if (error.code === 11000) {
      // MongoDB duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      return new DuplicateResourceError('Resource', field, value);
    }

    // Default to system error
    return new SystemError(error.message, { originalError: error });
  }
}

// Error Handler Middleware
const errorHandler = (error, req, res, next) => {
  // Convert error to appropriate error class
  const appError = ErrorFactory.fromError(error);

  // Log error
  console.error('🛡️ [error-handler] Error occurred:', {
    error: appError.toJSON(),
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Send error response
  res.status(appError.statusCode).json({
    success: false,
    error: appError.message,
    code: appError.code,
    timestamp: appError.timestamp,
    ...(process.env.NODE_ENV === 'development' && {
      stack: appError.stack,
      metadata: appError.metadata
    })
  });
};

// Async Error Wrapper
const asyncErrorWrapper = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation Helper
const validateRequired = (data, requiredFields) => {
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    throw new RequiredFieldError(missingFields.join(', '));
  }
};

// Error Statistics
class ErrorStats {
  constructor() {
    this.stats = {
      total: 0,
      byType: {},
      byCode: {},
      byHour: {},
      recent: []
    };
  }

  record(error) {
    this.stats.total++;
    
    // By type
    const type = error.constructor.name;
    this.stats.byType[type] = (this.stats.byType[type] || 0) + 1;
    
    // By code
    const code = error.code || 'UNKNOWN';
    this.stats.byCode[code] = (this.stats.byCode[code] || 0) + 1;
    
    // By hour
    const hour = new Date().getHours();
    this.stats.byHour[hour] = (this.stats.byHour[hour] || 0) + 1;
    
    // Recent errors (keep last 100)
    this.stats.recent.unshift({
      timestamp: new Date().toISOString(),
      type,
      code: error.code,
      message: error.message
    });
    
    if (this.stats.recent.length > 100) {
      this.stats.recent = this.stats.recent.slice(0, 100);
    }
  }

  getStats() {
    return {
      ...this.stats,
      timestamp: new Date().toISOString()
    };
  }

  reset() {
    this.stats = {
      total: 0,
      byType: {},
      byCode: {},
      byHour: {},
      recent: []
    };
  }
}

const errorStats = new ErrorStats();

module.exports = {
  // Base Error Class
  BaseError,
  
  // Validation Errors
  ValidationError,
  RequiredFieldError,
  InvalidFormatError,
  
  // Authentication Errors
  AuthenticationError,
  InvalidTokenError,
  InsufficientPermissionsError,
  
  // Not Found Errors
  NotFoundError,
  UserNotFoundError,
  BookingNotFoundError,
  ProfessionalNotFoundError,
  
  // Conflict Errors
  ConflictError,
  DuplicateResourceError,
  TimeSlotNotAvailableError,
  UserAlreadyBookedError,
  
  // Business Logic Errors
  BusinessLogicError,
  InvalidStatusTransitionError,
  LateCancellationError,
  FutureCompletionError,
  ProfessionalNotAvailableError,
  
  // System Errors
  SystemError,
  DatabaseError,
  ExternalServiceError,
  CircuitBreakerError,
  
  // Rate Limiting & Timeout
  RateLimitError,
  TimeoutError,
  
  // Utilities
  ErrorFactory,
  errorHandler,
  asyncErrorWrapper,
  validateRequired,
  errorStats
};
