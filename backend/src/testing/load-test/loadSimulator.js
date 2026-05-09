// Load Simulator - Enterprise Stress Testing Core
// Simulador de carga tipo Rappi/Uber scale para testing controlado

console.log("🚀 Load Simulator - Enterprise Stress Testing Core");

const http = require('http');
const crypto = require('crypto');
const { performance } = require('perf_hooks');

class LoadSimulator {
  constructor(config = {}) {
    this.name = 'load-simulator';
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:10000',
      maxConcurrency: config.maxConcurrency || 100,
      batchDelay: config.batchDelay || 100, // ms between batches
      testTimeout: config.testTimeout || 300000, // 5 minutes
      errorThreshold: config.errorThreshold || 10, // %
      enableProtection: config.enableProtection !== false,
      ...config
    };
    
    // Test state
    this.isRunning = false;
    this.currentTest = null;
    this.results = {
      summary: {
        total_requests: 0,
        successful_requests: 0,
        failed_requests: 0,
        avg_latency: 0,
        p95_latency: 0,
        p99_latency: 0,
        error_rate: 0,
        system_status: 'healthy'
      },
      endpoints: {},
      bottlenecks: [],
      recommendations: [],
      timeline: []
    };
    
    // Protection mechanisms
    this.protection = {
      currentConcurrency: 0,
      errorRate: 0,
      lastErrorCheck: Date.now(),
      emergencyStop: false
    };
    
    console.log(`🚀 [${this.name}] Load simulator initialized:`, {
      baseUrl: this.config.baseUrl,
      maxConcurrency: this.config.maxConcurrency,
      protection: this.config.enableProtection
    });
  }

  /**
   * Execute a complete load test scenario
   */
  async executeScenario(scenario) {
    if (this.isRunning) {
      throw new Error('Load test already running');
    }
    
    this.isRunning = true;
    this.currentTest = scenario;
    this.resetResults();
    
    console.log(`🚀 [${this.name}] Starting scenario: ${scenario.name}`);
    console.log(`📊 [${this.name}] Configuration:`, {
      duration: scenario.duration,
      concurrency: scenario.concurrency,
      requests: scenario.requests?.length || 0
    });
    
    try {
      const startTime = Date.now();
      
      // Execute scenario phases
      if (scenario.phases) {
        for (const phase of scenario.phases) {
          await this.executePhase(phase);
          this.checkEmergencyStop();
        }
      } else {
        await this.executePhase(scenario);
      }
      
      // Calculate final results
      this.calculateFinalResults();
      
      const duration = Date.now() - startTime;
      console.log(`✅ [${this.name}] Scenario completed in ${duration}ms`);
      
      return this.results;
      
    } catch (error) {
      console.error(`❌ [${this.name}] Scenario failed:`, error);
      this.results.summary.system_status = 'critical';
      this.results.summary.error = error.message;
      throw error;
    } finally {
      this.isRunning = false;
      this.currentTest = null;
    }
  }

  /**
   * Execute a single test phase
   */
  async executePhase(phase) {
    console.log(`📈 [${this.name}] Executing phase: ${phase.name || 'unnamed'}`);
    
    const startTime = Date.now();
    const promises = [];
    const concurrency = phase.concurrency || this.config.maxConcurrency;
    
    // Execute requests in batches
    for (let i = 0; i < phase.iterations; i++) {
      if (this.protection.emergencyStop) {
        console.warn(`🛑 [${this.name}] Emergency stop triggered`);
        break;
      }
      
      // Control concurrency
      while (promises.length >= concurrency) {
        await Promise.race(promises);
        promises.splice(promises.findIndex(p => p.settled), 1);
      }
      
      // Select request type
      const request = this.selectRequest(phase.requests);
      const promise = this.executeRequest(request, i);
      promises.push(promise);
      
      // Add delay between batches
      if (i % concurrency === 0 && i > 0) {
        await this.delay(this.config.batchDelay);
      }
    }
    
    // Wait for all remaining requests
    await Promise.allSettled(promises);
    
    const duration = Date.now() - startTime;
    console.log(`✅ [${this.name}] Phase completed in ${duration}ms`);
  }

  /**
   * Execute a single HTTP request
   */
  async executeRequest(request, index) {
    const requestId = crypto.randomBytes(8).toString('hex');
    const startTime = performance.now();
    
    try {
      // Prepare request data
      const requestData = this.prepareRequestData(request, index);
      
      // Make HTTP request
      const response = await this.makeHttpRequest(requestData);
      
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);
      
      // Record successful request
      this.recordRequest(request.endpoint, {
        requestId,
        latency,
        statusCode: response.statusCode,
        success: true,
        timestamp: Date.now()
      });
      
      return {
        success: true,
        requestId,
        latency,
        statusCode: response.statusCode
      };
      
    } catch (error) {
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);
      
      // Record failed request
      this.recordRequest(request.endpoint, {
        requestId,
        latency,
        statusCode: error.statusCode || 500,
        success: false,
        error: error.message,
        timestamp: Date.now()
      });
      
      return {
        success: false,
        requestId,
        latency,
        error: error.message
      };
    }
  }

  /**
   * Make HTTP request
   */
  async makeHttpRequest(requestData) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 10000,
        path: requestData.path,
        method: requestData.method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'LoadSimulator/1.0',
          ...requestData.headers
        }
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      // Set timeout
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      // Send request body if present
      if (requestData.body) {
        req.write(JSON.stringify(requestData.body));
      }
      
      req.end();
    });
  }

  /**
   * Prepare request data
   */
  prepareRequestData(request, index) {
    const requestData = {
      method: request.method || 'GET',
      path: request.endpoint,
      headers: request.headers || {}
    };
    
    // Add body for POST/PUT requests
    if (request.body) {
      requestData.body = typeof request.body === 'function' 
        ? request.body(index) 
        : request.body;
    }
    
    return requestData;
  }

  /**
   * Select request from weighted list
   */
  selectRequest(requests) {
    if (!requests || requests.length === 0) {
      return { endpoint: '/health', method: 'GET' };
    }
    
    if (requests.length === 1) {
      return requests[0];
    }
    
    // Weighted selection
    const totalWeight = requests.reduce((sum, req) => sum + (req.weight || 1), 0);
    let random = Math.random() * totalWeight;
    
    for (const request of requests) {
      random -= (request.weight || 1);
      if (random <= 0) {
        return request;
      }
    }
    
    return requests[0];
  }

  /**
   * Record request result
   */
  recordRequest(endpoint, result) {
    // Update summary
    this.results.summary.total_requests++;
    
    if (result.success) {
      this.results.summary.successful_requests++;
    } else {
      this.results.summary.failed_requests++;
    }
    
    // Update endpoint stats
    if (!this.results.endpoints[endpoint]) {
      this.results.endpoints[endpoint] = {
        requests: 0,
        successful: 0,
        failed: 0,
        latencies: [],
        errors: []
      };
    }
    
    const endpointStats = this.results.endpoints[endpoint];
    endpointStats.requests++;
    
    if (result.success) {
      endpointStats.successful++;
    } else {
      endpointStats.failed++;
      endpointStats.errors.push(result.error);
    }
    
    endpointStats.latencies.push(result.latency);
    
    // Add to timeline
    this.results.timeline.push({
      timestamp: result.timestamp,
      endpoint,
      latency: result.latency,
      success: result.success,
      statusCode: result.statusCode
    });
    
    // Update protection metrics
    this.updateProtectionMetrics();
  }

  /**
   * Update protection metrics
   */
  updateProtectionMetrics() {
    const now = Date.now();
    const recentWindow = 10000; // 10 seconds
    
    // Count recent requests and errors
    const recentRequests = this.results.timeline.filter(
      r => now - r.timestamp < recentWindow
    );
    
    const recentErrors = recentRequests.filter(r => !r.success);
    
    this.protection.errorRate = recentRequests.length > 0 
      ? (recentErrors.length / recentRequests.length) * 100 
      : 0;
    
    // Check emergency stop conditions
    if (this.config.enableProtection) {
      if (this.protection.errorRate > this.config.errorThreshold) {
        console.warn(`🚨 [${this.name}] High error rate detected: ${this.protection.errorRate.toFixed(2)}%`);
        this.protection.emergencyStop = true;
      }
    }
  }

  /**
   * Check emergency stop
   */
  checkEmergencyStop() {
    if (this.protection.emergencyStop) {
      throw new Error('Emergency stop triggered due to high error rate');
    }
  }

  /**
   * Calculate final results
   */
  calculateFinalResults() {
    const summary = this.results.summary;
    
    // Calculate error rate
    summary.error_rate = summary.total_requests > 0 
      ? (summary.failed_requests / summary.total_requests) * 100 
      : 0;
    
    // Calculate latencies
    const allLatencies = [];
    for (const endpoint of Object.values(this.results.endpoints)) {
      allLatencies.push(...endpoint.latencies);
    }
    
    if (allLatencies.length > 0) {
      allLatencies.sort((a, b) => a - b);
      summary.avg_latency = Math.round(
        allLatencies.reduce((sum, lat) => sum + lat, 0) / allLatencies.length
      );
      summary.p95_latency = allLatencies[Math.floor(allLatencies.length * 0.95)];
      summary.p99_latency = allLatencies[Math.floor(allLatencies.length * 0.99)];
    }
    
    // Determine system status
    if (summary.error_rate > 10) {
      summary.system_status = 'critical';
    } else if (summary.error_rate > 5 || summary.p95_latency > 2000) {
      summary.system_status = 'degraded';
    } else {
      summary.system_status = 'healthy';
    }
    
    // Identify bottlenecks
    this.identifyBottlenecks();
    
    // Generate recommendations
    this.generateRecommendations();
  }

  /**
   * Identify performance bottlenecks
   */
  identifyBottlenecks() {
    const bottlenecks = [];
    
    for (const [endpoint, stats] of Object.entries(this.results.endpoints)) {
      const errorRate = (stats.failed / stats.requests) * 100;
      const avgLatency = stats.latencies.reduce((sum, lat) => sum + lat, 0) / stats.latencies.length;
      
      // High error rate
      if (errorRate > 10) {
        bottlenecks.push({
          type: 'high_error_rate',
          endpoint,
          value: errorRate.toFixed(2) + '%',
          severity: 'critical'
        });
      }
      
      // High latency
      if (avgLatency > 1000) {
        bottlenecks.push({
          type: 'high_latency',
          endpoint,
          value: Math.round(avgLatency) + 'ms',
          severity: avgLatency > 2000 ? 'critical' : 'warning'
        });
      }
      
      // Slow requests
      const slowRequests = stats.latencies.filter(lat => lat > 500).length;
      if (slowRequests > stats.requests * 0.1) {
        bottlenecks.push({
          type: 'slow_requests',
          endpoint,
          value: slowRequests + '/' + stats.requests,
          severity: 'warning'
        });
      }
    }
    
    this.results.bottlenecks = bottlenecks.sort((a, b) => {
      const severityOrder = { critical: 3, warning: 2, info: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    const summary = this.results.summary;
    
    // High error rate recommendations
    if (summary.error_rate > 10) {
      recommendations.push({
        type: 'error_rate',
        priority: 'critical',
        description: 'Implement retry mechanisms and circuit breakers',
        action: 'Add exponential backoff and circuit breaker patterns'
      });
    }
    
    // High latency recommendations
    if (summary.p95_latency > 1500) {
      recommendations.push({
        type: 'latency',
        priority: 'high',
        description: 'Optimize database queries and add caching',
        action: 'Implement query optimization and Redis caching layer'
      });
    }
    
    // Bottleneck-specific recommendations
    for (const bottleneck of this.results.bottlenecks) {
      if (bottleneck.type === 'high_latency' && bottleneck.endpoint.includes('/api/bookings')) {
        recommendations.push({
          type: 'database_optimization',
          priority: 'high',
          description: 'Bookings endpoint shows high latency',
          action: 'Add database indexes and optimize MongoDB queries'
        });
      }
      
      if (bottleneck.type === 'high_error_rate' && bottleneck.endpoint.includes('/api/auth')) {
        recommendations.push({
          type: 'auth_optimization',
          priority: 'critical',
          description: 'Auth endpoint shows high error rate',
          action: 'Review authentication logic and add rate limiting'
        });
      }
    }
    
    // General recommendations
    if (summary.total_requests > 1000 && summary.avg_latency < 100) {
      recommendations.push({
        type: 'scaling',
        priority: 'medium',
        description: 'System handles current load well',
        action: 'Consider horizontal scaling for increased capacity'
      });
    }
    
    this.results.recommendations = recommendations;
  }

  /**
   * Reset results
   */
  resetResults() {
    this.results = {
      summary: {
        total_requests: 0,
        successful_requests: 0,
        failed_requests: 0,
        avg_latency: 0,
        p95_latency: 0,
        p99_latency: 0,
        error_rate: 0,
        system_status: 'healthy'
      },
      endpoints: {},
      bottlenecks: [],
      recommendations: [],
      timeline: []
    };
    
    this.protection = {
      currentConcurrency: 0,
      errorRate: 0,
      lastErrorCheck: Date.now(),
      emergencyStop: false
    };
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      currentTest: this.currentTest?.name,
      protection: this.protection,
      config: this.config
    };
  }

  /**
   * Emergency stop
   */
  emergencyStop() {
    this.protection.emergencyStop = true;
    console.warn(`🛑 [${this.name}] Emergency stop triggered manually`);
  }

  /**
   * Utility: delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = {
  LoadSimulator
};
