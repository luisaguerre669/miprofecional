// Booking Worker - Distributed Redis Streams Consumer
// Procesa eventos de bookings con consumer groups y retry automático

console.log("👷 Booking Worker - Distributed Redis Streams Consumer");

const { redisClient } = require('../config/redis.client');
const { distributedEventBus } = require('../events/distributedEventBus');
const { BOOKING_EVENTS } = require('../events/eventTypes');

class BookingWorker {
  constructor() {
    this.name = 'booking-worker';
    this.groupName = 'booking-group'; // Updated to match distributed event bus
    this.consumerName = `booking-worker-${process.pid}`;
    this.isRunning = false;
    this.processedCount = 0;
    this.errorCount = 0;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.startTime = Date.now();
    
    this.setupGracefulShutdown();
  }

  async start() {
    try {
      console.log(`👷 [${this.name}] Starting distributed booking worker...`);
      console.log(`👷 [${this.name}] Consumer: ${this.consumerName}`);
      console.log(`👷 [${this.name}] Consumer Group: ${this.groupName}`);
      
      // Check Redis availability
      const redisHealth = await redisClient.healthCheck();
      if (redisHealth.status !== 'healthy') {
        console.error(`👷 [${this.name}] Redis not healthy: ${redisHealth.error}`);
        return false;
      }
      
      // Subscribe to booking events with distributed event bus
      await this.subscribeToBookingEvents();
      
      this.isRunning = true;
      console.log(`👷 [${this.name}] Started successfully`);
      
      return true;
      
    } catch (error) {
      console.error(`👷 [${this.name}] Failed to start:`, error.message);
      return false;
    }
  }

  async subscribeToBookingEvents() {
    try {
      // Subscribe to booking created events
      await distributedEventBus.subscribe(
        BOOKING_EVENTS.CREATED,
        this.handleBookingCreated.bind(this),
        {
          consumerName: this.consumerName,
          maxRetries: this.maxRetries
        }
      );
      
      // Subscribe to booking updated events
      await distributedEventBus.subscribe(
        BOOKING_EVENTS.UPDATED,
        this.handleBookingUpdated.bind(this),
        {
          consumerName: this.consumerName,
          maxRetries: this.maxRetries
        }
      );
      
      // Subscribe to booking cancelled events
      await distributedEventBus.subscribe(
        BOOKING_EVENTS.CANCELLED,
        this.handleBookingCancelled.bind(this),
        {
          consumerName: this.consumerName,
          maxRetries: this.maxRetries
        }
      );
      
      console.log(`👷 [${this.name}] Subscribed to all booking events with consumer group: ${this.groupName}`);
      
    } catch (error) {
      console.error(`👷 [${this.name}] Error subscribing to events:`, error.message);
      throw error;
    }
  }

  async handleBookingCreated(payload, metadata) {
    const startTime = Date.now();
    
    try {
      console.log(`👷 [${this.name}] Processing BOOKING_CREATED:`, {
        bookingId: payload.bookingId,
        userId: payload.userId,
        professionalId: payload.professionalId,
        service: payload.service,
        timestamp: new Date().toISOString()
      });
      
      // Analytics processing
      await this.processBookingAnalytics(payload, metadata);
      
      // Notification processing
      await this.processBookingNotifications(payload, metadata);
      
      // Business logic processing
      await this.processBookingBusinessLogic(payload, metadata);
      
      this.processedCount++;
      const duration = Date.now() - startTime;
      
      console.log(`👷 [${this.name}] BOOKING_CREATED processed (${duration}ms):`, {
        bookingId: payload.bookingId,
        processedCount: this.processedCount
      });
      
    } catch (error) {
      this.errorCount++;
      console.error(`👷 [${this.name}] Error processing BOOKING_CREATED:`, error.message);
      
      // Log error for monitoring
      console.error(`👷 [${this.name}] Error details:`, {
        bookingId: payload.bookingId,
        error: error.message,
        stack: error.stack,
        metadata
      });
    }
  }

  async handleBookingUpdated(payload, metadata) {
    const startTime = Date.now();
    
    try {
      console.log(`👷 [${this.name}] Processing BOOKING_UPDATED:`, {
        bookingId: payload.bookingId,
        userId: payload.userId,
        professionalId: payload.professionalId,
        previousStatus: payload.previousStatus,
        newStatus: payload.newStatus,
        timestamp: new Date().toISOString()
      });
      
      // Analytics for status changes
      await this.processStatusChangeAnalytics(payload, metadata);
      
      // Notifications for important status changes
      await this.processStatusChangeNotifications(payload, metadata);
      
      // Business logic for status changes
      await this.processStatusChangeBusinessLogic(payload, metadata);
      
      this.processedCount++;
      const duration = Date.now() - startTime;
      
      console.log(`👷 [${this.name}] BOOKING_UPDATED processed (${duration}ms):`, {
        bookingId: payload.bookingId,
        previousStatus: payload.previousStatus,
        newStatus: payload.newStatus,
        processedCount: this.processedCount
      });
      
    } catch (error) {
      this.errorCount++;
      console.error(`👷 [${this.name}] Error processing BOOKING_UPDATED:`, error.message);
      
      console.error(`👷 [${this.name}] Error details:`, {
        bookingId: payload.bookingId,
        error: error.message,
        stack: error.stack,
        metadata
      });
    }
  }

  async handleBookingCancelled(payload, metadata) {
    const startTime = Date.now();
    
    try {
      console.log(`👷 [${this.name}] Processing BOOKING_CANCELLED:`, {
        bookingId: payload.bookingId,
        userId: payload.userId,
        professionalId: payload.professionalId,
        reason: payload.reason,
        timestamp: new Date().toISOString()
      });
      
      // Analytics for cancellations
      await this.processCancellationAnalytics(payload, metadata);
      
      // Notifications for cancellations
      await this.processCancellationNotifications(payload, metadata);
      
      // Business logic for cancellations
      await this.processCancellationBusinessLogic(payload, metadata);
      
      this.processedCount++;
      const duration = Date.now() - startTime;
      
      console.log(`👷 [${this.name}] BOOKING_CANCELLED processed (${duration}ms):`, {
        bookingId: payload.bookingId,
        reason: payload.reason,
        processedCount: this.processedCount
      });
      
    } catch (error) {
      this.errorCount++;
      console.error(`👷 [${this.name}] Error processing BOOKING_CANCELLED:`, error.message);
      
      console.error(`👷 [${this.name}] Error details:`, {
        bookingId: payload.bookingId,
        error: error.message,
        stack: error.stack,
        metadata
      });
    }
  }

  // Analytics processing methods
  async processBookingAnalytics(payload, metadata) {
    try {
      // Increment booking creation metrics
      console.log(`👷 [${this.name}] Analytics: Booking created - Service: ${payload.service}`);
      
      // Track booking metrics by service
      const serviceMetrics = {
        service: payload.service,
        price: payload.price,
        date: payload.date,
        professionalId: payload.professionalId,
        userId: payload.userId,
        timestamp: new Date().toISOString()
      };
      
      // In real implementation, this would send to analytics service
      console.log(`👷 [${this.name}] Would send booking analytics:`, serviceMetrics);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      console.error(`👷 [${this.name}] Analytics processing error:`, error.message);
    }
  }

  async processStatusChangeAnalytics(payload, metadata) {
    try {
      // Track status change metrics
      const statusChangeMetrics = {
        bookingId: payload.bookingId,
        previousStatus: payload.previousStatus,
        newStatus: payload.newStatus,
        changedBy: metadata.source || 'unknown',
        timestamp: new Date().toISOString()
      };
      
      console.log(`👷 [${this.name}] Analytics: Status change - ${payload.previousStatus} → ${payload.newStatus}`);
      
      // In real implementation, this would send to analytics service
      console.log(`👷 [${this.name}] Would send status change analytics:`, statusChangeMetrics);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 30));
      
    } catch (error) {
      console.error(`👷 [${this.name}] Status change analytics error:`, error.message);
    }
  }

  async processCancellationAnalytics(payload, metadata) {
    try {
      // Track cancellation metrics
      const cancellationMetrics = {
        bookingId: payload.bookingId,
        reason: payload.reason,
        userId: payload.userId,
        professionalId: payload.professionalId,
        timestamp: new Date().toISOString()
      };
      
      console.log(`👷 [${this.name}] Analytics: Booking cancelled - Reason: ${payload.reason}`);
      
      // In real implementation, this would send to analytics service
      console.log(`👷 [${this.name}] Would send cancellation analytics:`, cancellationMetrics);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 30));
      
    } catch (error) {
      console.error(`👷 [${this.name}] Cancellation analytics error:`, error.message);
    }
  }

  // Notification processing methods
  async processBookingNotifications(payload, metadata) {
    try {
      // Queue notifications for user and professional
      console.log(`👷 [${this.name}] Notifications: Booking created for user ${payload.userId}`);
      console.log(`👷 [${this.name}] Notifications: Booking created for professional ${payload.professionalId}`);
      
      // In real implementation, this would queue email/SMS notifications
      const notifications = [
        {
          type: 'booking_confirmation_user',
          recipient: payload.userId,
          data: {
            bookingId: payload.bookingId,
            service: payload.service,
            date: payload.date,
            price: payload.price
          }
        },
        {
          type: 'booking_notification_professional',
          recipient: payload.professionalId,
          data: {
            bookingId: payload.bookingId,
            service: payload.service,
            date: payload.date,
            price: payload.price
          }
        }
      ];
      
      console.log(`👷 [${this.name}] Would queue notifications:`, notifications);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`👷 [${this.name}] Notification processing error:`, error.message);
    }
  }

  async processStatusChangeNotifications(payload, metadata) {
    try {
      // Only send notifications for important status changes
      const importantChanges = [
        { from: 'pending', to: 'confirmed' },
        { from: 'confirmed', to: 'completed' },
        { from: 'confirmed', to: 'cancelled' }
      ];
      
      const isImportant = importantChanges.some(change => 
        change.from === payload.previousStatus && change.to === payload.newStatus
      );
      
      if (isImportant) {
        console.log(`👷 [${this.name}] Notifications: Important status change ${payload.previousStatus} → ${payload.newStatus}`);
        
        // In real implementation, this would queue notifications
        const notification = {
          type: 'booking_status_change',
          recipients: [payload.userId, payload.professionalId],
          data: {
            bookingId: payload.bookingId,
            previousStatus: payload.previousStatus,
            newStatus: payload.newStatus
          }
        };
        
        console.log(`👷 [${this.name}] Would queue status change notification:`, notification);
      }
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      console.error(`👷 [${this.name}] Status change notification error:`, error.message);
    }
  }

  async processCancellationNotifications(payload, metadata) {
    try {
      console.log(`👷 [${this.name}] Notifications: Booking cancelled for user ${payload.userId}`);
      console.log(`👷 [${this.name}] Notifications: Booking cancelled for professional ${payload.professionalId}`);
      
      // In real implementation, this would queue cancellation notifications
      const notifications = [
        {
          type: 'booking_cancellation_user',
          recipient: payload.userId,
          data: {
            bookingId: payload.bookingId,
            reason: payload.reason
          }
        },
        {
          type: 'booking_cancellation_professional',
          recipient: payload.professionalId,
          data: {
            bookingId: payload.bookingId,
            reason: payload.reason
          }
        }
      ];
      
      console.log(`👷 [${this.name}] Would queue cancellation notifications:`, notifications);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 80));
      
    } catch (error) {
      console.error(`👷 [${this.name}] Cancellation notification error:`, error.message);
    }
  }

  // Business logic processing methods
  async processBookingBusinessLogic(payload, metadata) {
    try {
      // Update professional availability
      console.log(`👷 [${this.name}] Business: Updating availability for professional ${payload.professionalId}`);
      
      // Update booking statistics
      console.log(`👷 [${this.name}] Business: Updating booking statistics`);
      
      // Check for booking conflicts
      console.log(`👷 [${this.name}] Business: Checking for booking conflicts`);
      
      // In real implementation, this would update database records
      console.log(`👷 [${this.name}] Would update business logic for booking:`, payload.bookingId);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 150));
      
    } catch (error) {
      console.error(`👷 [${this.name}] Business logic processing error:`, error.message);
    }
  }

  async processStatusChangeBusinessLogic(payload, metadata) {
    try {
      // Update professional statistics based on status change
      if (payload.newStatus === 'completed') {
        console.log(`👷 [${this.name}] Business: Updating completed statistics for professional ${payload.professionalId}`);
      }
      
      if (payload.newStatus === 'cancelled') {
        console.log(`👷 [${this.name}] Business: Updating cancellation statistics for professional ${payload.professionalId}`);
      }
      
      // In real implementation, this would update database records
      console.log(`👷 [${this.name}] Would update business logic for status change:`, payload.bookingId);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`👷 [${this.name}] Status change business logic error:`, error.message);
    }
  }

  async processCancellationBusinessLogic(payload, metadata) {
    try {
      // Update professional availability
      console.log(`👷 [${this.name}] Business: Freeing up availability for professional ${payload.professionalId}`);
      
      // Update cancellation statistics
      console.log(`👷 [${this.name}] Business: Updating cancellation statistics`);
      
      // Process refunds if applicable
      if (payload.reason === 'user_cancelled') {
        console.log(`👷 [${this.name}] Business: Processing refund for booking ${payload.bookingId}`);
      }
      
      // In real implementation, this would update database records
      console.log(`👷 [${this.name}] Would update business logic for cancellation:`, payload.bookingId);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 120));
      
    } catch (error) {
      console.error(`👷 [${this.name}] Cancellation business logic error:`, error.message);
    }
  }

  // Get worker statistics
  getStats() {
    const uptime = Date.now() - this.startTime;
    
    return {
      name: this.name,
      consumerName: this.consumerName,
      groupName: this.groupName,
      isRunning: this.isRunning,
      processedCount: this.processedCount,
      errorCount: this.errorCount,
      uptime: uptime,
      uptimeFormatted: this.formatUptime(uptime),
      errorRate: this.processedCount > 0 ? 
        (this.errorCount / this.processedCount * 100).toFixed(2) + '%' : '0%',
      startTime: new Date(this.startTime).toISOString(),
      timestamp: new Date().toISOString()
    };
  }

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

  // Graceful shutdown
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`👷 [${this.name}] ${signal} received, shutting down gracefully...`);
      
      this.isRunning = false;
      
      // Wait for current processing to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`👷 [${this.name}] Final stats:`, this.getStats());
      console.log(`👷 [${this.name}] Shutdown completed`);
      
      process.exit(0);
    };
    
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }
}

// Create and start worker if this file is run directly
if (require.main === module) {
  const bookingWorker = new BookingWorker();
  
  bookingWorker.start().then(success => {
    if (success) {
      console.log('👷 Booking worker started successfully');
      
      // Periodic stats reporting
      setInterval(() => {
        console.log('👷 Booking Worker Stats:', bookingWorker.getStats());
      }, 60000); // Every minute
    } else {
      console.error('👷 Failed to start booking worker');
      process.exit(1);
    }
  });
}

module.exports = {
  BookingWorker
};
