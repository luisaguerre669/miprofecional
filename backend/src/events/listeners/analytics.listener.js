// Analytics Listener - Event-Driven Architecture
// Handles analytics events without blocking main flow

console.log("📊 Analytics Listener - Event-Driven Architecture");

class AnalyticsListener {
  constructor() {
    this.name = "analytics-listener";
    this.eventCounts = new Map();
    this.sessionData = new Map();
  }

  // Handle user registration analytics
  async handleUserRegistered(data, metadata) {
    try {
      const { userId, email, name, phone, location } = data;
      
      console.log(`📊 [analytics] USER_REGISTERED:`, {
        userId,
        email: email ? email.substring(0, 3) + '***' : 'N/A',
        name: name || 'N/A',
        location: location || 'N/A',
        timestamp: new Date().toISOString(),
        source: metadata.source || 'unknown'
      });

      // Increment registration count
      this.incrementEventCount('USER_REGISTERED');
      
      // Store session analytics
      this.sessionData.set(userId, {
        registeredAt: new Date().toISOString(),
        registrationSource: metadata.source,
        location: location
      });

      // In real implementation, this would send to analytics service
      // await this.sendToAnalyticsService('user_registered', data, metadata);
      
    } catch (error) {
      console.error(`❌ [analytics] Error in USER_REGISTERED handler:`, error);
      throw error;
    }
  }

  // Handle user login analytics
  async handleUserLoggedIn(data, metadata) {
    try {
      const { userId, email, rememberMe } = data;
      
      console.log(`📊 [analytics] USER_LOGGED_IN:`, {
        userId,
        email: email ? email.substring(0, 3) + '***' : 'N/A',
        rememberMe: rememberMe || false,
        timestamp: new Date().toISOString(),
        source: metadata.source || 'unknown'
      });

      // Increment login count
      this.incrementEventCount('USER_LOGGED_IN');
      
      // Update session data
      const existingSession = this.sessionData.get(userId) || {};
      this.sessionData.set(userId, {
        ...existingSession,
        lastLoginAt: new Date().toISOString(),
        loginCount: (existingSession.loginCount || 0) + 1,
        loginSource: metadata.source
      });

      // In real implementation, this would send to analytics service
      // await this.sendToAnalyticsService('user_logged_in', data, metadata);
      
    } catch (error) {
      console.error(`❌ [analytics] Error in USER_LOGGED_IN handler:`, error);
      throw error;
    }
  }

  // Handle booking created analytics
  async handleBookingCreated(data, metadata) {
    try {
      const { bookingId, userId, professionalId, service, date, price } = data;
      
      console.log(`📊 [analytics] BOOKING_CREATED:`, {
        bookingId,
        userId,
        professionalId,
        service: service || 'N/A',
        date: date || 'N/A',
        price: price || 'N/A',
        timestamp: new Date().toISOString(),
        source: metadata.source || 'unknown'
      });

      // Increment booking count
      this.incrementEventCount('BOOKING_CREATED');
      
      // Track booking metrics
      this.incrementEventCount(`BOOKING_${service?.toUpperCase() || 'UNKNOWN'}`);
      
      // In real implementation, this would send to analytics service
      // await this.sendToAnalyticsService('booking_created', data, metadata);
      
    } catch (error) {
      console.error(`❌ [analytics] Error in BOOKING_CREATED handler:`, error);
      throw error;
    }
  }

  // Handle booking updated analytics
  async handleBookingUpdated(data, metadata) {
    try {
      const { bookingId, userId, professionalId, previousStatus, newStatus } = data;
      
      console.log(`📊 [analytics] BOOKING_UPDATED:`, {
        bookingId,
        userId,
        professionalId,
        previousStatus,
        newStatus,
        timestamp: new Date().toISOString(),
        source: metadata.source || 'unknown'
      });

      // Increment update count
      this.incrementEventCount('BOOKING_UPDATED');
      
      // Track status changes
      this.incrementEventCount(`BOOKING_STATUS_${previousStatus}_TO_${newStatus}`);
      
      // In real implementation, this would send to analytics service
      // await this.sendToAnalyticsService('booking_updated', data, metadata);
      
    } catch (error) {
      console.error(`❌ [analytics] Error in BOOKING_UPDATED handler:`, error);
      throw error;
    }
  }

  // Handle booking cancelled analytics
  async handleBookingCancelled(data, metadata) {
    try {
      const { bookingId, userId, professionalId, reason } = data;
      
      console.log(`📊 [analytics] BOOKING_CANCELLED:`, {
        bookingId,
        userId,
        professionalId,
        reason: reason || 'N/A',
        timestamp: new Date().toISOString(),
        source: metadata.source || 'unknown'
      });

      // Increment cancellation count
      this.incrementEventCount('BOOKING_CANCELLED');
      
      // Track cancellation reasons
      if (reason) {
        this.incrementEventCount(`BOOKING_CANCELLED_${reason.toUpperCase()}`);
      }
      
      // In real implementation, this would send to analytics service
      // await this.sendToAnalyticsService('booking_cancelled', data, metadata);
      
    } catch (error) {
      console.error(`❌ [analytics] Error in BOOKING_CANCELLED handler:`, error);
      throw error;
    }
  }

  // Handle professional location updated analytics
  async handleProfessionalLocationUpdated(data, metadata) {
    try {
      const { professionalId, location, previousLocation } = data;
      
      console.log(`📊 [analytics] PROFESSIONAL_LOCATION_UPDATED:`, {
        professionalId,
        location: location ? `${location.lat}, ${location.lng}` : 'N/A',
        previousLocation: previousLocation ? `${previousLocation.lat}, ${previousLocation.lng}` : 'N/A',
        timestamp: new Date().toISOString(),
        source: metadata.source || 'unknown'
      });

      // Increment location update count
      this.incrementEventCount('PROFESSIONAL_LOCATION_UPDATED');
      
      // Track professional activity
      this.incrementEventCount(`PROFESSIONAL_${professionalId}_LOCATION_UPDATES`);
      
      // In real implementation, this would send to analytics service
      // await this.sendToAnalyticsService('professional_location_updated', data, metadata);
      
    } catch (error) {
      console.error(`❌ [analytics] Error in PROFESSIONAL_LOCATION_UPDATED handler:`, error);
      throw error;
    }
  }

  // Handle system error analytics
  async handleSystemError(data, metadata) {
    try {
      const { error, errorType, service, userId, requestId } = data;
      
      console.log(`📊 [analytics] SYSTEM_ERROR:`, {
        errorType: errorType || 'UNKNOWN',
        service: service || 'unknown',
        userId: userId || 'N/A',
        requestId: requestId || 'N/A',
        error: error ? error.substring(0, 100) : 'N/A',
        timestamp: new Date().toISOString(),
        source: metadata.source || 'unknown'
      });

      // Increment error count
      this.incrementEventCount('SYSTEM_ERROR');
      
      // Track errors by type
      this.incrementEventCount(`ERROR_${errorType?.toUpperCase() || 'UNKNOWN'}`);
      
      // Track errors by service
      this.incrementEventCount(`ERROR_${service?.toUpperCase() || 'UNKNOWN'}`);
      
      // In real implementation, this would send to analytics service
      // await this.sendToAnalyticsService('system_error', data, metadata);
      
    } catch (error) {
      console.error(`❌ [analytics] Error in SYSTEM_ERROR handler:`, error);
      throw error;
    }
  }

  // Helper method to increment event counts
  incrementEventCount(eventType) {
    const current = this.eventCounts.get(eventType) || 0;
    this.eventCounts.set(eventType, current + 1);
  }

  // Get analytics statistics
  getStats() {
    const stats = {
      totalEvents: Array.from(this.eventCounts.values()).reduce((a, b) => a + b, 0),
      eventCounts: Object.fromEntries(this.eventCounts),
      activeSessions: this.sessionData.size,
      timestamp: new Date().toISOString()
    };

    console.log(`📊 [analytics] Current Stats:`, stats);
    return stats;
  }

  // Reset analytics data
  reset() {
    this.eventCounts.clear();
    this.sessionData.clear();
    console.log(`📊 [analytics] Analytics data reset`);
  }

  // Mock method for sending to analytics service (would be implemented in real system)
  async sendToAnalyticsService(eventType, data, metadata) {
    // In real implementation, this would send to external analytics service
    // For now, just log that it would be sent
    console.log(`📊 [analytics] Would send to analytics service: ${eventType}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Create singleton instance
const analyticsListener = new AnalyticsListener();

// Export the listener and instance
module.exports = {
  AnalyticsListener,
  analyticsListener
};
