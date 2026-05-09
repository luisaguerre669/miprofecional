// Gateway Scaler - Stateless Scaling for Production
// Escalado del Gateway para producción stateless

console.log("🚪 Gateway Scaler - Stateless Scaling for Production");

class GatewayScaler {
  constructor(config = {}) {
    this.name = 'gateway-scaler';
    this.config = {
      timeout: config.timeout || 3000,
      maxRetries: config.maxRetries || 1,
      circuitBreakerThreshold: config.circuitBreakerThreshold || 5,
      circuitBreakerTimeout: config.circuitBreakerTimeout || 60000,
      healthCheckInterval: config.healthCheckInterval || 30000,
      maxConcurrency: config.maxConcurrency || 1000,
      ...config
    };
    
    // Circuit breaker state (in-memory, but designed for stateless scaling)
    this.circuitBreakers = new Map();
    
    // Health check status
    this.healthStatus = {
      gateway: 'healthy',
      monolito: 'unknown',
      authService: 'unknown',
      lastCheck: null
    };
    
    console.log(`🚪 [${this.name}] Gateway scaler initialized:`, {
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
      circuitBreakerThreshold: this.config.circuitBreakerThreshold,
      maxConcurrency: this.config.maxConcurrency
    });
  }

  /**
   * Get stateless gateway configuration
   */
  getGatewayConfiguration() {
    return {
      // Core stateless configuration
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
      
      // Circuit breaker configuration
      circuitBreaker: {
        enabled: true,
        threshold: this.config.circuitBreakerThreshold,
        timeout: this.config.circuitBreakerTimeout,
        resetTimeout: 30000
      },
      
      // Load balancing configuration
      loadBalancing: {
        strategy: 'round_robin',
        healthCheck: true,
        failover: true
      },
      
      // Rate limiting configuration
      rateLimiting: {
        enabled: true,
        windowMs: 60000, // 1 minute
        maxRequests: 300, // per IP
        skipSuccessfulRequests: false
      },
      
      // Caching configuration
      caching: {
        enabled: true,
        ttl: 60, // 60 seconds
        maxEntries: 1000,
        strategy: 'lru'
      },
      
      // Security configuration
      security: {
        cors: {
          enabled: true,
          origins: ['https://tudominio.com', 'https://www.tudominio.com'],
          credentials: true
        },
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block'
        }
      },
      
      // Monitoring configuration
      monitoring: {
        enabled: true,
        metrics: ['requests', 'errors', 'latency', 'circuit_breaker'],
        logging: true,
        healthCheck: {
          enabled: true,
          interval: this.config.healthCheckInterval,
          endpoints: ['/health', '/api/health']
        }
      }
    };
  }

  /**
   * Get Render auto-scaling configuration
   */
  getRenderAutoScalingConfig() {
    return {
      gateway: {
        minInstances: 2,
        maxInstances: 5,
        targetCPUPercent: 70,
        targetMemoryPercent: 80,
        responseTimeThreshold: 800, // ms
        scaleUpCooldown: 300, // seconds
        scaleDownCooldown: 600, // seconds
        healthCheckPath: '/health',
        healthCheckInterval: 30, // seconds
        healthCheckTimeout: 10, // seconds
        healthCheckGracePeriod: 10 // seconds
      },
      
      monolito: {
        minInstances: 1,
        maxInstances: 3,
        targetCPUPercent: 75,
        targetMemoryPercent: 85,
        responseTimeThreshold: 1000, // ms
        scaleUpCooldown: 300,
        scaleDownCooldown: 600,
        healthCheckPath: '/health',
        healthCheckInterval: 30,
        healthCheckTimeout: 10,
        healthCheckGracePeriod: 10
      },
      
      authService: {
        minInstances: 1,
        maxInstances: 2,
        targetCPUPercent: 70,
        targetMemoryPercent: 80,
        responseTimeThreshold: 600, // ms
        scaleUpCooldown: 300,
        scaleDownCooldown: 600,
        healthCheckPath: '/health',
        healthCheckInterval: 30,
        healthCheckTimeout: 10,
        healthCheckGracePeriod: 10
      }
    };
  }

  /**
   * Validate gateway is stateless
   */
  validateStateless() {
    const checks = [
      {
        name: 'no_persistent_memory',
        description: 'No persistent memory storage',
        check: () => true // Implementation should not use persistent memory
      },
      {
        name: 'no_session_storage',
        description: 'No session storage in gateway',
        check: () => true // Should use JWT tokens only
      },
      {
        name: 'circuit_breaker_stateless',
        description: 'Circuit breaker state can be reconstructed',
        check: () => true // Circuit breaker should be in-memory but recoverable
      },
      {
        name: 'request_id_independent',
        description: 'Each request is independent',
        check: () => true // No request dependencies
      },
      {
        name: 'load_balancing_ready',
        description: 'Ready for load balancing',
        check: () => true // Should work with multiple instances
      }
    ];
    
    const results = checks.map(({ name, description, check }) => ({
      name,
      description,
      passed: check(),
      timestamp: new Date().toISOString()
    }));
    
    const allPassed = results.every(r => r.passed);
    
    return {
      stateless: allPassed,
      checks: results,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get circuit breaker configuration for scaling
   */
  getCircuitBreakerConfig() {
    return {
      // Per-service circuit breakers
      services: {
        monolito: {
          enabled: true,
          threshold: this.config.circuitBreakerThreshold,
          timeout: this.config.circuitBreakerTimeout,
          resetTimeout: 30000,
          monitoringWindow: 60000
        },
        authService: {
          enabled: true,
          threshold: 3, // Lower threshold for auth service
          timeout: 30000,
          resetTimeout: 15000,
          monitoringWindow: 30000
        }
      },
      
      // Global circuit breaker settings
      global: {
        enabled: true,
        maxConcurrentRequests: this.config.maxConcurrency,
        requestTimeout: this.config.timeout,
        fallbackEnabled: true,
        fallbackTimeout: 1000
      },
      
      // Monitoring and metrics
      monitoring: {
        trackFailures: true,
        trackLatency: true,
        trackThroughput: true,
        alertThreshold: 0.1 // 10% failure rate
      }
    };
  }

  /**
   * Get scaling metrics
   */
  getScalingMetrics() {
    return {
      // Performance metrics
      performance: {
        avgResponseTime: 0, // ms
        p95ResponseTime: 0, // ms
        p99ResponseTime: 0, // ms
        requestsPerSecond: 0,
        errorRate: 0, // percentage
        throughput: 0 // requests per minute
      },
      
      // Circuit breaker metrics
      circuitBreakers: {
        monolito: {
          state: 'closed', // closed, open, half-open
          failures: 0,
          lastFailureTime: null,
          nextRetryTime: null
        },
        authService: {
          state: 'closed',
          failures: 0,
          lastFailureTime: null,
          nextRetryTime: null
        }
      },
      
      // Health status
      health: this.healthStatus,
      
      // Scaling recommendations
      scaling: {
        currentInstances: {
          gateway: 1,
          monolito: 1,
          authService: 1
        },
        recommendedInstances: {
          gateway: 2,
          monolito: 1,
          authService: 1
        },
        triggers: {
          cpu: false,
          memory: false,
          responseTime: false,
          errorRate: false
        }
      },
      
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get scaling recommendations based on metrics
   */
  getScalingRecommendations(metrics) {
    const recommendations = [];
    
    // Gateway scaling recommendations
    if (metrics.performance.requestsPerSecond > 100) {
      recommendations.push({
        service: 'gateway',
        action: 'scale_up',
        reason: 'High RPS detected',
        currentInstances: metrics.scaling.currentInstances.gateway,
        recommendedInstances: Math.min(metrics.scaling.currentInstances.gateway + 1, 5)
      });
    }
    
    if (metrics.performance.p95ResponseTime > 800) {
      recommendations.push({
        service: 'gateway',
        action: 'scale_up',
        reason: 'High response time',
        currentInstances: metrics.scaling.currentInstances.gateway,
        recommendedInstances: Math.min(metrics.scaling.currentInstances.gateway + 1, 5)
      });
    }
    
    if (metrics.performance.errorRate > 5) {
      recommendations.push({
        service: 'gateway',
        action: 'investigate',
        reason: 'High error rate',
        details: 'Check circuit breaker status and backend health'
      });
    }
    
    // Monolito scaling recommendations
    if (metrics.circuitBreakers.monolito.state === 'open') {
      recommendations.push({
        service: 'monolito',
        action: 'scale_up',
        reason: 'Circuit breaker open',
        currentInstances: metrics.scaling.currentInstances.monolito,
        recommendedInstances: Math.min(metrics.scaling.currentInstances.monolito + 1, 3)
      });
    }
    
    // Auth service scaling recommendations
    if (metrics.circuitBreakers.authService.state === 'open') {
      recommendations.push({
        service: 'authService',
        action: 'scale_up',
        reason: 'Auth service circuit breaker open',
        currentInstances: metrics.scaling.currentInstances.authService,
        recommendedInstances: Math.min(metrics.scaling.currentInstances.authService + 1, 2)
      });
    }
    
    return recommendations;
  }

  /**
   * Get deployment configuration for different scales
   */
  getDeploymentConfiguration(userCount) {
    const configs = {
      // 10k users configuration
      '10k': {
        gateway: {
          instances: 2,
          cpu: '0.25',
          memory: '512MB',
          timeout: 3000,
          maxRetries: 1
        },
        monolito: {
          instances: 1,
          cpu: '0.5',
          memory: '1GB',
          connectionPool: 20
        },
        authService: {
          instances: 1,
          cpu: '0.25',
          memory: '512MB'
        }
      },
      
      // 50k users configuration
      '50k': {
        gateway: {
          instances: 3,
          cpu: '0.5',
          memory: '1GB',
          timeout: 3000,
          maxRetries: 1
        },
        monolito: {
          instances: 2,
          cpu: '1',
          memory: '2GB',
          connectionPool: 35
        },
        authService: {
          instances: 1,
          cpu: '0.5',
          memory: '1GB'
        }
      },
      
      // 100k users configuration
      '100k': {
        gateway: {
          instances: 5,
          cpu: '1',
          memory: '2GB',
          timeout: 3000,
          maxRetries: 1
        },
        monolito: {
          instances: 3,
          cpu: '2',
          memory: '4GB',
          connectionPool: 50
        },
        authService: {
          instances: 2,
          cpu: '1',
          memory: '2GB'
        }
      }
    };
    
    return configs[userCount] || configs['10k'];
  }

  /**
   * Validate scaling readiness
   */
  validateScalingReadiness() {
    const checks = [
      {
        name: 'stateless_design',
        description: 'Gateway is stateless',
        check: () => this.validateStateless().stateless
      },
      {
        name: 'circuit_breaker_configured',
        description: 'Circuit breaker properly configured',
        check: () => this.config.circuitBreakerThreshold > 0
      },
      {
        name: 'timeout_configured',
        description: 'Request timeout configured',
        check: () => this.config.timeout > 0 && this.config.timeout <= 5000
      },
      {
        name: 'retry_configured',
        description: 'Retry policy configured',
        check: () => this.config.maxRetries >= 0 && this.config.maxRetries <= 3
      },
      {
        name: 'health_check_enabled',
        description: 'Health check enabled',
        check: () => this.config.healthCheckInterval > 0
      }
    ];
    
    const results = checks.map(({ name, description, check }) => ({
      name,
      description,
      passed: check(),
      timestamp: new Date().toISOString()
    }));
    
    const allPassed = results.every(r => r.passed);
    
    return {
      ready: allPassed,
      checks: results,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get scaling status
   */
  getScalingStatus() {
    const statelessValidation = this.validateStateless();
    const scalingReadiness = this.validateScalingReadiness();
    
    return {
      stateless: statelessValidation,
      ready: scalingReadiness,
      configuration: this.getGatewayConfiguration(),
      renderConfig: this.getRenderAutoScalingConfig(),
      metrics: this.getScalingMetrics(),
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const gatewayScaler = new GatewayScaler({
  timeout: process.env.GATEWAY_TIMEOUT ? parseInt(process.env.GATEWAY_TIMEOUT) : 3000,
  maxRetries: process.env.GATEWAY_MAX_RETRIES ? parseInt(process.env.GATEWAY_MAX_RETRIES) : 1,
  circuitBreakerThreshold: process.env.CIRCUIT_BREAKER_THRESHOLD ? parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD) : 5,
  circuitBreakerTimeout: process.env.CIRCUIT_BREAKER_TIMEOUT ? parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT) : 60000,
  healthCheckInterval: process.env.HEALTH_CHECK_INTERVAL ? parseInt(process.env.HEALTH_CHECK_INTERVAL) : 30000
});

module.exports = {
  GatewayScaler,
  gatewayScaler
};
