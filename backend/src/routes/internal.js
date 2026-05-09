// Internal Routes - Observability Dashboard API
// Rutas internas para dashboard de observabilidad tipo Datadog

console.log("🔧 Internal Routes - Observability Dashboard API");

const express = require('express');
const router = express.Router();
const { dashboardAPI, observability, metrics, alertSystem, tracer, logger } = require('../observability');

// Middleware para validar acceso interno
const internalAuth = (req, res, next) => {
  const token = req.headers['x-internal-token'];
  const allowedToken = process.env.INTERNAL_API_TOKEN || 'internal-token-123';
  
  if (token !== allowedToken) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized access to internal API',
      code: 'INTERNAL_UNAUTHORIZED'
    });
  }
  
  next();
};

// Aplicar autenticación a todas las rutas
router.use(internalAuth);

// GET /internal/metrics/dashboard - Dashboard data (Datadog-style)
router.get('/metrics/dashboard', (req, res) => {
  try {
    const dashboardData = dashboardAPI.getDashboardData();
    
    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error getting dashboard data', { error: error.message }, {
      requestId: req.requestId,
      module: 'internal-api'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard data',
      code: 'DASHBOARD_ERROR'
    });
  }
});

// GET /internal/health - Health check endpoint
router.get('/health', (req, res) => {
  try {
    const healthData = dashboardAPI.getHealthCheck();
    
    res.status(healthData.status === 'healthy' ? 200 : 503).json({
      success: healthData.status !== 'unhealthy',
      data: healthData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error getting health data', { error: error.message }, {
      requestId: req.requestId,
      module: 'internal-api'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get health data',
      code: 'HEALTH_ERROR'
    });
  }
});

// GET /internal/metrics - Raw metrics data
router.get('/metrics', (req, res) => {
  try {
    const metricsData = metrics.getMetrics();
    
    res.json({
      success: true,
      data: metricsData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error getting metrics', { error: error.message }, {
      requestId: req.requestId,
      module: 'internal-api'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics',
      code: 'METRICS_ERROR'
    });
  }
});

// GET /internal/logs - Recent logs
router.get('/logs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const level = req.query.level ? req.query.level.toUpperCase() : null;
    
    const loggerStats = logger.getStats();
    let recentLogs = loggerStats.recentLogs || [];
    
    // Filter by level if specified
    if (level) {
      recentLogs = recentLogs.filter(log => log.level === level);
    }
    
    // Limit results
    recentLogs = recentLogs.slice(0, limit);
    
    res.json({
      success: true,
      data: {
        logs: recentLogs,
        total: recentLogs.length,
        stats: loggerStats
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error getting logs', { error: error.message }, {
      requestId: req.requestId,
      module: 'internal-api'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get logs',
      code: 'LOGS_ERROR'
    });
  }
});

// GET /internal/alerts - Active alerts
router.get('/alerts', (req, res) => {
  try {
    const activeAlerts = alertSystem.getActiveAlerts();
    const alertStats = alertSystem.getStats();
    
    res.json({
      success: true,
      data: {
        alerts: activeAlerts,
        stats: alertStats,
        status: alertSystem.getAlertStatus()
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error getting alerts', { error: error.message }, {
      requestId: req.requestId,
      module: 'internal-api'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get alerts',
      code: 'ALERTS_ERROR'
    });
  }
});

// GET /internal/traces - Active traces
router.get('/traces', (req, res) => {
  try {
    const activeTraces = tracer.getActiveTraces();
    const traceStats = tracer.getStats();
    
    res.json({
      success: true,
      data: {
        traces: activeTraces,
        stats: traceStats
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error getting traces', { error: error.message }, {
      requestId: req.requestId,
      module: 'internal-api'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get traces',
      code: 'TRACES_ERROR'
    });
  }
});

// GET /internal/status - Complete system status
router.get('/status', (req, res) => {
  try {
    const statusData = observability.getStatus();
    
    res.json({
      success: true,
      data: statusData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error getting system status', { error: error.message }, {
      requestId: req.requestId,
      module: 'internal-api'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get system status',
      code: 'STATUS_ERROR'
    });
  }
});

// POST /internal/reset - Reset observability data (development only)
router.post('/reset', (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Reset not allowed in production',
        code: 'RESET_FORBIDDEN'
      });
    }
    
    observability.reset();
    
    logger.info('Observability data reset via internal API', {}, {
      requestId: req.requestId,
      module: 'internal-api'
    });
    
    res.json({
      success: true,
      message: 'Observability data reset successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error resetting observability data', { error: error.message }, {
      requestId: req.requestId,
      module: 'internal-api'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to reset observability data',
      code: 'RESET_ERROR'
    });
  }
});

// GET /internal/performance - Performance metrics
router.get('/performance', (req, res) => {
  try {
    const performanceData = {
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      observability: {
        logger: logger.getStats(),
        metrics: metrics.getStats(),
        traces: tracer.getPerformanceMetrics(),
        alerts: alertSystem.getAlertStatus()
      },
      timestamp: Date.now()
    };
    
    res.json({
      success: true,
      data: performanceData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error getting performance data', { error: error.message }, {
      requestId: req.requestId,
      module: 'internal-api'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get performance data',
      code: 'PERFORMANCE_ERROR'
    });
  }
});

module.exports = router;
