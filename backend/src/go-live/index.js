// Go Live System - Production Readiness Validation
// Sistema de validación GO LIVE para producción

console.log("🚀 Go Live System - Production Readiness Validation");

const { goLiveValidator } = require('./go-live-validator');

class GoLiveSystem {
  constructor(config = {}) {
    this.name = 'go-live-system';
    this.config = {
      baseUrl: config.baseUrl || 'https://api.tudominio.com',
      testTimeout: config.testTimeout || 10000,
      maxConcurrency: config.maxConcurrency || 100,
      stabilityTestDuration: config.stabilityTestDuration || 30 * 60 * 1000,
      ...config
    };
    
    this.validationResults = null;
    
    console.log(`🚀 [${this.name}] Go Live system initialized:`, {
      baseUrl: this.config.baseUrl,
      testTimeout: this.config.testTimeout
    });
  }

  /**
   * Execute complete GO LIVE validation
   */
  async executeGoLiveValidation() {
    console.log(`🚀 [${this.name}] Starting GO LIVE validation...`);
    
    try {
      this.validationResults = await goLiveValidator.executeGoLiveValidation();
      
      console.log(`✅ [${this.name}] GO LIVE validation completed`);
      
      return this.validationResults;
      
    } catch (error) {
      console.error(`❌ [${this.name}] GO LIVE validation failed:`, error);
      throw error;
    }
  }

  /**
   * Get validation status
   */
  getValidationStatus() {
    if (!this.validationResults) {
      return {
        status: 'not_executed',
        goLive: false,
        timestamp: null
      };
    }
    
    return {
      status: 'executed',
      goLive: this.validationResults.final.goLive,
      timestamp: this.validationResults.final.timestamp,
      summary: goLiveValidator.getValidationSummary(),
      issues: this.validationResults.final.issues,
      recommendations: this.validationResults.final.recommendations
    };
  }

  /**
   * Print detailed results
   */
  printResults() {
    if (!this.validationResults) {
      console.log(`❌ [${this.name}] No validation results available`);
      return;
    }
    
    goLiveValidator.printResults();
  }

  /**
   * Get go/no-go decision
   */
  getGoNoGoDecision() {
    if (!this.validationResults) {
      return {
        decision: 'NO_GO',
        reason: 'Validation not executed',
        confidence: 0
      };
    }
    
    const summary = goLiveValidator.getValidationSummary();
    const confidence = parseFloat(summary.successRate) / 100;
    
    return {
      decision: this.validationResults.final.goLive ? 'GO' : 'NO_GO',
      reason: this.validationResults.final.goLive 
        ? 'All critical validations passed' 
        : 'Critical validations failed',
      confidence: confidence,
      issues: this.validationResults.final.issues,
      recommendations: this.validationResults.final.recommendations
    };
  }

  /**
   * Reset validation state
   */
  reset() {
    this.validationResults = null;
    console.log(`🔄 [${this.name}] Validation state reset`);
  }
}

// Create singleton instance
const goLiveSystem = new GoLiveSystem({
  baseUrl: process.env.GO_LIVE_BASE_URL || 'https://api.tudominio.com',
  testTimeout: process.env.GO_LIVE_TEST_TIMEOUT ? parseInt(process.env.GO_LIVE_TEST_TIMEOUT) : 10000,
  maxConcurrency: process.env.GO_LIVE_MAX_CONCURRENCY ? parseInt(process.env.GO_LIVE_MAX_CONCURRENCY) : 100,
  stabilityTestDuration: process.env.GO_LIVE_STABILITY_DURATION ? parseInt(process.env.GO_LIVE_STABILITY_DURATION) : 30 * 60 * 1000
});

module.exports = {
  GoLiveSystem,
  goLiveSystem,
  goLiveValidator
};
