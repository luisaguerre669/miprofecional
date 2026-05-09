// Load Test System - Enterprise Stress Testing Entry Point
// Punto de entrada unificado para sistema de stress testing

console.log("🚀 Load Test System - Enterprise Stress Testing Entry Point");

const { LoadSimulator } = require('./loadSimulator');
const { LoadTestScenarios } = require('./scenarios');
const { ResultsLogger } = require('./results-logger');

class LoadTestSystem {
  constructor(config = {}) {
    this.name = 'load-test-system';
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:10000',
      maxConcurrency: config.maxConcurrency || 1000,
      outputDir: config.outputDir || './reports',
      enableProtection: config.enableProtection !== false,
      ...config
    };
    
    // Initialize components
    this.simulator = new LoadSimulator({
      baseUrl: this.config.baseUrl,
      maxConcurrency: this.config.maxConcurrency,
      enableProtection: this.config.enableProtection
    });
    
    this.scenarios = new LoadTestScenarios();
    this.logger = new ResultsLogger({
      outputDir: this.config.outputDir
    });
    
    console.log(`🚀 [${this.name}] Load test system initialized:`, {
      baseUrl: this.config.baseUrl,
      maxConcurrency: this.config.maxConcurrency,
      outputDir: this.config.outputDir
    });
  }

  /**
   * Execute complete load test suite
   */
  async executeFullTestSuite() {
    console.log(`🚀 [${this.name}] Starting full test suite...`);
    
    const allScenarios = this.scenarios.getAllScenarios();
    const results = {};
    
    for (const [scenarioName, scenario] of Object.entries(allScenarios)) {
      try {
        console.log(`📊 [${this.name}] Executing scenario: ${scenarioName}`);
        
        // Initialize test session
        await this.logger.initializeTest(`full-suite-${scenarioName}`, scenario);
        
        // Execute scenario
        const result = await this.simulator.executeScenario(scenario);
        
        // Save results
        const reports = await this.logger.saveResults(result);
        
        results[scenarioName] = {
          success: true,
          result,
          reports
        };
        
        console.log(`✅ [${this.name}] Scenario ${scenarioName} completed`);
        
        // Wait between scenarios
        await this.delay(5000);
        
      } catch (error) {
        console.error(`❌ [${this.name}] Scenario ${scenarioName} failed:`, error);
        
        results[scenarioName] = {
          success: false,
          error: error.message
        };
      }
    }
    
    // Generate summary report
    await this.generateSummaryReport(results);
    
    return results;
  }

  /**
   * Execute specific scenario
   */
  async executeScenario(scenarioName, options = {}) {
    const scenario = this.scenarios.getScenario(scenarioName);
    if (!scenario) {
      throw new Error(`Scenario not found: ${scenarioName}`);
    }
    
    // Validate scenario
    const validation = this.scenarios.validateScenario(scenario);
    if (!validation.valid) {
      throw new Error(`Invalid scenario: ${validation.errors.join(', ')}`);
    }
    
    console.log(`🚀 [${this.name}] Executing scenario: ${scenarioName}`);
    
    // Initialize test session
    const testName = options.testName || scenarioName;
    await this.logger.initializeTest(testName, scenario);
    
    // Apply options overrides
    if (options.concurrency) {
      scenario.concurrency = options.concurrency;
    }
    
    if (options.iterations) {
      scenario.iterations = options.iterations;
    }
    
    // Execute scenario
    const result = await this.simulator.executeScenario(scenario);
    
    // Save results
    const reports = await this.logger.saveResults(result);
    
    console.log(`✅ [${this.name}] Scenario ${scenarioName} completed`);
    
    return {
      result,
      reports,
      summary: this.logger.getTestSummary()
    };
  }

  /**
   * Execute quick performance check
   */
  async executeQuickCheck() {
    console.log(`⚡ [${this.name}] Starting quick performance check...`);
    
    const quickScenario = {
      name: 'QUICK_PERFORMANCE_CHECK',
      description: 'Quick performance validation',
      duration: 30000, // 30 seconds
      concurrency: 50,
      iterations: 200,
      requests: [
        {
          endpoint: '/health',
          method: 'GET',
          weight: 3
        },
        {
          endpoint: '/api/auth/login',
          method: 'POST',
          weight: 1,
          body: () => ({
            email: 'test@loadtest.com',
            password: 'Test123456!'
          })
        }
      ]
    };
    
    return await this.executeScenario('quick', {
      testName: 'quick-performance-check',
      ...quickScenario
    });
  }

  /**
   * Execute scalability test
   */
  async executeScalabilityTest() {
    console.log(`📈 [${this.name}] Starting scalability test...`);
    
    const concurrencyLevels = [50, 100, 200, 400, 800];
    const results = {};
    
    for (const concurrency of concurrencyLevels) {
      console.log(`📊 [${this.name}] Testing concurrency: ${concurrency}`);
      
      try {
        const result = await this.executeScenario('auth', {
          testName: `scalability-${concurrency}`,
          concurrency,
          iterations: concurrency * 5
        });
        
        results[concurrency] = {
          success: true,
          summary: result.summary,
          avgLatency: result.result.summary.avg_latency,
          errorRate: result.result.summary.error_rate,
          requestsPerSecond: result.result.summary.total_requests / (result.result.duration / 1000)
        };
        
        console.log(`✅ [${this.name}] Concurrency ${concurrency} completed`);
        
        // Wait between tests
        await this.delay(3000);
        
      } catch (error) {
        console.error(`❌ [${this.name}] Concurrency ${concurrency} failed:`, error);
        
        results[concurrency] = {
          success: false,
          error: error.message
        };
        
        // Stop test if high failure rate
        break;
      }
    }
    
    // Generate scalability report
    await this.generateScalabilityReport(results);
    
    return results;
  }

  /**
   * Generate summary report for full test suite
   */
  async generateSummaryReport(results) {
    const summary = {
      testSuite: 'FULL_TEST_SUITE',
      timestamp: new Date().toISOString(),
      scenarios: Object.keys(results),
      overall: {
        totalScenarios: Object.keys(results).length,
        successfulScenarios: Object.values(results).filter(r => r.success).length,
        failedScenarios: Object.values(results).filter(r => !r.success).length
      },
      performance: this.calculateOverallPerformance(results),
      recommendations: this.generateOverallRecommendations(results)
    };
    
    const filename = `test-suite-summary-${Date.now()}.json`;
    const filepath = `${this.config.outputDir}/${filename}`;
    
    const fs = require('fs').promises;
    await fs.writeFile(filepath, JSON.stringify(summary, null, 2));
    
    console.log(`📊 [${this.name}] Summary report saved: ${filename}`);
    
    return summary;
  }

  /**
   * Generate scalability report
   */
  async generateScalabilityReport(results) {
    const scalabilityData = Object.entries(results)
      .filter(([_, result]) => result.success)
      .map(([concurrency, result]) => ({
        concurrency: parseInt(concurrency),
        avgLatency: result.avgLatency,
        errorRate: result.errorRate,
        requestsPerSecond: result.requestsPerSecond
      }))
      .sort((a, b) => a.concurrency - b.concurrency);
    
    const report = {
      testType: 'SCALABILITY_TEST',
      timestamp: new Date().toISOString(),
      data: scalabilityData,
      maxConcurrency: scalabilityData.length > 0 ? Math.max(...scalabilityData.map(d => d.concurrency)) : 0,
      breakingPoint: this.findBreakingPoint(scalabilityData),
      recommendations: this.generateScalabilityRecommendations(scalabilityData)
    };
    
    const filename = `scalability-report-${Date.now()}.json`;
    const filepath = `${this.config.outputDir}/${filename}`;
    
    const fs = require('fs').promises;
    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    
    console.log(`📊 [${this.name}] Scalability report saved: ${filename}`);
    
    return report;
  }

  /**
   * Calculate overall performance metrics
   */
  calculateOverallPerformance(results) {
    const successfulResults = Object.values(results).filter(r => r.success);
    
    if (successfulResults.length === 0) {
      return { status: 'failed', message: 'All scenarios failed' };
    }
    
    const totalRequests = successfulResults.reduce((sum, r) => sum + r.result.summary.total_requests, 0);
    const totalErrors = successfulResults.reduce((sum, r) => sum + r.result.summary.failed_requests, 0);
    const avgLatency = successfulResults.reduce((sum, r) => sum + r.result.summary.avg_latency, 0) / successfulResults.length;
    
    return {
      status: 'success',
      totalRequests,
      errorRate: (totalErrors / totalRequests) * 100,
      avgLatency: Math.round(avgLatency),
      scenariosCompleted: successfulResults.length,
      scenariosFailed: Object.values(results).filter(r => !r.success).length
    };
  }

  /**
   * Generate overall recommendations
   */
  generateOverallRecommendations(results) {
    const recommendations = [];
    const bottlenecks = [];
    
    // Collect all bottlenecks
    for (const result of Object.values(results)) {
      if (result.success && result.result.bottlenecks) {
        bottlenecks.push(...result.result.bottlenecks);
      }
    }
    
    // Analyze common issues
    const errorRates = Object.values(results)
      .filter(r => r.success)
      .map(r => r.result.summary.error_rate);
    
    const avgErrorRate = errorRates.reduce((sum, rate) => sum + rate, 0) / errorRates.length;
    
    if (avgErrorRate > 10) {
      recommendations.push({
        priority: 'critical',
        type: 'error_rate',
        description: 'High error rate across multiple scenarios',
        action: 'Review error handling and implement retry mechanisms'
      });
    }
    
    // Check for common bottlenecks
    const bottleneckTypes = bottlenecks.reduce((acc, b) => {
      acc[b.type] = (acc[b.type] || 0) + 1;
      return acc;
    }, {});
    
    for (const [type, count] of Object.entries(bottleneckTypes)) {
      if (count > 2) {
        recommendations.push({
          priority: 'high',
          type: type,
          description: `Repeated ${type} issues across scenarios`,
          action: `Optimize ${type} handling system-wide`
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Find breaking point in scalability test
   */
  findBreakingPoint(scalabilityData) {
    for (let i = 1; i < scalabilityData.length; i++) {
      const current = scalabilityData[i];
      const previous = scalabilityData[i - 1];
      
      // Significant latency increase
      if (current.avgLatency > previous.avgLatency * 2) {
        return {
          concurrency: previous.concurrency,
          reason: 'Latency doubled',
          latency: previous.avgLatency,
          nextLatency: current.avgLatency
        };
      }
      
      // High error rate
      if (current.errorRate > 10) {
        return {
          concurrency: current.concurrency,
          reason: 'Error rate exceeded 10%',
          errorRate: current.errorRate
        };
      }
    }
    
    return null;
  }

  /**
   * Generate scalability recommendations
   */
  generateScalabilityRecommendations(scalabilityData) {
    const recommendations = [];
    
    if (scalabilityData.length === 0) {
      return recommendations;
    }
    
    const maxConcurrency = Math.max(...scalabilityData.map(d => d.concurrency));
    const breakingPoint = this.findBreakingPoint(scalabilityData);
    
    if (breakingPoint) {
      recommendations.push({
        priority: 'high',
        type: 'scaling_limit',
        description: `System shows degradation at ${breakingPoint.concurrency} concurrent users`,
        action: `Optimize for ${breakingPoint.concurrency * 2} concurrent users or implement auto-scaling`
      });
    } else {
      recommendations.push({
        priority: 'medium',
        type: 'scaling_potential',
        description: `System handles up to ${maxConcurrency} concurrent users well`,
        action: 'Consider testing higher concurrency levels'
      });
    }
    
    return recommendations;
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      name: this.name,
      config: this.config,
      simulator: this.simulator.getStatus(),
      scenarios: this.scenarios.getTestDataSummary(),
      isRunning: this.simulator.isRunning
    };
  }

  /**
   * Emergency stop
   */
  emergencyStop() {
    this.simulator.emergencyStop();
    console.log(`🛑 [${this.name}] Emergency stop triggered`);
  }

  /**
   * Get available scenarios
   */
  getAvailableScenarios() {
    const scenarios = this.scenarios.getAllScenarios();
    
    return Object.keys(scenarios).map(name => ({
      name,
      description: scenarios[name].description,
      duration: scenarios[name].duration,
      concurrency: scenarios[name].concurrency,
      iterations: scenarios[name].iterations
    }));
  }

  /**
   * Utility: delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create singleton instance
const loadTestSystem = new LoadTestSystem({
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:10000',
  maxConcurrency: process.env.TEST_MAX_CONCURRENCY ? parseInt(process.env.TEST_MAX_CONCURRENCY) : 1000,
  outputDir: process.env.TEST_OUTPUT_DIR || './reports'
});

module.exports = {
  LoadTestSystem,
  loadTestSystem
};
