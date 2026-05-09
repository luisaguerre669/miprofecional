#!/usr/bin/env node

// Go Live Runner - Production Readiness Validation CLI
// CLI para ejecutar validación GO LIVE de producción

console.log("🚀 Go Live Runner - Production Readiness Validation CLI");

const { goLiveValidator } = require('./go-live-validator');

// CLI arguments
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  try {
    console.log(`🎯 [Go Live Runner] Starting with command: ${command}`);
    
    switch (command) {
      case 'validate':
        await runGoLiveValidation();
        break;
        
      case 'backend':
        await runBackendValidation();
        break;
        
      case 'gateway':
        await runGatewayValidation();
        break;
        
      case 'database':
        await runDatabaseValidation();
        break;
        
      case 'cloudflare':
        await runCloudflareValidation();
        break;
        
      case 'observability':
        await runObservabilityValidation();
        break;
        
      case 'alerts':
        await runAlertsValidation();
        break;
        
      case 'performance':
        await runPerformanceValidation();
        break;
        
      case 'failover':
        await runFailoverValidation();
        break;
        
      case 'security':
        await runSecurityValidation();
        break;
        
      case 'summary':
        await showValidationSummary();
        break;
        
      default:
        showUsage();
        break;
    }
    
  } catch (error) {
    console.error(`❌ [Go Live Runner] Error:`, error.message);
    process.exit(1);
  }
}

/**
 * Run complete GO LIVE validation
 */
async function runGoLiveValidation() {
  console.log(`🚀 Running complete GO LIVE validation...`);
  console.log(`   This will validate all systems for production readiness`);
  console.log(`   Estimated time: 5-10 minutes`);
  
  const results = await goLiveValidator.executeGoLiveValidation();
  
  console.log(`✅ GO LIVE validation completed:`);
  console.log(`   Final Decision: ${results.final.goLive ? '🚀 GO LIVE' : '❌ NO-GO'}`);
  console.log(`   Backend: ${results.backend.overall ? '✅' : '❌'}`);
  console.log(`   Gateway: ${results.gateway.overall ? '✅' : '❌'}`);
  console.log(`   Database: ${results.database.overall ? '✅' : '❌'}`);
  console.log(`   Cloudflare: ${results.cloudflare.overall ? '✅' : '❌'}`);
  console.log(`   Observability: ${results.observability.overall ? '✅' : '❌'}`);
  console.log(`   Alerts: ${results.alerts.overall ? '✅' : '❌'}`);
  console.log(`   Performance: ${results.performance.overall ? '✅' : '❌'}`);
  console.log(`   Failover: ${results.failover.overall ? '✅' : '❌'}`);
  console.log(`   Security: ${results.security.overall ? '✅' : '❌'}`);
  
  const summary = goLiveValidator.getValidationSummary();
  console.log(`   Success Rate: ${summary.successRate}%`);
  console.log(`   Total Checks: ${summary.totalChecks}`);
  console.log(`   Passed: ${summary.passedChecks}`);
  console.log(`   Failed: ${summary.failedChecks}`);
  
  if (results.final.issues.length > 0) {
    console.log(`   Critical Issues: ${results.final.issues.length}`);
    results.final.issues.forEach(issue => {
      console.log(`     - ${issue}`);
    });
  }
  
  if (results.final.recommendations.length > 0) {
    console.log(`   Recommendations: ${results.final.recommendations.length}`);
    results.final.recommendations.forEach(rec => {
      console.log(`     - ${rec}`);
    });
  }
  
  if (!results.final.goLive) {
    console.log(`\n❌ SYSTEM NOT READY FOR GO LIVE`);
    console.log(`   Fix all critical issues before proceeding`);
    process.exit(1);
  } else {
    console.log(`\n🚀 SYSTEM READY FOR GO LIVE!`);
    console.log(`   You can proceed with production deployment`);
  }
}

/**
 * Run backend validation only
 */
async function runBackendValidation() {
  console.log(`🔍 Running backend validation...`);
  
  const results = await goLiveValidator.validateBackendCore();
  
  console.log(`✅ Backend validation completed:`);
  console.log(`   Overall: ${results.overall ? '✅ PASSED' : '❌ FAILED'}`);
  
  for (const [test, result] of Object.entries(results.tests)) {
    console.log(`   ${result.passed ? '✅' : '❌'} ${test}`);
    if (!result.passed && result.error) {
      console.log(`     Error: ${result.error}`);
    }
  }
  
  if (!results.overall) {
    console.log(`\n❌ Backend validation failed - fix before GO LIVE`);
    process.exit(1);
  }
}

/**
 * Run gateway validation only
 */
async function runGatewayValidation() {
  console.log(`🚪 Running gateway validation...`);
  
  const results = await goLiveValidator.validateGateway();
  
  console.log(`✅ Gateway validation completed:`);
  console.log(`   Overall: ${results.overall ? '✅ PASSED' : '❌ FAILED'}`);
  
  for (const [test, result] of Object.entries(results.tests)) {
    console.log(`   ${result.passed ? '✅' : '❌'} ${test}`);
    if (!result.passed && result.error) {
      console.log(`     Error: ${result.error}`);
    }
  }
  
  if (!results.overall) {
    console.log(`\n❌ Gateway validation failed - fix before GO LIVE`);
    process.exit(1);
  }
}

/**
 * Run database validation only
 */
async function runDatabaseValidation() {
  console.log(`🗄️ Running database validation...`);
  
  const results = await goLiveValidator.validateDatabase();
  
  console.log(`✅ Database validation completed:`);
  console.log(`   Overall: ${results.overall ? '✅ PASSED' : '❌ FAILED'}`);
  
  for (const [test, result] of Object.entries(results.tests)) {
    console.log(`   ${result.passed ? '✅' : '❌'} ${test}`);
    if (!result.passed && result.error) {
      console.log(`     Error: ${result.error}`);
    }
  }
  
  if (!results.overall) {
    console.log(`\n❌ Database validation failed - fix before GO LIVE`);
    process.exit(1);
  }
}

/**
 * Run Cloudflare validation only
 */
async function runCloudflareValidation() {
  console.log(`☁️ Running Cloudflare validation...`);
  
  const results = await goLiveValidator.validateCloudflare();
  
  console.log(`✅ Cloudflare validation completed:`);
  console.log(`   Overall: ${results.overall ? '✅ PASSED' : '❌ FAILED'}`);
  
  for (const [test, result] of Object.entries(results.tests)) {
    console.log(`   ${result.passed ? '✅' : '❌'} ${test}`);
    if (!result.passed && result.error) {
      console.log(`     Error: ${result.error}`);
    }
  }
  
  if (!results.overall) {
    console.log(`\n❌ Cloudflare validation failed - fix before GO LIVE`);
    process.exit(1);
  }
}

/**
 * Run observability validation only
 */
async function runObservabilityValidation() {
  console.log(`📊 Running observability validation...`);
  
  const results = await goLiveValidator.validateObservability();
  
  console.log(`✅ Observability validation completed:`);
  console.log(`   Overall: ${results.overall ? '✅ PASSED' : '❌ FAILED'}`);
  
  for (const [test, result] of Object.entries(results.tests)) {
    console.log(`   ${result.passed ? '✅' : '❌'} ${test}`);
    if (!result.passed && result.error) {
      console.log(`     Error: ${result.error}`);
    }
  }
  
  if (!results.overall) {
    console.log(`\n❌ Observability validation failed - fix before GO LIVE`);
    process.exit(1);
  }
}

/**
 * Run alerts validation only
 */
async function runAlertsValidation() {
  console.log(`🚨 Running alerts validation...`);
  
  const results = await goLiveValidator.validateAlerts();
  
  console.log(`✅ Alerts validation completed:`);
  console.log(`   Overall: ${results.overall ? '✅ PASSED' : '❌ FAILED'}`);
  
  for (const [test, result] of Object.entries(results.tests)) {
    console.log(`   ${result.passed ? '✅' : '❌'} ${test}`);
    if (!result.passed && result.error) {
      console.log(`     Error: ${result.error}`);
    }
  }
  
  if (!results.overall) {
    console.log(`\n❌ Alerts validation failed - fix before GO LIVE`);
    process.exit(1);
  }
}

/**
 * Run performance validation only
 */
async function runPerformanceValidation() {
  console.log(`⚡ Running performance validation...`);
  
  const results = await goLiveValidator.validatePerformance();
  
  console.log(`✅ Performance validation completed:`);
  console.log(`   Overall: ${results.overall ? '✅ PASSED' : '❌ FAILED'}`);
  
  for (const [test, result] of Object.entries(results.tests)) {
    console.log(`   ${result.passed ? '✅' : '❌'} ${test}`);
    if (!result.passed && result.error) {
      console.log(`     Error: ${result.error}`);
    }
  }
  
  if (!results.overall) {
    console.log(`\n❌ Performance validation failed - fix before GO LIVE`);
    process.exit(1);
  }
}

/**
 * Run failover validation only
 */
async function runFailoverValidation() {
  console.log(`🔄 Running failover validation...`);
  
  const results = await goLiveValidator.validateFailover();
  
  console.log(`✅ Failover validation completed:`);
  console.log(`   Overall: ${results.overall ? '✅ PASSED' : '❌ FAILED'}`);
  
  for (const [test, result] of Object.entries(results.tests)) {
    console.log(`   ${result.passed ? '✅' : '❌'} ${test}`);
    if (!result.passed && result.error) {
      console.log(`     Error: ${result.error}`);
    }
  }
  
  if (!results.overall) {
    console.log(`\n❌ Failover validation failed - fix before GO LIVE`);
    process.exit(1);
  }
}

/**
 * Run security validation only
 */
async function runSecurityValidation() {
  console.log(`🔐 Running security validation...`);
  
  const results = await goLiveValidator.validateSecurity();
  
  console.log(`✅ Security validation completed:`);
  console.log(`   Overall: ${results.overall ? '✅ PASSED' : '❌ FAILED'}`);
  
  for (const [test, result] of Object.entries(results.tests)) {
    console.log(`   ${result.passed ? '✅' : '❌'} ${test}`);
    if (!result.passed && result.error) {
      console.log(`     Error: ${result.error}`);
    }
  }
  
  if (!results.overall) {
    console.log(`\n❌ Security validation failed - fix before GO LIVE`);
    process.exit(1);
  }
}

/**
 * Show validation summary
 */
async function showValidationSummary() {
  console.log(`📊 GO LIVE validation requirements:`);
  console.log(``);
  
  console.log(`🔍 BACKEND CORE VALIDATION:`);
  console.log(`   - Server stability (100 consecutive requests)`);
  console.log(`   - Error rate < 1%`);
  console.log(`   - CPU stable < 60%`);
  console.log(`   - Memory no leaks (30 min+)`);
  console.log(`   - Critical endpoints functional`);
  console.log(``);
  
  console.log(`🚪 GATEWAY VALIDATION:`);
  console.log(`   - Stateless design`);
  console.log(`   - Circuit breaker active`);
  console.log(`   - Timeout max 3000ms`);
  console.log(`   - Retry max 1`);
  console.log(`   - Fallback to monolito working`);
  console.log(``);
  
  console.log(`🗄️ DATABASE VALIDATION:`);
  console.log(`   - Stable connection`);
  console.log(`   - Required indexes active`);
  console.log(`   - Connection pool active`);
  console.log(`   - No slow queries > 500ms`);
  console.log(``);
  
  console.log(`☁️ CLOUDFLARE VALIDATION:`);
  console.log(`   - HTTPS enforced`);
  console.log(`   - Cache GET endpoints working`);
  console.log(`   - WAF active`);
  console.log(`   - DDoS protection ON`);
  console.log(`   - Rate limiting active`);
  console.log(``);
  
  console.log(`📊 OBSERVABILITY VALIDATION:`);
  console.log(`   - Structured JSON logs active`);
  console.log(`   - Request ID in all requests`);
  console.log(`   - Error logging active`);
  console.log(`   - Metrics available (RPS, latency, error rate)`);
  console.log(``);
  
  console.log(`🚨 ALERTS VALIDATION:`);
  console.log(`   CRITICAL: API DOWN, DB DISCONNECTED, ERROR RATE > 5%`);
  console.log(`   WARNING: LATENCY > 800ms, CPU > 80%, MEMORY > 85%`);
  console.log(``);
  
  console.log(`⚡ PERFORMANCE VALIDATION:`);
  console.log(`   - 100-1000 requests without failures`);
  console.log(`   - P95 latency < 800ms`);
  console.log(`   - No memory spikes`);
  console.log(`   - No gateway degradation`);
  console.log(``);
  
  console.log(`🔄 FAILOVER VALIDATION:`);
  console.log(`   - Auth service down → fallback works`);
  console.log(`   - Gateway timeout → circuit breaker works`);
  console.log(`   - DB delay → system doesn't collapse`);
  console.log(`   - Service error → fallback stable`);
  console.log(``);
  
  console.log(`🔐 SECURITY VALIDATION:`);
  console.log(`   - JWT required in protected routes`);
  console.log(`   - CORS restricted to real domain`);
  console.log(`   - Rate limiting active`);
  console.log(`   - No public endpoints without auth`);
  console.log(`   - Security headers active`);
  console.log(``);
  
  console.log(`✅ GO/NO-GO CRITERIA:`);
  console.log(`   GO LIVE IF:`);
  console.log(`   ✅ Error rate < 1%`);
  console.log(`   ✅ System stable 30 min under load`);
  console.log(`   ✅ DB stable without errors`);
  console.log(`   ✅ Gateway with fallback active`);
  console.log(`   ✅ Cloudflare working correctly`);
  console.log(`   ✅ Logs and metrics active`);
  console.log(``);
  
  console.log(`   NO GO IF:`);
  console.log(`   ❌ Intermittent errors`);
  console.log(`   ❌ DB unstable`);
  console.log(`   ❌ Gateway without fallback`);
  console.log(`   ❌ Latency > 1s`);
  console.log(`   ❌ Memory leaks detected`);
  console.log(``);
  
  console.log(`🎯 EXPECTED RESULT:`);
  console.log(`   System ready for production:`);
  console.log(`   ✅ 10,000 users stable`);
  console.log(`   ✅ 50,000 with cache and scaling`);
  console.log(`   ✅ 100,000 with auto-scaling active`);
  console.log(`   ✅ No initial downtime`);
  console.log(`   ✅ No architecture disruption`);
}

/**
 * Show usage information
 */
function showUsage() {
  console.log(`🚀 Go Live Runner - Production Readiness Validation CLI`);
  console.log(``);
  console.log(`Usage: node run-go-live.js <command>`);
  console.log(``);
  console.log(`Commands:`);
  console.log(`   validate        - Run complete GO LIVE validation`);
  console.log(`   backend         - Run backend validation only`);
  console.log(`   gateway         - Run gateway validation only`);
  console.log(`   database        - Run database validation only`);
  console.log(`   cloudflare      - Run Cloudflare validation only`);
  console.log(`   observability   - Run observability validation only`);
  console.log(`   alerts          - Run alerts validation only`);
  console.log(`   performance     - Run performance validation only`);
  console.log(`   failover        - Run failover validation only`);
  console.log(`   security        - Run security validation only`);
  console.log(`   summary         - Show validation requirements summary`);
  console.log(``);
  console.log(`Environment Variables:`);
  console.log(`   GO_LIVE_BASE_URL        - API base URL for validation (default: https://api.tudominio.com)`);
  console.log(`   GO_LIVE_TEST_TIMEOUT     - Request timeout in ms (default: 10000)`);
  console.log(`   GO_LIVE_MAX_CONCURRENCY  - Max concurrent requests (default: 100)`);
  console.log(`   GO_LIVE_STABILITY_DURATION - Stability test duration in ms (default: 1800000)`);
  console.log(``);
  console.log(`Examples:`);
  console.log(`   node run-go-live.js validate`);
  console.log(`   node run-go-live.js backend`);
  console.log(`   node run-go-live.js security`);
  console.log(`   GO_LIVE_BASE_URL=https://api.myapp.com node run-go-live.js validate`);
}

// Handle process signals
process.on('SIGINT', () => {
  console.log(`\n🛑 GO LIVE validation stopped by user`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(`\n🛑 GO LIVE validation stopped by system`);
  process.exit(0);
});

// Run main function
if (require.main === module) {
  main();
}

module.exports = {
  runGoLiveValidation,
  runBackendValidation,
  runGatewayValidation,
  runDatabaseValidation,
  runCloudflareValidation,
  runObservabilityValidation,
  runAlertsValidation,
  runPerformanceValidation,
  runFailoverValidation,
  runSecurityValidation,
  showValidationSummary
};
