// Geo Worker - Distributed Redis Streams Consumer
// Procesa eventos de geolocalización con consumer groups y retry automático

console.log("🌍 Geo Worker - Distributed Redis Streams Consumer");

const { redisClient } = require('../config/redis.client');
const { distributedEventBus } = require('../events/distributedEventBus');
const { PROFESSIONAL_EVENTS } = require('../events/eventTypes');

class GeoWorker {
  constructor() {
    this.name = 'geo-worker';
    this.groupName = 'geo-group'; // Updated to match distributed event bus
    this.consumerName = `geo-worker-${process.pid}`;
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
      console.log(`🌍 [${this.name}] Starting distributed geo worker...`);
      console.log(`🌍 [${this.name}] Consumer: ${this.consumerName}`);
      console.log(`🌍 [${this.name}] Consumer Group: ${this.groupName}`);
      
      // Check Redis availability
      const redisHealth = await redisClient.healthCheck();
      if (redisHealth.status !== 'healthy') {
        console.error(`🌍 [${this.name}] Redis not healthy: ${redisHealth.error}`);
        return false;
      }
      
      // Subscribe to geo events with distributed event bus
      await this.subscribeToGeoEvents();
      
      this.isRunning = true;
      console.log(`🌍 [${this.name}] Started successfully`);
      
      return true;
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Failed to start:`, error.message);
      return false;
    }
  }

  async subscribeToGeoEvents() {
    try {
      // Subscribe to professional location updated events
      await distributedEventBus.subscribe(
        PROFESSIONAL_EVENTS.LOCATION_UPDATED,
        this.handleProfessionalLocationUpdated.bind(this),
        {
          consumerName: this.consumerName,
          maxRetries: this.maxRetries
        }
      );
      
      // Subscribe to professional registered events
      await distributedEventBus.subscribe(
        PROFESSIONAL_EVENTS.REGISTERED,
        this.handleProfessionalRegistered.bind(this),
        {
          consumerName: this.consumerName,
          maxRetries: this.maxRetries
        }
      );
      
      // Subscribe to professional verified events
      await distributedEventBus.subscribe(
        PROFESSIONAL_EVENTS.VERIFIED,
        this.handleProfessionalVerified.bind(this),
        {
          consumerName: this.consumerName,
          maxRetries: this.maxRetries
        }
      );
      
      console.log(`🌍 [${this.name}] Subscribed to all geo events with consumer group: ${this.groupName}`);
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Error subscribing to events:`, error.message);
      throw error;
    }
  }

  async handleProfessionalLocationUpdated(payload, metadata) {
    const startTime = Date.now();
    
    try {
      console.log(`🌍 [${this.name}] Processing PROFESSIONAL_LOCATION_UPDATED:`, {
        professionalId: payload.professionalId,
        location: payload.location ? `${payload.location.lat}, ${payload.location.lng}` : 'N/A',
        previousLocation: payload.previousLocation ? `${payload.previousLocation.lat}, ${payload.previousLocation.lng}` : 'N/A',
        timestamp: new Date().toISOString()
      });
      
      // Location analytics processing
      await this.processLocationAnalytics(payload, metadata);
      
      // Real-time updates processing
      await this.processRealTimeUpdates(payload, metadata);
      
      // Geospatial indexing processing
      await this.processGeospatialIndexing(payload, metadata);
      
      // Business logic processing
      await this.processLocationBusinessLogic(payload, metadata);
      
      // Notification processing
      await this.processLocationNotifications(payload, metadata);
      
      this.processedCount++;
      const duration = Date.now() - startTime;
      
      console.log(`🌍 [${this.name}] PROFESSIONAL_LOCATION_UPDATED processed (${duration}ms):`, {
        professionalId: payload.professionalId,
        processedCount: this.processedCount
      });
      
    } catch (error) {
      this.errorCount++;
      console.error(`🌍 [${this.name}] Error processing PROFESSIONAL_LOCATION_UPDATED:`, error.message);
      
      console.error(`🌍 [${this.name}] Error details:`, {
        professionalId: payload.professionalId,
        error: error.message,
        stack: error.stack,
        metadata
      });
    }
  }

  async handleProfessionalRegistered(payload, metadata) {
    const startTime = Date.now();
    
    try {
      console.log(`🌍 [${this.name}] Processing PROFESSIONAL_REGISTERED:`, {
        professionalId: payload.professionalId,
        businessName: payload.businessName || 'N/A',
        profession: payload.profession || 'N/A',
        location: payload.location ? `${payload.location.lat}, ${payload.location.lng}` : 'N/A',
        timestamp: new Date().toISOString()
      });
      
      // Geospatial indexing for new professional
      await this.processProfessionalIndexing(payload, metadata);
      
      // Location analytics for new professional
      await this.processProfessionalLocationAnalytics(payload, metadata);
      
      // Business logic for new professional
      await this.processProfessionalBusinessLogic(payload, metadata);
      
      this.processedCount++;
      const duration = Date.now() - startTime;
      
      console.log(`🌍 [${this.name}] PROFESSIONAL_REGISTERED processed (${duration}ms):`, {
        professionalId: payload.professionalId,
        processedCount: this.processedCount
      });
      
    } catch (error) {
      this.errorCount++;
      console.error(`🌍 [${this.name}] Error processing PROFESSIONAL_REGISTERED:`, error.message);
      
      console.error(`🌍 [${this.name}] Error details:`, {
        professionalId: payload.professionalId,
        error: error.message,
        stack: error.stack,
        metadata
      });
    }
  }

  async handleProfessionalVerified(payload, metadata) {
    const startTime = Date.now();
    
    try {
      console.log(`🌍 [${this.name}] Processing PROFESSIONAL_VERIFIED:`, {
        professionalId: payload.professionalId,
        businessName: payload.businessName || 'N/A',
        verificationDate: payload.verificationDate || 'N/A',
        timestamp: new Date().toISOString()
      });
      
      // Update geospatial indexing for verified professional
      await this.processVerifiedProfessionalIndexing(payload, metadata);
      
      // Business logic for verified professional
      await this.processVerifiedProfessionalBusinessLogic(payload, metadata);
      
      // Notification processing for verified professional
      await this.processVerifiedProfessionalNotifications(payload, metadata);
      
      this.processedCount++;
      const duration = Date.now() - startTime;
      
      console.log(`🌍 [${this.name}] PROFESSIONAL_VERIFIED processed (${duration}ms):`, {
        professionalId: payload.professionalId,
        processedCount: this.processedCount
      });
      
    } catch (error) {
      this.errorCount++;
      console.error(`🌍 [${this.name}] Error processing PROFESSIONAL_VERIFIED:`, error.message);
      
      console.error(`🌍 [${this.name}] Error details:`, {
        professionalId: payload.professionalId,
        error: error.message,
        stack: error.stack,
        metadata
      });
    }
  }

  // Location analytics processing
  async processLocationAnalytics(payload, metadata) {
    try {
      const locationMetrics = {
        professionalId: payload.professionalId,
        location: payload.location,
        previousLocation: payload.previousLocation,
        distance: this.calculateDistance(payload.previousLocation, payload.location),
        source: metadata.source || 'api',
        timestamp: new Date().toISOString()
      };
      
      console.log(`🌍 [${this.name}] Analytics: Professional location updated`);
      
      if (locationMetrics.distance) {
        console.log(`🌍 [${this.name}] Analytics: Distance moved: ${locationMetrics.distance.toFixed(2)}km`);
      }
      
      // In real implementation, this would send to analytics service
      console.log(`🌍 [${this.name}] Would send location analytics:`, locationMetrics);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 40));
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Location analytics error:`, error.message);
    }
  }

  // Real-time updates processing
  async processRealTimeUpdates(payload, metadata) {
    try {
      console.log(`🌍 [${this.name}] Real-time: Broadcasting location update`);
      
      // Broadcast to connected clients
      const broadcastData = {
        professionalId: payload.professionalId,
        location: payload.location,
        timestamp: new Date().toISOString(),
        source: 'geo-worker'
      };
      
      console.log(`🌍 [${this.name}] Would broadcast to real-time clients:`, broadcastData);
      
      // Update professional availability based on location
      await this.updateProfessionalAvailability(payload, metadata);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 30));
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Real-time updates error:`, error.message);
    }
  }

  // Geospatial indexing processing
  async processGeospatialIndexing(payload, metadata) {
    try {
      console.log(`🌍 [${this.name}] Geospatial: Updating location index`);
      
      // Update geospatial index
      const indexData = {
        professionalId: payload.professionalId,
        coordinates: [payload.location.lng, payload.location.lat], // GeoJSON format [lng, lat]
        timestamp: new Date().toISOString()
      };
      
      console.log(`🌍 [${this.name}] Would update geospatial index:`, indexData);
      
      // Update nearby professionals cache
      await this.updateNearbyProfessionalsCache(payload, metadata);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 60));
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Geospatial indexing error:`, error.message);
    }
  }

  // Location business logic processing
  async processLocationBusinessLogic(payload, metadata) {
    try {
      console.log(`🌍 [${this.name}] Business: Processing location business logic`);
      
      // Update professional statistics
      await this.updateProfessionalLocationStats(payload, metadata);
      
      // Check for service area changes
      await this.checkServiceAreaChanges(payload, metadata);
      
      // Update professional ranking based on location activity
      await this.updateProfessionalRanking(payload, metadata);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 80));
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Location business logic error:`, error.message);
    }
  }

  // Location notification processing
  async processLocationNotifications(payload, metadata) {
    try {
      console.log(`🌍 [${this.name}] Notifications: Processing location notifications`);
      
      // Notify nearby users of professional availability
      await this.notifyNearbyUsers(payload, metadata);
      
      // Update professional status notifications
      await this.updateProfessionalStatusNotifications(payload, metadata);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Location notifications error:`, error.message);
    }
  }

  // Professional indexing processing
  async processProfessionalIndexing(payload, metadata) {
    try {
      console.log(`🌍 [${this.name}] Indexing: Adding new professional to geospatial index`);
      
      const indexData = {
        professionalId: payload.professionalId,
        businessName: payload.businessName,
        profession: payload.profession,
        coordinates: payload.location ? [payload.location.lng, payload.location.lat] : null,
        isActive: payload.isActive !== false,
        timestamp: new Date().toISOString()
      };
      
      console.log(`🌍 [${this.name}] Would add to geospatial index:`, indexData);
      
      // Initialize professional location statistics
      await this.initializeProfessionalLocationStats(payload, metadata);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 70));
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Professional indexing error:`, error.message);
    }
  }

  // Professional location analytics processing
  async processProfessionalLocationAnalytics(payload, metadata) {
    try {
      const locationAnalytics = {
        professionalId: payload.professionalId,
        businessName: payload.businessName,
        profession: payload.profession,
        initialLocation: payload.location,
        registrationDate: new Date().toISOString(),
        source: metadata.source || 'api'
      };
      
      console.log(`🌍 [${this.name}] Analytics: Professional registered with location`);
      
      // In real implementation, this would send to analytics service
      console.log(`🌍 [${this.name}] Would send professional location analytics:`, locationAnalytics);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 40));
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Professional location analytics error:`, error.message);
    }
  }

  // Professional business logic processing
  async processProfessionalBusinessLogic(payload, metadata) {
    try {
      console.log(`🌍 [${this.name}] Business: Processing new professional business logic`);
      
      // Update professional statistics
      await this.updateProfessionalRegistrationStats(payload, metadata);
      
      // Check for nearby professionals for recommendations
      await this.findNearbyProfessionals(payload, metadata);
      
      // Initialize professional ranking
      await this.initializeProfessionalRanking(payload, metadata);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 90));
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Professional business logic error:`, error.message);
    }
  }

  // Verified professional indexing processing
  async processVerifiedProfessionalIndexing(payload, metadata) {
    try {
      console.log(`🌍 [${this.name}] Indexing: Updating verified professional in geospatial index`);
      
      const indexUpdate = {
        professionalId: payload.professionalId,
        isVerified: true,
        verificationDate: payload.verificationDate,
        timestamp: new Date().toISOString()
      };
      
      console.log(`🌍 [${this.name}] Would update geospatial index for verified professional:`, indexUpdate);
      
      // Boost professional ranking in search results
      await this.boostVerifiedProfessionalRanking(payload, metadata);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Verified professional indexing error:`, error.message);
    }
  }

  // Verified professional business logic processing
  async processVerifiedProfessionalBusinessLogic(payload, metadata) {
    try {
      console.log(`🌍 [${this.name}] Business: Processing verified professional business logic`);
      
      // Update professional verification statistics
      await this.updateVerificationStats(payload, metadata);
      
      // Notify users about newly verified professional
      await this.notifyUsersAboutVerifiedProfessional(payload, metadata);
      
      // Update professional search ranking
      await this.updateVerifiedProfessionalSearchRanking(payload, metadata);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 80));
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Verified professional business logic error:`, error.message);
    }
  }

  // Verified professional notification processing
  async processVerifiedProfessionalNotifications(payload, metadata) {
    try {
      console.log(`🌍 [${this.name}] Notifications: Processing verified professional notifications`);
      
      // Send verification confirmation to professional
      await this.sendVerificationConfirmation(payload, metadata);
      
      // Notify users who saved this professional
      await this.notifySavedUsers(payload, metadata);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 60));
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Verified professional notifications error:`, error.message);
    }
  }

  // Helper methods
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

  async updateProfessionalAvailability(payload, metadata) {
    try {
      console.log(`🌍 [${this.name}] Business: Updating availability for professional ${payload.professionalId}`);
      
      // In real implementation, this would update database records
      console.log(`🌍 [${this.name}] Would update professional availability:`, payload.professionalId);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 30));
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Update availability error:`, error.message);
    }
  }

  async updateNearbyProfessionalsCache(payload, metadata) {
    try {
      console.log(`🌍 [${this.name}] Cache: Updating nearby professionals cache`);
      
      // In real implementation, this would update Redis cache
      console.log(`🌍 [${this.name}] Would update nearby professionals cache around:`, payload.location);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 40));
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Update nearby cache error:`, error.message);
    }
  }

  async updateProfessionalLocationStats(payload, metadata) {
    try {
      console.log(`🌍 [${this.name}] Stats: Updating location statistics for professional ${payload.professionalId}`);
      
      // In real implementation, this would update database records
      console.log(`🌍 [${this.name}] Would update location stats:`, payload.professionalId);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 35));
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Update location stats error:`, error.message);
    }
  }

  async checkServiceAreaChanges(payload, metadata) {
    try {
      console.log(`🌍 [${this.name}] Business: Checking service area changes`);
      
      // In real implementation, this would check if location affects service area
      console.log(`🌍 [${this.name}] Would check service area changes for:`, payload.professionalId);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 25));
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Check service area error:`, error.message);
    }
  }

  async updateProfessionalRanking(payload, metadata) {
    try {
      console.log(`🌍 [${this.name}] Ranking: Updating professional ranking based on location activity`);
      
      // In real implementation, this would update search ranking
      console.log(`🌍 [${this.name}] Would update ranking for:`, payload.professionalId);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 45));
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Update ranking error:`, error.message);
    }
  }

  async notifyNearbyUsers(payload, metadata) {
    try {
      console.log(`🌍 [${this.name}] Notifications: Notifying nearby users of professional availability`);
      
      // In real implementation, this would find and notify nearby users
      console.log(`🌍 [${this.name}] Would notify nearby users around:`, payload.location);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 55));
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Notify nearby users error:`, error.message);
    }
  }

  async updateProfessionalStatusNotifications(payload, metadata) {
    try {
      console.log(`🌍 [${this.name}] Notifications: Updating professional status notifications`);
      
      // In real implementation, this would update status notifications
      console.log(`🌍 [${this.name}] Would update status notifications for:`, payload.professionalId);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 30));
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Update status notifications error:`, error.message);
    }
  }

  async initializeProfessionalLocationStats(payload, metadata) {
    try {
      console.log(`🌍 [${this.name}] Stats: Initializing location statistics for new professional`);
      
      // In real implementation, this would initialize stats in database
      console.log(`🌍 [${this.name}] Would initialize location stats for:`, payload.professionalId);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 40));
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Initialize location stats error:`, error.message);
    }
  }

  async updateProfessionalRegistrationStats(payload, metadata) {
    try {
      console.log(`🌍 [${this.name}] Stats: Updating registration statistics`);
      
      // In real implementation, this would update registration stats
      console.log(`🌍 [${this.name}] Would update registration stats for:`, payload.professionalId);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 35));
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Update registration stats error:`, error.message);
    }
  }

  async findNearbyProfessionals(payload, metadata) {
    try {
      console.log(`🌍 [${this.name}] Business: Finding nearby professionals for recommendations`);
      
      // In real implementation, this would find nearby professionals
      console.log(`🌍 [${this.name}] Would find nearby professionals around:`, payload.location);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 60));
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Find nearby professionals error:`, error.message);
    }
  }

  async initializeProfessionalRanking(payload, metadata) {
    try {
      console.log(`🌍 [${this.name}] Ranking: Initializing professional ranking`);
      
      // In real implementation, this would initialize ranking
      console.log(`🌍 [${this.name}] Would initialize ranking for:`, payload.professionalId);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 45));
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Initialize ranking error:`, error.message);
    }
  }

  async boostVerifiedProfessionalRanking(payload, metadata) {
    try {
      console.log(`🌍 [${this.name}] Ranking: Boosting verified professional ranking`);
      
      // In real implementation, this would boost ranking in search results
      console.log(`🌍 [${this.name}] Would boost ranking for verified:`, payload.professionalId);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 30));
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Boost ranking error:`, error.message);
    }
  }

  async updateVerificationStats(payload, metadata) {
    try {
      console.log(`🌍 [${this.name}] Stats: Updating verification statistics`);
      
      // In real implementation, this would update verification stats
      console.log(`🌍 [${this.name}] Would update verification stats for:`, payload.professionalId);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 35));
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Update verification stats error:`, error.message);
    }
  }

  async notifyUsersAboutVerifiedProfessional(payload, metadata) {
    try {
      console.log(`🌍 [${this.name}] Notifications: Notifying users about verified professional`);
      
      // In real implementation, this would notify users who saved this professional
      console.log(`🌍 [${this.name}] Would notify users about verified:`, payload.professionalId);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Notify users error:`, error.message);
    }
  }

  async updateVerifiedProfessionalSearchRanking(payload, metadata) {
    try {
      console.log(`🌍 [${this.name}] Search: Updating verified professional search ranking`);
      
      // In real implementation, this would update search ranking
      console.log(`🌍 [${this.name}] Would update search ranking for verified:`, payload.professionalId);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 40));
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Update search ranking error:`, error.message);
    }
  }

  async sendVerificationConfirmation(payload, metadata) {
    try {
      console.log(`🌍 [${this.name}] Notifications: Sending verification confirmation`);
      
      // In real implementation, this would send email/SMS confirmation
      console.log(`🌍 [${this.name}] Would send verification confirmation to:`, payload.professionalId);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 80));
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Send verification confirmation error:`, error.message);
    }
  }

  async notifySavedUsers(payload, metadata) {
    try {
      console.log(`🌍 [${this.name}] Notifications: Notifying users who saved this professional`);
      
      // In real implementation, this would find and notify users who saved this professional
      console.log(`🌍 [${this.name}] Would notify saved users for:`, payload.professionalId);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 70));
      
    } catch (error) {
      console.error(`🌍 [${this.name}] Notify saved users error:`, error.message);
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
      console.log(`🌍 [${this.name}] ${signal} received, shutting down gracefully...`);
      
      this.isRunning = false;
      
      // Wait for current processing to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`🌍 [${this.name}] Final stats:`, this.getStats());
      console.log(`🌍 [${this.name}] Shutdown completed`);
      
      process.exit(0);
    };
    
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }
}

// Create and start worker if this file is run directly
if (require.main === module) {
  const geoWorker = new GeoWorker();
  
  geoWorker.start().then(success => {
    if (success) {
      console.log('🌍 Geo worker started successfully');
      
      // Periodic stats reporting
      setInterval(() => {
        console.log('🌍 Geo Worker Stats:', geoWorker.getStats());
      }, 60000); // Every minute
    } else {
      console.error('🌍 Failed to start geo worker');
      process.exit(1);
    }
  });
}

module.exports = {
  GeoWorker
};
