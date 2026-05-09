// Load Test Controller - Tests de carga para Go Live validation
// Controlador para ejecutar tests de carga y rendimiento

const axios = require('axios');

class LoadTestController {
  constructor() {
    this.baseURL = process.env.API_BASE_URL || 'http://localhost:3001';
    this.testTimeout = 30000;
    this.maxConcurrency = 100;
    this.results = [];
    console.log('⚡ Load Test Controller initialized');
  }

  /**
   * Ejecutar test de carga completo
   */
  async runFullLoadTest(req, res) {
    try {
      console.log('⚡ Starting full load test...');
      
      const { 
        requests = 1000, 
        concurrency = 50, 
        duration = 60000 
      } = req.body;
      
      // Test 1: Health check
      const healthTest = await this.testHealthEndpoint();
      
      // Test 2: Load test concurrente
      const loadTest = await this.runConcurrentLoadTest(requests, concurrency);
      
      // Test 3: Stress test
      const stressTest = await this.runStressTest(duration);
      
      // Test 4: Endpoints críticos
      const criticalEndpointsTest = await this.testCriticalEndpoints();
      
      // Test 5: Performance bajo carga
      const performanceTest = await this.testPerformanceUnderLoad();
      
      const results = {
        timestamp: new Date().toISOString(),
        testConfig: { requests, concurrency, duration },
        health: healthTest,
        load: loadTest,
        stress: stressTest,
        critical: criticalEndpointsTest,
        performance: performanceTest,
        summary: this.generateSummary(healthTest, loadTest, stressTest, criticalEndpointsTest, performanceTest)
      };
      
      this.results.push(results);
      
      res.status(200).json({
        success: true,
        data: results,
        message: 'Full load test completed successfully'
      });
      
    } catch (error) {
      console.error('❌ Full load test error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to run full load test'
      });
    }
  }

  /**
   * Test de endpoint de salud
   */
  async testHealthEndpoint() {
    try {
      console.log('⚡ Testing health endpoint...');
      
      const startTime = Date.now();
      const response = await axios.get(`${this.baseURL}/health`, { timeout: this.testTimeout });
      const endTime = Date.now();
      
      return {
        success: response.status === 200,
        responseTime: endTime - startTime,
        status: response.data?.status || 'unknown',
        passed: response.status === 200 && (endTime - startTime) < 1000
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        responseTime: 9999,
        passed: false
      };
    }
  }

  /**
   * Test de carga concurrente
   */
  async runConcurrentLoadTest(totalRequests, concurrency) {
    try {
      console.log(`⚡ Running concurrent load test: ${totalRequests} requests, ${concurrency} concurrent`);
      
      const startTime = Date.now();
      const results = [];
      let successCount = 0;
      let errorCount = 0;
      const responseTimes = [];
      
      // Crear batches de requests concurrentes
      const batchSize = Math.floor(totalRequests / concurrency);
      const remainder = totalRequests % concurrency;
      
      for (let batch = 0; batch < batchSize; batch++) {
        const batchPromises = [];
        
        for (let i = 0; i < concurrency; i++) {
          const requestIndex = batch * concurrency + i;
          
          if (requestIndex >= totalRequests) break;
          
          batchPromises.push(this.makeSingleRequest(requestIndex));
        }
        
        // Ejecutar batch concurrente
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Procesar resultados del batch
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            successCount++;
            responseTimes.push(result.value.responseTime);
          } else {
            errorCount++;
          }
          
          results.push({
            request: batch * concurrency + index,
            success: result.status === 'fulfilled',
            responseTime: result.status === 'fulfilled' ? result.value.responseTime : null,
            error: result.status === 'rejected' ? result.reason.message : null
          });
        });
      }
      
      // Requests restantes
      if (remainder > 0) {
        const remainderPromises = [];
        for (let i = 0; i < remainder; i++) {
          remainderPromises.push(this.makeSingleRequest(batchSize * concurrency + i));
        }
        
        const remainderResults = await Promise.allSettled(remainderPromises);
        remainderResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            successCount++;
            responseTimes.push(result.value.responseTime);
          } else {
            errorCount++;
          }
          
          results.push({
            request: batchSize * concurrency + index,
            success: result.status === 'fulfilled',
            responseTime: result.status === 'fulfilled' ? result.value.responseTime : null,
            error: result.status === 'rejected' ? result.reason.message : null
          });
        });
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Calcular estadísticas
      responseTimes.sort((a, b) => a - b);
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const p50 = responseTimes[Math.floor(responseTimes.length * 0.5)];
      const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
      const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)];
      
      return {
        totalRequests,
        concurrency,
        successCount,
        errorCount,
        successRate: (successCount / totalRequests) * 100,
        errorRate: (errorCount / totalRequests) * 100,
        totalTime,
        avgResponseTime: Math.round(avgResponseTime),
        p50,
        p95,
        p99,
        minResponseTime: Math.min(...responseTimes),
        maxResponseTime: Math.max(...responseTimes),
        passed: successCount >= totalRequests * 0.99 && p95 < 800
      };
      
    } catch (error) {
      console.error('❌ Concurrent load test error:', error);
      return {
        success: false,
        error: error.message,
        passed: false
      };
    }
  }

  /**
   * Test de estrés
   */
  async runStressTest(duration) {
    try {
      console.log(`⚡ Running stress test for ${duration}ms...`);
      
      const startTime = Date.now();
      const results = [];
      let requestCount = 0;
      let errorCount = 0;
      
      // Generar carga sostenida durante el tiempo especificado
      const endTime = startTime + duration;
      
      while (Date.now() < endTime) {
        const batchPromises = [];
        
        // Crear batch de 10 requests concurrentes
        for (let i = 0; i < 10; i++) {
          batchPromises.push(this.makeSingleRequest(requestCount + i));
        }
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          requestCount++;
          
          if (result.status === 'fulfilled') {
            results.push({
              request: requestCount,
              success: true,
              responseTime: result.value.responseTime
            });
          } else {
            errorCount++;
            results.push({
              request: requestCount,
              success: false,
              error: result.reason.message
            });
          }
        });
        
        // Pequeña pausa entre batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const actualDuration = Date.now() - startTime;
      const successRate = ((requestCount - errorCount) / requestCount) * 100;
      
      return {
        duration: actualDuration,
        totalRequests: requestCount,
        errorCount,
        successRate,
        requestsPerSecond: requestCount / (actualDuration / 1000),
        passed: successRate >= 99 && errorCount === 0
      };
      
    } catch (error) {
      console.error('❌ Stress test error:', error);
      return {
        success: false,
        error: error.message,
        passed: false
      };
    }
  }

  /**
   * Test de endpoints críticos
   */
  async testCriticalEndpoints() {
    try {
      console.log('⚡ Testing critical endpoints...');
      
      const endpoints = [
        { path: '/health', method: 'GET', expectedStatus: 200 },
        { path: '/api/categories', method: 'GET', expectedStatus: 200 },
        { path: '/api/professionals/nearby', method: 'GET', expectedStatus: 200, params: { lat: -34.6037, lng: -58.3816, radius: 5000 } },
        { path: '/api/mobile/health', method: 'GET', expectedStatus: 200 }
      ];
      
      const results = [];
      let passedCount = 0;
      
      for (const endpoint of endpoints) {
        const startTime = Date.now();
        
        try {
          const config = {
            method: endpoint.method.toLowerCase(),
            url: `${this.baseURL}${endpoint.path}`,
            timeout: this.testTimeout
          };
          
          if (endpoint.params) {
            config.params = endpoint.params;
          }
          
          const response = await axios(config);
          const endTime = Date.now();
          
          const passed = response.status === endpoint.expectedStatus;
          if (passed) passedCount++;
          
          results.push({
            endpoint: endpoint.path,
            method: endpoint.method,
            expectedStatus: endpoint.expectedStatus,
            actualStatus: response.status,
            responseTime: endTime - startTime,
            passed,
            success: true
          });
          
        } catch (error) {
          const endTime = Date.now();
          
          results.push({
            endpoint: endpoint.path,
            method: endpoint.method,
            expectedStatus: endpoint.expectedStatus,
            actualStatus: error.response?.status || 0,
            responseTime: endTime - startTime,
            passed: false,
            error: error.message,
            success: false
          });
        }
      }
      
      return {
        totalEndpoints: endpoints.length,
        passedCount,
        failedCount: endpoints.length - passedCount,
        successRate: (passedCount / endpoints.length) * 100,
        results,
        passed: passedCount === endpoints.length
      };
      
    } catch (error) {
      console.error('❌ Critical endpoints test error:', error);
      return {
        success: false,
        error: error.message,
        passed: false
      };
    }
  }

  /**
   * Test de rendimiento bajo carga
   */
  async testPerformanceUnderLoad() {
    try {
      console.log('⚡ Testing performance under load...');
      
      // Test con diferentes niveles de carga
      const loadLevels = [10, 25, 50, 100];
      const results = [];
      
      for (const load of loadLevels) {
        const result = await this.runConcurrentLoadTest(load * 10, load);
        results.push({
          load: load,
          requests: load * 10,
          concurrency: load,
          ...result
        });
      }
      
      // Analizar degradación del rendimiento
      const degradation = this.analyzePerformanceDegradation(results);
      
      return {
        loadLevels,
        results,
        degradation,
        passed: degradation.maxDegradation < 20 && results.every(r => r.passed)
      };
      
    } catch (error) {
      console.error('❌ Performance under load test error:', error);
      return {
        success: false,
        error: error.message,
        passed: false
      };
    }
  }

  /**
   * Hacer una única request
   */
  async makeSingleRequest(requestId) {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${this.baseURL}/health`, { timeout: this.testTimeout });
      const endTime = Date.now();
      
      return {
        requestId,
        success: true,
        responseTime: endTime - startTime,
        status: response.status
      };
      
    } catch (error) {
      const endTime = Date.now();
      
      return {
        requestId,
        success: false,
        responseTime: endTime - startTime,
        error: error.message
      };
    }
  }

  /**
   * Analizar degradación del rendimiento
   */
  analyzePerformanceDegradation(results) {
    if (results.length < 2) {
      return { maxDegradation: 0, trend: 'stable' };
    }
    
    const firstResult = results[0];
    const lastResult = results[results.length - 1];
    
    const responseTimeDegradation = ((lastResult.avgResponseTime - firstResult.avgResponseTime) / firstResult.avgResponseTime) * 100;
    const successRateDegradation = firstResult.successRate - lastResult.successRate;
    
    return {
      maxDegradation: Math.max(responseTimeDegradation, Math.abs(successRateDegradation)),
      responseTimeDegradation,
      successRateDegradation,
      trend: responseTimeDegradation > 10 ? 'degrading' : successRateDegradation > 5 ? 'unstable' : 'stable'
    };
  }

  /**
   * Generar resumen del test
   */
  generateSummary(health, load, stress, critical, performance) {
    const allPassed = [
      health.passed,
      load.passed,
      stress.passed,
      critical.passed,
      performance.passed
    ].every(Boolean);
    
    const issues = [];
    if (!health.passed) issues.push('Health endpoint failed');
    if (!load.passed) issues.push('Load test failed');
    if (!stress.passed) issues.push('Stress test failed');
    if (!critical.passed) issues.push('Critical endpoints failed');
    if (!performance.passed) issues.push('Performance degradation detected');
    
    const recommendations = [];
    if (load.errorRate > 1) recommendations.push('Optimize error handling');
    if (load.p95 > 800) recommendations.push('Improve response times');
    if (performance.degradation.maxDegradation > 20) recommendations.push('Fix performance degradation under load');
    
    return {
      overall: {
        passed: allPassed,
        issues,
        recommendations,
        goLiveDecision: allPassed ? 'GO' : 'NO-GO',
        confidence: allPassed ? 95 : 60
      },
      health,
      load,
      stress,
      critical,
      performance
    };
  }

  /**
   * Obtener resultados de tests anteriores
   */
  async getTestResults(req, res) {
    try {
      const { limit = 10, skip = 0 } = req.query;
      
      const paginatedResults = this.results
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(parseInt(skip), parseInt(skip) + parseInt(limit));
      
      res.status(200).json({
        success: true,
        data: paginatedResults,
        pagination: {
          total: this.results.length,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: parseInt(skip) + parseInt(limit) < this.results.length
        }
      });
      
    } catch (error) {
      console.error('❌ Get test results error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get test results'
      });
    }
  }

  /**
   * Limpiar resultados de tests
   */
  async clearTestResults(req, res) {
    try {
      this.results = [];
      
      res.status(200).json({
        success: true,
        message: 'Test results cleared'
      });
      
    } catch (error) {
      console.error('❌ Clear test results error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear test results'
      });
    }
  }

  /**
   * Obtener estadísticas de tests
   */
  async getTestStats(req, res) {
    try {
      if (this.results.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            totalTests: 0,
            successRate: 0,
            lastTest: null,
            averageResponseTime: 0
          }
        });
      }
      
      const lastTest = this.results[this.results.length - 1];
      const successTests = this.results.filter(r => r.summary.overall.passed).length;
      
      const stats = {
        totalTests: this.results.length,
        successTests,
        successRate: (successTests / this.results.length) * 100,
        lastTest: lastTest.timestamp,
        lastTestResult: lastTest.summary.overall.goLiveDecision,
        averageResponseTime: lastTest.load?.avgResponseTime || 0,
        trends: this.calculateTestTrends()
      };
      
      res.status(200).json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      console.error('❌ Get test stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get test stats'
      });
    }
  }

  /**
   * Calcular tendencias de tests
   */
  calculateTestTrends() {
    if (this.results.length < 2) {
      return { trend: 'insufficient_data', direction: 'stable' };
    }
    
    const recentTests = this.results.slice(-5);
    const successTests = recentTests.filter(r => r.summary.overall.passed).length;
    const successRate = (successTests / recentTests.length) * 100;
    
    let trend = 'stable';
    let direction = 'stable';
    
    if (successRate >= 80) {
      trend = 'improving';
      direction = 'up';
    } else if (successRate <= 40) {
      trend = 'degrading';
      direction = 'down';
    }
    
    return { trend, direction, successRate, recentTests: recentTests.length };
  }
}

module.exports = new LoadTestController();
