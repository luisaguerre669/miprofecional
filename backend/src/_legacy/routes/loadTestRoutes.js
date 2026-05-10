// Load Test Routes - Rutas para tests de carga y Go Live validation
// Rutas para ejecutar tests de rendimiento y validación de producción

const express = require('express');
const router = express.Router();
const LoadTestController = require('../controllers/loadTestController');
const authMiddleware = require('../middleware/auth');

// Middleware para logging de peticiones de load test
router.use((req, res, next) => {
  console.log(`⚡ Load Test API: ${req.method} ${req.path}`);
  console.log(`⚡ User-Agent: ${req.get('User-Agent') || 'Unknown'}`);
  console.log(`⚡ Timestamp: ${new Date().toISOString()}`);
  next();
});

/**
 * Rutas principales de Load Testing
 */

// POST /api/load-test/full - Ejecutar test completo de carga
router.post('/full', LoadTestController.runFullLoadTest);

// GET /api/load-test/results - Obtener resultados de tests anteriores
router.get('/results', LoadTestController.getTestResults);

// DELETE /api/load-test/results - Limpiar resultados de tests
router.delete('/results', LoadTestController.clearTestResults);

// GET /api/load-test/stats - Obtener estadísticas de tests
router.get('/stats', LoadTestController.getTestStats);

/**
 * Rutas específicas de tests
 */

// POST /api/load-test/health - Test de health endpoint
router.post('/health', async (req, res) => {
  try {
    const result = await LoadTestController.testHealthEndpoint();
    res.status(200).json({
      success: true,
      data: result,
      message: 'Health test completed'
    });
  } catch (error) {
    console.error('❌ Health test error:', error);
    res.status(500).json({
      success: false,
      error: 'Health test failed'
    });
  }
});

// POST /api/load-test/concurrent - Test de carga concurrente
router.post('/concurrent', async (req, res) => {
  try {
    const { requests = 1000, concurrency = 100 } = req.body;
    const result = await LoadTestController.runConcurrentLoadTest(requests, concurrency);
    res.status(200).json({
      success: true,
      data: result,
      message: 'Concurrent load test completed'
    });
  } catch (error) {
    console.error('❌ Concurrent load test error:', error);
    res.status(500).json({
      success: false,
      error: 'Concurrent load test failed'
    });
  }
});

// POST /api/load-test/stress - Test de estrés
router.post('/stress', async (req, res) => {
  try {
    const { duration = 60000 } = req.body;
    const result = await LoadTestController.runStressTest(duration);
    res.status(200).json({
      success: true,
      data: result,
      message: 'Stress test completed'
    });
  } catch (error) {
    console.error('❌ Stress test error:', error);
    res.status(500).json({
      success: false,
      error: 'Stress test failed'
    });
  }
});

// POST /api/load-test/critical - Test de endpoints críticos
router.post('/critical', async (req, res) => {
  try {
    const result = await LoadTestController.testCriticalEndpoints();
    res.status(200).json({
      success: true,
      data: result,
      message: 'Critical endpoints test completed'
    });
  } catch (error) {
    console.error('❌ Critical endpoints test error:', error);
    res.status(500).json({
      success: false,
      error: 'Critical endpoints test failed'
    });
  }
});

// POST /api/load-test/performance - Test de rendimiento bajo carga
router.post('/performance', async (req, res) => {
  try {
    const result = await LoadTestController.testPerformanceUnderLoad();
    res.status(200).json({
      success: true,
      data: result,
      message: 'Performance under load test completed'
    });
  } catch (error) {
    console.error('❌ Performance test error:', error);
    res.status(500).json({
      success: false,
      error: 'Performance test failed'
    });
  }
});

/**
 * Rutas de validación Go Live
 */

// POST /api/load-test/go-live/validate - Validación Go Live completa
router.post('/go-live/validate', authMiddleware, async (req, res) => {
  try {
    const GoLiveValidator = require('../go-live-validator');
    const goLiveValidator = new GoLiveValidator();
    
    const result = await goLiveValidator.executeGoLiveValidation();
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Go Live validation completed'
    });
  } catch (error) {
    console.error('❌ Go Live validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Go Live validation failed'
    });
  }
});

// GET /api/load-test/go-live/status - Obtener estado de validación Go Live
router.get('/go-live/status', authMiddleware, async (req, res) => {
  try {
    const GoLiveValidator = require('../go-live-validator');
    const goLiveValidator = new GoLiveValidator();
    
    const summary = goLiveValidator.getValidationSummary();
    
    res.status(200).json({
      success: true,
      data: summary,
      message: 'Go Live status retrieved'
    });
  } catch (error) {
    console.error('❌ Go Live status error:', error);
    res.status(500).json({
      success: false,
      error: 'Go Live status retrieval failed'
    });
  }
});

/**
 * Rutas de monitoreo en tiempo real
 */

// GET /api/load-test/monitoring/status - Estado del sistema
router.get('/monitoring/status', async (req, res) => {
  try {
    const status = await LoadTestController.getSystemStatus();
    res.status(200).json({
      success: true,
      data: status,
      message: 'System status retrieved'
    });
  } catch (error) {
    console.error('❌ System status error:', error);
    res.status(500).json({
      success: false,
      error: 'System status retrieval failed'
    });
  }
});

// GET /api/load-test/monitoring/metrics - Métricas en tiempo real
router.get('/monitoring/metrics', async (req, res) => {
  try {
    const { duration = 60000 } = req.query;
    const metrics = await LoadTestController.getRealTimeMetrics(parseInt(duration));
    
    res.status(200).json({
      success: true,
      data: metrics,
      message: 'Real-time metrics retrieved'
    });
  } catch (error) {
    console.error('❌ Real-time metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Real-time metrics retrieval failed'
    });
  }
});

/**
 * Rutas de configuración de tests
 */

// GET /api/load-test/config - Obtener configuración de tests
router.get('/config', (req, res) => {
  try {
    const config = {
      baseURL: process.env.API_BASE_URL || 'http://localhost:3001',
      testTimeout: 30000,
      maxConcurrency: 100,
      defaultRequests: 1000,
      defaultDuration: 60000,
      endpoints: [
        { path: '/health', method: 'GET', expectedStatus: 200 },
        { path: '/api/categories', method: 'GET', expectedStatus: 200 },
        { path: '/api/professionals/nearby', method: 'GET', expectedStatus: 200 },
        { path: '/api/mobile/health', method: 'GET', expectedStatus: 200 }
      ]
    };
    
    res.status(200).json({
      success: true,
      data: config,
      message: 'Load test configuration retrieved'
    });
  } catch (error) {
    console.error('❌ Get config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get configuration'
    });
  }
});

// PUT /api/load-test/config - Actualizar configuración de tests
router.put('/config', authMiddleware, async (req, res) => {
  try {
    const { baseURL, testTimeout, maxConcurrency, defaultRequests, defaultDuration } = req.body;
    
    // En una implementación real, esto se guardaría en base de datos
    const config = {
      baseURL: baseURL || process.env.API_BASE_URL,
      testTimeout: testTimeout || 30000,
      maxConcurrency: maxConcurrency || 100,
      defaultRequests: defaultRequests || 1000,
      defaultDuration: defaultDuration || 60000,
      updatedAt: new Date()
    };
    
    res.status(200).json({
      success: true,
      data: config,
      message: 'Load test configuration updated'
    });
  } catch (error) {
    console.error('❌ Update config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update configuration'
    });
  }
});

/**
 * Rutas de reportes y análisis
 */

// GET /api/load-test/reports/summary - Reporte resumido
router.get('/reports/summary', async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    
    const summary = await LoadTestController.generateSummaryReport({
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      limit: parseInt(limit)
    });
    
    res.status(200).json({
      success: true,
      data: summary,
      message: 'Summary report generated'
    });
  } catch (error) {
    console.error('❌ Summary report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate summary report'
    });
  }
});

// GET /api/load-test/reports/performance - Reporte de rendimiento
router.get('/reports/performance', async (req, res) => {
  try {
    const { testId } = req.query;
    
    const report = await LoadTestController.generatePerformanceReport(testId);
    
    res.status(200).json({
      success: true,
      data: report,
      message: 'Performance report generated'
    });
  } catch (error) {
    console.error('❌ Performance report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate performance report'
    });
  }
});

// GET /api/load-test/reports/go-live - Reporte de validación Go Live
router.get('/reports/go-live', async (req, res) => {
  try {
    const { testId } = req.query;
    
    const report = await LoadTestController.generateGoLiveReport(testId);
    
    res.status(200).json({
      success: true,
      data: report,
      message: 'Go Live validation report generated'
    });
  } catch (error) {
    console.error('❌ Go Live report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate Go Live report'
    });
  }
});

/**
 * Middleware para manejar errores
 */
router.use((error, req, res, next) => {
  console.error(`❌ Load Test API Error: ${error.message}`);
  console.error(`❌ Path: ${req.path}`);
  console.error(`❌ Method: ${req.method}`);
  
  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
});

/**
 * Middleware para rutas no encontradas
 */
router.use('*', (req, res) => {
  console.log(`❌ Load Test API - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      '/full',
      '/results',
      '/stats',
      '/health',
      '/concurrent',
      '/stress',
      '/critical',
      '/performance',
      '/go-live/validate',
      '/go-live/status',
      '/monitoring/status',
      '/monitoring/metrics',
      '/config',
      '/reports/summary',
      '/reports/performance',
      '/reports/go-live'
    ]
  });
});

module.exports = router;
