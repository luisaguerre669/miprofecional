#!/usr/bin/env node

// Deployment Runner - Enterprise Production Deployment CLI
// CLI para ejecutar validación de despliegue enterprise

console.log("🚀 Deployment Runner - Enterprise Production Deployment CLI");

const { deploymentSystem } = require('./index');

// CLI arguments
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  try {
    console.log(`🎯 [Deployment Runner] Starting with command: ${command}`);
    
    switch (command) {
      case 'validate':
        await runValidation();
        break;
        
      case 'go-live':
        await runGoLiveCheck();
        break;
        
      case 'full':
        await runFullDeploymentValidation();
        break;
        
      case 'status':
        await showStatus();
        break;
        
      case 'config':
        await showConfiguration();
        break;
        
      case 'reset':
        await resetDeployment();
        break;
        
      default:
        showUsage();
        break;
    }
    
  } catch (error) {
    console.error(`❌ [Deployment Runner] Error:`, error.message);
    process.exit(1);
  }
}

/**
 * Run production validation only
 */
async function runValidation() {
  console.log(`📋 Running production validation...`);
  
  const { validateProductionReadiness } = require('./index');
  const results = validateProductionReadiness();
  
  console.log(`✅ Production validation completed:`);
  console.log(`   Overall Ready: ${results.overall.ready ? '✅ YES' : '❌ NO'}`);
  console.log(`   Cloudflare: ${results.cloudflare.valid ? '✅' : '❌'}`);
  console.log(`   Render: ${results.render.valid ? '✅' : '❌'}`);
  console.log(`   Backend: ${results.backend.valid ? '✅' : '❌'}`);
  console.log(`   Security: ${results.security.valid ? '✅' : '❌'}`);
  console.log(`   Performance: ${results.performance.valid ? '✅' : '❌'}`);
  
  if (!results.overall.ready && results.overall.issues.length > 0) {
    console.log(`   Issues: ${results.overall.issues.join(', ')}`);
  }
  
  if (!results.overall.ready) {
    console.log(`\n❌ Production validation failed - fix issues before deployment`);
    process.exit(1);
  }
}

/**
 * Run go-live check only
 */
async function runGoLiveCheck() {
  console.log(`🚀 Running go-live check...`);
  
  const results = await deploymentSystem.goLiveChecker.executeFullCheck();
  
  console.log(`✅ Go-live check completed:`);
  console.log(`   Overall Ready: ${results.overall.ready ? '✅ YES' : '❌ NO'}`);
  
  const summary = deploymentSystem.goLiveChecker.getSummaryReport();
  console.log(`   Total Checks: ${summary.totalChecks}`);
  console.log(`   Passed: ${summary.passedChecks}`);
  console.log(`   Failed: ${summary.failedChecks}`);
  console.log(`   Success Rate: ${summary.successRate}%`);
  
  if (!results.overall.ready && results.overall.issues.length > 0) {
    console.log(`   Issues: ${results.overall.issues.join(', ')}`);
  }
  
  if (!results.overall.ready) {
    console.log(`\n❌ Go-live check failed - fix issues before deployment`);
    process.exit(1);
  }
}

/**
 * Run full deployment validation
 */
async function runFullDeploymentValidation() {
  console.log(`🎯 Running full deployment validation...`);
  console.log(`   This will validate all systems before production deployment`);
  
  const results = await deploymentSystem.executeDeploymentValidation();
  
  if (results.success) {
    console.log(`🎉 Full deployment validation completed successfully!`);
    console.log(`   System is ready for production deployment`);
    
    if (results.deploymentReport) {
      console.log(`   Report generated with recommendations`);
    }
    
    console.log(`\n✅ READY FOR PRODUCTION DEPLOYMENT`);
  } else {
    console.error(`❌ Full deployment validation failed:`);
    console.error(`   Stage: ${results.stage}`);
    console.error(`   Message: ${results.message}`);
    
    if (results.results?.overall?.issues) {
      console.error(`   Issues: ${results.results.overall.issues.join(', ')}`);
    }
    
    console.log(`\n❌ NOT READY FOR PRODUCTION DEPLOYMENT`);
    process.exit(1);
  }
}

/**
 * Show deployment status
 */
async function showStatus() {
  console.log(`📊 Deployment status:`);
  
  const status = deploymentSystem.getDeploymentStatus();
  
  console.log(`   Environment: ${status.environment}`);
  console.log(`   Validation Ready: ${status.validationReady ? '✅' : '❌'}`);
  console.log(`   Go-Live Ready: ${status.goLiveReady ? '✅' : '❌'}`);
  console.log(`   Overall Ready: ${status.overallReady ? '✅' : '❌'}`);
  
  if (status.lastCheck) {
    console.log(`   Last Check: ${new Date(status.lastCheck).toLocaleString()}`);
  }
  
  if (status.issues.length > 0) {
    console.log(`   Issues: ${status.issues.join(', ')}`);
  }
}

/**
 * Show configuration
 */
async function showConfiguration() {
  console.log(`⚙️ Deployment configuration:`);
  
  const { productionConfig } = require('./index');
  
  console.log(`   Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`   Base URL: ${process.env.BASE_URL || 'https://api.tudominio.com'}`);
  console.log(`   Auth URL: ${process.env.AUTH_URL || 'https://auth.tudominio.com'}`);
  console.log(`   Backend URL: ${process.env.BACKEND_URL || 'https://backend.tudominio.com'}`);
  
  console.log(`\n🌐 Cloudflare Configuration:`);
  console.log(`   DNS Records: ${Object.keys(productionConfig.cloudflare.dns).length}`);
  console.log(`   WAF Enabled: ${productionConfig.cloudflare.security.waf.enabled}`);
  console.log(`   DDoS Protection: ${productionConfig.cloudflare.security.ddos.enabled}`);
  console.log(`   Cache Rules: ${productionConfig.cloudflare.cache.rules.length}`);
  console.log(`   Rate Limiting Rules: ${productionConfig.cloudflare.rateLimiting.rules.length}`);
  
  console.log(`\n🚀 Render Services:`);
  console.log(`   Gateway: ${productionConfig.render.gateway.name}`);
  console.log(`   Monolito: ${productionConfig.render.monolito.name}`);
  console.log(`   Auth Service: ${productionConfig.render.authService.name}`);
  
  console.log(`\n⚡ Performance Targets:`);
  console.log(`   P95 Latency: ${productionConfig.performance.targets.latency_p95}ms`);
  console.log(`   Error Rate: ${productionConfig.performance.targets.error_rate}%`);
  console.log(`   Uptime: ${productionConfig.performance.targets.uptime}%`);
}

/**
 * Reset deployment state
 */
async function resetDeployment() {
  console.log(`🔄 Resetting deployment state...`);
  
  deploymentSystem.reset();
  
  console.log(`✅ Deployment state reset`);
  console.log(`   Validation results cleared`);
  console.log(`   Go-live check results cleared`);
}

/**
 * Show usage information
 */
function showUsage() {
  console.log(`🚀 Deployment Runner - Enterprise Production Deployment CLI`);
  console.log(``);
  console.log(`Usage: node run-deployment.js <command>`);
  console.log(``);
  console.log(`Commands:`);
  console.log(`   validate    - Run production validation only`);
  console.log(`   go-live     - Run go-live check only`);
  console.log(`   full        - Run complete deployment validation`);
  console.log(`   status      - Show current deployment status`);
  console.log(`   config      - Show deployment configuration`);
  console.log(`   reset       - Reset deployment state`);
  console.log(``);
  console.log(`Environment Variables:`);
  console.log(`   NODE_ENV              - Environment (default: production)`);
  console.log(`   BASE_URL              - API base URL (default: https://api.tudominio.com)`);
  console.log(`   AUTH_URL              - Auth service URL (default: https://auth.tudominio.com)`);
  console.log(`   BACKEND_URL           - Backend URL (default: https://backend.tudominio.com)`);
  console.log(`   VALIDATE_BEFORE_DEPLOY- Run validation before deployment (default: true)`);
  console.log(`   RUN_GO_LIVE_CHECK     - Run go-live check (default: true)`);
  console.log(`   INTERNAL_API_TOKEN    - Internal API token for health checks`);
  console.log(``);
  console.log(`Examples:`);
  console.log(`   node run-deployment.js validate`);
  console.log(`   node run-deployment.js go-live`);
  console.log(`   node run-deployment.js full`);
  console.log(`   BASE_URL=https://api.myapp.com node run-deployment.js status`);
}

// Handle process signals
process.on('SIGINT', () => {
  console.log(`\n🛑 Deployment validation stopped by user`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(`\n🛑 Deployment validation stopped by system`);
  process.exit(0);
});

// Run main function
if (require.main === module) {
  main();
}

module.exports = {
  runValidation,
  runGoLiveCheck,
  runFullDeploymentValidation,
  showStatus,
  showConfiguration,
  resetDeployment
};
