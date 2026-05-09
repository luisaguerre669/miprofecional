// Booking Consumer - Independent Event Consumer
// Procesa eventos de bookings de forma distribuida y async

console.log("👥 Booking Consumer - Independent Event Consumer");

const { AUTH_EVENTS, BOOKING_EVENTS, PROFESSIONAL_EVENTS, SYSTEM_EVENTS } = require('../eventTypes');

class BookingConsumer {
  constructor(config = {}) {
    this.name = 'booking-consumer';
    this.isRunning = false;
    this.processedCount = 0;
    this.errorCount = 0;
    this.retryCount = 0;
    this.startTime = Date.now();
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
    
    // Event handlers
    this.handlers = new Map();
    this.setupEventHandlers();
    
    this.setupGracefulShutdown();
  }

  setupEventHandlers() {
    // Booking events
    this.handlers.set(BOOKING_EVENTS.CREATED, this.handleBookingCreated.bind(this));
    this.handlers.set(BOOKING_EVENTS.UPDATED, this.handleBookingUpdated.bind(this));
    this.handlers.set(BOOKING_EVENTS.CANCELLED, this.handleBookingCancelled.bind(this));
    this.handlers.set(BOOKING_EVENTS.CONFIRMED, this.handleBookingConfirmed.bind(this));
    this.handlers.set(BOOKING_EVENTS.COMPLETED, this.handleBookingCompleted.bind(this));
    this.handlers.set(BOOKING_EVENTS.STATUS_CHANGED, this.handleBookingStatusChanged.bind(this));
  }

  async start() {
    try {
      console.log(`👥 [${this.name}] Starting booking consumer...`);
      
      this.isRunning = true;
      
      console.log(`👥 [${this.name}] Started successfully`);
      console.log(`👥 [${this.name}] Registered handlers: ${Array.from(this.handlers.keys()).join(', ')}`);
      
      return true;
    } catch (error) {
      console.error(`👥 [${this.name}] Failed to start:`, error.message);
      return false;
    }
  }

  async stop() {
    try {
      console.log(`👥 [${this.name}] Stopping booking consumer...`);
      
      this.isRunning = false;
      
      console.log(`👥 [${this.name}] Stopped successfully`);
    } catch (error) {
      console.error(`👥 [${this.name}] Error during stop:`, error.message);
    }
  }

  async handleEvent(eventName, payload, metadata) {
    const startTime = Date.now();
    
    try {
      const handler = this.handlers.get(eventName);
      
      if (!handler) {
        console.warn(`👥 [${this.name}] No handler for event: ${eventName}`);
        return { success: false, error: 'No handler found' };
      }
      
      console.log(`👥 [${this.name}] Processing event: ${eventName}`);
      
      // Ejecutar handler con retry
      const result = await this.executeWithRetry(handler, payload, metadata);
      
      this.processedCount++;
      const duration = Date.now() - startTime;
      
      console.log(`👥 [${this.name}] Event processed: ${eventName} (${duration}ms)`);
      
      return {
        success: true,
        eventName,
        duration,
        processedCount: this.processedCount
      };
      
    } catch (error) {
      this.errorCount++;
      const duration = Date.now() - startTime;
      
      console.error(`👥 [${this.name}] Event processing failed: ${eventName} - ${error.message}`);
      
      return {
        success: false,
        eventName,
        error: error.message,
        duration,
        errorCount: this.errorCount
      };
    }
  }

  async executeWithRetry(handler, payload, metadata) {
    let lastError;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await handler(payload, metadata);
        
        if (attempt > 0) {
          console.log(`👥 [${this.name}] Retry success on attempt ${attempt + 1}`);
          this.retryCount++;
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        if (attempt === this.maxRetries) {
          console.error(`👥 [${this.name}] Max retries reached (${this.maxRetries})`);
          break;
        }
        
        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt);
        console.warn(`👥 [${this.name}] Retry attempt ${attempt + 1}/${this.maxRetries} after ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  // Event Handlers
  async handleBookingCreated(payload, metadata) {
    try {
      console.log(`👥 [${this.name}] BOOKING_CREATED: Processing new booking`);
      
      // Analytics processing
      await this.processBookingAnalytics(payload, metadata);
      
      // Notification processing
      await this.processBookingNotifications(payload, metadata);
      
      // Business logic processing
      await this.processBookingBusinessLogic(payload, metadata);
      
      // External integrations
      await this.processBookingIntegrations(payload, metadata);
      
      console.log(`👥 [${this.name}] BOOKING_CREATED: Processing completed`);
      
    } catch (error) {
      console.error(`👥 [${this.name}] BOOKING_CREATED processing error:`, error.message);
      throw error;
    }
  }

  async handleBookingUpdated(payload, metadata) {
    try {
      console.log(`👥 [${this.name}] BOOKING_UPDATED: Processing booking update`);
      
      // Analytics for status changes
      await this.processStatusChangeAnalytics(payload, metadata);
      
      // Notifications for important changes
      await this.processStatusChangeNotifications(payload, metadata);
      
      // Business logic for updates
      await this.processUpdateBusinessLogic(payload, metadata);
      
      console.log(`👥 [${this.name}] BOOKING_UPDATED: Processing completed`);
      
    } catch (error) {
      console.error(`👥 [${this.name}] BOOKING_UPDATED processing error:`, error.message);
      throw error;
    }
  }

  async handleBookingCancelled(payload, metadata) {
    try {
      console.log(`👥 [${this.name}] BOOKING_CANCELLED: Processing booking cancellation`);
      
      // Cancellation analytics
      await this.processCancellationAnalytics(payload, metadata);
      
      // Cancellation notifications
      await this.processCancellationNotifications(payload, metadata);
      
      // Cancellation business logic
      await this.processCancellationBusinessLogic(payload, metadata);
      
      console.log(`👥 [${this.name}] BOOKING_CANCELLED: Processing completed`);
      
    } catch (error) {
      console.error(`👥 [${this.name}] BOOKING_CANCELLED processing error:`, error.message);
      throw error;
    }
  }

  async handleBookingConfirmed(payload, metadata) {
    try {
      console.log(`👥 [${this.name}] BOOKING_CONFIRMED: Processing booking confirmation`);
      
      // Confirmation analytics
      await this.processConfirmationAnalytics(payload, metadata);
      
      // Confirmation notifications
      await this.processConfirmationNotifications(payload, metadata);
      
      // Confirmation business logic
      await this.processConfirmationBusinessLogic(payload, metadata);
      
      console.log(`👥 [${this.name}] BOOKING_CONFIRMED: Processing completed`);
      
    } catch (error) {
      console.error(`👥 [${this.name}] BOOKING_CONFIRMED processing error:`, error.message);
      throw error;
    }
  }

  async handleBookingCompleted(payload, metadata) {
    try {
      console.log(`👥 [${this.name}] BOOKING_COMPLETED: Processing booking completion`);
      
      // Completion analytics
      await this.processCompletionAnalytics(payload, metadata);
      
      // Completion notifications
      await this.processCompletionNotifications(payload, metadata);
      
      // Completion business logic
      await this.processCompletionBusinessLogic(payload, metadata);
      
      // Review request
      await this.processReviewRequest(payload, metadata);
      
      console.log(`👥 [${this.name}] BOOKING_COMPLETED: Processing completed`);
      
    } catch (error) {
      console.error(`👥 [${this.name}] BOOKING_COMPLETED processing error:`, error.message);
      throw error;
    }
  }

  async handleBookingStatusChanged(payload, metadata) {
    try {
      console.log(`👥 [${this.name}] BOOKING_STATUS_CHANGED: Processing status change`);
      
      // Status change analytics
      await this.processGenericStatusChangeAnalytics(payload, metadata);
      
      // Status change notifications
      await this.processGenericStatusChangeNotifications(payload, metadata);
      
      console.log(`👥 [${this.name}] BOOKING_STATUS_CHANGED: Processing completed`);
      
    } catch (error) {
      console.error(`👥 [${this.name}] BOOKING_STATUS_CHANGED processing error:`, error.message);
      throw error;
    }
  }

  // Processing methods
  async processBookingAnalytics(payload, metadata) {
    try {
      console.log(`👥 [${this.name}] Analytics: Processing booking creation`);
      
      const analyticsData = {
        bookingId: payload.bookingId,
        userId: payload.userId,
        professionalId: payload.professionalId,
        service: payload.service,
        price: payload.price,
        date: payload.date,
        timestamp: new Date().toISOString(),
        source: metadata.source || 'consumer'
      };
      
      // En implementación real, esto enviaría a servicio de analytics
      console.log(`👥 [${this.name}] Would send booking analytics:`, analyticsData);
      
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      console.error(`👥 [${this.name}] Analytics processing error:`, error.message);
    }
  }

  async processBookingNotifications(payload, metadata) {
    try {
      console.log(`👥 [${this.name}] Notifications: Processing booking notifications`);
      
      // Notificación al usuario
      const userNotification = {
        type: 'booking_confirmation',
        recipient: payload.userId,
        data: {
          bookingId: payload.bookingId,
          service: payload.service,
          date: payload.date,
          price: payload.price
        }
      };
      
      // Notificación al profesional
      const professionalNotification = {
        type: 'new_booking',
        recipient: payload.professionalId,
        data: {
          bookingId: payload.bookingId,
          service: payload.service,
          date: payload.date,
          price: payload.price,
          userId: payload.userId
        }
      };
      
      console.log(`👥 [${this.name}] Would queue notifications:`, [userNotification, professionalNotification]);
      
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`👥 [${this.name}] Notification processing error:`, error.message);
    }
  }

  async processBookingBusinessLogic(payload, metadata) {
    try {
      console.log(`👥 [${this.name}] Business: Processing booking business logic`);
      
      // Actualizar estadísticas del profesional
      await this.updateProfessionalStats(payload.professionalId);
      
      // Verificar disponibilidad del profesional
      await this.checkProfessionalAvailability(payload.professionalId, payload.date);
      
      // Actualizar métricas del sistema
      await this.updateSystemMetrics('booking_created');
      
      console.log(`👥 [${this.name}] Business logic processed`);
      
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 80));
      
    } catch (error) {
      console.error(`👥 [${this.name}] Business logic processing error:`, error.message);
    }
  }

  async processBookingIntegrations(payload, metadata) {
    try {
      console.log(`👥 [${this.name}] Integrations: Processing external integrations`);
      
      // Integración con calendario
      await this.syncWithCalendar(payload);
      
      // Integración con sistema de pagos
      await this.updatePaymentSystem(payload);
      
      // Integración con CRM
      await this.updateCRM(payload);
      
      console.log(`👥 [${this.name}] External integrations processed`);
      
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 120));
      
    } catch (error) {
      console.error(`👥 [${this.name}] Integration processing error:`, error.message);
    }
  }

  // Helper methods (stubs para implementación real)
  async updateProfessionalStats(professionalId) {
    console.log(`👥 [${this.name}] Would update stats for professional: ${professionalId}`);
  }

  async checkProfessionalAvailability(professionalId, date) {
    console.log(`👥 [${this.name}] Would check availability for professional: ${professionalId} on ${date}`);
  }

  async updateSystemMetrics(metric) {
    console.log(`👥 [${this.name}] Would update system metric: ${metric}`);
  }

  async syncWithCalendar(payload) {
    console.log(`👥 [${this.name}] Would sync booking ${payload.bookingId} with calendar`);
  }

  async updatePaymentSystem(payload) {
    console.log(`👥 [${this.name}] Would update payment system for booking: ${payload.bookingId}`);
  }

  async updateCRM(payload) {
    console.log(`👥 [${this.name}] Would update CRM for booking: ${payload.bookingId}`);
  }

  async processStatusChangeAnalytics(payload, metadata) {
    console.log(`👥 [${this.name}] Would process status change analytics for booking: ${payload.bookingId}`);
  }

  async processStatusChangeNotifications(payload, metadata) {
    console.log(`👥 [${this.name}] Would send status change notifications for booking: ${payload.bookingId}`);
  }

  async processUpdateBusinessLogic(payload, metadata) {
    console.log(`👥 [${this.name}] Would process update business logic for booking: ${payload.bookingId}`);
  }

  async processCancellationAnalytics(payload, metadata) {
    console.log(`👥 [${this.name}] Would process cancellation analytics for booking: ${payload.bookingId}`);
  }

  async processCancellationNotifications(payload, metadata) {
    console.log(`👥 [${this.name}] Would send cancellation notifications for booking: ${payload.bookingId}`);
  }

  async processCancellationBusinessLogic(payload, metadata) {
    console.log(`👥 [${this.name}] Would process cancellation business logic for booking: ${payload.bookingId}`);
  }

  async processConfirmationAnalytics(payload, metadata) {
    console.log(`👥 [${this.name}] Would process confirmation analytics for booking: ${payload.bookingId}`);
  }

  async processConfirmationNotifications(payload, metadata) {
    console.log(`👥 [${this.name}] Would send confirmation notifications for booking: ${payload.bookingId}`);
  }

  async processConfirmationBusinessLogic(payload, metadata) {
    console.log(`👥 [${this.name}] Would process confirmation business logic for booking: ${payload.bookingId}`);
  }

  async processCompletionAnalytics(payload, metadata) {
    console.log(`👥 [${this.name}] Would process completion analytics for booking: ${payload.bookingId}`);
  }

  async processCompletionNotifications(payload, metadata) {
    console.log(`👥 [${this.name}] Would send completion notifications for booking: ${payload.bookingId}`);
  }

  async processCompletionBusinessLogic(payload, metadata) {
    console.log(`👥 [${this.name}] Would process completion business logic for booking: ${payload.bookingId}`);
  }

  async processReviewRequest(payload, metadata) {
    console.log(`👥 [${this.name}] Would send review request for booking: ${payload.bookingId}`);
  }

  async processGenericStatusChangeAnalytics(payload, metadata) {
    console.log(`👥 [${this.name}] Would process generic status change analytics for booking: ${payload.bookingId}`);
  }

  async processGenericStatusChangeNotifications(payload, metadata) {
    console.log(`👥 [${this.name}] Would send generic status change notifications for booking: ${payload.bookingId}`);
  }

  // Get consumer statistics
  getStats() {
    const uptime = Date.now() - this.startTime;
    
    return {
      name: this.name,
      isRunning: this.isRunning,
      processedCount: this.processedCount,
      errorCount: this.errorCount,
      retryCount: this.retryCount,
      uptime: uptime,
      uptimeFormatted: this.formatUptime(uptime),
      errorRate: this.processedCount > 0 ? 
        (this.errorCount / this.processedCount * 100).toFixed(2) + '%' : '0%',
      retryRate: this.processedCount > 0 ? 
        (this.retryCount / this.processedCount * 100).toFixed(2) + '%' : '0%',
      handlersCount: this.handlers.size,
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

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`👥 [${this.name}] ${signal} received, shutting down gracefully...`);
      
      this.isRunning = false;
      
      // Wait for current processing to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`👥 [${this.name}] Final stats:`, this.getStats());
      console.log(`👥 [${this.name}] Shutdown completed`);
      
      process.exit(0);
    };
    
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }
}

// Create and start consumer if this file is run directly
if (require.main === module) {
  const bookingConsumer = new BookingConsumer();
  
  bookingConsumer.start().then(success => {
    if (success) {
      console.log('👥 Booking consumer started successfully');
      
      // Periodic stats reporting
      setInterval(() => {
        console.log('👥 Booking Consumer Stats:', bookingConsumer.getStats());
      }, 60000); // Every minute
    } else {
      console.error('👥 Failed to start booking consumer');
      process.exit(1);
    }
  });
}

module.exports = {
  BookingConsumer
};
