// Start Lock Cleaner Job - Background Service Starter
// Inicia el Lock Cleaner Job como servicio background

console.log("🔄 Start Lock Cleaner Job - Background Service Starter");

const { LockCleanerJob } = require('./lock-cleaner');

// Create and start lock cleaner job
const lockCleaner = new LockCleanerJob({
  interval: process.env.LOCK_CLEANER_INTERVAL || 5000, // 5 seconds
});

// Start the job
lockCleaner.start().then(success => {
  if (success) {
    console.log('🔄 Lock Cleaner Job started successfully');
    
    // Periodic stats reporting
    setInterval(() => {
      console.log('🔄 Lock Cleaner Stats:', lockCleaner.getStats());
    }, 60000); // Every minute
    
    // Health check
    setInterval(() => {
      const health = lockCleaner.getHealthStatus();
      if (health.status !== 'healthy') {
        console.warn('🔄 Lock Cleaner Health Warning:', health);
      }
    }, 300000); // Every 5 minutes
    
  } else {
    console.error('🔄 Failed to start Lock Cleaner Job');
    process.exit(1);
  }
}).catch(error => {
  console.error('🔄 Lock Cleaner Job startup error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, stopping Lock Cleaner Job...');
  lockCleaner.stop();
});

process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, stopping Lock Cleaner Job...');
  lockCleaner.stop();
});

// Export for testing
module.exports = { lockCleaner };
