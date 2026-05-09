// Enterprise Gateway - Hardened Network Layer
// Gateway resiliente con solo routing + circuit breaker + fallback

console.log("🚪 Enterprise Gateway - Hardened Network Layer");

const CircuitBreaker = require('./circuitBreaker');

class EnterpriseGateway {
  constructor(config = {}) {
    this.name = 'enterprise-gateway';
    this.config = {
      enableCircuitBreaker: config.enableCircuitBreaker !== false,
      circuitBreakerThreshold: config.circuitBreakerThreshold || 5,
      circuitBreakerTimeout: config.circuitBreakerTimeout || 60000, // 1 minute
      enableFallback: config.enableFallback !== false,
      fallbackTimeout: config.fallbackTimeout || 5000,
      enableMetrics: config.enableMetrics !== false,
      ...config
    };
    
    // Circuit breakers for different services
    this.circuitBreakers = new Map();
    
    // Route registry
    this.routes = new Map();
    
    // Fallback handlers
    this.fallbackHandlers = new Map();
    
    // Statistics
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      circuitBreakerTrips: 0,
      fallbackActivations: 0,
      avgResponseTime: 0,
      requestsByRoute: {},
      errorsByType: {}
    };
    
    // Initialize
    this.init();
  }

  init() {
    console.log(`🚪 [${this.name}] Gateway initialized:`, {
      circuitBreakerEnabled: this.config.enableCircuitBreaker,
      fallbackEnabled: this.config.enableFallback,
      metricsEnabled: this.config.enableMetrics
    });
  }

  /**
   * Register route with circuit breaker
   */
  registerRoute(path, handler, options = {}) {
    const routeConfig = {
      path,
      handler,
      method: options.method || 'GET',
      timeout: options.timeout || 30000,
      retries: options.retries || 0,
      circuitBreaker: options.circuitBreaker !== false,
      fallback: options.fallback,
      metadata: options.metadata || {}
    };
    
    // Create circuit breaker for this route
    if (routeConfig.circuitBreaker && this.config.enableCircuitBreaker) {
      const circuitBreaker = new CircuitBreaker({
        threshold: options.circuitBreakerThreshold || this.config.circuitBreakerThreshold,
        timeout: options.circuitBreakerTimeout || this.config.circuitBreakerTimeout,
        onTrip: () => this.onCircuitBreakerTrip(path),
        onReset: () => this.onCircuitBreakerReset(path)
      });
      
      this.circuitBreakers.set(path, circuitBreaker);
    }
    
    // Register fallback handler
    if (routeConfig.fallback && this.config.enableFallback) {
      this.fallbackHandlers.set(path, routeConfig.fallback);
    }
    
    // Register route
    this.routes.set(path, routeConfig);
    
    console.log(`🚪 [${this.name}] Route registered: ${path} (${routeConfig.method})`);
  }

  /**
   * Handle incoming request
   */
  async handleRequest(req, res) {
    const startTime = Date.now();
    const path = req.path;
    const method = req.method;
    
    try {
      // Update statistics
      this.stats.totalRequests++;
      
      // Find matching route
      const route = this.findRoute(path, method);
      
      if (!route) {
        return this.sendErrorResponse(res, 404, 'Route not found', 'ROUTE_NOT_FOUND');
      }
      
      // Update route statistics
      const routeKey = `${method} ${path}`;
      if (!this.stats.requestsByRoute[routeKey]) {
        this.stats.requestsByRoute[routeKey] = 0;
      }
      this.stats.requestsByRoute[routeKey]++;
      
      // Check circuit breaker
      if (route.circuitBreaker) {
        const circuitBreaker = this.circuitBreakers.get(path);
        if (circuitBreaker && circuitBreaker.isOpen()) {
          return this.handleCircuitBreakerOpen(req, res, route);
        }
      }
      
      // Execute request handler
      const result = await this.executeHandler(req, res, route);
      
      // Update success statistics
      this.stats.successfulRequests++;
      this.updateResponseTimeStats(Date.now() - startTime);
      
      return result;
      
    } catch (error) {
      // Update error statistics
      this.stats.failedRequests++;
      this.updateErrorStats(error);
      
      // Try fallback if available
      const route = this.findRoute(path, method);
      if (route && this.fallbackHandlers.has(path)) {
        return this.handleFallback(req, res, error, route);
      }
      
      // Send error response
      return this.sendErrorResponse(res, 500, 'Internal server error', 'INTERNAL_ERROR', error);
    }
  }

  /**
   * Find matching route
   */
  findRoute(path, method) {
    // Exact match first
    const exactKey = `${method} ${path}`;
    if (this.routes.has(exactKey)) {
      return this.routes.get(exactKey);
    }
    
    // Path match (any method)
    if (this.routes.has(path)) {
      return this.routes.get(path);
    }
    
    // Pattern matching (simplified)
    for (const [routePath, routeConfig] of this.routes.entries()) {
      if (this.pathMatches(path, routePath)) {
        return routeConfig;
      }
    }
    
    return null;
  }

  /**
   * Check if path matches route pattern
   */
  pathMatches(path, pattern) {
    // Simple pattern matching - can be enhanced with regex
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(path);
    }
    
    return path === pattern;
  }

  /**
   * Execute request handler with circuit breaker
   */
  async executeHandler(req, res, route) {
    const circuitBreaker = this.circuitBreakers.get(route.path);
    
    if (circuitBreaker) {
      return await circuitBreaker.execute(async () => {
        return await route.handler(req, res);
      });
    } else {
      return await route.handler(req, res);
    }
  }

  /**
   * Handle circuit breaker open state
   */
  async handleCircuitBreakerOpen(req, res, route) {
    console.warn(`🚪 [${this.name}] Circuit breaker OPEN for ${route.path}`);
    
    // Try fallback first
    if (this.fallbackHandlers.has(route.path)) {
      return this.handleFallback(req, res, new Error('Circuit breaker open'), route);
    }
    
    // Send circuit breaker error
    return this.sendErrorResponse(res, 503, 'Service temporarily unavailable', 'CIRCUIT_BREAKER_OPEN');
  }

  /**
   * Handle fallback execution
   */
  async handleFallback(req, res, error, route) {
    const fallbackHandler = this.fallbackHandlers.get(route.path);
    
    try {
      console.log(`🚪 [${this.name}] Executing fallback for ${route.path}`);
      this.stats.fallbackActivations++;
      
      // Execute fallback with timeout
      const result = await this.executeWithTimeout(
        fallbackHandler(req, res, error),
        this.config.fallbackTimeout
      );
      
      return result;
      
    } catch (fallbackError) {
      console.error(`🚪 [${this.name}] Fallback failed for ${route.path}:`, fallbackError);
      
      // Send fallback error
      return this.sendErrorResponse(res, 503, 'Service unavailable', 'FALLBACK_FAILED', fallbackError);
    }
  }

  /**
   * Execute with timeout
   */
  async executeWithTimeout(promise, timeout) {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Handler timeout')), timeout)
      )
    ]);
  }

  /**
   * Send error response
   */
  sendErrorResponse(res, statusCode, message, code, error = null) {
    const response = {
      success: false,
      error: message,
      code: code,
      timestamp: new Date().toISOString()
    };
    
    if (error && process.env.NODE_ENV === 'development') {
      response.details = {
        message: error.message,
        stack: error.stack
      };
    }
    
    res.status(statusCode).json(response);
  }

  /**
   * Circuit breaker event handlers
   */
  onCircuitBreakerTrip(route) {
    this.stats.circuitBreakerTrips++;
    console.warn(`🚪 [${this.name}] Circuit breaker TRIPPED for ${route}`);
  }

  onCircuitBreakerReset(route) {
    console.log(`🚪 [${this.name}] Circuit breaker RESET for ${route}`);
  }

  /**
   * Update response time statistics
   */
  updateResponseTimeStats(responseTime) {
    this.stats.avgResponseTime = 
      ((this.stats.avgResponseTime * (this.stats.totalRequests - 1)) + responseTime) / 
      this.stats.totalRequests;
  }

  /**
   * Update error statistics
   */
  updateErrorStats(error) {
    const errorType = error.constructor.name;
    
    if (!this.stats.errorsByType[errorType]) {
      this.stats.errorsByType[errorType] = 0;
    }
    
    this.stats.errorsByType[errorType]++;
  }

  /**
   * Get gateway statistics
   */
  getStats() {
    const stats = {
      ...this.stats,
      successRate: this.stats.totalRequests > 0 ? 
        (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2) + '%' : '0%',
      errorRate: this.stats.totalRequests > 0 ? 
        (this.stats.failedRequests / this.stats.totalRequests * 100).toFixed(2) + '%' : '0%',
      avgResponseTime: this.stats.avgResponseTime.toFixed(2) + 'ms',
      circuitBreakers: {},
      timestamp: new Date().toISOString()
    };
    
    // Add circuit breaker status
    for (const [path, circuitBreaker] of this.circuitBreakers.entries()) {
      stats.circuitBreakers[path] = circuitBreaker.getStatus();
    }
    
    return stats;
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    const stats = this.getStats();
    const circuitBreakersOpen = Object.values(stats.circuitBreakers)
      .filter(cb => cb.state === 'open').length;
    
    let status = 'healthy';
    let issues = [];
    
    if (parseFloat(stats.errorRate) > 10) {
      status = 'critical';
      issues.push(`High error rate: ${stats.errorRate}`);
    }
    
    if (circuitBreakersOpen > 0) {
      status = 'warning';
      issues.push(`${circuitBreakersOpen} circuit breakers open`);
    }
    
    if (parseFloat(stats.successRate) < 95) {
      status = 'warning';
      issues.push(`Low success rate: ${stats.successRate}`);
    }
    
    return {
      status,
      issues,
      stats,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset all statistics
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      circuitBreakerTrips: 0,
      fallbackActivations: 0,
      avgResponseTime: 0,
      requestsByRoute: {},
      errorsByType: {}
    };
    
    // Reset circuit breakers
    for (const circuitBreaker of this.circuitBreakers.values()) {
      circuitBreaker.reset();
    }
    
    console.log(`🚪 [${this.name}] All statistics reset`);
  }

  /**
   * Create Express middleware
   */
  middleware() {
    return (req, res, next) => {
      // If this is a registered route, handle through gateway
      const route = this.findRoute(req.path, req.method);
      
      if (route) {
        return this.handleRequest(req, res);
      }
      
      // Otherwise, continue to next middleware
      next();
    };
  }
}

// Create default gateway instance
const gateway = new EnterpriseGateway({
  enableCircuitBreaker: process.env.GATEWAY_CIRCUIT_BREAKER !== 'false',
  enableFallback: process.env.GATEWAY_FALLBACK !== 'false',
  circuitBreakerThreshold: parseInt(process.env.GATEWAY_CB_THRESHOLD) || 5,
  circuitBreakerTimeout: parseInt(process.env.GATEWAY_CB_TIMEOUT) || 60000
});

module.exports = {
  EnterpriseGateway,
  gateway
};
