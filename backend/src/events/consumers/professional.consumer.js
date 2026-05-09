// Professional Consumer - Independent Event Consumer
// Procesa eventos de profesionales de forma distribuida y async

console.log("👨‍💼 Professional Consumer - Independent Event Consumer");

const { AUTH_EVENTS, BOOKING_EVENTS, PROFESSIONAL_EVENTS, SYSTEM_EVENTS } = require('../eventTypes');

class ProfessionalConsumer {
  constructor(config = {}) {
    this.name = 'professional-consumer';
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
    // Professional events
    this.handlers.set(PROFESSIONAL_EVENTS.LOCATION_UPDATED, this.handleProfessionalLocationUpdated.bind(this));
    this.handlers.set(PROFESSIONAL_EVENTS.REGISTERED, this.handleProfessionalRegistered.bind(this));
    this.handlers.set(PROFESSIONAL_EVENTS.VERIFIED, this.handleProfessionalVerified.bind(this));
    
    // Booking events (relevant to professionals)
    this.handlers.set(BOOKING_EVENTS.CREATED, this.handleBookingCreated.bind(this));
    this.handlers.set(BOOKING_EVENTS.UPDATED, this.handleBookingUpdated.bind(this));
    this.handlers.set(BOOKING_EVENTS.CANCELLED, this.handleBookingCancelled.bind(this));
    this.handlers.set(BOOKING_EVENTS.COMPLETED, this.handleBookingCompleted.bind(this));
  }

  async start() {
    try {
      console.log(`👨‍💼 [${this.name}] Starting professional consumer...`);
      
      this.isRunning = true;
      
      console.log(`👨‍💼 [${this.name}] Started successfully`);
      console.log(`👨‍💼 [${this.name}] Registered handlers: ${Array.from(this.handlers.keys()).join(', ')}`);
      
      return true;
    } catch (error) {
      console.error(`👨‍💼 [${this.name}] Failed to start:`, error.message);
      return false;
    }
  }

  async stop() {
    try {
      console.log(`👨‍💼 [${this.name}] Stopping professional consumer...`);
      
      this.isRunning = false;
      
      console.log(`👨‍💼 [${this.name}] Stopped successfully`);
    } catch (error) {
      console.error(`👨‍💼 [${this.name}] Error during stop:`, error.message);
    }
  }

  async handleEvent(eventName, payload, metadata) {
    const startTime = Date.now();
    
    try {
      const handler = this.handlers.get(eventName);
      
      if (!handler) {
        console.warn(`👨‍💼 [${this.name}] No handler for event: ${eventName}`);
        return { success: false, error: 'No handler found' };
      }
      
      console.log(`👨‍💼 [${this.name}] Processing event: ${eventName}`);
      
      // Ejecutar handler con retry
      const result = await this.executeWithRetry(handler, payload, metadata);
      
      this.processedCount++;
      const duration = Date.now() - startTime;
      
      console.log(`👨‍💼 [${this.name}] Event processed: ${eventName} (${duration}ms)`);
      
      return {
        success: true,
        eventName,
        duration,
        processedCount: this.processedCount
      };
      
    } catch (error) {
      this.errorCount++;
      const duration = Date.now() - startTime;
      
      console.error(`👨‍💼 [${this.name}] Event processing failed: ${eventName} - ${error.message}`);
      
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
          console.log(`👨‍💼 [${this.name}] Retry success on attempt ${attempt + 1}`);
          this.retryCount++;
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        if (attempt === this.maxRetries) {
          console.error(`👨‍💼 [${this.name}] Max retries reached (${this.maxRetries})`);
          break;
        }
        
        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt);
        console.warn(`👨‍💼 [${this.name}] Retry attempt ${attempt + 1}/${this.maxRetries} after ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  // Event Handlers
  async handleProfessionalLocationUpdated(payload, metadata) {
    try {
      console.log(`👨‍💼 [${this.name}] PROFESSIONAL_LOCATION_UPDATED: Processing location update`);
      
      // Geospatial indexing
      await this.processGeospatialIndexing(payload, metadata);
      
      // Real-time updates
      await this.processRealTimeUpdates(payload, metadata);
      
      // Analytics processing
      await this.processLocationAnalytics(payload, metadata);
      
      // Business logic processing
      await this.processLocationBusinessLogic(payload, metadata);
      
      // Notification processing
      await this.processLocationNotifications(payload, metadata);
      
      console.log(`👨‍💼 [${this.name}] PROFESSIONAL_LOCATION_UPDATED: Processing completed`);
      
    } catch (error) {
      console.error(`👨‍💼 [${this.name}] PROFESSIONAL_LOCATION_UPDATED processing error:`, error.message);
      throw error;
    }
  }

  async handleProfessionalRegistered(payload, metadata) {
    try {
      console.log(`👨‍💼 [${this.name}] PROFESSIONAL_REGISTERED: Processing professional registration`);
      
      // Geospatial indexing
      await this.processProfessionalIndexing(payload, metadata);
      
      // Analytics processing
      await this.processRegistrationAnalytics(payload, metadata);
      
      // Business logic processing
      await this.processRegistrationBusinessLogic(payload, metadata);
      
      // Notification processing
      await this.processRegistrationNotifications(payload, metadata);
      
      // Verification processing
      await this.processVerificationWorkflow(payload, metadata);
      
      console.log(`👨‍💼 [${this.name}] PROFESSIONAL_REGISTERED: Processing completed`);
      
    } catch (error) {
      console.error(`👨‍💼 [${this.name}] PROFESSIONAL_REGISTERED processing error:`, error.message);
      throw error;
    }
  }

  async handleProfessionalVerified(payload, metadata) {
    try {
      console.log(`👨‍💼 [${this.name}] PROFESSIONAL_VERIFIED: Processing professional verification`);
      
      // Update geospatial indexing
      await this.processVerifiedProfessionalIndexing(payload, metadata);
      
      // Business logic processing
      await this.processVerifiedBusinessLogic(payload, metadata);
      
      // Notification processing
      await this.processVerifiedNotifications(payload, metadata);
      
      // Ranking updates
      await this.processRankingUpdates(payload, metadata);
      
      console.log(`👨‍💼 [${this.name}] PROFESSIONAL_VERIFIED: Processing completed`);
      
    } catch (error) {
      console.error(`👨‍💼 [${this.name}] PROFESSIONAL_VERIFIED processing error:`, error.message);
      throw error;
    }
  }

  async handleBookingCreated(payload, metadata) {
    try {
      console.log(`👨‍💼 [${this.name}] BOOKING_CREATED: Processing new booking for professional`);
      
      // Update professional statistics
      await this.updateProfessionalBookingStats(payload.professionalId, 'created');
      
      // Update availability
      await this.updateProfessionalAvailability(payload.professionalId, payload.date);
      
      // Send notifications to professional
      await this.sendProfessionalBookingNotification(payload, 'created');
      
      console.log(`👨‍💼 [${this.name}] BOOKING_CREATED: Processing completed`);
      
    } catch (error) {
      console.error(`👨‍💼 [${this.name}] BOOKING_CREATED processing error:`, error.message);
      throw error;
    }
  }

  async handleBookingUpdated(payload, metadata) {
    try {
      console.log(`👨‍💼 [${this.name}] BOOKING_UPDATED: Processing booking update for professional`);
      
      // Update professional statistics based on status change
      await this.updateProfessionalBookingStats(payload.professionalId, payload.newStatus);
      
      // Send notifications to professional for important changes
      if (this.isImportantStatusChange(payload.previousStatus, payload.newStatus)) {
        await this.sendProfessionalBookingNotification(payload, 'updated');
      }
      
      console.log(`👨‍💼 [${this.name}] BOOKING_UPDATED: Processing completed`);
      
    } catch (error) {
      console.error(`👨‍💼 [${this.name}] BOOKING_UPDATED processing error:`, error.message);
      throw error;
    }
  }

  async handleBookingCancelled(payload, metadata) {
    try {
      console.log(`👨‍💼 [${this.name}] BOOKING_CANCELLED: Processing booking cancellation for professional`);
      
      // Update professional statistics
      await this.updateProfessionalBookingStats(payload.professionalId, 'cancelled');
      
      // Update availability
      await this.updateProfessionalAvailability(payload.professionalId, payload.date);
      
      // Send notification to professional
      await this.sendProfessionalBookingNotification(payload, 'cancelled');
      
      console.log(`👨‍💼 [${this.name}] BOOKING_CANCELLED: Processing completed`);
      
    } catch (error) {
      console.error(`👨‍💼 [${this.name}] BOOKING_CANCELLED processing error:`, error.message);
      throw error;
    }
  }

  async handleBookingCompleted(payload, metadata) {
    try {
      console.log(`👨‍💼 [${this.name}] BOOKING_COMPLETED: Processing booking completion for professional`);
      
      // Update professional statistics
      await this.updateProfessionalBookingStats(payload.professionalId, 'completed');
      
      // Update rating and reviews
      await this.updateProfessionalRating(payload.professionalId, payload.rating);
      
      // Send notification to professional
      await this.sendProfessionalBookingNotification(payload, 'completed');
      
      // Request review
      await this.requestReviewFromUser(payload);
      
      console.log(`👨‍💼 [${this.name}] BOOKING_COMPLETED: Processing completed`);
      
    } catch (error) {
      console.error(`👨‍💼 [${this.name}] BOOKING_COMPLETED processing error:`, error.message);
      throw error;
    }
  }

  // Processing methods
  async processGeospatialIndexing(payload, metadata) {
    try {
      console.log(`👨‍💼 [${this.name}] Geospatial: Processing location indexing`);
      
      const indexingData = {
        professionalId: payload.professionalId,
        coordinates: [payload.location.lng, payload.location.lat], // GeoJSON format
        timestamp: new Date().toISOString(),
        previousLocation: payload.previousLocation
      };
      
      // En implementación real, esto actualizaría el índice geoespacial
      console.log(`👨‍💼 [${this.name}] Would update geospatial index:`, indexingData);
      
      // Actualizar caché de profesionales cercanos
      await this.updateNearbyProfessionalsCache(payload);
      
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 60));
      
    } catch (error) {
      console.error(`👨‍💼 [${this.name}] Geospatial indexing error:`, error.message);
    }
  }

  async processRealTimeUpdates(payload, metadata) {
    try {
      console.log(`👨‍💼 [${this.name}] Real-time: Processing location updates`);
      
      // Broadcast a clientes conectados
      const broadcastData = {
        professionalId: payload.professionalId,
        location: payload.location,
        timestamp: new Date().toISOString(),
        source: 'professional-consumer'
      };
      
      console.log(`👨‍💼 [${this.name}] Would broadcast location update:`, broadcastData);
      
      // Actualizar disponibilidad basada en ubicación
      await this.updateAvailabilityByLocation(payload);
      
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 40));
      
    } catch (error) {
      console.error(`👨‍💼 [${this.name}] Real-time updates error:`, error.message);
    }
  }

  async processLocationAnalytics(payload, metadata) {
    try {
      console.log(`👨‍💼 [${this.name}] Analytics: Processing location analytics`);
      
      const analyticsData = {
        professionalId: payload.professionalId,
        location: payload.location,
        previousLocation: payload.previousLocation,
        distance: this.calculateDistance(payload.previousLocation, payload.location),
        timestamp: new Date().toISOString(),
        source: metadata.source || 'consumer'
      };
      
      console.log(`👨‍💼 [${this.name}] Would send location analytics:`, analyticsData);
      
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 30));
      
    } catch (error) {
      console.error(`👨‍💼 [${this.name}] Location analytics error:`, error.message);
    }
  }

  async processLocationBusinessLogic(payload, metadata) {
    try {
      console.log(`👨‍💼 [${this.name}] Business: Processing location business logic`);
      
      // Actualizar estadísticas de profesional
      await this.updateProfessionalLocationStats(payload.professionalId);
      
      // Verificar cambios en área de servicio
      await this.checkServiceAreaChanges(payload);
      
      // Actualizar ranking basado en actividad de ubicación
      await this.updateProfessionalRanking(payload.professionalId);
      
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 80));
      
    } catch (error) {
      console.error(`👨‍💼 [${this.name}] Location business logic error:`, error.message);
    }
  }

  async processLocationNotifications(payload, metadata) {
    try {
      console.log(`👨‍💼 [${this.name}] Notifications: Processing location notifications`);
      
      // Notificar a usuarios cercanos de disponibilidad
      await this.notifyNearbyUsers(payload);
      
      // Actualizar notificaciones de estado de profesional
      await this.updateProfessionalStatusNotifications(payload);
      
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      console.error(`👨‍💼 [${this.name}] Location notifications error:`, error.message);
    }
  }

  async processProfessionalIndexing(payload, metadata) {
    try {
      console.log(`👨‍💼 [${this.name}] Indexing: Adding new professional to geospatial index`);
      
      const indexingData = {
        professionalId: payload.professionalId,
        businessName: payload.businessName,
        profession: payload.profession,
        coordinates: payload.location ? [payload.location.lng, payload.location.lat] : null,
        isActive: payload.isActive !== false,
        timestamp: new Date().toISOString()
      };
      
      console.log(`👨‍💼 [${this.name}] Would add to geospatial index:`, indexingData);
      
      // Inicializar estadísticas de ubicación del profesional
      await this.initializeProfessionalLocationStats(payload);
      
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 70));
      
    } catch (error) {
      console.error(`👨‍💼 [${this.name}] Professional indexing error:`, error.message);
    }
  }

  async processRegistrationAnalytics(payload, metadata) {
    try {
      console.log(`👨‍💼 [${this.name}] Analytics: Processing professional registration`);
      
      const analyticsData = {
        professionalId: payload.professionalId,
        businessName: payload.businessName,
        profession: payload.profession,
        initialLocation: payload.location,
        registrationDate: new Date().toISOString(),
        source: metadata.source || 'consumer'
      };
      
      console.log(`👨‍💼 [${this.name}] Would send registration analytics:`, analyticsData);
      
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 40));
      
    } catch (error) {
      console.error(`👨‍💼 [${this.name}] Registration analytics error:`, error.message);
    }
  }

  async processRegistrationBusinessLogic(payload, metadata) {
    try {
      console.log(`👨‍💼 [${this.name}] Business: Processing new professional business logic`);
      
      // Actualizar estadísticas de profesionales
      await this.updateProfessionalRegistrationStats(payload);
      
      // Buscar profesionales cercanos para recomendaciones
      await this.findNearbyProfessionals(payload);
      
      // Inicializar ranking de profesional
      await this.initializeProfessionalRanking(payload);
      
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 90));
      
    } catch (error) {
      console.error(`👨‍💼 [${this.name}] Registration business logic error:`, error.message);
    }
  }

  async processRegistrationNotifications(payload, metadata) {
    try {
      console.log(`👨‍💼 [${this.name}] Notifications: Processing registration notifications`);
      
      // Notificación de bienvenida al profesional
      await this.sendWelcomeNotification(payload);
      
      // Notificar a usuarios que guardaron este profesional
      await this.notifySavedUsers(payload);
      
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 60));
      
    } catch (error) {
      console.error(`👨‍💼 [${this.name}] Registration notifications error:`, error.message);
    }
  }

  async processVerificationWorkflow(payload, metadata) {
    try {
      console.log(`👨‍💼 [${this.name}] Verification: Processing verification workflow`);
      
      // Iniciar proceso de verificación
      await this.initiateVerificationProcess(payload);
      
      // Enviar documentos de verificación
      await this.sendVerificationDocuments(payload);
      
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 80));
      
    } catch (error) {
      console.error(`👨‍💼 [${this.name}] Verification workflow error:`, error.message);
    }
  }

  // Helper methods (stubs para implementación real)
  calculateDistance(location1, location2) {
    if (!location1 || !location2) return null;
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(location2.lat - location1.lat);
    const dLon = this.toRadians(location2.lng - location1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(location1.lat)) * Math.cos(this.toRadians(location2.lat)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  async updateNearbyProfessionalsCache(payload) {
    console.log(`👨‍💼 [${this.name}] Would update nearby professionals cache around:`, payload.location);
  }

  async updateAvailabilityByLocation(payload) {
    console.log(`👨‍💼 [${this.name}] Would update availability for professional: ${payload.professionalId}`);
  }

  async updateProfessionalLocationStats(professionalId) {
    console.log(`👨‍💼 [${this.name}] Would update location stats for professional: ${professionalId}`);
  }

  async checkServiceAreaChanges(payload) {
    console.log(`👨‍💼 [${this.name}] Would check service area changes for professional: ${payload.professionalId}`);
  }

  async updateProfessionalRanking(professionalId) {
    console.log(`👨‍💼 [${this.name}] Would update ranking for professional: ${professionalId}`);
  }

  async notifyNearbyUsers(payload) {
    console.log(`👨‍💼 [${this.name}] Would notify nearby users around:`, payload.location);
  }

  async updateProfessionalStatusNotifications(payload) {
    console.log(`👨‍💼 [${this.name}] Would update status notifications for professional: ${payload.professionalId}`);
  }

  async initializeProfessionalLocationStats(payload) {
    console.log(`👨‍💼 [${this.name}] Would initialize location stats for professional: ${payload.professionalId}`);
  }

  async updateProfessionalRegistrationStats(payload) {
    console.log(`👨‍💼 [${this.name}] Would update registration stats for professional: ${payload.professionalId}`);
  }

  async findNearbyProfessionals(payload) {
    console.log(`👨‍💼 [${this.name}] Would find nearby professionals around:`, payload.location);
  }

  async initializeProfessionalRanking(payload) {
    console.log(`👨‍💼 [${this.name}] Would initialize ranking for professional: ${payload.professionalId}`);
  }

  async sendWelcomeNotification(payload) {
    console.log(`👨‍💼 [${this.name}] Would send welcome notification to professional: ${payload.professionalId}`);
  }

  async notifySavedUsers(payload) {
    console.log(`👨‍💼 [${this.name}] Would notify users who saved professional: ${payload.professionalId}`);
  }

  async initiateVerificationProcess(payload) {
    console.log(`👨‍💼 [${this.name}] Would initiate verification process for professional: ${payload.professionalId}`);
  }

  async sendVerificationDocuments(payload) {
    console.log(`👨‍💼 [${this.name}] Would send verification documents to professional: ${payload.professionalId}`);
  }

  async processVerifiedProfessionalIndexing(payload, metadata) {
    console.log(`👨‍💼 [${this.name}] Would update geospatial index for verified professional: ${payload.professionalId}`);
  }

  async processVerifiedBusinessLogic(payload, metadata) {
    console.log(`👨‍💼 [${this.name}] Would process verified business logic for professional: ${payload.professionalId}`);
  }

  async processVerifiedNotifications(payload, metadata) {
    console.log(`👨‍💼 [${this.name}] Would send verification notifications for professional: ${payload.professionalId}`);
  }

  async processRankingUpdates(payload, metadata) {
    console.log(`👨‍💼 [${this.name}] Would update ranking for verified professional: ${payload.professionalId}`);
  }

  async updateProfessionalBookingStats(professionalId, action) {
    console.log(`👨‍💼 [${this.name}] Would update booking stats for professional: ${professionalId}, action: ${action}`);
  }

  async updateProfessionalAvailability(professionalId, date) {
    console.log(`👨‍💼 [${this.name}] Would update availability for professional: ${professionalId} on ${date}`);
  }

  async sendProfessionalBookingNotification(payload, action) {
    console.log(`👨‍💼 [${this.name}] Would send ${action} notification to professional: ${payload.professionalId}`);
  }

  isImportantStatusChange(previousStatus, newStatus) {
    const importantChanges = [
      { from: 'pending', to: 'confirmed' },
      { from: 'confirmed', to: 'completed' },
      { from: 'confirmed', to: 'cancelled' }
    ];
    
    return importantChanges.some(change => 
      change.from === previousStatus && change.to === newStatus
    );
  }

  async updateProfessionalRating(professionalId, rating) {
    console.log(`👨‍💼 [${this.name}] Would update rating for professional: ${professionalId} with ${rating}`);
  }

  async requestReviewFromUser(payload) {
    console.log(`👨‍💼 [${this.name}] Would request review from user: ${payload.userId} for booking: ${payload.bookingId}`);
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
      console.log(`👨‍💼 [${this.name}] ${signal} received, shutting down gracefully...`);
      
      this.isRunning = false;
      
      // Wait for current processing to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`👨‍💼 [${this.name}] Final stats:`, this.getStats());
      console.log(`👨‍💼 [${this.name}] Shutdown completed`);
      
      process.exit(0);
    };
    
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }
}

// Create and start consumer if this file is run directly
if (require.main === module) {
  const professionalConsumer = new ProfessionalConsumer();
  
  professionalConsumer.start().then(success => {
    if (success) {
      console.log('👨‍💼 Professional consumer started successfully');
      
      // Periodic stats reporting
      setInterval(() => {
        console.log('👨‍💼 Professional Consumer Stats:', professionalConsumer.getStats());
      }, 60000); // Every minute
    } else {
      console.error('👨‍💼 Failed to start professional consumer');
      process.exit(1);
    }
  });
}

module.exports = {
  ProfessionalConsumer
};
