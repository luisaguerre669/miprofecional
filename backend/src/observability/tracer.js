// Datadog-Style Tracer - Basic Distributed Tracing
// Sistema de tracing básico con traceId y correlación

console.log("🔗 Datadog-Style Tracer - Basic Distributed Tracing");

const crypto = require('crypto');

class DatadogTracer {
  constructor(config = {}) {
    this.name = 'datadog-tracer';
    this.config = {
      enableConsole: config.enableConsole !== false,
      maxSpans: config.maxSpans || 1000,
      ...config
    };
    
    // Active traces storage
    this.activeTraces = new Map();
    
    // Trace statistics
    this.stats = {
      totalTraces: 0,
      completedTraces: 0,
      failedTraces: 0,
      avgDuration: 0,
      spansByService: {}
    };
  }

  /**
   * Generate unique trace ID
   */
  generateTraceId() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Generate unique span ID
   */
  generateSpanId() {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Start a new trace
   */
  startTrace(service, operation, metadata = {}) {
    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();
    const startTime = Date.now();
    
    const trace = {
      traceId,
      spanId,
      parentSpanId: null,
      service,
      operation,
      startTime,
      endTime: null,
      duration: null,
      status: 'active',
      tags: metadata,
      spans: []
    };
    
    this.activeTraces.set(traceId, trace);
    this.stats.totalTraces++;
    
    return trace;
  }

  /**
   * Start a span within an existing trace
   */
  startSpan(traceId, service, operation, parentSpanId = null, metadata = {}) {
    const trace = this.activeTraces.get(traceId);
    if (!trace) {
      console.warn(`🔗 [${this.name}] Trace not found: ${traceId}`);
      return null;
    }
    
    const spanId = this.generateSpanId();
    const startTime = Date.now();
    
    const span = {
      spanId,
      parentSpanId,
      service,
      operation,
      startTime,
      endTime: null,
      duration: null,
      status: 'active',
      tags: metadata
    };
    
    trace.spans.push(span);
    
    return span;
  }

  /**
   * Finish a span
   */
  finishSpan(traceId, spanId, status = 'success', error = null) {
    const trace = this.activeTraces.get(traceId);
    if (!trace) return null;
    
    const span = trace.spans.find(s => s.spanId === spanId);
    if (!span) return null;
    
    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;
    
    if (error) {
      span.error = {
        message: error.message,
        stack: error.stack
      };
    }
    
    return span;
  }

  /**
   * Finish a trace
   */
  finishTrace(traceId, status = 'success', error = null) {
    const trace = this.activeTraces.get(traceId);
    if (!trace) return null;
    
    trace.endTime = Date.now();
    trace.duration = trace.endTime - trace.startTime;
    trace.status = status;
    
    if (error) {
      trace.error = {
        message: error.message,
        stack: error.stack
      };
    }
    
    // Update statistics
    this.updateStats(trace);
    
    // Remove from active traces
    this.activeTraces.delete(traceId);
    
    return trace;
  }

  /**
   * Get active trace
   */
  getActiveTrace(traceId) {
    return this.activeTraces.get(traceId);
  }

  /**
   * Get all active traces
   */
  getActiveTraces() {
    return Array.from(this.activeTraces.values());
  }

  /**
   * Create trace middleware for Express
   */
  traceMiddleware(service = 'api') {
    return (req, res, next) => {
      // Start trace
      const trace = this.startTrace(service, `${req.method} ${req.path}`, {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Add trace to request
      req.traceId = trace.traceId;
      req.spanId = trace.spanId;
      
      // Override res.end to finish trace
      const originalEnd = res.end;
      res.end = function(...args) {
        const status = res.statusCode >= 400 ? 'error' : 'success';
        
        // Finish trace
        trace.endTime = Date.now();
        trace.duration = trace.endTime - trace.startTime;
        trace.status = status;
        trace.tags.statusCode = res.statusCode;
        
        // Update statistics
        tracer.updateStats(trace);
        
        // Remove from active traces
        tracer.activeTraces.delete(trace.traceId);
        
        originalEnd.apply(this, args);
      };
      
      next();
    };
  }

  /**
   * Update trace statistics
   */
  updateStats(trace) {
    this.stats.completedTraces++;
    
    if (trace.status === 'error') {
      this.stats.failedTraces++;
    }
    
    // Update average duration
    this.stats.avgDuration = 
      ((this.stats.avgDuration * (this.stats.completedTraces - 1)) + trace.duration) / 
      this.stats.completedTraces;
    
    // Update spans by service
    trace.spans.forEach(span => {
      if (!this.stats.spansByService[span.service]) {
        this.stats.spansByService[span.service] = 0;
      }
      this.stats.spansByService[span.service]++;
    });
  }

  /**
   * Get trace statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeTraces: this.activeTraces.size,
      avgDuration: this.stats.avgDuration.toFixed(2) + 'ms',
      timestamp: Date.now()
    };
  }

  /**
   * Get trace by ID with detailed information
   */
  getTraceDetails(traceId) {
    const trace = this.activeTraces.get(traceId);
    if (!trace) return null;
    
    return {
      ...trace,
      spanCount: trace.spans.length,
      services: [...new Set(trace.spans.map(s => s.service))],
      timestamp: Date.now()
    };
  }

  /**
   * Create child span for service call
   */
  createServiceSpan(traceId, serviceName, operation, metadata = {}) {
    const trace = this.activeTraces.get(traceId);
    if (!trace) return null;
    
    const parentSpanId = trace.spans[trace.spans.length - 1]?.spanId || trace.spanId;
    
    return this.startSpan(traceId, serviceName, operation, parentSpanId, {
      ...metadata,
      parentService: trace.service
    });
  }

  /**
   * Log trace information
   */
  logTrace(traceId, message, level = 'INFO') {
    const trace = this.activeTraces.get(traceId);
    if (!trace) return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      traceId,
      spanId: trace.spanId,
      service: trace.service,
      operation: trace.operation,
      message,
      duration: Date.now() - trace.startTime
    };
    
    console.log(`🔗 [${this.name}] ${level}:`, logEntry);
  }

  /**
   * Reset all traces and statistics
   */
  reset() {
    this.activeTraces.clear();
    this.stats = {
      totalTraces: 0,
      completedTraces: 0,
      failedTraces: 0,
      avgDuration: 0,
      spansByService: {}
    };
    
    console.log(`🔗 [${this.name}] All traces and statistics reset`);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const now = Date.now();
    const recentTraces = Array.from(this.activeTraces.values())
      .filter(trace => (now - trace.startTime) < 60000); // Last minute
    
    return {
      activeTraces: this.activeTraces.size,
      recentTraces: recentTraces.length,
      avgDuration: this.stats.avgDuration.toFixed(2) + 'ms',
      errorRate: this.stats.completedTraces > 0 ? 
        (this.stats.failedTraces / this.stats.completedTraces * 100).toFixed(2) + '%' : '0%',
      topServices: Object.entries(this.stats.spansByService)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([service, count]) => ({ service, count })),
      timestamp: Date.now()
    };
  }
}

// Create singleton instance
const tracer = new DatadogTracer({
  enableConsole: process.env.TRACER_CONSOLE !== 'false'
});

module.exports = {
  DatadogTracer,
  tracer
};
