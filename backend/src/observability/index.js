// Datadog-Style Observability Module Index - Production Monitoring
// Punto de entrada unificado para sistema de observabilidad tipo Datadog

console.log("📊 Datadog-Style Observability Module Index - Production Monitoring");

const { DatadogLogger, logger, requestLogger } = require('./logger');
const { DatadogMetrics, metrics, metricsMiddleware } = require('./metrics');
const { DatadogTracer, tracer } = require('./tracer');
const { DatadogAlertSystem, alertSystem } = require('./alerts');
const { DashboardDataAPI, dashboardAPI } = require('./dashboard-data');

// Create unified Datadog-style observability interface
class DatadogObservabilitySystem {
  constructor(config = {}) {
    this.name = 'datadog-observability-system';
    this.logger = logger;
    this.metrics = metrics;
    this.tracer = tracer;
    this.alertSystem = alertSystem;
    this.dashboardAPI = dashboardAPI;
    this.config = config;
    
    // Initialize
    this.init();
  }

  init() {
    console.log(`📊 [${this.name}] Observability system initialized`);
  }

  /**
   * Get comprehensive observability data
   */
  getStatus() {
    return {
      logger: this.logger.getStats(),
      metrics: this.metrics.getMetrics(),
      traces: this.tracer.getStats(),
      alerts: this.alertSystem.getStats(),
      dashboard: this.dashboardAPI.getDashboardData(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    const alertStatus = this.alertSystem.getAlertStatus();
    const loggerStats = this.logger.getStats();
    const metricsData = this.metrics.getMetricsSummary();
    
    let status = 'healthy';
    let issues = [];
    
    // Check for critical alerts
    if (alertStatus.criticalAlerts > 0) {
      status = 'critical';
      issues.push(`${alertStatus.criticalAlerts} critical alerts active`);
    }
    
    // Check for warning alerts
    if (alertStatus.warningAlerts > 0 && status === 'healthy') {
      status = 'warning';
      issues.push(`${alertStatus.warningAlerts} warning alerts active`);
    }
    
    // Check error rate
    const errorRate = parseFloat(loggerStats.errorRate);
    if (errorRate > 10) {
      status = 'critical';
      issues.push(`High error rate: ${loggerStats.errorRate}`);
    }
    
    // Check success rate
    const successRate = parseFloat(loggerStats.successRate);
    if (successRate < 95 && status === 'healthy') {
      status = 'warning';
      issues.push(`Low success rate: ${loggerStats.successRate}`);
    }
    
    return {
      status,
      issues,
      logger: loggerStats,
      metrics: metricsData,
      alerts: alertStatus,
      dashboard: this.dashboardAPI.getMetricsSummary(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset all observability data
   */
  reset() {
    this.logger.resetStats();
    this.metrics.reset();
    this.tracer.reset();
    this.alertSystem.reset();
    
    console.log(`📊 [${this.name}] All observability data reset`);
  }

  /**
   * Get dashboard data (Datadog-style)
   */
  getDashboardData() {
    return this.dashboardAPI.getDashboardData();
  }

  /**
   * Get health check data
   */
  getHealthCheck() {
    return this.dashboardAPI.getHealthCheck();
  }
}

// Create singleton instance
const observability = new DatadogObservabilitySystem();

module.exports = {
  // Classes
  DatadogLogger,
  DatadogMetrics,
  DatadogTracer,
  DatadogAlertSystem,
  DashboardDataAPI,
  DatadogObservabilitySystem,
  
  // Instances
  logger,
  metrics,
  tracer,
  alertSystem,
  dashboardAPI,
  observability,
  
  // Middleware
  requestLogger,
  metricsMiddleware,
  tracerMiddleware: tracer.traceMiddleware.bind(tracer)
};
