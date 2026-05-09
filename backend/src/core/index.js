// Core Module Index - Enterprise Core System Entry Point
// Punto de entrada unificado para el sistema core empresarial

console.log("🏗️ Core Module Index - Enterprise Core System Entry Point");

const { 
  BaseError, 
  ErrorFactory, 
  errorHandler, 
  asyncErrorWrapper,
  validateRequired,
  errorStats 
} = require('./errors');

const { 
  ResponseBuilder,
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
  responseMiddleware,
  validateResponse,
  responseStats
} = require('./response');

const {
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
} = require('./constants');

// Create unified core system interface
class CoreSystem {
  constructor() {
    this.name = 'core-system';
    this.initialized = false;
    
    // Core components
    this.errors = {
      BaseError,
      ErrorFactory,
      errorHandler,
      asyncErrorWrapper,
      validateRequired,
      stats: errorStats
    };
    
    this.response = {
      ResponseBuilder,
      helpers: {
        sendSuccess,
        sendError,
        sendPaginated,
        sendValidationError,
        sendNotFound,
        sendUnauthorized,
        sendForbidden,
        sendConflict,
        sendRateLimit,
        sendServerError
      },
      middleware: responseMiddleware,
      validate: validateResponse,
      stats: responseStats
    };
    
    this.constants = {
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
    
    this.init();
  }

  init() {
    console.log(`🏗️ [${this.name}] Core system initialized`);
    this.initialized = true;
  }

  /**
   * Get comprehensive system status
   */
  getStatus() {
    return {
      name: this.name,
      initialized: this.initialized,
      environment: this.constants.APP.ENVIRONMENT,
      version: this.constants.APP.VERSION,
      components: {
        errors: this.errors.stats.getStats(),
        response: this.response.stats.getStats()
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    const errorStats = this.errors.stats.getStats();
    const responseStats = this.response.stats.getStats();
    
    let status = 'healthy';
    let issues = [];
    
    // Check error rate
    const errorRate = parseFloat(errorStats.errorRate);
    if (errorRate > 10) {
      status = 'critical';
      issues.push(`High error rate: ${errorStats.errorRate}`);
    }
    
    // Check response success rate
    const successRate = parseFloat(responseStats.successRate);
    if (successRate < 95) {
      status = 'warning';
      issues.push(`Low success rate: ${responseStats.successRate}`);
    }
    
    return {
      status,
      issues,
      environment: this.constants.APP.ENVIRONMENT,
      version: this.constants.APP.VERSION,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset all statistics
   */
  resetStats() {
    this.errors.stats.reset();
    this.response.stats.reset();
    
    console.log(`🏗️ [${this.name}] All core statistics reset`);
  }

  /**
   * Validate system configuration
   */
  validateConfig() {
    const issues = [];
    
    // Validate required environment variables
    const requiredEnvVars = ['JWT_SECRET'];
    
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        issues.push(`Missing required environment variable: ${envVar}`);
      }
    }
    
    // Validate configuration values
    if (this.constants.JWT.SECRET === 'your-secret-key') {
      issues.push('JWT_SECRET is using default value - should be changed in production');
    }
    
    return {
      valid: issues.length === 0,
      issues,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get system information
   */
  getSystemInfo() {
    return {
      application: {
        name: this.constants.APP.NAME,
        version: this.constants.APP.VERSION,
        environment: this.constants.APP.ENVIRONMENT,
        port: this.constants.APP.PORT
      },
      database: {
        name: this.constants.DATABASE.NAME,
        timeout: this.constants.DATABASE.CONNECTION_TIMEOUT,
        maxPoolSize: this.constants.DATABASE.MAX_POOL_SIZE
      },
      jwt: {
        algorithm: this.constants.JWT.ALGORITHM,
        expiresIn: this.constants.JWT.EXPIRES_IN,
        issuer: this.constants.JWT.ISSUER
      },
      features: {
        rateLimiting: true,
        validation: true,
        errorHandling: true,
        responseStandardization: true,
        logging: true,
        metrics: true
      },
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const coreSystem = new CoreSystem();

module.exports = {
  // Classes
  CoreSystem,
  
  // Instances
  coreSystem,
  
  // Errors Module
  BaseError,
  ErrorFactory,
  errorHandler,
  asyncErrorWrapper,
  validateRequired,
  errorStats,
  
  // Response Module
  ResponseBuilder,
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
  responseMiddleware,
  validateResponse,
  responseStats,
  
  // Constants
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
