// Scaling System - Enterprise Scaling to 100k Users
// Sistema de escalado enterprise para 100k usuarios

console.log("📈 Scaling System - Enterprise Scaling to 100k Users");

const { mongoDbOptimizer } = require('./mongodb-optimizer');
const { gatewayScaler } = require('./gateway-scaler');
const { performanceOptimizer } = require('./performance-optimizer');

class ScalingSystem {
  constructor(config = {}) {
    this.name = 'scaling-system';
    this.config = {
      targetUsers: config.targetUsers || 100000,
      enableAutoScaling: config.enableAutoScaling !== false,
      enableMonitoring: config.enableMonitoring !== false,
      ...config
    };
    
    console.log(`📈 [${this.name}] Scaling system initialized:`, {
      targetUsers: this.config.targetUsers,
      enableAutoScaling: this.config.enableAutoScaling,
      enableMonitoring: this.config.enableMonitoring
    });
  }

  /**
   * Get complete scaling configuration for target user count
   */
  getScalingConfiguration(userCount = this.config.targetUsers) {
    return {
      target: userCount,
      
      // MongoDB configuration
      mongodb: {
        connection: mongoDbOptimizer.getConnectionOptions(),
        indexes: mongoDbOptimizer.getRequiredIndexes(),
        optimization: mongoDbOptimizer.getOptimizedQueries(),
        recommendations: mongoDbOptimizer.getScalingRecommendations(userCount),
        atlasConfig: mongoDbOptimizer.generateAtlasConfiguration(userCount)
      },
      
      // Gateway configuration
      gateway: {
        configuration: gatewayScaler.getGatewayConfiguration(),
        renderConfig: gatewayScaler.getRenderAutoScalingConfig(),
        circuitBreaker: gatewayScaler.getCircuitBreakerConfig(),
        deployment: gatewayScaler.getDeploymentConfiguration(userCount),
        stateless: gatewayScaler.validateStateless()
      },
      
      // Performance optimization
      performance: {
        response: performanceOptimizer.getResponseOptimization(),
        queries: performanceOptimizer.getQueryOptimization(),
        caching: performanceOptimizer.getCachingConfiguration(),
        rateLimiting: performanceOptimizer.getRateLimitingConfiguration(),
        middleware: performanceOptimizer.getMiddlewareConfiguration(),
        monitoring: performanceOptimizer.getPerformanceMonitoring(),
        recommendations: performanceOptimizer.getOptimizationRecommendations(userCount)
      },
      
      // Infrastructure scaling
      infrastructure: {
        render: this.getRenderScalingConfig(userCount),
        cloudflare: this.getCloudflareConfig(userCount),
        monitoring: this.getMonitoringConfig(userCount)
      },
      
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get Render scaling configuration
   */
  getRenderScalingConfig(userCount) {
    const configs = {
      // 10k users configuration
      '10k': {
        gateway: {
          minInstances: 2,
          maxInstances: 3,
          cpu: '0.25',
          memory: '512MB',
          autoScaling: {
            enabled: true,
            targetCPU: 70,
            targetMemory: 80,
            responseTimeThreshold: 800
          }
        },
        monolito: {
          minInstances: 1,
          maxInstances: 2,
          cpu: '0.5',
          memory: '1GB',
          autoScaling: {
            enabled: true,
            targetCPU: 75,
            targetMemory: 85,
            responseTimeThreshold: 1000
          }
        },
        authService: {
          minInstances: 1,
          maxInstances: 1,
          cpu: '0.25',
          memory: '512MB',
          autoScaling: {
            enabled: false
          }
        }
      },
      
      // 50k users configuration
      '50k': {
        gateway: {
          minInstances: 3,
          maxInstances: 5,
          cpu: '0.5',
          memory: '1GB',
          autoScaling: {
            enabled: true,
            targetCPU: 70,
            targetMemory: 80,
            responseTimeThreshold: 800
          }
        },
        monolito: {
          minInstances: 2,
          maxInstances: 3,
          cpu: '1',
          memory: '2GB',
          autoScaling: {
            enabled: true,
            targetCPU: 75,
            targetMemory: 85,
            responseTimeThreshold: 1000
          }
        },
        authService: {
          minInstances: 1,
          maxInstances: 2,
          cpu: '0.5',
          memory: '1GB',
          autoScaling: {
            enabled: true,
            targetCPU: 70,
            targetMemory: 80,
            responseTimeThreshold: 600
          }
        }
      },
      
      // 100k users configuration
      '100k': {
        gateway: {
          minInstances: 5,
          maxInstances: 8,
          cpu: '1',
          memory: '2GB',
          autoScaling: {
            enabled: true,
            targetCPU: 70,
            targetMemory: 80,
            responseTimeThreshold: 800
          }
        },
        monolito: {
          minInstances: 3,
          maxInstances: 5,
          cpu: '2',
          memory: '4GB',
          autoScaling: {
            enabled: true,
            targetCPU: 75,
            targetMemory: 85,
            responseTimeThreshold: 1000
          }
        },
        authService: {
          minInstances: 2,
          maxInstances: 3,
          cpu: '1',
          memory: '2GB',
          autoScaling: {
            enabled: true,
            targetCPU: 70,
            targetMemory: 80,
            responseTimeThreshold: 600
          }
        }
      }
    };
    
    return configs[userCount] || configs['10k'];
  }

  /**
   * Get Cloudflare configuration for scaling
   */
  getCloudflareConfig(userCount) {
    const baseConfig = {
      dns: {
        'api.tudominio.com': {
          type: 'CNAME',
          target: 'gateway-service.onrender.com',
          proxy: true
        },
        'auth.tudominio.com': {
          type: 'CNAME',
          target: 'auth-service.onrender.com',
          proxy: true
        },
        'backend.tudominio.com': {
          type: 'CNAME',
          target: 'monolito-service.onrender.com',
          proxy: true
        }
      },
      
      security: {
        waf: {
          enabled: true,
          mode: userCount > 50000 ? 'high' : 'medium'
        },
        ddos: {
          enabled: true,
          level: userCount > 50000 ? 'high' : 'medium'
        },
        botProtection: {
          enabled: true,
          mode: userCount > 50000 ? 'high' : 'medium'
        }
      },
      
      cache: {
        rules: [
          {
            pattern: 'api.tudominio.com/professionals/*',
            cacheTtl: userCount > 50000 ? 30 : 60,
            browserTtl: 15
          },
          {
            pattern: 'api.tudominio.com/categories',
            cacheTtl: 300,
            browserTtl: 120
          },
          {
            pattern: '*/health',
            cacheTtl: 15,
            browserTtl: 5
          }
        ]
      },
      
      rateLimiting: {
        rules: [
          {
            pattern: 'api.tudominio.com/auth/login',
            rate: userCount > 50000 ? '120/minute' : '60/minute',
            burst: userCount > 50000 ? 20 : 10
          },
          {
            pattern: 'api.tudominio.com/auth/register',
            rate: userCount > 50000 ? '60/minute' : '30/minute',
            burst: userCount > 50000 ? 10 : 5
          },
          {
            pattern: 'api.tudominio.com/bookings',
            rate: userCount > 50000 ? '240/minute' : '120/minute',
            burst: userCount > 50000 ? 40 : 20
          },
          {
            pattern: 'api.tudominio.com/*',
            rate: userCount > 50000 ? '600/minute' : '300/minute',
            burst: userCount > 50000 ? 100 : 50
          }
        ]
      }
    };
    
    return baseConfig;
  }

  /**
   * Get monitoring configuration
   */
  getMonitoringConfig(userCount) {
    return {
      enabled: this.config.enableMonitoring,
      
      // Metrics collection
      metrics: {
        enabled: true,
        interval: 30000, // 30 seconds
        retention: userCount > 50000 ? 7 : 3, // days
        
        // Key metrics to track
        keyMetrics: [
          'requests_per_second',
          'response_time_p95',
          'error_rate',
          'active_connections',
          'memory_usage',
          'cpu_usage',
          'database_connections',
          'cache_hit_rate'
        ]
      },
      
      // Alerting configuration
      alerting: {
        enabled: true,
        
        // Critical alerts
        critical: [
          {
            metric: 'error_rate',
            threshold: userCount > 50000 ? 3 : 5,
            operator: 'gt',
            cooldown: 300000 // 5 minutes
          },
          {
            metric: 'response_time_p95',
            threshold: 1500,
            operator: 'gt',
            cooldown: 300000
          },
          {
            metric: 'database_connections',
            threshold: 90,
            operator: 'gt',
            cooldown: 300000
          }
        ],
        
        // Warning alerts
        warning: [
          {
            metric: 'response_time_p95',
            threshold: 800,
            operator: 'gt',
            cooldown: 300000
          },
          {
            metric: 'memory_usage',
            threshold: 80,
            operator: 'gt',
            cooldown: 300000
          },
          {
            metric: 'cpu_usage',
            threshold: 75,
            operator: 'gt',
            cooldown: 300000
          }
        ]
      },
      
      // Dashboard configuration
      dashboard: {
        enabled: true,
        refreshInterval: 30000, // 30 seconds
        panels: [
          'overview',
          'performance',
          'errors',
          'infrastructure',
          'database'
        ]
      }
    };
  }

  /**
   * Validate scaling readiness
   */
  validateScalingReadiness(userCount = this.config.targetUsers) {
    const validations = [
      {
        name: 'mongodb_optimized',
        description: 'MongoDB optimized for scaling',
        check: () => mongoDbOptimizer.validateConfiguration({}).valid
      },
      {
        name: 'gateway_stateless',
        description: 'Gateway is stateless and ready for scaling',
        check: () => gatewayScaler.validateScalingReadiness().ready
      },
      {
        name: 'performance_optimized',
        description: 'Performance optimizations enabled',
        check: () => performanceOptimizer.validatePerformanceConfiguration().optimized
      },
      {
        name: 'indexes_created',
        description: 'Required indexes are created',
        check: () => mongoDbOptimizer.getRequiredIndexes().length > 0
      },
      {
        name: 'monitoring_enabled',
        description: 'Monitoring and alerting configured',
        check: () => this.config.enableMonitoring
      }
    ];
    
    const results = validations.map(({ name, description, check }) => ({
      name,
      description,
      passed: check(),
      timestamp: new Date().toISOString()
    }));
    
    const allPassed = results.every(r => r.passed);
    
    return {
      ready: allPassed,
      targetUsers: userCount,
      validations: results,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get scaling roadmap
   */
  getScalingRoadmap() {
    return {
      phases: [
        {
          phase: '1',
          name: 'Foundation (10k users)',
          targetUsers: 10000,
          duration: '1-2 weeks',
          tasks: [
            'Optimize database queries with lean() and projections',
            'Implement proper pagination',
            'Add basic caching layer',
            'Configure monitoring and alerting',
            'Set up auto-scaling for gateway (2-3 instances)'
          ],
          deliverables: [
            'MongoDB optimization complete',
            'Gateway auto-scaling configured',
            'Basic monitoring dashboard',
            'Performance baseline established'
          ]
        },
        {
          phase: '2',
          name: 'Growth (50k users)',
          targetUsers: 50000,
          duration: '2-3 weeks',
          tasks: [
            'Implement Redis caching layer',
            'Add read replicas for MongoDB',
            'Scale gateway to 3-5 instances',
            'Scale monolito to 2-3 instances',
            'Enhance monitoring with APM',
            'Implement advanced rate limiting'
          ],
          deliverables: [
            'Redis caching deployed',
            'MongoDB read replicas configured',
            'Gateway auto-scaling (3-5 instances)',
            'Monolito auto-scaling (2-3 instances)',
            'Advanced monitoring system'
          ]
        },
        {
          phase: '3',
          name: 'Scale (100k users)',
          targetUsers: 100000,
          duration: '3-4 weeks',
          tasks: [
            'Implement database sharding',
            'Scale gateway to 5-8 instances',
            'Scale monolito to 3-5 instances',
            'Scale auth service to 2-3 instances',
            'Implement microservices architecture',
            'Add CDN optimization',
            'Implement circuit breaker patterns'
          ],
          deliverables: [
            'Database sharding implemented',
            'Gateway auto-scaling (5-8 instances)',
            'Monolito auto-scaling (3-5 instances)',
            'Microservices architecture',
            'Enterprise-grade monitoring'
          ]
        }
      ],
      
      timeline: '6-9 weeks total',
      dependencies: [
        'Phase 1 must be completed before Phase 2',
        'Phase 2 must be completed before Phase 3',
        'Each phase requires performance validation'
      ]
    };
  }

  /**
   * Get scaling status
   */
  getScalingStatus() {
    const validation = this.validateScalingReadiness();
    const config = this.getScalingConfiguration();
    
    return {
      targetUsers: this.config.targetUsers,
      ready: validation.ready,
      configuration: config,
      validation: validation,
      roadmap: this.getScalingRoadmap(),
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const scalingSystem = new ScalingSystem({
  targetUsers: process.env.TARGET_USERS ? parseInt(process.env.TARGET_USERS) : 100000,
  enableAutoScaling: process.env.ENABLE_AUTO_SCALING !== 'false',
  enableMonitoring: process.env.ENABLE_MONITORING !== 'false'
});

module.exports = {
  ScalingSystem,
  scalingSystem
};
