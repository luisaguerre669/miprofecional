// Performance Optimizer - Scaling to 100k Users
// Optimización de performance para escalar a 100k usuarios

console.log("⚡ Performance Optimizer - Scaling to 100k Users");

class PerformanceOptimizer {
  constructor(config = {}) {
    this.name = 'performance-optimizer';
    this.config = {
      enableCompression: config.enableCompression !== false,
      enableCache: config.enableCache !== false,
      enableRateLimit: config.enableRateLimit !== false,
      maxPayloadSize: config.maxPayloadSize || 1024 * 1024, // 1MB
      cacheTTL: config.cacheTTL || 60, // seconds
      rateLimitWindow: config.rateLimitWindow || 60000, // 1 minute
      ...config
    };
    
    console.log(`⚡ [${this.name}] Performance optimizer initialized:`, {
      enableCompression: this.config.enableCompression,
      enableCache: this.config.enableCache,
      enableRateLimit: this.config.enableRateLimit,
      maxPayloadSize: this.config.maxPayloadSize
    });
  }

  /**
   * Get optimized response configuration
   */
  getResponseOptimization() {
    return {
      // Compression settings
      compression: {
        enabled: this.config.enableCompression,
        level: 6, // Balanced compression level
        threshold: 1024, // Only compress responses > 1KB
        types: [
          'text/*',
          'application/json',
          'application/javascript',
          'text/css',
          'text/html',
          'text/xml',
          'application/xml'
        ]
      },
      
      // Payload optimization
      payload: {
        maxSize: this.config.maxPayloadSize,
        stripFields: [
          '__v',
          'password',
          'secret',
          'token',
          'internalNotes'
        ],
        maxArrayItems: 100, // Limit array items in responses
        maxObjectDepth: 5 // Limit object nesting depth
      },
      
      // Response headers for optimization
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    };
  }

  /**
   * Get query optimization patterns
   */
  getQueryOptimization() {
    return {
      // MongoDB query optimization
      mongodb: {
        // Always use lean() for read operations
        useLean: true,
        
        // Projections to minimize data transfer
        projections: {
          users: ['name', 'email', 'phone', 'location.city', 'isActive'],
          professionals: [
            'businessName',
            'profession',
            'contact.phone',
            'location.city',
            'location.coordinates',
            'verification.isVerified',
            'stats.rating',
            'stats.reviewCount',
            'pricing.hourlyRate'
          ],
          bookings: [
            'service',
            'date',
            'price',
            'status',
            'notes',
            'createdAt'
          ]
        },
        
        // Pagination settings
        pagination: {
          defaultLimit: 20,
          maxLimit: 100,
          defaultSkip: 0,
          validateParams: true
        },
        
        // Query optimization rules
        rules: [
          'Always use .select() for specific fields',
          'Always use .lean() for read operations',
          'Always implement pagination with limit/skip',
          'Avoid .populate() when possible',
          'Use indexes for all query fields',
          'Avoid $where and JavaScript expressions',
          'Use aggregation pipelines for complex queries'
        ]
      },
      
      // Response optimization
      response: {
        // Remove sensitive fields
        stripFields: [
          '__v',
          'password',
          'salt',
          'hash',
          'secret',
          'token',
          'internalNotes',
          'metadata'
        ],
        
        // Limit response sizes
        limits: {
          maxArrayItems: 100,
          maxObjectDepth: 5,
          maxStringLength: 10000
        },
        
        // Optimize nested objects
        flatten: [
          'location.coordinates',
          'stats.rating',
          'stats.reviewCount',
          'contact.phone',
          'contact.email'
        ]
      }
    };
  }

  /**
   * Get caching configuration
   */
  getCachingConfiguration() {
    return {
      enabled: this.config.enableCache,
      
      // Cache settings for different endpoints
      endpoints: {
        // GET endpoints that can be cached
        '/api/professionals/nearby': {
          ttl: 30, // 30 seconds
          maxSize: 1000,
          strategy: 'lru'
        },
        '/api/categories': {
          ttl: 300, // 5 minutes
          maxSize: 100,
          strategy: 'lru'
        },
        '/api/health': {
          ttl: 10, // 10 seconds
          maxSize: 50,
          strategy: 'lru'
        },
        
        // Static data endpoints
        '/api/config': {
          ttl: 3600, // 1 hour
          maxSize: 10,
          strategy: 'lru'
        }
      },
      
      // Cache invalidation rules
      invalidation: {
        // Invalidate on POST/PUT/DELETE
        onMutation: true,
        
        // Specific invalidation rules
        rules: [
          {
            pattern: '/api/professionals/*',
            invalidateOn: ['POST', 'PUT', 'DELETE'],
            paths: ['/api/professionals/nearby']
          },
          {
            pattern: '/api/bookings/*',
            invalidateOn: ['POST', 'PUT', 'DELETE'],
            paths: ['/api/professionals/nearby']
          }
        ]
      },
      
      // Cache storage configuration
      storage: {
        type: 'memory', // In production, use Redis
        maxSize: 10000,
        ttl: this.config.cacheTTL,
        strategy: 'lru'
      }
    };
  }

  /**
   * Get rate limiting configuration
   */
  getRateLimitingConfiguration() {
    return {
      enabled: this.config.enableRateLimit,
      
      // Rate limits per endpoint
      endpoints: {
        '/api/auth/login': {
          windowMs: this.config.rateLimitWindow,
          max: 60, // 60 requests per minute
          message: 'Too many login attempts, please try again later',
          skipSuccessfulRequests: false
        },
        '/api/auth/register': {
          windowMs: this.config.rateLimitWindow,
          max: 30, // 30 requests per minute
          message: 'Too many registration attempts, please try again later'
        },
        '/api/bookings': {
          windowMs: this.config.rateLimitWindow,
          max: 120, // 120 requests per minute
          message: 'Too many booking requests, please try again later'
        },
        '/api/professionals/nearby': {
          windowMs: this.config.rateLimitWindow,
          max: 300, // 300 requests per minute
          message: 'Too many search requests, please try again later'
        },
        '/api/*': {
          windowMs: this.config.rateLimitWindow,
          max: 300, // 300 requests per minute
          message: 'Too many requests, please try again later'
        }
      },
      
      // Global rate limiting
      global: {
        windowMs: this.config.rateLimitWindow,
        max: 1000, // 1000 requests per minute per IP
        message: 'Rate limit exceeded, please try again later'
      },
      
      // Rate limiting strategy
      strategy: {
        type: 'sliding-window',
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
        keyGenerator: (req) => req.ip
      }
    };
  }

  /**
   * Get middleware configuration
   */
  getMiddlewareConfiguration() {
    return {
      // Compression middleware
      compression: {
        enabled: this.config.enableCompression,
        filter: (req, res) => {
          // Don't compress small responses
          if (req.headers['x-no-compression']) {
            return false;
          }
          
          // Compress based on content type
          const type = res.getHeader('content-type');
          return type && this.getResponseOptimization().compression.types.some(t => 
            type.includes(t)
          );
        },
        threshold: 1024,
        level: 6
      },
      
      // Rate limiting middleware
      rateLimit: {
        enabled: this.config.enableRateLimit,
        windowMs: this.config.rateLimitWindow,
        max: 300,
        message: {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many requests, please try again later'
        },
        standardHeaders: true,
        legacyHeaders: false
      },
      
      // Response size limiting middleware
      responseSize: {
        enabled: true,
        maxSize: this.config.maxPayloadSize,
        message: {
          success: false,
          error: 'Response too large',
          message: 'Response size exceeds limit'
        }
      },
      
      // Request timeout middleware
      timeout: {
        enabled: true,
        timeout: 30000, // 30 seconds
        message: {
          success: false,
          error: 'Request timeout',
          message: 'Request took too long to process'
        }
      }
    };
  }

  /**
   * Get performance monitoring configuration
   */
  getPerformanceMonitoring() {
    return {
      enabled: true,
      
      // Metrics to track
      metrics: [
        'response_time',
        'request_size',
        'response_size',
        'error_rate',
        'throughput',
        'memory_usage',
        'cpu_usage'
      ],
      
      // Performance thresholds
      thresholds: {
        response_time: {
          warning: 500, // ms
          critical: 1000 // ms
        },
        error_rate: {
          warning: 1, // percentage
          critical: 5 // percentage
        },
        memory_usage: {
          warning: 70, // percentage
          critical: 85 // percentage
        },
        cpu_usage: {
          warning: 70, // percentage
          critical: 85 // percentage
        }
      },
      
      // Alerting configuration
      alerting: {
        enabled: true,
        channels: ['console', 'log'],
        cooldown: 300000 // 5 minutes
      }
    };
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(userCount) {
    const recommendations = [];
    
    // Base recommendations for all scales
    recommendations.push({
      category: 'database',
      priority: 'critical',
      action: 'Use lean() for all read queries',
      reason: 'Reduces memory usage and improves performance'
    });
    
    recommendations.push({
      category: 'database',
      priority: 'critical',
      action: 'Implement proper pagination',
      reason: 'Prevents large result sets and memory issues'
    });
    
    recommendations.push({
      category: 'response',
      priority: 'high',
      action: 'Enable response compression',
      reason: 'Reduces bandwidth usage and improves response times'
    });
    
    // Scale-specific recommendations
    if (userCount >= 10000) {
      recommendations.push({
        category: 'caching',
        priority: 'high',
        action: 'Implement Redis caching layer',
        reason: 'Reduces database load for 10k+ users'
      });
    }
    
    if (userCount >= 50000) {
      recommendations.push({
        category: 'database',
        priority: 'critical',
        action: 'Implement read replicas',
        reason: 'Distributes read load for 50k+ users'
      });
      
      recommendations.push({
        category: 'monitoring',
        priority: 'high',
        action: 'Implement APM monitoring',
        reason: 'Essential for performance tracking at scale'
      });
    }
    
    if (userCount >= 100000) {
      recommendations.push({
        category: 'architecture',
        priority: 'critical',
        action: 'Consider microservices architecture',
        reason: 'Better scalability for 100k+ users'
      });
      
      recommendations.push({
        category: 'database',
        priority: 'critical',
        action: 'Implement database sharding',
        reason: 'Distributes write load for 100k+ users'
      });
    }
    
    return recommendations;
  }

  /**
   * Validate performance configuration
   */
  validatePerformanceConfiguration() {
    const checks = [
      {
        name: 'compression_enabled',
        description: 'Response compression enabled',
        check: () => this.config.enableCompression
      },
      {
        name: 'cache_enabled',
        description: 'Caching enabled',
        check: () => this.config.enableCache
      },
      {
        name: 'rate_limit_enabled',
        description: 'Rate limiting enabled',
        check: () => this.config.enableRateLimit
      },
      {
        name: 'payload_size_limited',
        description: 'Payload size limited',
        check: () => this.config.maxPayloadSize > 0
      },
      {
        name: 'cache_ttl_configured',
        description: 'Cache TTL configured',
        check: () => this.config.cacheTTL > 0
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
      optimized: allPassed,
      checks: results,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get performance status
   */
  getPerformanceStatus() {
    const validation = this.validatePerformanceConfiguration();
    
    return {
      optimized: validation.optimized,
      configuration: {
        response: this.getResponseOptimization(),
        queries: this.getQueryOptimization(),
        caching: this.getCachingConfiguration(),
        rateLimiting: this.getRateLimitingConfiguration(),
        middleware: this.getMiddlewareConfiguration(),
        monitoring: this.getPerformanceMonitoring()
      },
      recommendations: this.getOptimizationRecommendations(100000),
      validation: validation,
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const performanceOptimizer = new PerformanceOptimizer({
  enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
  enableCache: process.env.ENABLE_CACHE !== 'false',
  enableRateLimit: process.env.ENABLE_RATE_LIMIT !== 'false',
  maxPayloadSize: process.env.MAX_PAYLOAD_SIZE ? parseInt(process.env.MAX_PAYLOAD_SIZE) : 1024 * 1024,
  cacheTTL: process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL) : 60,
  rateLimitWindow: process.env.RATE_LIMIT_WINDOW ? parseInt(process.env.RATE_LIMIT_WINDOW) : 60000
});

module.exports = {
  PerformanceOptimizer,
  performanceOptimizer
};
