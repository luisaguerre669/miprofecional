// Datadog-Style Logger - Structured JSON Logging for Production
// Sistema de logging estructurado tipo Datadog con formato obligatorio

console.log("📊 Datadog-Style Logger - Structured JSON Logging");

const crypto = require('crypto');

class DatadogLogger {
  constructor(config = {}) {
    this.name = 'datadog-logger';
    this.service = 'miprofesional-api';
    this.config = {
      level: config.level || 'INFO', // INFO, WARN, ERROR, DEBUG
      enableConsole: config.enableConsole !== false,
      enableFile: config.enableFile || false,
      filePath: config.filePath || './logs/app.log',
      maxFileSize: config.maxFileSize || 10 * 1024 * 1024, // 10MB
      maxFiles: config.maxFiles || 5,
      ...config
    };
    
    // Log levels with numeric values for filtering
    this.levels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };
    
    // Statistics
    this.stats = {
      totalLogs: 0,
      errorLogs: 0,
      warnLogs: 0,
      infoLogs: 0,
      debugLogs: 0,
      logsByModule: {},
      logsByRequestId: {},
      slowQueries: [],
      errorRates: {},
      avgResponseTime: 0,
      responseTimeCount: 0
    };
    
    // Initialize logger
    this.init();
  }

  init() {
    // Create logs directory if file logging enabled
    if (this.config.enableFile) {
      const fs = require('fs');
      const path = require('path');
      const logDir = path.dirname(this.config.filePath);
      
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }
    
    console.log(`📊 [${this.name}] Logger initialized:`, {
      level: this.config.level,
      format: this.config.format,
      enableConsole: this.config.enableConsole,
      enableFile: this.config.enableFile
    });
  }

  /**
   * Generate or extract request ID
   */
  getRequestId(req = null) {
    if (req && req.headers) {
      // Extract from header
      const requestId = req.headers[this.config.requestIdHeader.toLowerCase()] || 
                       req.headers[this.config.requestIdHeader];
      
      if (requestId) return requestId;
    }
    
    // Generate new request ID
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Create structured log entry (Datadog format obligatorio)
   */
  createLogEntry(level, message, data = {}, context = {}) {
    const timestamp = new Date().toISOString();
    const requestId = context.requestId || this.generateRequestId();
    const module = context.module || 'application';
    const correlationId = context.correlationId || requestId;
    
    // Update statistics
    this.updateStats(level, module, requestId);
    
    // FORMATO OBLIGATORIO DATADOG-STYLE
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      service: this.service,
      module: module,
      requestId: requestId,
      correlationId: correlationId,
      message: message,
      data: data || {},
      durationMs: context.durationMs || 0,
      statusCode: context.statusCode || null,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      pid: process.pid,
      hostname: require('os').hostname()
    };

    // Add performance metrics if available
    if (context.responseTime) {
      logEntry.durationMs = context.responseTime;
      this.updateResponseTimeStats(context.responseTime);
    }
    
    // Add error details for error logs
    if (level === 'ERROR' && data.error) {
      logEntry.data.error = {
        name: data.error.name,
        message: data.error.message,
        stack: data.error.stack
      };
    }

    return logEntry;
  }

  /**
   * Log ERROR
   */
  error(message, data = {}, context = {}) {
    if (!this.shouldLog('ERROR')) return;
    
    const logEntry = this.createLogEntry('ERROR', message, data, context);
    this.writeLog(logEntry);
  }

  /**
   * Log WARN
   */
  warn(message, data = {}, context = {}) {
    if (!this.shouldLog('WARN')) return;
    
    const logEntry = this.createLogEntry('WARN', message, data, context);
    this.writeLog(logEntry);
  }

  /**
   * Log INFO
   */
  info(message, data = {}, context = {}) {
    if (!this.shouldLog('INFO')) return;
    
    const logEntry = this.createLogEntry('INFO', message, data, context);
    this.writeLog(logEntry);
  }

  /**
   * Log DEBUG
   */
  debug(message, data = {}, context = {}) {
    if (!this.shouldLog('DEBUG')) return;
    
    const logEntry = this.createLogEntry('DEBUG', message, data, context);
    this.writeLog(logEntry);
  }

  /**
   * Log HTTP request
   */
  logRequest(req, startTime, metadata = {}) {
    const responseTime = Date.now() - startTime;
    const requestId = this.getRequestId(req);
    
    const logMetadata = {
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      statusCode: metadata.statusCode,
      responseTime,
      ...metadata
    };
    
    const context = {
      requestId,
      module: 'http',
      responseTime
    };
    
    // Determine log level based on status code
    const level = metadata.statusCode >= 400 ? 'error' : 
                  metadata.statusCode >= 300 ? 'warn' : 'info';
    
    const message = `${req.method} ${req.url} ${metadata.statusCode}`;
    
    this[level](message, logMetadata, context);
  }

  /**
   * Log database query
   */
  logQuery(query, duration, metadata = {}) {
    const context = {
      module: 'database',
      responseTime: duration
    };
    
    const logMetadata = {
      query: typeof query === 'string' ? query : JSON.stringify(query),
      duration: `${duration}ms`,
      collection: metadata.collection,
      operation: metadata.operation,
      ...metadata
    };
    
    // Log slow queries (>300ms)
    if (duration > 300) {
      this.stats.slowQueries.push({
        query: logMetadata.query,
        duration,
        timestamp: new Date().toISOString(),
        collection: metadata.collection
      });
      
      // Keep only last 100 slow queries
      if (this.stats.slowQueries.length > 100) {
        this.stats.slowQueries = this.stats.slowQueries.slice(-100);
      }
      
      this.warn('Slow database query detected', logMetadata, context);
    } else {
      this.debug('Database query executed', logMetadata, context);
    }
  }

  /**
   * Log event
   */
  logEvent(eventName, payload, metadata = {}) {
    const context = {
      module: 'events',
      requestId: metadata.requestId
    };
    
    const logMetadata = {
      eventName,
      payload: typeof payload === 'object' ? JSON.stringify(payload) : payload,
      priority: metadata.priority,
      listeners: metadata.listeners,
      ...metadata
    };
    
    this.info(`Event emitted: ${eventName}`, logMetadata, context);
  }

  /**
   * Write log to configured outputs
   */
  writeLog(logEntry) {
    const formattedLog = this.formatLog(logEntry);
    
    // Console output
    if (this.config.enableConsole) {
      this.writeToConsole(formattedLog, logEntry.level);
    }
    
    // File output
    if (this.config.enableFile) {
      this.writeToFile(formattedLog);
    }
  }

  /**
   * Format log entry
   */
  formatLog(logEntry) {
    if (this.config.format === 'json') {
      return JSON.stringify(logEntry);
    } else {
      // Text format
      const { timestamp, level, message, requestId, module, ...rest } = logEntry;
      const extras = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : '';
      return `[${timestamp}] ${level} [${requestId}] [${module}] ${message}${extras}`;
    }
  }

  /**
   * Write to console with colors
   */
  writeToConsole(formattedLog, level) {
    const colors = {
      ERROR: '\x1b[31m', // red
      WARN: '\x1b[33m',  // yellow
      INFO: '\x1b[36m',  // cyan
      DEBUG: '\x1b[37m'  // white
    };
    
    const reset = '\x1b[0m';
    const color = colors[level] || '';
    
    console.log(`${color}${formattedLog}${reset}`);
  }

  /**
   * Write to file
   */
  writeToFile(formattedLog) {
    const fs = require('fs');
    
    try {
      fs.appendFileSync(this.config.filePath, formattedLog + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Check if should log based on level
   */
  shouldLog(level) {
    return this.levels[level] <= this.levels[this.config.level];
  }

  /**
   * Generate request ID
   */
  generateRequestId() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Update statistics
   */
  updateStats(level, module, requestId) {
    this.stats.totalLogs++;
    this.stats[`${level}Logs`]++;
    
    // Track logs by module
    if (!this.stats.logsByModule[module]) {
      this.stats.logsByModule[module] = 0;
    }
    this.stats.logsByModule[module]++;
    
    // Track logs by request ID
    if (!this.stats.logsByRequestId[requestId]) {
      this.stats.logsByRequestId[requestId] = 0;
    }
    this.stats.logsByRequestId[requestId]++;
  }

  /**
   * Update response time statistics
   */
  updateResponseTimeStats(responseTime) {
    this.stats.responseTimeCount++;
    this.stats.avgResponseTime = 
      ((this.stats.avgResponseTime * (this.stats.responseTimeCount - 1)) + responseTime) / 
      this.stats.responseTimeCount;
  }

  /**
   * Get logger statistics
   */
  getStats() {
    const errorRate = this.stats.totalLogs > 0 ? 
      (this.stats.errorLogs / this.stats.totalLogs * 100).toFixed(2) : '0';
    
    return {
      ...this.stats,
      errorRate: `${errorRate}%`,
      avgResponseTime: `${this.stats.avgResponseTime.toFixed(2)}ms`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalLogs: 0,
      errorLogs: 0,
      warnLogs: 0,
      infoLogs: 0,
      debugLogs: 0,
      logsByModule: {},
      logsByRequestId: {},
      slowQueries: [],
      errorRates: {},
      avgResponseTime: 0,
      responseTimeCount: 0
    };
  }

  /**
   * Get logs by request ID
   */
  getLogsByRequestId(requestId, limit = 50) {
    // In a real implementation, this would query log storage
    // For now, return statistics
    return {
      requestId,
      logCount: this.stats.logsByRequestId[requestId] || 0,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get slow queries
   */
  getSlowQueries(limit = 20) {
    return this.stats.slowQueries.slice(-limit);
  }

  /**
   * Get error rates by module
   */
  getErrorRates() {
    const rates = {};
    
    for (const module in this.stats.logsByModule) {
      const totalLogs = this.stats.logsByModule[module];
      const errorLogs = this.stats.errorLogs; // Simplified - in real implementation would track per module
      
      rates[module] = {
        totalLogs,
        errorRate: totalLogs > 0 ? (errorLogs / totalLogs * 100).toFixed(2) + '%' : '0%'
      };
    }
    
    return rates;
  }

  /**
   * Create child logger with context
   */
  child(context = {}) {
    const childLogger = new EnterpriseLogger(this.config);
    childLogger.parentContext = context;
    
    return {
      error: (message, metadata = {}) => childLogger.error(message, metadata, { ...context }),
      warn: (message, metadata = {}) => childLogger.warn(message, metadata, { ...context }),
      info: (message, metadata = {}) => childLogger.info(message, metadata, { ...context }),
      debug: (message, metadata = {}) => childLogger.debug(message, metadata, { ...context }),
      logRequest: (req, startTime, metadata = {}) => childLogger.logRequest(req, startTime, { ...metadata }),
      logQuery: (query, duration, metadata = {}) => childLogger.logQuery(query, duration, { ...metadata }),
      logEvent: (eventName, payload, metadata = {}) => childLogger.logEvent(eventName, payload, { ...metadata })
    };
  }
}

// Create default logger instance
const logger = new DatadogLogger({
  level: process.env.LOG_LEVEL || 'INFO',
  enableConsole: process.env.LOG_CONSOLE !== 'false',
  enableFile: process.env.LOG_FILE === 'true',
  filePath: process.env.LOG_FILE_PATH || './logs/app.log'
});

// Express middleware for request logging (Datadog-style)
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = logger.getRequestId(req);
  
  // Add request ID to request object
  req.requestId = requestId;
  req.correlationId = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    
    // Log request completion with Datadog format
    const message = `${req.method} ${req.url} ${res.statusCode}`;
    const data = {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      contentLength: res.get('Content-Length')
    };
    
    const context = {
      requestId: req.requestId,
      correlationId: req.correlationId,
      module: 'http',
      durationMs: responseTime,
      statusCode: res.statusCode
    };
    
    // Determine log level based on status code
    const level = res.statusCode >= 400 ? 'ERROR' : 
                  res.statusCode >= 300 ? 'WARN' : 'INFO';
    
    logger[level](message, data, context);
    
    originalEnd.apply(this, args);
  };
  
  next();
};

module.exports = {
  DatadogLogger,
  logger,
  requestLogger
};
