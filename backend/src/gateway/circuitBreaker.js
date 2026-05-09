// Circuit Breaker - Enterprise Resilience Pattern
// Implementación de Circuit Breaker para resiliencia de servicios

console.log("⚡ Circuit Breaker - Enterprise Resilience Pattern");

class CircuitBreaker {
  constructor(config = {}) {
    this.name = config.name || 'circuit-breaker';
    this.config = {
      threshold: config.threshold || 5, // Number of failures before tripping
      timeout: config.timeout || 60000, // Time to stay open (ms)
      resetTimeout: config.resetTimeout || 30000, // Time to attempt reset (ms)
      monitoringPeriod: config.monitoringPeriod || 10000, // Period to consider for failures (ms)
      ...config
    };
    
    // Circuit breaker states
    this.states = {
      CLOSED: 'closed',    // Normal operation
      OPEN: 'open',        // Circuit is tripped
      HALF_OPEN: 'half-open' // Attempting to recover
    };
    
    // Current state
    this.state = this.states.CLOSED;
    
    // Statistics
    this.stats = {
      requests: 0,
      successes: 0,
      failures: 0,
      trips: 0,
      resets: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
      lastTripTime: null,
      lastResetTime: null,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      failureRate: 0,
      avgResponseTime: 0,
      responseTimes: []
    };
    
    // Event handlers
    this.onTrip = config.onTrip || (() => {});
    this.onReset = config.onReset || (() => {});
    this.onSuccess = config.onSuccess || (() => {});
    this.onFailure = config.onFailure || (() => {});
    
    // Initialize
    this.init();
  }

  init() {
    console.log(`⚡ [${this.name}] Circuit breaker initialized:`, {
      threshold: this.config.threshold,
      timeout: this.config.timeout,
      resetTimeout: this.config.resetTimeout
    });
  }

  /**
   * Execute function through circuit breaker
   */
  async execute(fn) {
    const startTime = Date.now();
    
    try {
      // Check if circuit is open
      if (this.isOpen()) {
        throw new Error('Circuit breaker is OPEN');
      }
      
      // Execute the function
      this.stats.requests++;
      const result = await fn();
      
      // Record success
      const responseTime = Date.now() - startTime;
      this.recordSuccess(responseTime);
      
      return result;
      
    } catch (error) {
      // Record failure
      const responseTime = Date.now() - startTime;
      this.recordFailure(error, responseTime);
      
      throw error;
    }
  }

  /**
   * Record successful execution
   */
  recordSuccess(responseTime) {
    this.stats.successes++;
    this.stats.consecutiveSuccesses++;
    this.stats.consecutiveFailures = 0;
    this.stats.lastSuccessTime = Date.now();
    
    // Update response time stats
    this.stats.responseTimes.push(responseTime);
    if (this.stats.responseTimes.length > 100) {
      this.stats.responseTimes = this.stats.responseTimes.slice(-100);
    }
    this.stats.avgResponseTime = 
      this.stats.responseTimes.reduce((a, b) => a + b, 0) / this.stats.responseTimes.length;
    
    // Calculate failure rate
    this.updateFailureRate();
    
    // Handle state transitions
    if (this.state === this.states.HALF_OPEN) {
      if (this.stats.consecutiveSuccesses >= 3) {
        this.reset();
      }
    }
    
    // Call success handler
    this.onSuccess();
    
    console.log(`⚡ [${this.name}] Success recorded:`, {
      state: this.state,
      consecutiveSuccesses: this.stats.consecutiveSuccesses,
      responseTime: `${responseTime}ms`
    });
  }

  /**
   * Record failed execution
   */
  recordFailure(error, responseTime) {
    this.stats.failures++;
    this.stats.consecutiveFailures++;
    this.stats.consecutiveSuccesses = 0;
    this.stats.lastFailureTime = Date.now();
    
    // Update response time stats
    this.stats.responseTimes.push(responseTime);
    if (this.stats.responseTimes.length > 100) {
      this.stats.responseTimes = this.stats.responseTimes.slice(-100);
    }
    this.stats.avgResponseTime = 
      this.stats.responseTimes.reduce((a, b) => a + b, 0) / this.stats.responseTimes.length;
    
    // Calculate failure rate
    this.updateFailureRate();
    
    // Handle state transitions
    if (this.state === this.states.CLOSED) {
      if (this.shouldTrip()) {
        this.trip();
      }
    } else if (this.state === this.states.HALF_OPEN) {
      this.trip(); // Trip again on failure in half-open state
    }
    
    // Call failure handler
    this.onFailure(error);
    
    console.log(`⚡ [${this.name}] Failure recorded:`, {
      state: this.state,
      consecutiveFailures: this.stats.consecutiveFailures,
      error: error.message,
      responseTime: `${responseTime}ms`
    });
  }

  /**
   * Check if circuit should trip
   */
  shouldTrip() {
    // Trip if consecutive failures exceed threshold
    if (this.stats.consecutiveFailures >= this.config.threshold) {
      return true;
    }
    
    // Trip if failure rate is too high in monitoring period
    if (this.stats.failureRate > 50 && this.stats.requests >= 10) {
      return true;
    }
    
    return false;
  }

  /**
   * Trip the circuit (move to OPEN state)
   */
  trip() {
    this.state = this.states.OPEN;
    this.stats.trips++;
    this.stats.lastTripTime = Date.now();
    
    // Set timeout to attempt reset
    setTimeout(() => {
      this.attemptReset();
    }, this.config.timeout);
    
    // Call trip handler
    this.onTrip();
    
    console.warn(`⚡ [${this.name}] Circuit breaker TRIPPED:`, {
      consecutiveFailures: this.stats.consecutiveFailures,
      failureRate: `${this.stats.failureRate}%`,
      nextResetAttempt: new Date(Date.now() + this.config.timeout).toISOString()
    });
  }

  /**
   * Attempt to reset circuit (move to HALF_OPEN state)
   */
  attemptReset() {
    if (this.state === this.states.OPEN) {
      this.state = this.states.HALF_OPEN;
      this.stats.consecutiveFailures = 0;
      this.stats.consecutiveSuccesses = 0;
      
      console.log(`⚡ [${this.name}] Circuit breaker attempting reset (HALF_OPEN)`);
    }
  }

  /**
   * Reset circuit (move to CLOSED state)
   */
  reset() {
    this.state = this.states.CLOSED;
    this.stats.resets++;
    this.stats.lastResetTime = Date.now();
    this.stats.consecutiveFailures = 0;
    this.stats.consecutiveSuccesses = 0;
    
    // Call reset handler
    this.onReset();
    
    console.log(`⚡ [${this.name}] Circuit breaker RESET (CLOSED)`);
  }

  /**
   * Check if circuit is open
   */
  isOpen() {
    return this.state === this.states.OPEN;
  }

  /**
   * Check if circuit is closed
   */
  isClosed() {
    return this.state === this.states.CLOSED;
  }

  /**
   * Check if circuit is half-open
   */
  isHalfOpen() {
    return this.state === this.states.HALF_OPEN;
  }

  /**
   * Update failure rate
   */
  updateFailureRate() {
    const recentRequests = this.getRecentRequests();
    const recentFailures = this.getRecentFailures();
    
    this.stats.failureRate = recentRequests > 0 ? 
      (recentFailures / recentRequests * 100) : 0;
  }

  /**
   * Get recent requests count (simplified)
   */
  getRecentRequests() {
    // In a real implementation, this would check timestamps
    // For now, use total requests
    return this.stats.requests;
  }

  /**
   * Get recent failures count (simplified)
   */
  getRecentFailures() {
    // In a real implementation, this would check timestamps
    // For now, use total failures
    return this.stats.failures;
  }

  /**
   * Get circuit breaker status
   */
  getStatus() {
    return {
      state: this.state,
      stats: {
        ...this.stats,
        failureRate: `${this.stats.failureRate.toFixed(2)}%`,
        avgResponseTime: `${this.stats.avgResponseTime.toFixed(2)}ms`
      },
      config: {
        threshold: this.config.threshold,
        timeout: this.config.timeout,
        resetTimeout: this.config.resetTimeout
      },
      health: this.getHealthStatus(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    let status = 'healthy';
    let issues = [];
    
    if (this.state === this.states.OPEN) {
      status = 'critical';
      issues.push('Circuit breaker is OPEN');
    } else if (this.state === this.states.HALF_OPEN) {
      status = 'warning';
      issues.push('Circuit breaker is HALF-OPEN (recovering)');
    }
    
    if (this.stats.failureRate > 30) {
      status = 'warning';
      issues.push(`High failure rate: ${this.stats.failureRate.toFixed(2)}%`);
    }
    
    if (this.stats.consecutiveFailures >= this.config.threshold - 1) {
      status = 'warning';
      issues.push(`Approaching threshold: ${this.stats.consecutiveFailures}/${this.config.threshold} failures`);
    }
    
    return {
      status,
      issues
    };
  }

  /**
   * Force trip circuit (for testing)
   */
  forceTrip() {
    this.trip();
  }

  /**
   * Force reset circuit (for testing)
   */
  forceReset() {
    this.reset();
  }

  /**
   * Get detailed statistics
   */
  getDetailedStats() {
    const now = Date.now();
    const uptime = now - (this.stats.lastResetTime || now);
    
    return {
      ...this.stats,
      uptime: uptime,
      requestsPerMinute: this.stats.requests > 0 ? 
        (this.stats.requests / (uptime / 60000)).toFixed(2) : 0,
      successRate: this.stats.requests > 0 ? 
        (this.stats.successes / this.stats.requests * 100).toFixed(2) + '%' : '0%',
      failureRate: `${this.stats.failureRate.toFixed(2)}%`,
      avgResponseTime: `${this.stats.avgResponseTime.toFixed(2)}ms`,
      timeInCurrentState: this.getTimeInCurrentState(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get time in current state
   */
  getTimeInCurrentState() {
    const now = Date.now();
    
    switch (this.state) {
      case this.states.OPEN:
        return this.stats.lastTripTime ? now - this.stats.lastTripTime : 0;
      case this.states.HALF_OPEN:
        return this.stats.lastResetTime ? now - this.stats.lastResetTime : 0;
      case this.states.CLOSED:
        return this.stats.lastResetTime ? now - this.stats.lastResetTime : uptime;
      default:
        return 0;
    }
  }

  /**
   * Reset all statistics
   */
  resetStats() {
    this.stats = {
      requests: 0,
      successes: 0,
      failures: 0,
      trips: this.stats.trips, // Keep trip count
      resets: this.stats.resets, // Keep reset count
      lastFailureTime: null,
      lastSuccessTime: null,
      lastTripTime: null,
      lastResetTime: Date.now(),
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      failureRate: 0,
      avgResponseTime: 0,
      responseTimes: []
    };
    
    console.log(`⚡ [${this.name}] Statistics reset`);
  }
}

module.exports = CircuitBreaker;
