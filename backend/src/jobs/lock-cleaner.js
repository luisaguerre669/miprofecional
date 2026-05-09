// Lock Cleaner Job - Automatic Expired Lock Cleanup
// Limpia locks expirados cada 5 segundos para mantener consistencia

console.log("🔄 Lock Cleaner Job - Automatic Expired Lock Cleanup");

const { bookingLockService } = require('../services/bookingLockService');
const { eventSystem } = require('../events');
const { BOOKING_EVENTS } = require('../events/eventTypes');

class LockCleanerJob {
  constructor(config = {}) {
    this.name = 'lock-cleaner';
    this.isRunning = false;
    this.interval = config.interval || 5000; // 5 seconds default
    this.intervalId = null;
    this.startTime = Date.now();
    this.stats = {
      totalCleanups: 0,
      expiredLocksCleaned: 0,
      errors: 0,
      lastCleanupTime: null,
      lastCleanupCount: 0,
      averageCleanupTime: 0,
      uptime: 0
    };
    
    this.setupGracefulShutdown();
  }

  /**
   * Start the lock cleaner job
   */
  start() {
    try {
      console.log(`🔄 [${this.name}] Starting lock cleaner job...`);
      console.log(`🔄 [${this.name}] Cleanup interval: ${this.interval}ms`);
      
      this.isRunning = true;
      
      // Run cleanup immediately on start
      this.runCleanup();
      
      // Schedule periodic cleanup
      this.intervalId = setInterval(() => {
        if (this.isRunning) {
          this.runCleanup();
        }
      }, this.interval);
      
      console.log(`🔄 [${this.name}] Lock cleaner job started successfully`);
      
      return true;
    } catch (error) {
      console.error(`🔄 [${this.name}] Failed to start lock cleaner job:`, error.message);
      return false;
    }
  }

  /**
   * Stop the lock cleaner job
   */
  stop() {
    try {
      console.log(`🔄 [${this.name}] Stopping lock cleaner job...`);
      
      this.isRunning = false;
      
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      
      console.log(`🔄 [${this.name}] Lock cleaner job stopped`);
      console.log(`🔄 [${this.name}] Final stats:`, this.getStats());
      
    } catch (error) {
      console.error(`🔄 [${this.name}] Error during stop:`, error.message);
    }
  }

  /**
   * Run cleanup cycle
   */
  async runCleanup() {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 [${this.name}] Running cleanup cycle...`);
      
      // Clean up expired locks
      const results = await bookingLockService.cleanupExpiredLocks();
      
      // Update stats
      this.updateStats(startTime, results.length);
      
      // Emit events for cleaned up bookings
      for (const result of results) {
        await this.emitCleanupEvent(result);
      }
      
      console.log(`🔄 [${this.name}] Cleanup cycle completed:`, {
        cleanedCount: results.length,
        duration: Date.now() - startTime,
        totalCleanups: this.stats.totalCleanups
      });
      
    } catch (error) {
      this.stats.errors++;
      console.error(`🔄 [${this.name}] Cleanup cycle failed:`, error.message);
    }
  }

  /**
   * Emit cleanup event
   */
  async emitCleanupEvent(result) {
    try {
      console.log(`🔄 [${this.name}] Emitting cleanup event:`, result);
      
      // Emit booking cancelled event for automatic cancellation
      await eventSystem.emitBookingCancelled(
        result.bookingId,
        null, // userId
        null, // professionalId
        'Lock expired - automatically cancelled',
        {
          source: 'lock-cleaner',
          automatic: true,
          previousStatus: result.previousStatus,
          newStatus: result.newStatus,
          cleanupTime: new Date().toISOString()
        }
      );
      
    } catch (error) {
      console.error(`🔄 [${this.name}] Failed to emit cleanup event:`, error.message);
    }
  }

  /**
   * Update statistics
   */
  updateStats(startTime, cleanedCount) {
    const duration = Date.now() - startTime;
    
    this.stats.totalCleanups++;
    this.stats.expiredLocksCleaned += cleanedCount;
    this.stats.lastCleanupTime = new Date().toISOString();
    this.stats.lastCleanupCount = cleanedCount;
    this.stats.uptime = Date.now() - this.startTime;
    
    // Update average cleanup time
    if (this.stats.totalCleanups === 1) {
      this.stats.averageCleanupTime = duration;
    } else {
      this.stats.averageCleanupTime = Math.round(
        (this.stats.averageCleanupTime * (this.stats.totalCleanups - 1) + duration) / 
        this.stats.totalCleanups
      );
    }
  }

  /**
   * Get job statistics
   */
  getStats() {
    return {
      ...this.stats,
      uptimeFormatted: this.formatUptime(this.stats.uptime),
      isRunning: this.isRunning,
      interval: this.interval,
      startTime: new Date(this.startTime).toISOString(),
      errorRate: this.stats.totalCleanups > 0 ? 
        (this.stats.errors / this.stats.totalCleanups * 100).toFixed(2) + '%' : '0%',
      averageCleanupPerMinute: this.stats.uptime > 0 ? 
        Math.round((this.stats.expiredLocksCleaned / this.stats.uptime) * 60000) : 0,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get job health status
   */
  getHealthStatus() {
    const now = Date.now();
    const timeSinceLastCleanup = this.stats.lastCleanupTime ? 
      now - new Date(this.stats.lastCleanupTime).getTime() : Infinity;
    
    let status = 'healthy';
    let issues = [];
    
    // Check if job is running
    if (!this.isRunning) {
      status = 'stopped';
      issues.push('Job is not running');
    }
    
    // Check if cleanup is running too slowly
    if (timeSinceLastCleanup > this.interval * 3) {
      status = 'warning';
      issues.push(`Cleanup is delayed by ${Math.round(timeSinceLastCleanup / 1000)}s`);
    }
    
    // Check error rate
    const errorRate = this.stats.totalCleanups > 0 ? 
      this.stats.errors / this.stats.totalCleanups : 0;
    
    if (errorRate > 0.1) { // 10% error rate
      status = 'error';
      issues.push(`High error rate: ${(errorRate * 100).toFixed(2)}%`);
    }
    
    // Check average cleanup time
    if (this.stats.averageCleanupTime > 5000) { // 5 seconds
      status = 'warning';
      issues.push(`Slow cleanup time: ${this.stats.averageCleanupTime}ms`);
    }
    
    return {
      status,
      issues,
      stats: this.getStats(),
      recommendations: this.getHealthRecommendations(status, issues),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get health recommendations
   */
  getHealthRecommendations(status, issues) {
    const recommendations = [];
    
    if (status === 'stopped') {
      recommendations.push({
        priority: 'high',
        action: 'Start the lock cleaner job',
        description: 'Job is not running - expired locks will accumulate'
      });
    }
    
    if (issues.some(issue => issue.includes('delayed'))) {
      recommendations.push({
        priority: 'medium',
        action: 'Check system performance',
        description: 'Cleanup is running slowly - may indicate system overload'
      });
    }
    
    if (issues.some(issue => issue.includes('High error rate'))) {
      recommendations.push({
        priority: 'high',
        action: 'Check error logs',
        description: 'High error rate may indicate database or connectivity issues'
      });
    }
    
    if (issues.some(issue => issue.includes('Slow cleanup time'))) {
      recommendations.push({
        priority: 'medium',
        action: 'Optimize cleanup queries',
        description: 'Consider adding database indexes or optimizing cleanup logic'
      });
    }
    
    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'info',
        action: 'Monitor regularly',
        description: 'Job is running normally - continue monitoring'
      });
    }
    
    return recommendations;
  }

  /**
   * Run manual cleanup
   */
  async runManualCleanup() {
    console.log(`🔄 [${this.name}] Running manual cleanup...`);
    
    try {
      const results = await bookingLockService.cleanupExpiredLocks();
      
      console.log(`🔄 [${this.name}] Manual cleanup completed:`, {
        cleanedCount: results.length,
        results
      });
      
      return results;
      
    } catch (error) {
      console.error(`🔄 [${this.name}] Manual cleanup failed:`, error.message);
      throw error;
    }
  }

  /**
   * Get cleanup history
   */
  getCleanupHistory(limit = 10) {
    // In a real implementation, this would query a database
    // For now, return recent stats
    return {
      recentCleanups: this.stats.totalCleanups,
      averageCleanupTime: this.stats.averageCleanupTime,
      lastCleanupTime: this.stats.lastCleanupTime,
      lastCleanupCount: this.stats.lastCleanupCount,
      totalExpiredLocksCleaned: this.stats.expiredLocksCleaned,
      errorRate: this.stats.totalCleanups > 0 ? 
        (this.stats.errors / this.stats.totalCleanups * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * Format uptime
   */
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Setup graceful shutdown
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`🔄 [${this.name}] ${signal} received, shutting down gracefully...`);
      
      this.stop();
      
      console.log(`🔄 [${this.name}] Shutdown completed`);
      
      process.exit(0);
    };
    
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }
}

// Create and start lock cleaner if this file is run directly
if (require.main === module) {
  const lockCleaner = new LockCleanerJob();
  
  lockCleaner.start().then(success => {
    if (success) {
      console.log('🔄 Lock cleaner job started successfully');
      
      // Periodic stats reporting
      setInterval(() => {
        console.log('🔄 Lock Cleaner Stats:', lockCleaner.getStats());
        console.log('🔄 Lock Cleaner Health:', lockCleaner.getHealthStatus());
      }, 60000); // Every minute
    } else {
      console.error('🔄 Failed to start lock cleaner job');
      process.exit(1);
    }
  });
}

module.exports = {
  LockCleanerJob
};
