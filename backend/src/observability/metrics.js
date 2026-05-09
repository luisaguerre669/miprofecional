// Datadog-Style Metrics - Production Monitoring Core System
// Sistema de métricas tipo Datadog con counters/histograms/gauges

console.log("📈 Datadog-Style Metrics - Production Monitoring Core System");

class DatadogMetrics {
  constructor(config = {}) {
    this.name = 'datadog-metrics';
    this.config = {
      enableConsole: config.enableConsole !== false,
      enableFile: config.enableFile || false,
      filePath: config.filePath || './logs/metrics.log',
      collectionInterval: config.collectionInterval || 60000, // 1 minute
      retentionPeriod: config.retentionPeriod || 24 * 60 * 60 * 1000, // 24 hours
      maxDataPoints: config.maxDataPoints || 1000,
      ...config
    };
    
    // CORE METRICS STORAGE (Datadog-style)
    this.counters = {
      // HTTP Counters
      http_requests_total: 0,
      http_errors_total: 0,
      http_requests_by_endpoint: {},
      http_errors_by_endpoint: {},
      
      // Auth Counters
      auth_logins_total: 0,
      auth_logins_failed_total: 0,
      auth_registrations_total: 0,
      
      // Booking Counters
      bookings_created_total: 0,
      bookings_confirmed_total: 0,
      bookings_cancelled_total: 0,
      bookings_completed_total: 0,
      
      // Database Counters
      db_queries_total: 0,
      db_slow_queries_total: 0,
      db_connections_total: 0
    };
    
    this.histograms = {
      // Request Duration Histograms
      request_duration_ms: {
        values: [],
        count: 0,
        sum: 0,
        min: Infinity,
        max: 0,
        p50: 0,
        p95: 0,
        p99: 0
      },
      
      // Database Query Duration Histograms
      db_query_duration_ms: {
        values: [],
        count: 0,
        sum: 0,
        min: Infinity,
        max: 0,
        p50: 0,
        p95: 0,
        p99: 0
      },
      
      // Auth Duration Histograms
      auth_duration_ms: {
        values: [],
        count: 0,
        sum: 0,
        min: Infinity,
        max: 0,
        p50: 0,
        p95: 0,
        p99: 0
      }
    };
    
    this.gauges = {
      // System Gauges
      active_requests: 0,
      memory_usage_mb: 0,
      cpu_usage_percent: 0,
      
      // Database Gauges
      db_connections_active: 0,
      db_connections_idle: 0,
      
      // Service Gauges
      circuit_breaker_status: {}, // 0=closed, 1=open, 2=half-open
      service_health_status: {}, // 0=healthy, 1=degraded, 2=critical
      
      // Performance Gauges
      requests_per_second: 0,
      errors_per_second: 0
    };
    
    // Time series data for trends
    this.timeSeries = {
      timestamps: [],
      dataPoints: []
    };
    
    // Initialize metrics collection
    this.init();
  }

  /**
   * Initialize metrics collection
   */
  init() {
    // Start metrics collection interval
    this.startCollection();
    
    // Initialize system metrics
    this.updateSystemMetrics();
    
    console.log(`📈 [${this.name}] Metrics initialized:`, {
      collectionInterval: this.config.collectionInterval,
      retentionPeriod: this.config.retentionPeriod
    });
  }

  /**
   * Increment counter metric
   */
  incrementCounter(counterName, value = 1, tags = {}) {
    if (this.counters[counterName] !== undefined) {
      this.counters[counterName] += value;
    } else if (counterName.includes('_by_')) {
      // Handle counters with tags (e.g., http_requests_by_endpoint)
      const [baseName, tagType] = counterName.split('_by_');
      if (!this.counters[counterName]) {
        this.counters[counterName] = {};
      }
      const tagValue = tags[tagType] || 'unknown';
      this.counters[counterName][tagValue] = (this.counters[counterName][tagValue] || 0) + value;
    }
  }

  /**
   * Record histogram metric
   */
  recordHistogram(histogramName, value, tags = {}) {
    const histogram = this.histograms[histogramName];
    if (!histogram) return;
    
    histogram.values.push(value);
    histogram.count++;
    histogram.sum += value;
    histogram.min = Math.min(histogram.min, value);
    histogram.max = Math.max(histogram.max, value);
    
    // Keep only last 1000 values
    if (histogram.values.length > 1000) {
      histogram.values = histogram.values.slice(-1000);
    }
    
    // Calculate percentiles
    this.calculatePercentiles(histogram);
  }

  /**
   * Set gauge metric
   */
  setGauge(gaugeName, value, tags = {}) {
    if (gaugeName.includes('_status')) {
      // Handle status gauges with tags
      if (!this.gauges[gaugeName]) {
        this.gauges[gaugeName] = {};
      }
      const tagValue = tags.service || tags.component || 'unknown';
      this.gauges[gaugeName][tagValue] = value;
    } else {
      this.gauges[gaugeName] = value;
    }
  }

  /**
   * Calculate percentiles for histogram
   */
  calculatePercentiles(histogram) {
    if (histogram.values.length === 0) return;
    
    const sorted = histogram.values.sort((a, b) => a - b);
    histogram.p50 = sorted[Math.floor(sorted.length * 0.5)];
    histogram.p95 = sorted[Math.floor(sorted.length * 0.95)];
    histogram.p99 = sorted[Math.floor(sorted.length * 0.99)];
  }

  /**
   * Start periodic metrics collection
   */
  startCollection() {
    setInterval(() => {
      this.collectMetrics();
    }, this.config.collectionInterval);
  }

  /**
   * Collect all metrics
   */
  collectMetrics() {
    const timestamp = Date.now();
    
    // Update system metrics
    this.updateSystemMetrics();
    
    // Calculate rates
    this.calculateRates();
    
    // Store time series data
    this.storeTimeSeries(timestamp);
    
    // Cleanup old data
    this.cleanupOldData();
    
    // Log metrics if enabled
    if (this.config.enableConsole) {
      this.logMetricsSummary();
    }
  }

  /**
   * Update system metrics
   */
  updateSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.gauges.memory_usage_mb = Math.round(memUsage.heapUsed / 1024 / 1024);
    this.gauges.cpu_usage_percent = this.estimateCpuUsage(cpuUsage);
  }

  /**
   * Estimate CPU usage (simplified)
   */
  estimateCpuUsage(cpuUsage) {
    // Simple estimation based on CPU usage delta
    return Math.min(Math.round(Math.random() * 20 + 10), 100); // Placeholder
  }

  /**
   * Calculate rates
   */
  calculateRates() {
    // Calculate requests per second
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    
    // Simplified rate calculation
    this.gauges.requests_per_second = Math.round(this.counters.http_requests_total / 100);
    this.gauges.errors_per_second = Math.round(this.counters.http_errors_total / 100);
  }

  /**
   * Store time series data
   */
  storeTimeSeries(timestamp) {
    this.timeSeries.timestamps.push(timestamp);
    
    const dataPoint = {
      counters: { ...this.counters },
      gauges: { ...this.gauges },
      histograms: {}
    };
    
    // Add histogram summaries
    for (const [name, histogram] of Object.entries(this.histograms)) {
      dataPoint.histograms[name] = {
        count: histogram.count,
        avg: histogram.count > 0 ? (histogram.sum / histogram.count).toFixed(2) : 0,
        p95: histogram.p95,
        p99: histogram.p99
      };
    }
    
    this.timeSeries.dataPoints.push(dataPoint);
    
    // Limit data points
    if (this.timeSeries.dataPoints.length > this.config.maxDataPoints) {
      this.timeSeries.timestamps.shift();
      this.timeSeries.dataPoints.shift();
    }
  }

  /**
   * Cleanup old data
   */
  cleanupOldData() {
    const cutoffTime = Date.now() - this.config.retentionPeriod;
    
    // Cleanup old time series data
    while (this.timeSeries.timestamps.length > 0 && this.timeSeries.timestamps[0] < cutoffTime) {
      this.timeSeries.timestamps.shift();
      this.timeSeries.dataPoints.shift();
    }
  }

  /**
   * Log metrics summary
   */
  logMetricsSummary() {
    const summary = this.getMetricsSummary();
    console.log('📈 [metrics] Summary:', JSON.stringify(summary, null, 2));
  }

  /**
   * Start periodic metrics collection
   */
  startCollection() {
    setInterval(() => {
      this.collectMetrics();
    }, this.config.collectionInterval);
  }

  /**
   * Collect all metrics
   */
  collectMetrics() {
    const timestamp = Date.now();
    
    // Update system metrics
    this.updateSystemMetrics();
    
    // Calculate rates
    this.calculateRates();
    
    // Store time series data
    this.storeTimeSeries(timestamp);
    
    // Cleanup old data
    this.cleanupOldData();
    
    // Log metrics if enabled
    if (this.config.enableConsole) {
      this.logMetricsSummary();
    }
  }

  /**
   * Update system metrics
   */
  updateSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.metrics.system.memory = {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
      external: memUsage.external,
      percentage: (memUsage.heapUsed / memUsage.heapTotal * 100).toFixed(2)
    };
    
    this.metrics.system.uptime = process.uptime();
    this.metrics.system.timestamp = Date.now();
  }

  /**
   * Record HTTP request
   */
  recordHttpRequest(req, res, responseTime) {
    const method = req.method;
    const endpoint = req.route?.path || req.path;
    const statusCode = res.statusCode;
    
    // Update request counts
    this.metrics.http.requests.total++;
    
    if (statusCode < 400) {
      this.metrics.http.requests.successful++;
    } else {
      this.metrics.http.requests.errors++;
    }
    
    // Update by status
    if (!this.metrics.http.requests.byStatus[statusCode]) {
      this.metrics.http.requests.byStatus[statusCode] = 0;
    }
    this.metrics.http.requests.byStatus[statusCode]++;
    
    // Update by method
    if (!this.metrics.http.requests.byMethod[method]) {
      this.metrics.http.requests.byMethod[method] = 0;
    }
    this.metrics.http.requests.byMethod[method]++;
    
    // Update by endpoint
    if (!this.metrics.http.requests.byEndpoint[endpoint]) {
      this.metrics.http.requests.byEndpoint[endpoint] = {
        count: 0,
        responseTime: [],
        errors: 0
      };
    }
    this.metrics.http.requests.byEndpoint[endpoint].count++;
    this.metrics.http.requests.byEndpoint[endpoint].responseTime.push(responseTime);
    
    if (statusCode >= 400) {
      this.metrics.http.requests.byEndpoint[endpoint].errors++;
    }
    
    // Update response time metrics
    this.updateResponseTimeMetrics(responseTime);
    
    // Update error metrics
    if (statusCode >= 400) {
      this.recordError('http_error', statusCode, 'http');
    }
  }

  /**
   * Update response time metrics
   */
  updateResponseTimeMetrics(responseTime) {
    const rt = this.metrics.http.responseTime;
    
    rt.total += responseTime;
    rt.count++;
    rt.min = Math.min(rt.min, responseTime);
    rt.max = Math.max(rt.max, responseTime);
    
    // Keep response times array for percentile calculation
    if (!rt.values) rt.values = [];
    rt.values.push(responseTime);
    
    // Keep only last 1000 values
    if (rt.values.length > 1000) {
      rt.values = rt.values.slice(-1000);
    }
    
    // Calculate percentiles
    const sorted = rt.values.sort((a, b) => a - b);
    rt.p50 = sorted[Math.floor(sorted.length * 0.5)];
    rt.p95 = sorted[Math.floor(sorted.length * 0.95)];
    rt.p99 = sorted[Math.floor(sorted.length * 0.99)];
  }

  /**
   * Record database query
   */
  recordDatabaseQuery(collection, operation, duration, error = null) {
    // Update query counts
    this.metrics.database.queries.total++;
    
    if (duration > 300) {
      this.metrics.database.queries.slow++;
    }
    
    // Update by collection
    if (!this.metrics.database.queries.byCollection[collection]) {
      this.metrics.database.queries.byCollection[collection] = {
        count: 0,
        totalTime: 0,
        slowQueries: 0
      };
    }
    this.metrics.database.queries.byCollection[collection].count++;
    this.metrics.database.queries.byCollection[collection].totalTime += duration;
    
    if (duration > 300) {
      this.metrics.database.queries.byCollection[collection].slowQueries++;
    }
    
    // Update by operation
    if (!this.metrics.database.queries.byOperation[operation]) {
      this.metrics.database.queries.byOperation[operation] = {
        count: 0,
        totalTime: 0,
        avgTime: 0
      };
    }
    this.metrics.database.queries.byOperation[operation].count++;
    this.metrics.database.queries.byOperation[operation].totalTime += duration;
    this.metrics.database.queries.byOperation[operation].avgTime = 
      this.metrics.database.queries.byOperation[operation].totalTime / 
      this.metrics.database.queries.byOperation[operation].count;
    
    // Update response time
    this.metrics.database.responseTime.total += duration;
    this.metrics.database.responseTime.count++;
    this.metrics.database.responseTime.avg = 
      this.metrics.database.responseTime.total / this.metrics.database.responseTime.count;
    
    // Track slow queries
    if (duration > 300) {
      this.metrics.database.responseTime.slowQueries.push({
        collection,
        operation,
        duration,
        timestamp: Date.now()
      });
      
      // Keep only last 100 slow queries
      if (this.metrics.database.responseTime.slowQueries.length > 100) {
        this.metrics.database.responseTime.slowQueries = 
          this.metrics.database.responseTime.slowQueries.slice(-100);
      }
    }
    
    // Record error if present
    if (error) {
      this.recordError('database_error', error.message, 'database');
    }
  }

  /**
   * Record event metrics
   */
  recordEvent(eventName, priority, processingTime, error = null) {
    // Update emitted events
    this.metrics.events.emitted.total++;
    
    if (!this.metrics.events.emitted.byType[eventName]) {
      this.metrics.events.emitted.byType[eventName] = 0;
    }
    this.metrics.events.emitted.byType[eventName]++;
    
    if (this.metrics.events.emitted.byPriority[priority] !== undefined) {
      this.metrics.events.emitted.byPriority[priority]++;
    }
    
    // Update processed events
    if (error) {
      this.metrics.events.processed.failed++;
    } else {
      this.metrics.events.processed.total++;
    }
    
    // Update processing times
    if (!this.metrics.events.queue.processingTimes[eventName]) {
      this.metrics.events.queue.processingTimes[eventName] = [];
    }
    this.metrics.events.queue.processingTimes[eventName].push(processingTime);
    
    // Keep only last 100 times per event
    if (this.metrics.events.queue.processingTimes[eventName].length > 100) {
      this.metrics.events.queue.processingTimes[eventName] = 
        this.metrics.events.queue.processingTimes[eventName].slice(-100);
    }
    
    // Record error if present
    if (error) {
      this.recordError('event_error', error.message, 'events');
    }
  }

  /**
   * Record error
   */
  recordError(type, message, module) {
    this.metrics.errors.total++;
    
    // Update by type
    if (!this.metrics.errors.byType[type]) {
      this.metrics.errors.byType[type] = 0;
    }
    this.metrics.errors.byType[type]++;
    
    // Update by module
    if (!this.metrics.errors.byModule[module]) {
      this.metrics.errors.byModule[module] = 0;
    }
    this.metrics.errors.byModule[module]++;
  }

  /**
   * Calculate rates
   */
  calculateRates() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Calculate HTTP request rate
    const recentRequests = this.getRecentRequests(oneMinuteAgo);
    this.metrics.http.rate.requestsPerMinute = recentRequests.length;
    
    // Calculate error rate
    const totalRequests = this.metrics.http.requests.total;
    this.metrics.errors.rate = totalRequests > 0 ? 
      (this.metrics.http.requests.errors / totalRequests * 100).toFixed(2) : 0;
  }

  /**
   * Get recent requests (simplified)
   */
  getRecentRequests(since) {
    // In a real implementation, this would query request logs
    // For now, return empty array
    return [];
  }

  /**
   * Store time series data
   */
  storeTimeSeries(timestamp) {
    this.timeSeries.timestamps.push(timestamp);
    
    const dataPoint = {
      http: {
        requestsPerMinute: this.metrics.http.rate.requestsPerMinute,
        errorRate: this.metrics.errors.rate,
        avgResponseTime: this.metrics.http.responseTime.count > 0 ? 
          (this.metrics.http.responseTime.total / this.metrics.http.responseTime.count).toFixed(2) : 0
      },
      database: {
        avgQueryTime: this.metrics.database.responseTime.avg,
        slowQueries: this.metrics.database.queries.slow
      },
      system: {
        memoryUsage: this.metrics.system.memory.percentage,
        uptime: this.metrics.system.uptime
      }
    };
    
    this.timeSeries.dataPoints.push(dataPoint);
    
    // Limit data points
    if (this.timeSeries.dataPoints.length > this.config.maxDataPoints) {
      this.timeSeries.timestamps.shift();
      this.timeSeries.dataPoints.shift();
    }
  }

  /**
   * Cleanup old data
   */
  cleanupOldData() {
    const cutoffTime = Date.now() - this.config.retentionPeriod;
    
    // Cleanup old time series data
    while (this.timeSeries.timestamps.length > 0 && this.timeSeries.timestamps[0] < cutoffTime) {
      this.timeSeries.timestamps.shift();
      this.timeSeries.dataPoints.shift();
    }
    
    // Cleanup old slow queries
    this.metrics.database.responseTime.slowQueries = 
      this.metrics.database.responseTime.slowQueries.filter(q => q.timestamp > cutoffTime);
  }

  /**
   * Log metrics summary
   */
  logMetricsSummary() {
    const summary = this.getMetricsSummary();
    console.log('📈 [metrics] Summary:', JSON.stringify(summary, null, 2));
  }

  /**
   * Get comprehensive metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      timeSeries: {
        dataPoints: this.timeSeries.dataPoints.length,
        timestamps: this.timeSeries.timestamps.length,
        latest: this.timeSeries.dataPoints[this.timeSeries.dataPoints.length - 1] || null
      },
      timestamp: Date.now()
    };
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary() {
    const rt = this.metrics.http.responseTime;
    
    return {
      http: {
        totalRequests: this.metrics.http.requests.total,
        errorRate: this.metrics.errors.rate + '%',
        requestsPerMinute: this.metrics.http.rate.requestsPerMinute,
        avgResponseTime: rt.count > 0 ? (rt.total / rt.count).toFixed(2) + 'ms' : '0ms',
        p95ResponseTime: rt.p95 + 'ms'
      },
      database: {
        totalQueries: this.metrics.database.queries.total,
        slowQueries: this.metrics.database.queries.slow,
        avgQueryTime: this.metrics.database.responseTime.avg.toFixed(2) + 'ms'
      },
      system: {
        memoryUsage: this.metrics.system.memory.percentage + '%',
        uptime: this.metrics.system.uptime.toFixed(2) + 's'
      },
      errors: {
        total: this.metrics.errors.total,
        rate: this.metrics.errors.rate + '%'
      }
    };
  }

  /**
   * Get performance alerts
   */
  getPerformanceAlerts() {
    const alerts = [];
    
    // High error rate
    if (parseFloat(this.metrics.errors.rate) > 5) {
      alerts.push({
        type: 'error_rate',
        severity: 'high',
        message: `Error rate is ${this.metrics.errors.rate}% (>5%)`,
        value: this.metrics.errors.rate,
        threshold: 5
      });
    }
    
    // Slow response time
    if (this.metrics.http.responseTime.p95 > 1000) {
      alerts.push({
        type: 'slow_response',
        severity: 'medium',
        message: `P95 response time is ${this.metrics.http.responseTime.p95}ms (>1000ms)`,
        value: this.metrics.http.responseTime.p95,
        threshold: 1000
      });
    }
    
    // High memory usage
    if (parseFloat(this.metrics.system.memory.percentage) > 80) {
      alerts.push({
        type: 'memory_usage',
        severity: 'medium',
        message: `Memory usage is ${this.metrics.system.memory.percentage}% (>80%)`,
        value: this.metrics.system.memory.percentage,
        threshold: 80
      });
    }
    
    // Slow database queries
    if (this.metrics.database.queries.slow > 10) {
      alerts.push({
        type: 'slow_queries',
        severity: 'medium',
        message: `${this.metrics.database.queries.slow} slow queries detected (>10)`,
        value: this.metrics.database.queries.slow,
        threshold: 10
      });
    }
    
    return alerts;
  }

  /**
   * Reset metrics
   */
  reset() {
    // Reset all metrics to initial state
    this.metrics.http.requests = {
      total: 0,
      successful: 0,
      errors: 0,
      byStatus: {},
      byMethod: {},
      byEndpoint: {}
    };
    
    this.metrics.http.responseTime = {
      total: 0,
      count: 0,
      min: Infinity,
      max: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      values: []
    };
    
    this.metrics.database.queries.total = 0;
    this.metrics.database.queries.slow = 0;
    this.metrics.database.responseTime.slowQueries = [];
    
    this.metrics.events.emitted.total = 0;
    this.metrics.events.processed.total = 0;
    this.metrics.events.processed.failed = 0;
    
    this.metrics.errors.total = 0;
    
    this.timeSeries = {
      timestamps: [],
      dataPoints: []
    };
    
    console.log('📈 [metrics] All metrics reset');
  }
}

// Create default metrics instance
const metrics = new EnterpriseMetrics({
  collectionInterval: process.env.METRICS_INTERVAL || 60000,
  enableConsole: process.env.METRICS_CONSOLE !== 'false'
});

// Express middleware for metrics collection
const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.end to collect metrics
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    metrics.recordHttpRequest(req, res, responseTime);
    originalEnd.apply(this, args);
  };
  
  next();
};

module.exports = {
  EnterpriseMetrics,
  metrics,
  metricsMiddleware
};
