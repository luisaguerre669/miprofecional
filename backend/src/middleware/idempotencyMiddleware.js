// Idempotency Middleware - Prevent Duplicate Requests
// Implementa Idempotency Key header para evitar doble submit

console.log("🔑 Idempotency Middleware - Prevent Duplicate Requests");

const { v4: uuidv4 } = require('uuid');
const { bookingLockService } = require('../services/bookingLockService');

class IdempotencyMiddleware {
  constructor(config = {}) {
    this.name = 'idempotency-middleware';
    this.cache = new Map();
    this.cacheMaxSize = config.cacheMaxSize || 10000;
    this.cacheTTL = config.cacheTTL || 24 * 60 * 60 * 1000; // 24 hours
    
    // Clean up expired entries periodically
    this.setupCleanup();
  }

  /**
   * Middleware function
   */
  middleware() {
    return (req, res, next) => {
      try {
        const idempotencyKey = this.getIdempotencyKey(req);
        
        if (!idempotencyKey) {
          // No idempotency key - continue normally
          req.idempotency = {
            hasKey: false,
            key: null,
            isDuplicate: false
          };
          return next();
        }
        
        // Check if this is a duplicate request
        const cachedResponse = this.getFromCache(idempotencyKey);
        
        if (cachedResponse) {
          console.log(`🔑 [${this.name}] Duplicate request detected:`, {
            idempotencyKey,
            url: req.url,
            method: req.method,
            originalTime: cachedResponse.timestamp
          });
          
          // Return cached response
          return res.status(cachedResponse.statusCode).json(cachedResponse.body);
        }
        
        // Store request in cache
        this.storeInCache(idempotencyKey, {
          method: req.method,
          url: req.url,
          headers: req.headers,
          body: req.body,
          timestamp: new Date().toISOString()
        });
        
        // Add idempotency info to request
        req.idempotency = {
          hasKey: true,
          key: idempotencyKey,
          isDuplicate: false,
          storeResponse: (statusCode, body) => {
            this.storeResponse(idempotencyKey, statusCode, body, req);
          }
        };
        
        next();
        
      } catch (error) {
        console.error(`🔑 [${this.name}] Middleware error:`, error.message);
        next();
      }
    };
  }

  /**
   * Get idempotency key from request
   */
  getIdempotencyKey(req) {
    // Try multiple sources in order of preference
    
    // 1. Idempotency-Key header (preferred)
    const headerKey = req.headers['idempotency-key'] || req.headers['Idempotency-Key'];
    if (headerKey && typeof headerKey === 'string' && headerKey.trim().length > 0) {
      return headerKey.trim();
    }
    
    // 2. X-Idempotency-Key header
    const xHeaderKey = req.headers['x-idempotency-key'] || req.headers['X-Idempotency-Key'];
    if (xHeaderKey && typeof xHeaderKey === 'string' && xHeaderKey.trim().length > 0) {
      return xHeaderKey.trim();
    }
    
    // 3. Request ID header
    const requestId = req.headers['request-id'] || req.headers['Request-ID'];
    if (requestId && typeof requestId === 'string' && requestId.trim().length > 0) {
      return requestId.trim();
    }
    
    // 4. Generate unique key based on request (fallback)
    const fallbackKey = this.generateFallbackKey(req);
    if (fallbackKey) {
      return fallbackKey;
    }
    
    return null;
  }

  /**
   * Generate fallback key based on request
   */
  generateFallbackKey(req) {
    try {
      const keyData = {
        method: req.method,
        url: req.url,
        userId: req.user?.id || 'anonymous',
        body: req.body
      };
      
      // Create hash of request data
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256');
      hash.update(JSON.stringify(keyData));
      
      return `fallback_${hash.digest('hex')}`;
    } catch (error) {
      console.error(`🔑 [${this.name}] Failed to generate fallback key:`, error.message);
      return null;
    }
  }

  /**
   * Get cached response
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    // Check if cache entry has expired
    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    
    // Return response if it exists
    if (cached.response) {
      return cached.response;
    }
    
    // Return request if no response yet (in-flight request)
    return cached.request ? { inFlight: true } : null;
  }

  /**
   * Store request in cache
   */
  storeInCache(key, requestData) {
    // Limit cache size
    if (this.cache.size >= this.cacheMaxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      request: requestData,
      timestamp: Date.now()
    });
  }

  /**
   * Store response in cache
   */
  storeResponse(key, statusCode, body, req) {
    const cached = this.cache.get(key);
    
    if (cached) {
      cached.response = {
        statusCode,
        body,
        timestamp: Date.now(),
        requestTime: cached.timestamp
      };
      
      // Log successful caching
      console.log(`🔑 [${this.name}] Response cached:`, {
        idempotencyKey: key,
        url: req.url,
        method: req.method,
        statusCode,
        responseTime: Date.now() - cached.timestamp
      });
    }
  }

  /**
   * Setup periodic cleanup
   */
  setupCleanup() {
    setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Clean up expired cache entries
   */
  cleanup() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTTL) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🔑 [${this.name}] Cache cleanup: removed ${cleanedCount} expired entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let inFlightCount = 0;
    let responseCount = 0;
    let expiredCount = 0;
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTTL) {
        expiredCount++;
      } else if (value.response) {
        responseCount++;
      } else if (value.request) {
        inFlightCount++;
      }
    }
    
    return {
      name: this.name,
      cacheSize: this.cache.size,
      cacheMaxSize: this.cacheMaxSize,
      cacheTTL: this.cacheTTL,
      inFlightCount,
      responseCount,
      expiredCount,
      hitRate: this.cache.size > 0 ? (responseCount / this.cache.size * 100).toFixed(2) + '%' : '0%',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    const clearedCount = this.cache.size;
    this.cache.clear();
    
    console.log(`🔑 [${this.name}] Cache cleared: ${clearedCount} entries removed`);
    
    return clearedCount;
  }

  /**
   * Get cache entries
   */
  getCacheEntries(limit = 100, offset = 0) {
    const entries = Array.from(this.cache.entries())
      .slice(offset, offset + limit)
      .map(([key, value]) => ({
        key,
        hasRequest: !!value.request,
        hasResponse: !!value.response,
        timestamp: value.timestamp,
        age: Date.now() - value.timestamp,
        isExpired: Date.now() - value.timestamp > this.cacheTTL
      }));
    
    return entries;
  }

  /**
   * Force expire entry
   */
  expireEntry(key) {
    const existed = this.cache.has(key);
    this.cache.delete(key);
    
    if (existed) {
      console.log(`🔑 [${this.name}] Force expired entry: ${key}`);
    }
    
    return existed;
  }

  /**
   * Check if request is in flight
   */
  isInFlight(key) {
    const cached = this.cache.get(key);
    return cached && cached.request && !cached.response;
  }

  /**
   * Wait for in-flight request to complete
   */
  async waitForInFlight(key, timeout = 30000) {
    const startTime = Date.now();
    
    while (this.isInFlight(key) && Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const cached = this.getFromCache(key);
    
    if (cached && cached.response) {
      return cached.response;
    }
    
    throw new Error('In-flight request timed out or failed');
  }
}

// Create singleton instance
const idempotencyMiddleware = new IdempotencyMiddleware();

// Express middleware function
const idempotency = idempotencyMiddleware.middleware();

// Response wrapper to automatically cache responses
const cacheResponse = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(body) {
    // Cache response if idempotency key is present
    if (req.idempotency && req.idempotency.hasKey && req.idempotency.storeResponse) {
      req.idempotency.storeResponse(res.statusCode, body);
    }
    
    return originalJson.call(this, body);
  };
  
  next();
};

module.exports = {
  IdempotencyMiddleware,
  idempotencyMiddleware,
  idempotency,
  cacheResponse
};
