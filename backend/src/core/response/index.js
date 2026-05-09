// Core Response Module - Enterprise Response Standard
// Sistema estandarizado de respuestas API para toda la aplicación

console.log("📦 Core Response Module - Enterprise Response Standard");

class ResponseBuilder {
  constructor() {
    this.response = {
      success: true,
      timestamp: new Date().toISOString(),
      requestId: null
    };
  }

  /**
   * Set success status
   */
  setSuccess(success = true) {
    this.response.success = success;
    return this;
  }

  /**
   * Set message
   */
  setMessage(message) {
    this.response.message = message;
    return this;
  }

  /**
   * Set data payload
   */
  setData(data) {
    this.response.data = data;
    return this;
  }

  /**
   * Set error information
   */
  setError(error, code = null) {
    this.response.success = false;
    this.response.error = error;
    if (code) {
      this.response.code = code;
    }
    return this;
  }

  /**
   * Set request ID
   */
  setRequestId(requestId) {
    this.response.requestId = requestId;
    return this;
  }

  /**
   * Set pagination information
   */
  setPagination(pagination) {
    this.response.pagination = pagination;
    return this;
  }

  /**
   * Set metadata
   */
  setMetadata(metadata) {
    this.response.metadata = metadata;
    return this;
  }

  /**
   * Add warning
   */
  addWarning(warning) {
    if (!this.response.warnings) {
      this.response.warnings = [];
    }
    this.response.warnings.push(warning);
    return this;
  }

  /**
   * Build final response
   */
  build() {
    return this.response;
  }

  /**
   * Send HTTP response
   */
  send(res, statusCode = 200) {
    return res.status(statusCode).json(this.build());
  }

  /**
   * Create success response
   */
  static success(data = null, message = 'Operation successful', metadata = {}) {
    return new ResponseBuilder()
      .setSuccess(true)
      .setData(data)
      .setMessage(message)
      .setMetadata(metadata)
      .build();
  }

  /**
   * Create error response
   */
  static error(error, code = null, metadata = {}) {
    return new ResponseBuilder()
      .setSuccess(false)
      .setError(error, code)
      .setMetadata(metadata)
      .build();
  }

  /**
   * Create paginated response
   */
  static paginated(data, pagination, message = 'Data retrieved successfully') {
    return new ResponseBuilder()
      .setSuccess(true)
      .setData(data)
      .setMessage(message)
      .setPagination(pagination)
      .build();
  }

  /**
   * Create validation error response
   */
  static validationError(validationErrors, message = 'Validation failed') {
    return new ResponseBuilder()
      .setSuccess(false)
      .setError(message, 'VALIDATION_ERROR')
      .setMetadata({ validationErrors })
      .build();
  }

  /**
   * Create not found response
   */
  static notFound(resource = 'Resource', message = null) {
    const defaultMessage = message || `${resource} not found`;
    return new ResponseBuilder()
      .setSuccess(false)
      .setError(defaultMessage, 'NOT_FOUND')
      .build();
  }

  /**
   * Create unauthorized response
   */
  static unauthorized(message = 'Unauthorized access') {
    return new ResponseBuilder()
      .setSuccess(false)
      .setError(message, 'UNAUTHORIZED')
      .build();
  }

  /**
   * Create forbidden response
   */
  static forbidden(message = 'Access forbidden') {
    return new ResponseBuilder()
      .setSuccess(false)
      .setError(message, 'FORBIDDEN')
      .build();
  }

  /**
   * Create conflict response
   */
  static conflict(message = 'Resource conflict') {
    return new ResponseBuilder()
      .setSuccess(false)
      .setError(message, 'CONFLICT')
      .build();
  }

  /**
   * Create rate limit response
   */
  static rateLimit(limit, window, message = null) {
    const defaultMessage = message || `Rate limit exceeded. Limit: ${limit} requests per ${window}ms`;
    return new ResponseBuilder()
      .setSuccess(false)
      .setError(defaultMessage, 'RATE_LIMIT_EXCEEDED')
      .setMetadata({ limit, window })
      .build();
  }

  /**
   * Create server error response
   */
  static serverError(message = 'Internal server error') {
    return new ResponseBuilder()
      .setSuccess(false)
      .setError(message, 'INTERNAL_SERVER_ERROR')
      .build();
  }
}

// Response Helper Functions
const sendSuccess = (res, data = null, message = 'Operation successful', statusCode = 200) => {
  return ResponseBuilder.success(data, message).send(res, statusCode);
};

const sendError = (res, error, code = null, statusCode = 500) => {
  return ResponseBuilder.error(error, code).send(res, statusCode);
};

const sendPaginated = (res, data, pagination, message = 'Data retrieved successfully') => {
  return ResponseBuilder.paginated(data, pagination, message).send(res, 200);
};

const sendValidationError = (res, validationErrors, message = 'Validation failed') => {
  return ResponseBuilder.validationError(validationErrors, message).send(res, 400);
};

const sendNotFound = (res, resource = 'Resource', message = null) => {
  return ResponseBuilder.notFound(resource, message).send(res, 404);
};

const sendUnauthorized = (res, message = 'Unauthorized access') => {
  return ResponseBuilder.unauthorized(message).send(res, 401);
};

const sendForbidden = (res, message = 'Access forbidden') => {
  return ResponseBuilder.forbidden(message).send(res, 403);
};

const sendConflict = (res, message = 'Resource conflict') => {
  return ResponseBuilder.conflict(message).send(res, 409);
};

const sendRateLimit = (res, limit, window, message = null) => {
  return ResponseBuilder.rateLimit(limit, window, message).send(res, 429);
};

const sendServerError = (res, message = 'Internal server error') => {
  return ResponseBuilder.serverError(message).send(res, 500);
};

// Response Middleware
const responseMiddleware = (req, res, next) => {
  // Add response helpers to response object
  res.sendSuccess = (data, message, statusCode) => sendSuccess(res, data, message, statusCode);
  res.sendError = (error, code, statusCode) => sendError(res, error, code, statusCode);
  res.sendPaginated = (data, pagination, message) => sendPaginated(res, data, pagination, message);
  res.sendValidationError = (validationErrors, message) => sendValidationError(res, validationErrors, message);
  res.sendNotFound = (resource, message) => sendNotFound(res, resource, message);
  res.sendUnauthorized = (message) => sendUnauthorized(res, message);
  res.sendForbidden = (message) => sendForbidden(res, message);
  res.sendConflict = (message) => sendConflict(res, message);
  res.sendRateLimit = (limit, window, message) => sendRateLimit(res, limit, window, message);
  res.sendServerError = (message) => sendServerError(res, message);
  
  // Add request ID to response
  const originalJson = res.json;
  res.json = function(data) {
    if (req.requestId && typeof data === 'object') {
      data.requestId = req.requestId;
    }
    return originalJson.call(this, data);
  };
  
  next();
};

// Response Validation
const validateResponse = (response) => {
  const required = ['success', 'timestamp'];
  const missing = required.filter(field => !(field in response));
  
  if (missing.length > 0) {
    throw new Error(`Response missing required fields: ${missing.join(', ')}`);
  }
  
  return true;
};

// Response Statistics
class ResponseStats {
  constructor() {
    this.stats = {
      total: 0,
      success: 0,
      error: 0,
      byStatusCode: {},
      byEndpoint: {},
      avgResponseTime: 0,
      responseTimes: []
    };
  }

  record(statusCode, responseTime, endpoint = null) {
    this.stats.total++;
    
    // By status code
    this.stats.byStatusCode[statusCode] = (this.stats.byStatusCode[statusCode] || 0) + 1;
    
    // By endpoint
    if (endpoint) {
      this.stats.byEndpoint[endpoint] = this.stats.byEndpoint[endpoint] || 0;
      this.stats.byEndpoint[endpoint]++;
    }
    
    // Success/error count
    if (statusCode < 400) {
      this.stats.success++;
    } else {
      this.stats.error++;
    }
    
    // Response time
    this.stats.responseTimes.push(responseTime);
    if (this.stats.responseTimes.length > 1000) {
      this.stats.responseTimes = this.stats.responseTimes.slice(-1000);
    }
    
    // Average response time
    this.stats.avgResponseTime = 
      this.stats.responseTimes.reduce((a, b) => a + b, 0) / this.stats.responseTimes.length;
  }

  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.total > 0 ? (this.stats.success / this.stats.total * 100).toFixed(2) + '%' : '0%',
      errorRate: this.stats.total > 0 ? (this.stats.error / this.stats.total * 100).toFixed(2) + '%' : '0%',
      avgResponseTime: this.stats.avgResponseTime.toFixed(2) + 'ms',
      timestamp: new Date().toISOString()
    };
  }

  reset() {
    this.stats = {
      total: 0,
      success: 0,
      error: 0,
      byStatusCode: {},
      byEndpoint: {},
      avgResponseTime: 0,
      responseTimes: []
    };
  }
}

const responseStats = new ResponseStats();

module.exports = {
  // Response Builder
  ResponseBuilder,
  
  // Helper Functions
  sendSuccess,
  sendError,
  sendPaginated,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendConflict,
  sendRateLimit,
  sendServerError,
  
  // Middleware
  responseMiddleware,
  
  // Utilities
  validateResponse,
  responseStats
};
