// Datadog-Style Dashboard Data API - Fake Datadog Style
// API endpoint para dashboard tipo Datadog con datos reales

console.log("📈 Datadog-Style Dashboard Data API - Fake Datadog Style");

const { metrics } = require('./metrics');
const { alertSystem } = require('./alerts');
const { tracer } = require('./tracer');
const { logger } = require('./logger');

class DashboardDataAPI {
  constructor() {
    this.name = 'dashboard-data-api';
  }

  /**
   * Get comprehensive dashboard data (Datadog-style format)
   */
  getDashboardData() {
    try {
      const timestamp = Date.now();
      
      // Get data from all observability systems
      const metricsData = metrics.getDashboardData();
      const alertsData = alertSystem.getAlertStatus();
      const tracesData = tracer.getPerformanceMetrics();
      const loggerData = logger.getStats();
      
      // Calculate system health
      const systemHealth = this.calculateSystemHealth(metricsData, alertsData);
      
      return {
        system: {
          status: systemHealth.status,
          health: systemHealth.health,
          uptime: process.uptime(),
          version: process.env.APP_VERSION || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date().toISOString()
        },
        traffic: {
          rps: metricsData.traffic.rps || 0,
          requests_total: metricsData.traffic.requests_total || 0,
          requests_per_minute: Math.round((metricsData.traffic.rps || 0) * 60),
          active_requests: metrics.gauges.active_requests || 0
        },
        performance: {
          avg_response_time: parseFloat(metricsData.performance.avg_response_time || 0),
          p50_response_time: metrics.histograms.request_duration_ms.p50 || 0,
          p95_response_time: parseFloat(metricsData.performance.p95 || 0),
          p99_response_time: parseFloat(metricsData.performance.p99 || 0),
          slow_requests_percent: this.calculateSlowRequestsPercent(metricsData)
        },
        errors: {
          rate: parseFloat(metricsData.errors.rate || 0),
          total: metricsData.errors.total || 0,
          errors_per_minute: Math.round((metricsData.errors.total || 0) / 60),
          error_rate_trend: this.calculateErrorRateTrend()
        },
        services: {
          auth: this.getServiceStatus('auth'),
          bookings: this.getServiceStatus('bookings'),
          geo: this.getServiceStatus('geo'),
          gateway: this.getServiceStatus('gateway'),
          database: this.getServiceStatus('database')
        },
        database: {
          status: metricsData.database.status || 'unknown',
          connections_active: metrics.gauges.db_connections_active || 0,
          connections_idle: metrics.gauges.db_connections_idle || 0,
          slow_queries: metricsData.database.slow_queries || 0,
          avg_query_time: metrics.histograms.db_query_duration_ms.avg || 0
        },
        infrastructure: {
          memory_usage_mb: metrics.gauges.memory_usage_mb || 0,
          memory_usage_percent: this.calculateMemoryPercent(),
          cpu_usage_percent: metrics.gauges.cpu_usage_percent || 0,
          disk_usage_percent: this.calculateDiskUsage(),
          network_io: this.calculateNetworkIO()
        },
        alerts: {
          active_alerts: alertsData.activeAlerts || 0,
          critical_alerts: alertsData.criticalAlerts || 0,
          warning_alerts: alertsData.warningAlerts || 0,
          last_alert_time: alertsData.lastAlertTime || null,
          alert_rate: this.calculateAlertRate()
        },
        traces: {
          active_traces: tracesData.activeTraces || 0,
          avg_trace_duration: parseFloat(tracesData.avgDuration) || 0,
          trace_error_rate: parseFloat(tracesData.errorRate) || 0,
          top_services: tracesData.topServices || []
        },
        logs: {
          total_logs: loggerData.totalLogs || 0,
          error_logs: loggerData.errorLogs || 0,
          warn_logs: loggerData.warnLogs || 0,
          log_rate: this.calculateLogRate(),
          recent_errors: this.getRecentErrors()
        },
        timestamp: timestamp
      };
      
    } catch (error) {
      console.error('📈 [dashboard-data] Error getting dashboard data:', error);
      return this.getFallbackDashboardData();
    }
  }

  /**
   * Calculate system health
   */
  calculateSystemHealth(metricsData, alertsData) {
    let health = 100;
    let status = 'healthy';
    
    // Error rate impact
    const errorRate = parseFloat(metricsData.errors.rate || 0);
    if (errorRate > 5) {
      health -= 40;
      status = 'critical';
    } else if (errorRate > 2) {
      health -= 20;
      status = 'degraded';
    }
    
    // Response time impact
    const p95 = parseFloat(metricsData.performance.p95 || 0);
    if (p95 > 1500) {
      health -= 30;
      if (status !== 'critical') status = 'degraded';
    } else if (p95 > 800) {
      health -= 15;
      if (status === 'healthy') status = 'degraded';
    }
    
    // Alert impact
    if (alertsData.criticalAlerts > 0) {
      health -= 25;
      status = 'critical';
    } else if (alertsData.warningAlerts > 0) {
      health -= 10;
      if (status === 'healthy') status = 'degraded';
    }
    
    // Memory impact
    const memoryPercent = this.calculateMemoryPercent();
    if (memoryPercent > 85) {
      health -= 20;
      if (status === 'healthy') status = 'degraded';
    }
    
    health = Math.max(0, Math.min(100, health));
    
    return { status, health: Math.round(health) };
  }

  /**
   * Get service status
   */
  getServiceStatus(serviceName) {
    const gaugeValue = metrics.gauges.service_health_status[serviceName];
    
    if (gaugeValue !== undefined) {
      return gaugeValue === 0 ? 'healthy' : 
             gaugeValue === 1 ? 'degraded' : 
             gaugeValue === 2 ? 'critical' : 'unknown';
    }
    
    // Default status based on service type
    const defaultStatuses = {
      auth: 'healthy',
      bookings: 'healthy', 
      geo: 'healthy',
      gateway: 'healthy',
      database: 'healthy'
    };
    
    return defaultStatuses[serviceName] || 'unknown';
  }

  /**
   * Calculate slow requests percentage
   */
  calculateSlowRequestsPercent(metricsData) {
    const p95 = parseFloat(metricsData.performance.p95 || 0);
    const avg = parseFloat(metricsData.performance.avg_response_time || 0);
    
    if (avg === 0) return 0;
    
    // Estimate slow requests based on p95 vs average
    return Math.min(Math.round(((p95 - avg) / avg) * 100), 100);
  }

  /**
   * Calculate error rate trend
   */
  calculateErrorRateTrend() {
    // Simple trend calculation - would use historical data in real implementation
    const currentRate = parseFloat(metrics.gauges.errors_per_second || 0);
    return currentRate > 2 ? 'increasing' : currentRate < 1 ? 'decreasing' : 'stable';
  }

  /**
   * Calculate memory percentage
   */
  calculateMemoryPercent() {
    const memUsage = process.memoryUsage();
    return Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
  }

  /**
   * Calculate disk usage (mock)
   */
  calculateDiskUsage() {
    return Math.round(Math.random() * 20 + 30); // 30-50%
  }

  /**
   * Calculate network I/O (mock)
   */
  calculateNetworkIO() {
    return {
      bytes_in: Math.round(Math.random() * 1000000),
      bytes_out: Math.round(Math.random() * 1000000),
      packets_in: Math.round(Math.random() * 10000),
      packets_out: Math.round(Math.random() * 10000)
    };
  }

  /**
   * Calculate alert rate
   */
  calculateAlertRate() {
    const stats = alertSystem.getStats();
    return stats.totalAlerts > 0 ? (stats.totalAlerts / 60).toFixed(2) : '0.00';
  }

  /**
   * Calculate log rate
   */
  calculateLogRate() {
    const stats = logger.getStats();
    return stats.totalLogs > 0 ? Math.round(stats.totalLogs / 60) : 0;
  }

  /**
   * Get recent errors
   */
  getRecentErrors() {
    // Would get from logger error history
    return [
      {
        timestamp: new Date(Date.now() - 300000).toISOString(),
        message: 'Database connection timeout',
        module: 'database',
        requestId: 'abc123'
      },
      {
        timestamp: new Date(Date.now() - 600000).toISOString(),
        message: 'Authentication failed for user',
        module: 'auth',
        requestId: 'def456'
      }
    ].slice(0, 5);
  }

  /**
   * Get fallback dashboard data (for errors)
   */
  getFallbackDashboardData() {
    return {
      system: {
        status: 'unknown',
        health: 0,
        uptime: process.uptime(),
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      },
      traffic: {
        rps: 0,
        requests_total: 0,
        requests_per_minute: 0,
        active_requests: 0
      },
      performance: {
        avg_response_time: 0,
        p50_response_time: 0,
        p95_response_time: 0,
        p99_response_time: 0,
        slow_requests_percent: 0
      },
      errors: {
        rate: 0,
        total: 0,
        errors_per_minute: 0,
        error_rate_trend: 'unknown'
      },
      services: {
        auth: 'unknown',
        bookings: 'unknown',
        geo: 'unknown',
        gateway: 'unknown',
        database: 'unknown'
      },
      database: {
        status: 'unknown',
        connections_active: 0,
        connections_idle: 0,
        slow_queries: 0,
        avg_query_time: 0
      },
      infrastructure: {
        memory_usage_mb: 0,
        memory_usage_percent: 0,
        cpu_usage_percent: 0,
        disk_usage_percent: 0,
        network_io: { bytes_in: 0, bytes_out: 0, packets_in: 0, packets_out: 0 }
      },
      alerts: {
        active_alerts: 0,
        critical_alerts: 0,
        warning_alerts: 0,
        last_alert_time: null,
        alert_rate: '0.00'
      },
      traces: {
        active_traces: 0,
        avg_trace_duration: 0,
        trace_error_rate: 0,
        top_services: []
      },
      logs: {
        total_logs: 0,
        error_logs: 0,
        warn_logs: 0,
        log_rate: 0,
        recent_errors: []
      },
      timestamp: Date.now()
    };
  }

  /**
   * Get health check endpoint data
   */
  getHealthCheck() {
    try {
      const dashboardData = this.getDashboardData();
      
      return {
        status: dashboardData.system.status,
        timestamp: dashboardData.system.timestamp,
        checks: {
          database: dashboardData.database.status === 'connected',
          memory: dashboardData.infrastructure.memory_usage_percent < 85,
          cpu: dashboardData.infrastructure.cpu_usage_percent < 80,
          error_rate: dashboardData.errors.rate < 5,
          response_time: dashboardData.performance.p95_response_time < 1500
        },
        uptime: dashboardData.system.uptime,
        version: dashboardData.system.version
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {},
        uptime: process.uptime(),
        version: process.env.APP_VERSION || '1.0.0',
        error: error.message
      };
    }
  }

  /**
   * Get metrics summary for monitoring
   */
  getMetricsSummary() {
    const dashboardData = this.getDashboardData();
    
    return {
      overview: {
        system_status: dashboardData.system.status,
        system_health: dashboardData.system.health,
        uptime: dashboardData.system.uptime
      },
      performance: {
        rps: dashboardData.traffic.rps,
        avg_response_time: dashboardData.performance.avg_response_time,
        p95_response_time: dashboardData.performance.p95_response_time,
        error_rate: dashboardData.errors.rate
      },
      infrastructure: {
        memory_usage_percent: dashboardData.infrastructure.memory_usage_percent,
        cpu_usage_percent: dashboardData.infrastructure.cpu_usage_percent,
        disk_usage_percent: dashboardData.infrastructure.disk_usage_percent
      },
      alerts: {
        active_alerts: dashboardData.alerts.active_alerts,
        critical_alerts: dashboardData.alerts.critical_alerts
      },
      timestamp: dashboardData.timestamp
    };
  }
}

// Create singleton instance
const dashboardAPI = new DashboardDataAPI();

module.exports = {
  DashboardDataAPI,
  dashboardAPI
};
