#!/usr/bin/env node

// Load Test Runner - Enterprise Stress Testing CLI
// CLI para ejecutar stress testing enterprise

console.log("🚀 Load Test Runner - Enterprise Stress Testing CLI");

const { loadTestSystem } = require('./index');

// CLI arguments
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  try {
    console.log(`🎯 [Load Test Runner] Starting with command: ${command}`);
    
    switch (command) {
      case 'quick':
        await runQuickCheck();
        break;
        
      case 'auth':
        await runAuthTest();
        break;
        
      case 'bookings':
        await runBookingsTest();
        break;
        
      case 'geo':
        await runGeolocationTest();
        break;
        
      case 'mixed':
        await runMixedTest();
        break;
        
      case 'stress':
        await runStressTest();
        break;
        
      case 'scalability':
        await runScalabilityTest();
        break;
        
      case 'full':
        await runFullTestSuite();
        break;
        
      case 'scenarios':
        await listScenarios();
        break;
        
      case 'status':
        await showStatus();
        break;
        
      default:
        showUsage();
        break;
    }
    
  } catch (error) {
    console.error(`❌ [Load Test Runner] Error:`, error.message);
    process.exit(1);
  }
}

/**
 * Run quick performance check
 */
async function runQuickCheck() {
  console.log(`⚡ Running quick performance check...`);
  
  const result = await loadTestSystem.executeQuickCheck();
  
  console.log(`✅ Quick check completed:`);
  console.log(`   Requests: ${result.result.summary.total_requests}`);
  console.log(`   Success Rate: ${(100 - result.result.summary.error_rate).toFixed(1)}%`);
  console.log(`   Avg Latency: ${result.result.summary.avg_latency}ms`);
  console.log(`   System Status: ${result.result.summary.system_status}`);
  
  if (result.reports.length > 0) {
    console.log(`   Reports: ${result.reports.map(r => r.filename).join(', ')}`);
  }
}

/**
 * Run auth load test
 */
async function runAuthTest() {
  console.log(`🔐 Running auth load test...`);
  
  const result = await loadTestSystem.executeScenario('auth');
  
  console.log(`✅ Auth test completed:`);
  console.log(`   Requests: ${result.result.summary.total_requests}`);
  console.log(`   Success Rate: ${(100 - result.result.summary.error_rate).toFixed(1)}%`);
  console.log(`   Avg Latency: ${result.result.summary.avg_latency}ms`);
  console.log(`   P95 Latency: ${result.result.summary.p95_latency}ms`);
  console.log(`   System Status: ${result.result.summary.system_status}`);
  
  if (result.result.bottlenecks.length > 0) {
    console.log(`   Bottlenecks: ${result.result.bottlenecks.length}`);
  }
  
  if (result.reports.length > 0) {
    console.log(`   Reports: ${result.reports.map(r => r.filename).join(', ')}`);
  }
}

/**
 * Run bookings load test
 */
async function runBookingsTest() {
  console.log(`📅 Running bookings load test...`);
  
  const result = await loadTestSystem.executeScenario('bookings');
  
  console.log(`✅ Bookings test completed:`);
  console.log(`   Requests: ${result.result.summary.total_requests}`);
  console.log(`   Success Rate: ${(100 - result.result.summary.error_rate).toFixed(1)}%`);
  console.log(`   Avg Latency: ${result.result.summary.avg_latency}ms`);
  console.log(`   P95 Latency: ${result.result.summary.p95_latency}ms`);
  console.log(`   System Status: ${result.result.summary.system_status}`);
  
  if (result.result.bottlenecks.length > 0) {
    console.log(`   Bottlenecks: ${result.result.bottlenecks.length}`);
  }
  
  if (result.reports.length > 0) {
    console.log(`   Reports: ${result.reports.map(r => r.filename).join(', ')}`);
  }
}

/**
 * Run geolocation load test
 */
async function runGeolocationTest() {
  console.log(`🗺️ Running geolocation load test...`);
  
  const result = await loadTestSystem.executeScenario('geolocation');
  
  console.log(`✅ Geolocation test completed:`);
  console.log(`   Requests: ${result.result.summary.total_requests}`);
  console.log(`   Success Rate: ${(100 - result.result.summary.error_rate).toFixed(1)}%`);
  console.log(`   Avg Latency: ${result.result.summary.avg_latency}ms`);
  console.log(`   P95 Latency: ${result.result.summary.p95_latency}ms`);
  console.log(`   System Status: ${result.result.summary.system_status}`);
  
  if (result.result.bottlenecks.length > 0) {
    console.log(`   Bottlenecks: ${result.result.bottlenecks.length}`);
  }
  
  if (result.reports.length > 0) {
    console.log(`   Reports: ${result.reports.map(r => r.filename).join(', ')}`);
  }
}

/**
 * Run mixed traffic test
 */
async function runMixedTest() {
  console.log(`🔄 Running mixed traffic test...`);
  
  const result = await loadTestSystem.executeScenario('mixed');
  
  console.log(`✅ Mixed traffic test completed:`);
  console.log(`   Requests: ${result.result.summary.total_requests}`);
  console.log(`   Success Rate: ${(100 - result.result.summary.error_rate).toFixed(1)}%`);
  console.log(`   Avg Latency: ${result.result.summary.avg_latency}ms`);
  console.log(`   P95 Latency: ${result.result.summary.p95_latency}ms`);
  console.log(`   System Status: ${result.result.summary.system_status}`);
  
  if (result.result.bottlenecks.length > 0) {
    console.log(`   Bottlenecks: ${result.result.bottlenecks.length}`);
  }
  
  if (result.reports.length > 0) {
    console.log(`   Reports: ${result.reports.map(r => r.filename).join(', ')}`);
  }
}

/**
 * Run stress test
 */
async function runStressTest() {
  console.log(`💪 Running stress test...`);
  
  const result = await loadTestSystem.executeScenario('stress');
  
  console.log(`✅ Stress test completed:`);
  console.log(`   Requests: ${result.result.summary.total_requests}`);
  console.log(`   Success Rate: ${(100 - result.result.summary.error_rate).toFixed(1)}%`);
  console.log(`   Avg Latency: ${result.result.summary.avg_latency}ms`);
  console.log(`   P95 Latency: ${result.result.summary.p95_latency}ms`);
  console.log(`   System Status: ${result.result.summary.system_status}`);
  
  if (result.result.bottlenecks.length > 0) {
    console.log(`   Bottlenecks: ${result.result.bottlenecks.length}`);
    result.result.bottlenecks.forEach(b => {
      console.log(`     - ${b.endpoint}: ${b.type} (${b.severity})`);
    });
  }
  
  if (result.result.recommendations.length > 0) {
    console.log(`   Recommendations: ${result.result.recommendations.length}`);
    result.result.recommendations.forEach(r => {
      console.log(`     - ${r.type}: ${r.description}`);
    });
  }
  
  if (result.reports.length > 0) {
    console.log(`   Reports: ${result.reports.map(r => r.filename).join(', ')}`);
  }
}

/**
 * Run scalability test
 */
async function runScalabilityTest() {
  console.log(`📈 Running scalability test...`);
  
  const results = await loadTestSystem.executeScalabilityTest();
  
  console.log(`✅ Scalability test completed:`);
  
  for (const [concurrency, result] of Object.entries(results)) {
    if (result.success) {
      console.log(`   ${concurrency} concurrent: ${result.avgLatency}ms avg, ${result.errorRate.toFixed(1)}% errors, ${result.requestsPerSecond.toFixed(0)} RPS`);
    } else {
      console.log(`   ${concurrency} concurrent: FAILED - ${result.error}`);
    }
  }
  
  console.log(`   Report: scalability-report-*.json`);
}

/**
 * Run full test suite
 */
async function runFullTestSuite() {
  console.log(`🎯 Running full test suite...`);
  console.log(`   This will take several minutes...`);
  
  const results = await loadTestSystem.executeFullTestSuite();
  
  console.log(`✅ Full test suite completed:`);
  
  for (const [scenarioName, result] of Object.entries(results)) {
    if (result.success) {
      console.log(`   ${scenarioName}: ✅ ${result.result.summary.total_requests} requests, ${(100 - result.result.summary.error_rate).toFixed(1)}% success`);
    } else {
      console.log(`   ${scenarioName}: ❌ ${result.error}`);
    }
  }
  
  console.log(`   Reports: test-suite-summary-*.json and individual scenario reports`);
}

/**
 * List available scenarios
 */
async function listScenarios() {
  console.log(`📋 Available test scenarios:`);
  
  const scenarios = loadTestSystem.getAvailableScenarios();
  
  scenarios.forEach(scenario => {
    console.log(`   ${scenario.name}:`);
    console.log(`     Description: ${scenario.description}`);
    console.log(`     Duration: ${scenario.duration}ms`);
    console.log(`     Concurrency: ${scenario.concurrency}`);
    console.log(`     Iterations: ${scenario.iterations}`);
    console.log(``);
  });
}

/**
 * Show system status
 */
async function showStatus() {
  console.log(`📊 System status:`);
  
  const status = loadTestSystem.getStatus();
  
  console.log(`   Name: ${status.name}`);
  console.log(`   Base URL: ${status.config.baseUrl}`);
  console.log(`   Max Concurrency: ${status.config.maxConcurrency}`);
  console.log(`   Output Directory: ${status.config.outputDir}`);
  console.log(`   Is Running: ${status.isRunning}`);
  console.log(`   Test Data:`);
  console.log(`     Users: ${status.scenarios.users}`);
  console.log(`     Professionals: ${status.scenarios.professionals}`);
  console.log(`     Services: ${status.scenarios.services}`);
  console.log(`     Locations: ${status.scenarios.locations}`);
}

/**
 * Show usage information
 */
function showUsage() {
  console.log(`🚀 Load Test Runner - Enterprise Stress Testing CLI`);
  console.log(``);
  console.log(`Usage: node run-tests.js <command>`);
  console.log(``);
  console.log(`Commands:`);
  console.log(`   quick       - Quick performance check (30s)`);
  console.log(`   auth        - Authentication load test`);
  console.log(`   bookings    - Bookings load test`);
  console.log(`   geo         - Geolocation load test`);
  console.log(`   mixed       - Mixed traffic test (real world)`);
  console.log(`   stress      - Maximum load stress test`);
  console.log(`   scalability - Scalability test (50-1000 concurrent)`);
  console.log(`   full        - Complete test suite`);
  console.log(`   scenarios   - List available scenarios`);
  console.log(`   status      - Show system status`);
  console.log(``);
  console.log(`Environment Variables:`);
  console.log(`   TEST_BASE_URL        - Target server URL (default: http://localhost:10000)`);
  console.log(`   TEST_MAX_CONCURRENCY  - Max concurrent requests (default: 1000)`);
  console.log(`   TEST_OUTPUT_DIR       - Reports directory (default: ./reports)`);
  console.log(``);
  console.log(`Examples:`);
  console.log(`   node run-tests.js quick`);
  console.log(`   node run-tests.js auth`);
  console.log(`   node run-tests.js stress`);
  console.log(`   TEST_MAX_CONCURRENCY=500 node run-tests.js scalability`);
}

// Handle process signals
process.on('SIGINT', () => {
  console.log(`\n🛑 Emergency stop triggered by user`);
  loadTestSystem.emergencyStop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(`\n🛑 Emergency stop triggered by system`);
  loadTestSystem.emergencyStop();
  process.exit(0);
});

// Run main function
if (require.main === module) {
  main();
}

module.exports = {
  runQuickCheck,
  runAuthTest,
  runBookingsTest,
  runGeolocationTest,
  runMixedTest,
  runStressTest,
  runScalabilityTest,
  runFullTestSuite,
  listScenarios,
  showStatus
};
