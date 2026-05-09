#!/usr/bin/env node

// Scaling Runner - Enterprise Scaling Validation CLI
// CLI para ejecutar validación de escalado enterprise

console.log("📈 Scaling Runner - Enterprise Scaling Validation CLI");

const { scalingValidator } = require('./scaling-validator');

// CLI arguments
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  try {
    console.log(`🎯 [Scaling Runner] Starting with command: ${command}`);
    
    switch (command) {
      case 'validate-10k':
        await runValidation10k();
        break;
        
      case 'validate-50k':
        await runValidation50k();
        break;
        
      case 'validate-100k':
        await runValidation100k();
        break;
        
      case 'performance':
        await runPerformanceValidation();
        break;
        
      case 'database':
        await runDatabaseValidation();
        break;
        
      case 'gateway':
        await runGatewayValidation();
        break;
        
      case 'config':
        await showScalingConfig();
        break;
        
      case 'roadmap':
        await showScalingRoadmap();
        break;
        
      default:
        showUsage();
        break;
    }
    
  } catch (error) {
    console.error(`❌ [Scaling Runner] Error:`, error.message);
    process.exit(1);
  }
}

/**
 * Run validation for 10k users
 */
async function runValidation10k() {
  console.log(`📈 Running scaling validation for 10,000 users...`);
  
  const results = await scalingValidator.executeScalingValidation(10000);
  
  console.log(`✅ 10k users validation completed:`);
  console.log(`   Overall Ready: ${results.overall.ready ? '✅ YES' : '❌ NO'}`);
  console.log(`   Performance: ${results.performance.overall ? '✅' : '❌'}`);
  console.log(`   Database: ${results.database.overall ? '✅' : '❌'}`);
  console.log(`   Gateway: ${results.gateway.overall ? '✅' : '❌'}`);
  console.log(`   Scaling Config: ${results.scaling.passed ? '✅' : '❌'}`);
  
  const summary = scalingValidator.getValidationSummary();
  console.log(`   Success Rate: ${summary.successRate}%`);
  
  if (!results.overall.ready && results.overall.issues.length > 0) {
    console.log(`   Issues: ${results.overall.issues.join(', ')}`);
  }
  
  if (!results.overall.ready) {
    console.log(`\n❌ System NOT ready for 10k users - fix issues before scaling`);
    process.exit(1);
  }
}

/**
 * Run validation for 50k users
 */
async function runValidation50k() {
  console.log(`📈 Running scaling validation for 50,000 users...`);
  
  const results = await scalingValidator.executeScalingValidation(50000);
  
  console.log(`✅ 50k users validation completed:`);
  console.log(`   Overall Ready: ${results.overall.ready ? '✅ YES' : '❌ NO'}`);
  console.log(`   Performance: ${results.performance.overall ? '✅' : '❌'}`);
  console.log(`   Database: ${results.database.overall ? '✅' : '❌'}`);
  console.log(`   Gateway: ${results.gateway.overall ? '✅' : '❌'}`);
  console.log(`   Scaling Config: ${results.scaling.passed ? '✅' : '❌'}`);
  
  const summary = scalingValidator.getValidationSummary();
  console.log(`   Success Rate: ${summary.successRate}%`);
  
  if (!results.overall.ready && results.overall.issues.length > 0) {
    console.log(`   Issues: ${results.overall.issues.join(', ')}`);
  }
  
  if (!results.overall.ready) {
    console.log(`\n❌ System NOT ready for 50k users - fix issues before scaling`);
    process.exit(1);
  }
}

/**
 * Run validation for 100k users
 */
async function runValidation100k() {
  console.log(`📈 Running scaling validation for 100,000 users...`);
  
  const results = await scalingValidator.executeScalingValidation(100000);
  
  console.log(`✅ 100k users validation completed:`);
  console.log(`   Overall Ready: ${results.overall.ready ? '✅ YES' : '❌ NO'}`);
  console.log(`   Performance: ${results.performance.overall ? '✅' : '❌'}`);
  console.log(`   Database: ${results.database.overall ? '✅' : '❌'}`);
  console.log(`   Gateway: ${results.gateway.overall ? '✅' : '❌'}`);
  console.log(`   Scaling Config: ${results.scaling.passed ? '✅' : '❌'}`);
  
  const summary = scalingValidator.getValidationSummary();
  console.log(`   Success Rate: ${summary.successRate}%`);
  
  if (!results.overall.ready && results.overall.issues.length > 0) {
    console.log(`   Issues: ${results.overall.issues.join(', ')}`);
  }
  
  if (!results.overall.ready) {
    console.log(`\n❌ System NOT ready for 100k users - fix issues before scaling`);
    process.exit(1);
  }
}

/**
 * Run performance validation only
 */
async function runPerformanceValidation() {
  console.log(`⚡ Running performance validation...`);
  
  const results = await scalingValidator.validatePerformance();
  
  console.log(`✅ Performance validation completed:`);
  console.log(`   Overall: ${results.overall ? '✅ PASSED' : '❌ FAILED'}`);
  
  for (const [test, result] of Object.entries(results.tests)) {
    console.log(`   ${result.passed ? '✅' : '❌'} ${test}`);
    if (!result.passed && result.error) {
      console.log(`     Error: ${result.error}`);
    }
  }
  
  if (!results.overall) {
    console.log(`\n❌ Performance validation failed - optimize before scaling`);
    process.exit(1);
  }
}

/**
 * Run database validation only
 */
async function runDatabaseValidation() {
  console.log(`🗄️ Running database validation...`);
  
  const results = await scalingValidator.validateDatabase();
  
  console.log(`✅ Database validation completed:`);
  console.log(`   Overall: ${results.overall ? '✅ PASSED' : '❌ FAILED'}`);
  
  for (const [test, result] of Object.entries(results.tests)) {
    console.log(`   ${result.passed ? '✅' : '❌'} ${test}`);
    if (!result.passed && result.error) {
      console.log(`     Error: ${result.error}`);
    }
  }
  
  if (!results.overall) {
    console.log(`\n❌ Database validation failed - optimize before scaling`);
    process.exit(1);
  }
}

/**
 * Run gateway validation only
 */
async function runGatewayValidation() {
  console.log(`🚪 Running gateway validation...`);
  
  const results = await scalingValidator.validateGateway();
  
  console.log(`✅ Gateway validation completed:`);
  console.log(`   Overall: ${results.overall ? '✅ PASSED' : '❌ FAILED'}`);
  
  for (const [test, result] of Object.entries(results.tests)) {
    console.log(`   ${result.passed ? '✅' : '❌'} ${test}`);
    if (!result.passed && result.error) {
      console.log(`     Error: ${result.error}`);
    }
  }
  
  if (!results.overall) {
    console.log(`\n❌ Gateway validation failed - fix before scaling`);
    process.exit(1);
  }
}

/**
 * Show scaling configuration
 */
async function showScalingConfig() {
  console.log(`📈 Scaling configuration:`);
  
  const { scalingSystem } = require('./index');
  
  // Show configuration for different user counts
  const userCounts = [10000, 50000, 100000];
  
  for (const userCount of userCounts) {
    console.log(`\n🎯 Configuration for ${userCount.toLocaleString()} users:`);
    
    const config = scalingSystem.getScalingConfiguration(userCount);
    
    console.log(`   MongoDB:`);
    console.log(`     Connection Pool: ${config.mongodb.connection.maxPoolSize}`);
    console.log(`     Indexes: ${config.mongodb.indexes.length}`);
    console.log(`     Retry Enabled: ${config.mongodb.connection.retryWrites}`);
    
    console.log(`   Gateway:`);
    console.log(`     Instances: ${config.gateway.deployment.gateway.instances}`);
    console.log(`     CPU: ${config.gateway.deployment.gateway.cpu}`);
    console.log(`     Memory: ${config.gateway.deployment.gateway.memory}`);
    console.log(`     Timeout: ${config.gateway.configuration.timeout}ms`);
    
    console.log(`   Monolito:`);
    console.log(`     Instances: ${config.gateway.deployment.monolito.instances}`);
    console.log(`     CPU: ${config.gateway.deployment.monolito.cpu}`);
    console.log(`     Memory: ${config.gateway.deployment.monolito.memory}`);
    
    console.log(`   Performance:`);
    console.log(`     Compression: ${config.performance.response.compression.enabled ? '✅' : '❌'}`);
    console.log(`     Caching: ${config.performance.caching.enabled ? '✅' : '❌'}`);
    console.log(`     Rate Limiting: ${config.performance.rateLimiting.enabled ? '✅' : '❌'}`);
  }
}

/**
 * Show scaling roadmap
 */
async function showScalingRoadmap() {
  console.log(`🗺️ Scaling roadmap:`);
  
  const { scalingSystem } = require('./index');
  const roadmap = scalingSystem.getScalingRoadmap();
  
  console.log(`\n📅 Timeline: ${roadmap.timeline}`);
  console.log(`\n📋 Phases:`);
  
  roadmap.phases.forEach((phase, index) => {
    console.log(`\n   Phase ${phase.phase}: ${phase.name}`);
    console.log(`   Target: ${phase.targetUsers.toLocaleString()} users`);
    console.log(`   Duration: ${phase.duration}`);
    console.log(`   Tasks:`);
    phase.tasks.forEach(task => {
      console.log(`     - ${task}`);
    });
    console.log(`   Deliverables:`);
    phase.deliverables.forEach(deliverable => {
      console.log(`     - ${deliverable}`);
    });
  });
  
  console.log(`\n🔗 Dependencies:`);
  roadmap.dependencies.forEach(dep => {
    console.log(`   - ${dep}`);
  });
}

/**
 * Show usage information
 */
function showUsage() {
  console.log(`📈 Scaling Runner - Enterprise Scaling Validation CLI`);
  console.log(``);
  console.log(`Usage: node run-scaling.js <command>`);
  console.log(``);
  console.log(`Commands:`);
  console.log(`   validate-10k     - Validate scaling to 10,000 users`);
  console.log(`   validate-50k     - Validate scaling to 50,000 users`);
  console.log(`   validate-100k    - Validate scaling to 100,000 users`);
  console.log(`   performance      - Run performance validation only`);
  console.log(`   database         - Run database validation only`);
  console.log(`   gateway          - Run gateway validation only`);
  console.log(`   config           - Show scaling configuration`);
  console.log(`   roadmap          - Show scaling roadmap`);
  console.log(``);
  console.log(`Environment Variables:`);
  console.log(`   TEST_BASE_URL        - API base URL for testing (default: https://api.tudominio.com)`);
  console.log(`   TEST_TIMEOUT         - Request timeout in ms (default: 10000)`);
  console.log(`   TEST_MAX_CONCURRENCY - Max concurrent requests (default: 100)`);
  console.log(``);
  console.log(`Examples:`);
  console.log(`   node run-scaling.js validate-10k`);
  console.log(`   node run-scaling.js validate-50k`);
  console.log(`   node run-scaling.js validate-100k`);
  console.log(`   TEST_BASE_URL=https://api.myapp.com node run-scaling.js performance`);
}

// Handle process signals
process.on('SIGINT', () => {
  console.log(`\n🛑 Scaling validation stopped by user`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(`\n🛑 Scaling validation stopped by system`);
  process.exit(0);
});

// Run main function
if (require.main === module) {
  main();
}

module.exports = {
  runValidation10k,
  runValidation50k,
  runValidation100k,
  runPerformanceValidation,
  runDatabaseValidation,
  runGatewayValidation,
  showScalingConfig,
  showScalingRoadmap
};
