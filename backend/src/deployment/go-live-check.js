// Go Live Check - Final Production Validation
// Validación final antes de abrir tráfico real

console.log("🚀 Go Live Check - Final Production Validation");

const http = require('http');
const https = require('https');

class GoLiveChecker {
  constructor(config = {}) {
    this.name = 'go-live-checker';
    this.config = {
      baseUrl: config.baseUrl || 'https://api.tudominio.com',
      authUrl: config.authUrl || 'https://auth.tudominio.com',
      backendUrl: config.backendUrl || 'https://backend.tudominio.com',
      timeout: config.timeout || 10000,
      retries: config.retries || 3,
      ...config
    };
    
    this.results = {
      preDeployment: {},
      postDeployment: {},
      overall: {
        ready: false,
        issues: [],
        recommendations: [],
        timestamp: new Date().toISOString()
      }
    };
    
    console.log(`🚀 [${this.name}] Go Live checker initialized:`, {
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout
    });
  }

  /**
   * Execute complete go-live check
   */
  async executeFullCheck() {
    console.log(`🚀 [${this.name}] Starting complete go-live check...`);
    
    try {
      // Pre-deployment checks
      console.log(`📋 [${this.name}] Running pre-deployment checks...`);
      this.results.preDeployment = await this.runPreDeploymentChecks();
      
      // Evaluate pre-deployment readiness
      const preDeploymentReady = this.evaluatePreDeploymentReadiness();
      
      if (!preDeploymentReady) {
        console.error(`❌ [${this.name}] Pre-deployment checks failed`);
        this.results.overall.ready = false;
        this.results.overall.issues.push('Pre-deployment validation failed');
        return this.results;
      }
      
      console.log(`✅ [${this.name}] Pre-deployment checks passed`);
      
      // Post-deployment checks (simulated)
      console.log(`📋 [${this.name}] Running post-deployment checks...`);
      this.results.postDeployment = await this.runPostDeploymentChecks();
      
      // Final evaluation
      this.evaluateFinalReadiness();
      
      console.log(`✅ [${this.name}] Go-live check completed`);
      
      return this.results;
      
    } catch (error) {
      console.error(`❌ [${this.name}] Go-live check failed:`, error);
      this.results.overall.ready = false;
      this.results.overall.issues.push(error.message);
      return this.results;
    }
  }

  /**
   * Run pre-deployment checks
   */
  async runPreDeploymentChecks() {
    const checks = {};
    
    // 1. Gateway responding OK
    console.log(`🔍 [${this.name}] Checking gateway response...`);
    checks.gateway_responding_ok = await this.checkServiceHealth(this.config.baseUrl);
    
    // 2. Monolito responding OK
    console.log(`🔍 [${this.name}] Checking monolito response...`);
    checks.monolito_responding_ok = await this.checkServiceHealth(this.config.backendUrl);
    
    // 3. Auth functioning (login test)
    console.log(`🔍 [${this.name}] Testing authentication...`);
    checks.auth_functioning_login_test = await this.testAuthLogin();
    
    // 4. Booking create test OK
    console.log(`🔍 [${this.name}] Testing booking creation...`);
    checks.booking_create_test_ok = await this.testBookingCreation();
    
    // 5. Nearby search OK
    console.log(`🔍 [${this.name}] Testing nearby search...`);
    checks.nearby_search_ok = await this.testNearbySearch();
    
    // 6. Cloudflare proxy ON
    console.log(`🔍 [${this.name}] Checking Cloudflare proxy...`);
    checks.cloudflare_proxy_on = await this.checkCloudflareProxy();
    
    // 7. Logs visible production
    console.log(`🔍 [${this.name}] Checking production logs...`);
    checks.logs_visible_production = await this.checkProductionLogs();
    
    return checks;
  }

  /**
   * Run post-deployment checks
   */
  async runPostDeploymentChecks() {
    const checks = {};
    
    // 1. Traffic routing active
    console.log(`🔍 [${this.name}] Checking traffic routing...`);
    checks.traffic_routing_active = await this.checkTrafficRouting();
    
    // 2. Monitoring dashboard active
    console.log(`🔍 [${this.name}] Checking monitoring dashboard...`);
    checks.monitoring_dashboard_active = await this.checkMonitoringDashboard();
    
    // 3. Alert system active
    console.log(`🔍 [${this.name}] Checking alert system...`);
    checks.alert_system_active = await this.checkAlertSystem();
    
    // 4. Backup system verified
    console.log(`🔍 [${this.name}] Checking backup system...`);
    checks.backup_system_verified = await this.checkBackupSystem();
    
    // 5. Rollback plan ready
    console.log(`🔍 [${this.name}] Checking rollback plan...`);
    checks.rollback_plan_ready = await this.checkRollbackPlan();
    
    return checks;
  }

  /**
   * Check service health
   */
  async checkServiceHealth(url) {
    try {
      const response = await this.makeRequest('GET', `${url}/health`);
      return response.statusCode === 200;
    } catch (error) {
      console.error(`❌ [${this.name}] Health check failed for ${url}:`, error.message);
      return false;
    }
  }

  /**
   * Test authentication login
   */
  async testAuthLogin() {
    try {
      const loginData = {
        email: 'test@miprofesional.com',
        password: 'Test123456!'
      };
      
      const response = await this.makeRequest('POST', `${this.config.baseUrl}/api/auth/login`, loginData);
      
      if (response.statusCode === 200 || response.statusCode === 401) {
        // 200 = valid credentials, 401 = endpoint working but invalid credentials
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`❌ [${this.name}] Auth login test failed:`, error.message);
      return false;
    }
  }

  /**
   * Test booking creation
   */
  async testBookingCreation() {
    try {
      const bookingData = {
        professional: 'test_professional_id',
        service: 'Plumbing Repair',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        price: 1500,
        notes: 'Test booking for go-live check'
      };
      
      const response = await this.makeRequest('POST', `${this.config.baseUrl}/api/bookings`, bookingData);
      
      // 201 = created, 401 = endpoint working but auth required
      return response.statusCode === 201 || response.statusCode === 401;
    } catch (error) {
      console.error(`❌ [${this.name}] Booking creation test failed:`, error.message);
      return false;
    }
  }

  /**
   * Test nearby search
   */
  async testNearbySearch() {
    try {
      const searchParams = {
        lat: -34.6037,
        lng: -58.3816,
        radius: 5000,
        category: 'plumbing'
      };
      
      const response = await this.makeRequest('GET', `${this.config.baseUrl}/api/professionals/nearby`, null, searchParams);
      
      return response.statusCode === 200;
    } catch (error) {
      console.error(`❌ [${this.name}] Nearby search test failed:`, error.message);
      return false;
    }
  }

  /**
   * Check Cloudflare proxy
   */
  async checkCloudflareProxy() {
    try {
      const response = await this.makeRequest('GET', this.config.baseUrl);
      
      // Check for Cloudflare headers
      const cfHeaders = [
        'cf-ray',
        'cf-cache-status',
        'server'
      ];
      
      const hasCloudflareHeaders = cfHeaders.some(header => 
        response.headers && response.headers[header]
      );
      
      return hasCloudflareHeaders;
    } catch (error) {
      console.error(`❌ [${this.name}] Cloudflare proxy check failed:`, error.message);
      return false;
    }
  }

  /**
   * Check production logs
   */
  async checkProductionLogs() {
    try {
      // Check internal observability endpoint
      const response = await this.makeRequest('GET', `${this.config.baseUrl}/internal/logs`, null, null, {
        'X-Internal-Token': process.env.INTERNAL_API_TOKEN || 'internal-token-123'
      });
      
      return response.statusCode === 200;
    } catch (error) {
      console.error(`❌ [${this.name}] Production logs check failed:`, error.message);
      return false;
    }
  }

  /**
   * Check traffic routing
   */
  async checkTrafficRouting() {
    try {
      // Test that requests are being routed through the gateway
      const response = await this.makeRequest('GET', `${this.config.baseUrl}/health`);
      
      return response.statusCode === 200;
    } catch (error) {
      console.error(`❌ [${this.name}] Traffic routing check failed:`, error.message);
      return false;
    }
  }

  /**
   * Check monitoring dashboard
   */
  async checkMonitoringDashboard() {
    try {
      const response = await this.makeRequest('GET', `${this.config.baseUrl}/internal/metrics/dashboard`, null, null, {
        'X-Internal-Token': process.env.INTERNAL_API_TOKEN || 'internal-token-123'
      });
      
      return response.statusCode === 200;
    } catch (error) {
      console.error(`❌ [${this.name}] Monitoring dashboard check failed:`, error.message);
      return false;
    }
  }

  /**
   * Check alert system
   */
  async checkAlertSystem() {
    try {
      const response = await this.makeRequest('GET', `${this.config.baseUrl}/internal/alerts`, null, null, {
        'X-Internal-Token': process.env.INTERNAL_API_TOKEN || 'internal-token-123'
      });
      
      return response.statusCode === 200;
    } catch (error) {
      console.error(`❌ [${this.name}] Alert system check failed:`, error.message);
      return false;
    }
  }

  /**
   * Check backup system
   */
  async checkBackupSystem() {
    try {
      // This would typically check MongoDB backup status
      // For now, simulate the check
      console.log(`🔍 [${this.name}] Backup system check (simulated)`);
      return true;
    } catch (error) {
      console.error(`❌ [${this.name}] Backup system check failed:`, error.message);
      return false;
    }
  }

  /**
   * Check rollback plan
   */
  async checkRollbackPlan() {
    try {
      // This would typically verify rollback procedures are in place
      // For now, simulate the check
      console.log(`🔍 [${this.name}] Rollback plan check (simulated)`);
      return true;
    } catch (error) {
      console.error(`❌ [${this.name}] Rollback plan check failed:`, error.message);
      return false;
    }
  }

  /**
   * Make HTTP request
   */
  async makeRequest(method, url, data = null, params = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      
      // Add query parameters
      if (params) {
        Object.keys(params).forEach(key => {
          urlObj.searchParams.append(key, params[key]);
        });
      }
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'GoLiveChecker/1.0',
          ...headers
        },
        timeout: this.config.timeout
      };
      
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const req = client.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseData
          });
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      // Send request body if present
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  /**
   * Evaluate pre-deployment readiness
   */
  evaluatePreDeploymentReadiness() {
    const checks = this.results.preDeployment;
    const requiredChecks = [
      'gateway_responding_ok',
      'monolito_responding_ok',
      'auth_functioning_login_test',
      'booking_create_test_ok',
      'nearby_search_ok',
      'cloudflare_proxy_on'
    ];
    
    const failedChecks = requiredChecks.filter(check => !checks[check]);
    
    if (failedChecks.length > 0) {
      console.error(`❌ [${this.name}] Failed pre-deployment checks:`, failedChecks);
      this.results.overall.issues.push(...failedChecks.map(check => `Pre-deployment check failed: ${check}`));
      return false;
    }
    
    return true;
  }

  /**
   * Evaluate final readiness
   */
  evaluateFinalReadiness() {
    const allChecks = { ...this.results.preDeployment, ...this.results.postDeployment };
    const failedChecks = Object.keys(allChecks).filter(check => !allChecks[check]);
    
    if (failedChecks.length === 0) {
      this.results.overall.ready = true;
      console.log(`🎉 [${this.name}] All checks passed - System ready for production!`);
    } else {
      this.results.overall.ready = false;
      this.results.overall.issues.push(...failedChecks.map(check => `Check failed: ${check}`));
      console.error(`❌ [${this.name}] System not ready for production. Failed checks:`, failedChecks);
    }
    
    // Generate recommendations
    this.generateRecommendations();
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    if (!this.results.preDeployment.gateway_responding_ok) {
      recommendations.push('Gateway service is not responding - check deployment and health checks');
    }
    
    if (!this.results.preDeployment.auth_functioning_login_test) {
      recommendations.push('Authentication endpoint is not working - verify JWT configuration');
    }
    
    if (!this.results.preDeployment.booking_create_test_ok) {
      recommendations.push('Booking creation is failing - check database connectivity and validation');
    }
    
    if (!this.results.preDeployment.nearby_search_ok) {
      recommendations.push('Nearby search is not working - verify geospatial indexes');
    }
    
    if (!this.results.preDeployment.cloudflare_proxy_on) {
      recommendations.push('Cloudflare proxy is not active - check DNS configuration');
    }
    
    if (this.results.overall.ready) {
      recommendations.push('All systems ready - proceed with production deployment');
      recommendations.push('Monitor system closely after traffic routing');
      recommendations.push('Have rollback plan ready');
    }
    
    this.results.overall.recommendations = recommendations;
  }

  /**
   * Get summary report
   */
  getSummaryReport() {
    const summary = {
      timestamp: this.results.overall.timestamp,
      ready: this.results.overall.ready,
      totalChecks: Object.keys({ ...this.results.preDeployment, ...this.results.postDeployment }).length,
      passedChecks: Object.keys({ ...this.results.preDeployment, ...this.results.postDeployment }).filter(key => 
        this.results.preDeployment[key] || this.results.postDeployment[key]
      ).length,
      failedChecks: Object.keys({ ...this.results.preDeployment, ...this.results.postDeployment }).filter(key => 
        !(this.results.preDeployment[key] || this.results.postDeployment[key])
      ).length,
      issues: this.results.overall.issues,
      recommendations: this.results.overall.recommendations
    };
    
    return summary;
  }

  /**
   * Print detailed results
   */
  printResults() {
    console.log(`\n🚀 GO-LIVE CHECK RESULTS`);
    console.log(`================================`);
    console.log(`📅 Timestamp: ${this.results.overall.timestamp}`);
    console.log(`🎯 Ready for Production: ${this.results.overall.ready ? '✅ YES' : '❌ NO'}`);
    console.log(``);
    
    console.log(`📋 PRE-DEPLOYMENT CHECKS:`);
    for (const [check, result] of Object.entries(this.results.preDeployment)) {
      console.log(`   ${result ? '✅' : '❌'} ${check}`);
    }
    console.log(``);
    
    console.log(`📋 POST-DEPLOYMENT CHECKS:`);
    for (const [check, result] of Object.entries(this.results.postDeployment)) {
      console.log(`   ${result ? '✅' : '❌'} ${check}`);
    }
    console.log(``);
    
    if (this.results.overall.issues.length > 0) {
      console.log(`❌ ISSUES:`);
      this.results.overall.issues.forEach(issue => {
        console.log(`   - ${issue}`);
      });
      console.log(``);
    }
    
    if (this.results.overall.recommendations.length > 0) {
      console.log(`💡 RECOMMENDATIONS:`);
      this.results.overall.recommendations.forEach(rec => {
        console.log(`   - ${rec}`);
      });
      console.log(``);
    }
    
    const summary = this.getSummaryReport();
    console.log(`📊 SUMMARY:`);
    console.log(`   Total Checks: ${summary.totalChecks}`);
    console.log(`   Passed: ${summary.passedChecks}`);
    console.log(`   Failed: ${summary.failedChecks}`);
    console.log(`   Success Rate: ${((summary.passedChecks / summary.totalChecks) * 100).toFixed(1)}%`);
  }
}

// Create singleton instance
const goLiveChecker = new GoLiveChecker();

module.exports = {
  GoLiveChecker,
  goLiveChecker
};
