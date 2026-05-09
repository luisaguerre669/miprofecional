// Datadog-Style Alert System - Real-time Alerting
// Sistema de alertas internas con reglas críticas y warnings

console.log("🚨 Datadog-Style Alert System - Real-time Alerting");

class DatadogAlertSystem {
  constructor(config = {}) {
    this.name = 'datadog-alerts';
    this.config = {
      enableConsole: config.enableConsole !== false,
      enableWebhook: config.enableWebhook || false,
      webhookUrl: config.webhookUrl || null,
      checkInterval: config.checkInterval || 30000, // 30 seconds
      alertCooldown: config.alertCooldown || 300000, // 5 minutes
      ...config
    };
    
    // Alert rules
    this.rules = {
      critical: [
        {
          name: 'error_rate_high',
          condition: 'error_rate > 5',
          threshold: 5,
          window: 300000, // 5 minutes
          message: 'Error rate is critically high (>5%)',
          enabled: true
        },
        {
          name: 'response_time_p95_high',
          condition: 'p95_response_time > 1500',
          threshold: 1500,
          window: 300000,
          message: 'P95 response time is critically high (>1500ms)',
          enabled: true
        },
        {
          name: 'circuit_breaker_open',
          condition: 'circuit_breaker_status == open',
          threshold: 1,
          window: 60000,
          message: 'Circuit breaker is OPEN',
          enabled: true
        },
        {
          name: 'database_connection_failed',
          condition: 'database_status != connected',
          threshold: 1,
          window: 60000,
          message: 'Database connection failed',
          enabled: true
        }
      ],
      warning: [
        {
          name: 'response_time_high',
          condition: 'avg_response_time > 800',
          threshold: 800,
          window: 300000,
          message: 'Response time is high (>800ms)',
          enabled: true
        },
        {
          name: 'memory_usage_high',
          condition: 'memory_usage_percent > 80',
          threshold: 80,
          window: 60000,
          message: 'Memory usage is high (>80%)',
          enabled: true
        },
        {
          name: 'cpu_usage_high',
          condition: 'cpu_usage_percent > 75',
          threshold: 75,
          window: 60000,
          message: 'CPU usage is high (>75%)',
          enabled: true
        },
        {
          name: 'high_retry_rate',
          condition: 'retry_rate > 10',
          threshold: 10,
          window: 300000,
          message: 'Retry rate is high (>10%)',
          enabled: true
        }
      ]
    };
    
    // Alert storage
    this.alerts = [];
    this.activeAlerts = new Map(); // rule.name -> alert timestamp
    this.alertHistory = [];
    this.maxHistorySize = 1000;
    
    // Statistics
    this.stats = {
      totalAlerts: 0,
      criticalAlerts: 0,
      warningAlerts: 0,
      alertsByRule: {},
      avgResolutionTime: 0,
      lastAlertTime: null
    };
    
    // Start alert monitoring
    this.startMonitoring();
  }

  /**
   * Start alert monitoring
   */
  startMonitoring() {
    setInterval(() => {
      this.checkAlerts();
    }, this.config.checkInterval);
    
    console.log(`🚨 [${this.name}] Alert monitoring started:`, {
      checkInterval: this.config.checkInterval,
      criticalRules: this.rules.critical.filter(r => r.enabled).length,
      warningRules: this.rules.warning.filter(r => r.enabled).length
    });
  }

  /**
   * Check all alert rules
   */
  async checkAlerts() {
    try {
      const metrics = this.getMetrics();
      const now = Date.now();
      
      // Check critical rules
      for (const rule of this.rules.critical.filter(r => r.enabled)) {
        await this.evaluateRule(rule, metrics, 'critical', now);
      }
      
      // Check warning rules
      for (const rule of this.rules.warning.filter(r => r.enabled)) {
        await this.evaluateRule(rule, metrics, 'warning', now);
      }
      
    } catch (error) {
      console.error(`🚨 [${this.name}] Error checking alerts:`, error);
    }
  }

  /**
   * Evaluate a single rule
   */
  async evaluateRule(rule, metrics, severity, now) {
    try {
      const result = this.evaluateCondition(rule.condition, metrics);
      
      if (result.triggered) {
        const lastAlertTime = this.activeAlerts.get(rule.name);
        
        // Check cooldown period
        if (!lastAlertTime || (now - lastAlertTime) > this.config.alertCooldown) {
          await this.triggerAlert(rule, result.value, severity, metrics);
          this.activeAlerts.set(rule.name, now);
        }
      } else {
        // Clear alert if condition resolved
        if (this.activeAlerts.has(rule.name)) {
          await this.clearAlert(rule.name, severity);
          this.activeAlerts.delete(rule.name);
        }
      }
      
    } catch (error) {
      console.error(`🚨 [${this.name}] Error evaluating rule ${rule.name}:`, error);
    }
  }

  /**
   * Evaluate rule condition
   */
  evaluateCondition(condition, metrics) {
    // Simple condition evaluation
    if (condition.includes('error_rate >')) {
      const threshold = parseFloat(condition.split('>')[1]);
      const errorRate = this.calculateErrorRate(metrics);
      return { triggered: errorRate > threshold, value: errorRate };
    }
    
    if (condition.includes('p95_response_time >')) {
      const threshold = parseFloat(condition.split('>')[1]);
      const p95 = metrics.performance?.p95 || 0;
      return { triggered: p95 > threshold, value: p95 };
    }
    
    if (condition.includes('avg_response_time >')) {
      const threshold = parseFloat(condition.split('>')[1]);
      const avg = metrics.performance?.avg_response_time || 0;
      return { triggered: avg > threshold, value: avg };
    }
    
    if (condition.includes('memory_usage_percent >')) {
      const threshold = parseFloat(condition.split('>')[1]);
      const memory = metrics.system?.memory_usage_percent || 0;
      return { triggered: memory > threshold, value: memory };
    }
    
    if (condition.includes('cpu_usage_percent >')) {
      const threshold = parseFloat(condition.split('>')[1]);
      const cpu = metrics.system?.cpu_usage_percent || 0;
      return { triggered: cpu > threshold, value: cpu };
    }
    
    if (condition.includes('circuit_breaker_status ==')) {
      const expected = condition.split('==')[1].trim();
      const status = metrics.services?.gateway || 'unknown';
      return { triggered: status === expected, value: status };
    }
    
    if (condition.includes('database_status !=')) {
      const expected = condition.split('!=')[1].trim();
      const status = metrics.database?.status || 'unknown';
      return { triggered: status !== expected, value: status };
    }
    
    return { triggered: false, value: null };
  }

  /**
   * Calculate error rate
   */
  calculateErrorRate(metrics) {
    if (!metrics.traffic?.requests_total || metrics.traffic.requests_total === 0) {
      return 0;
    }
    
    return (metrics.errors.total / metrics.traffic.requests_total) * 100;
  }

  /**
   * Trigger an alert
   */
  async triggerAlert(rule, value, severity, metrics) {
    const alert = {
      id: this.generateAlertId(),
      ruleName: rule.name,
      severity,
      message: rule.message,
      condition: rule.condition,
      value,
      threshold: rule.threshold,
      timestamp: new Date().toISOString(),
      status: 'active',
      metrics: this.sanitizeMetrics(metrics),
      resolvedAt: null
    };
    
    // Store alert
    this.alerts.push(alert);
    this.alertHistory.unshift(alert);
    
    // Limit history size
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory = this.alertHistory.slice(0, this.maxHistorySize);
    }
    
    // Update statistics
    this.updateStats(alert);
    
    // Log alert
    this.logAlert(alert);
    
    // Send webhook if enabled
    if (this.config.enableWebhook && this.config.webhookUrl) {
      await this.sendWebhook(alert);
    }
    
    return alert;
  }

  /**
   * Clear an alert
   */
  async clearAlert(ruleName, severity) {
    const alert = this.alerts.find(a => a.ruleName === ruleName && a.status === 'active');
    if (!alert) return;
    
    alert.status = 'resolved';
    alert.resolvedAt = new Date().toISOString();
    alert.duration = Date.now() - new Date(alert.timestamp).getTime();
    
    // Update statistics
    this.stats.avgResolutionTime = 
      ((this.stats.avgResolutionTime * (this.stats.totalAlerts - 1)) + alert.duration) / 
      this.stats.totalAlerts;
    
    // Log resolution
    console.log(`🚨 [${this.name}] Alert resolved:`, {
      ruleName: alert.ruleName,
      severity: alert.severity,
      duration: `${alert.duration}ms`
    });
    
    return alert;
  }

  /**
   * Generate alert ID
   */
  generateAlertId() {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Sanitize metrics for alert
   */
  sanitizeMetrics(metrics) {
    return {
      system: metrics.system || {},
      traffic: metrics.traffic || {},
      performance: metrics.performance || {},
      errors: metrics.errors || {},
      services: metrics.services || {},
      database: metrics.database || {}
    };
  }

  /**
   * Update alert statistics
   */
  updateStats(alert) {
    this.stats.totalAlerts++;
    this.stats.lastAlertTime = alert.timestamp;
    
    if (alert.severity === 'critical') {
      this.stats.criticalAlerts++;
    } else {
      this.stats.warningAlerts++;
    }
    
    if (!this.stats.alertsByRule[alert.ruleName]) {
      this.stats.alertsByRule[alert.ruleName] = 0;
    }
    this.stats.alertsByRule[alert.ruleName]++;
  }

  /**
   * Log alert
   */
  logAlert(alert) {
    const logLevel = alert.severity === 'critical' ? 'ERROR' : 'WARN';
    const logEntry = {
      timestamp: alert.timestamp,
      level: logLevel,
      service: 'alert-system',
      module: 'alerts',
      message: `ALERT: ${alert.message}`,
      data: {
        alertId: alert.id,
        ruleName: alert.ruleName,
        severity: alert.severity,
        condition: alert.condition,
        value: alert.value,
        threshold: alert.threshold,
        metrics: alert.metrics
      }
    };
    
    console.log(`🚨 [${this.name}] ${logLevel}:`, logEntry);
  }

  /**
   * Send webhook notification
   */
  async sendWebhook(alert) {
    try {
      const payload = {
        alert,
        timestamp: new Date().toISOString(),
        service: 'miprofesional-api'
      };
      
      // In a real implementation, this would make an HTTP request
      console.log(`🚨 [${this.name}] Webhook would be sent to:`, this.config.webhookUrl);
      console.log(`🚨 [${this.name}] Webhook payload:`, JSON.stringify(payload, null, 2));
      
    } catch (error) {
      console.error(`🚨 [${this.name}] Failed to send webhook:`, error);
    }
  }

  /**
   * Get metrics from the metrics system
   */
  getMetrics() {
    // This would integrate with the metrics system
    // For now, return mock data
    return {
      system: {
        memory_usage_percent: 45,
        cpu_usage_percent: 25,
        uptime: 123456
      },
      traffic: {
        requests_total: 50000,
        rps: 120
      },
      performance: {
        avg_response_time: 320,
        p95: 850,
        p99: 1200
      },
      errors: {
        total: 120,
        rate: 0.8
      },
      services: {
        auth: 'ok',
        bookings: 'ok',
        geo: 'ok',
        gateway: 'ok'
      },
      database: {
        status: 'connected',
        slow_queries: 3
      }
    };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    return this.alerts.filter(alert => alert.status === 'active');
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit = 100) {
    return this.alertHistory.slice(0, limit);
  }

  /**
   * Get alert statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeAlerts: this.getActiveAlerts().length,
      avgResolutionTime: this.stats.avgResolutionTime.toFixed(2) + 'ms',
      timestamp: Date.now()
    };
  }

  /**
   * Get alert status
   */
  getAlertStatus() {
    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
    const warningAlerts = activeAlerts.filter(a => a.severity === 'warning');
    
    let status = 'healthy';
    if (criticalAlerts.length > 0) {
      status = 'critical';
    } else if (warningAlerts.length > 0) {
      status = 'warning';
    }
    
    return {
      status,
      activeAlerts: activeAlerts.length,
      criticalAlerts: criticalAlerts.length,
      warningAlerts: warningAlerts.length,
      lastAlertTime: this.stats.lastAlertTime,
      timestamp: Date.now()
    };
  }

  /**
   * Enable/disable rule
   */
  toggleRule(ruleName, enabled) {
    const allRules = [...this.rules.critical, ...this.rules.warning];
    const rule = allRules.find(r => r.name === ruleName);
    
    if (rule) {
      rule.enabled = enabled;
      console.log(`🚨 [${this.name}] Rule ${ruleName} ${enabled ? 'enabled' : 'disabled'}`);
      return true;
    }
    
    return false;
  }

  /**
   * Add custom rule
   */
  addRule(rule, severity = 'warning') {
    if (!this.rules[severity]) {
      console.error(`🚨 [${this.name}] Invalid severity: ${severity}`);
      return false;
    }
    
    this.rules[severity].push({
      ...rule,
      enabled: rule.enabled !== false
    });
    
    console.log(`🚨 [${this.name}] Custom rule added:`, rule.name);
    return true;
  }

  /**
   * Reset all alerts
   */
  reset() {
    this.alerts = [];
    this.activeAlerts.clear();
    this.alertHistory = [];
    this.stats = {
      totalAlerts: 0,
      criticalAlerts: 0,
      warningAlerts: 0,
      alertsByRule: {},
      avgResolutionTime: 0,
      lastAlertTime: null
    };
    
    console.log(`🚨 [${this.name}] All alerts and statistics reset`);
  }
}

// Create singleton instance
const alertSystem = new DatadogAlertSystem({
  enableConsole: process.env.ALERTS_CONSOLE !== 'false',
  enableWebhook: process.env.ALERTS_WEBHOOK === 'true',
  webhookUrl: process.env.ALERTS_WEBHOOK_URL || null
});

module.exports = {
  DatadogAlertSystem,
  alertSystem
};
