// Notification Listener - Event-Driven Architecture
// Handles notification events without blocking main flow

console.log("📬 Notification Listener - Event-Driven Architecture");

class NotificationListener {
  constructor() {
    this.name = "notification-listener";
    this.notificationQueue = [];
    this.processingNotifications = false;
  }

  // Handle user registration notification
  async handleUserRegistered(data, metadata) {
    try {
      const { userId, email, name, location } = data;
      
      console.log(`📬 [notification] USER_REGISTERED:`, {
        userId,
        email: email ? email.substring(0, 3) + '***' : 'N/A',
        name: name || 'N/A',
        location: location || 'N/A',
        timestamp: new Date().toISOString(),
        source: metadata.source || 'unknown'
      });

      // Queue notification for processing
      this.queueNotification({
        type: 'welcome_email',
        recipient: email,
        userId,
        data: {
          name,
          location,
          registrationDate: new Date().toISOString()
        },
        priority: 'normal'
      });

      // In real implementation, this would send actual email
      // await this.sendWelcomeEmail(email, name, location);
      
    } catch (error) {
      console.error(`❌ [notification] Error in USER_REGISTERED handler:`, error);
      throw error;
    }
  }

  // Handle user login notification
  async handleUserLoggedIn(data, metadata) {
    try {
      const { userId, email, rememberMe } = data;
      
      console.log(`📬 [notification] USER_LOGGED_IN:`, {
        userId,
        email: email ? email.substring(0, 3) + '***' : 'N/A',
        rememberMe: rememberMe || false,
        timestamp: new Date().toISOString(),
        source: metadata.source || 'unknown'
      });

      // Only send notification for suspicious logins or important events
      // For now, just log - in real system might send security notifications
      if (this.isSuspiciousLogin(data, metadata)) {
        this.queueNotification({
          type: 'security_alert',
          recipient: email,
          userId,
          data: {
            loginTime: new Date().toISOString(),
            suspiciousReason: this.getSuspiciousReason(data, metadata)
          },
          priority: 'high'
        });
      }

      // In real implementation, this might send security notifications
      // if (this.isSuspiciousLogin(data, metadata)) {
      //   await this.sendSecurityAlert(email, data);
      // }
      
    } catch (error) {
      console.error(`❌ [notification] Error in USER_LOGGED_IN handler:`, error);
      throw error;
    }
  }

  // Handle booking created notification
  async handleBookingCreated(data, metadata) {
    try {
      const { bookingId, userId, professionalId, service, date, price } = data;
      
      console.log(`📬 [notification] BOOKING_CREATED:`, {
        bookingId,
        userId,
        professionalId,
        service: service || 'N/A',
        date: date || 'N/A',
        price: price || 'N/A',
        timestamp: new Date().toISOString(),
        source: metadata.source || 'unknown'
      });

      // Queue notifications for both user and professional
      this.queueNotification({
        type: 'booking_confirmation_user',
        recipient: 'user', // Would resolve to actual user email
        userId,
        data: {
          bookingId,
          service,
          date,
          price
        },
        priority: 'normal'
      });

      this.queueNotification({
        type: 'booking_notification_professional',
        recipient: 'professional', // Would resolve to professional email
        professionalId,
        data: {
          bookingId,
          service,
          date,
          price
        },
        priority: 'normal'
      });

      // In real implementation, this would send actual emails
      // await this.sendBookingConfirmationToUser(userId, bookingData);
      // await this.sendBookingNotificationToProfessional(professionalId, bookingData);
      
    } catch (error) {
      console.error(`❌ [notification] Error in BOOKING_CREATED handler:`, error);
      throw error;
    }
  }

  // Handle booking updated notification
  async handleBookingUpdated(data, metadata) {
    try {
      const { bookingId, userId, professionalId, previousStatus, newStatus } = data;
      
      console.log(`📬 [notification] BOOKING_UPDATED:`, {
        bookingId,
        userId,
        professionalId,
        previousStatus,
        newStatus,
        timestamp: new Date().toISOString(),
        source: metadata.source || 'unknown'
      });

      // Only send notifications for important status changes
      if (this.isImportantStatusChange(previousStatus, newStatus)) {
        this.queueNotification({
          type: 'booking_status_change',
          recipient: 'both', // Send to both user and professional
          userId,
          professionalId,
          data: {
            bookingId,
            previousStatus,
            newStatus,
            changeTime: new Date().toISOString()
          },
          priority: this.getStatusChangePriority(previousStatus, newStatus)
        });
      }

      // In real implementation, this would send actual emails
      // if (this.isImportantStatusChange(previousStatus, newStatus)) {
      //   await this.sendBookingStatusChange(userId, professionalId, data);
      // }
      
    } catch (error) {
      console.error(`❌ [notification] Error in BOOKING_UPDATED handler:`, error);
      throw error;
    }
  }

  // Handle booking cancelled notification
  async handleBookingCancelled(data, metadata) {
    try {
      const { bookingId, userId, professionalId, reason } = data;
      
      console.log(`📬 [notification] BOOKING_CANCELLED:`, {
        bookingId,
        userId,
        professionalId,
        reason: reason || 'N/A',
        timestamp: new Date().toISOString(),
        source: metadata.source || 'unknown'
      });

      // Queue notifications for both user and professional
      this.queueNotification({
        type: 'booking_cancellation_user',
        recipient: 'user',
        userId,
        data: {
          bookingId,
          reason,
          cancellationTime: new Date().toISOString()
        },
        priority: 'normal'
      });

      this.queueNotification({
        type: 'booking_cancellation_professional',
        recipient: 'professional',
        professionalId,
        data: {
          bookingId,
          reason,
          cancellationTime: new Date().toISOString()
        },
        priority: 'normal'
      });

      // In real implementation, this would send actual emails
      // await this.sendBookingCancellationToUser(userId, bookingData);
      // await this.sendBookingCancellationToProfessional(professionalId, bookingData);
      
    } catch (error) {
      console.error(`❌ [notification] Error in BOOKING_CANCELLED handler:`, error);
      throw error;
    }
  }

  // Handle professional location updated notification
  async handleProfessionalLocationUpdated(data, metadata) {
    try {
      const { professionalId, location, previousLocation } = data;
      
      console.log(`📬 [notification] PROFESSIONAL_LOCATION_UPDATED:`, {
        professionalId,
        location: location ? `${location.lat}, ${location.lng}` : 'N/A',
        previousLocation: previousLocation ? `${previousLocation.lat}, ${previousLocation.lng}` : 'N/A',
        timestamp: new Date().toISOString(),
        source: metadata.source || 'unknown'
      });

      // Location updates typically don't trigger notifications
      // But we might want to notify nearby users or track professional activity
      
      // In real implementation, this might trigger location-based notifications
      // await this.notifyNearbyUsers(professionalId, location);
      
    } catch (error) {
      console.error(`❌ [notification] Error in PROFESSIONAL_LOCATION_UPDATED handler:`, error);
      throw error;
    }
  }

  // Handle system error notification
  async handleSystemError(data, metadata) {
    try {
      const { error, errorType, service, userId, requestId } = data;
      
      console.log(`📬 [notification] SYSTEM_ERROR:`, {
        errorType: errorType || 'UNKNOWN',
        service: service || 'unknown',
        userId: userId || 'N/A',
        requestId: requestId || 'N/A',
        error: error ? error.substring(0, 100) : 'N/A',
        timestamp: new Date().toISOString(),
        source: metadata.source || 'unknown'
      });

      // Queue critical error notifications
      if (this.isCriticalError(errorType, service)) {
        this.queueNotification({
          type: 'system_error_alert',
          recipient: 'admin', // Send to admin team
          data: {
            errorType,
            service,
            error,
            requestId,
            timestamp: new Date().toISOString()
          },
          priority: 'critical'
        });
      }

      // In real implementation, this would send alerts to admin team
      // if (this.isCriticalError(errorType, service)) {
      //   await this.sendSystemErrorAlert(data);
      // }
      
    } catch (error) {
      console.error(`❌ [notification] Error in SYSTEM_ERROR handler:`, error);
      throw error;
    }
  }

  // Queue notification for processing
  queueNotification(notification) {
    this.notificationQueue.push({
      ...notification,
      queuedAt: Date.now()
    });
    
    console.log(`📬 [notification] QUEUED: ${notification.type} for ${notification.recipient}`);
    
    // Start processing if not already processing
    if (!this.processingNotifications) {
      this.processNotificationQueue();
    }
  }

  // Process notification queue asynchronously
  async processNotificationQueue() {
    if (this.processingNotifications) return;
    
    this.processingNotifications = true;
    
    try {
      while (this.notificationQueue.length > 0) {
        const notification = this.notificationQueue.shift();
        await this.processNotification(notification);
      }
    } catch (error) {
      console.error('❌ [notification] Queue processing error:', error);
    } finally {
      this.processingNotifications = false;
    }
  }

  // Process individual notification
  async processNotification(notification) {
    try {
      console.log(`📬 [notification] PROCESSING: ${notification.type} for ${notification.recipient}`);
      
      // In real implementation, this would send actual notifications
      // For now, just simulate sending
      await this.sendNotification(notification);
      
      console.log(`📬 [notification] SENT: ${notification.type} for ${notification.recipient}`);
      
    } catch (error) {
      console.error(`❌ [notification] Error processing notification:`, error);
      // In real system, might retry or move to dead letter queue
    }
  }

  // Send notification (mock implementation)
  async sendNotification(notification) {
    // Simulate sending delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // In real implementation, this would use email service, SMS service, push notifications, etc.
    console.log(`📬 [notification] Would send ${notification.type} to ${notification.recipient}`);
  }

  // Helper methods for notification logic
  isSuspiciousLogin(data, metadata) {
    // Simple suspicious login detection
    const { rememberMe } = data;
    const { ip, userAgent } = metadata;
    
    // Suspicious if login from new location/device without remember me
    return !rememberMe && (ip !== 'known' || userAgent !== 'known');
  }

  getSuspiciousReason(data, metadata) {
    const reasons = [];
    
    if (!data.rememberMe) {
      reasons.push('no_remember_me');
    }
    
    if (metadata.ip !== 'known') {
      reasons.push('new_ip');
    }
    
    if (metadata.userAgent !== 'known') {
      reasons.push('new_device');
    }
    
    return reasons.join(', ') || 'unknown';
  }

  isImportantStatusChange(previousStatus, newStatus) {
    const importantChanges = [
      { from: 'pending', to: 'confirmed' },
      { from: 'confirmed', to: 'cancelled' },
      { from: 'confirmed', to: 'completed' },
      { from: 'pending', to: 'cancelled' }
    ];
    
    return importantChanges.some(change => 
      change.from === previousStatus && change.to === newStatus
    );
  }

  getStatusChangePriority(previousStatus, newStatus) {
    const highPriorityChanges = [
      { from: 'confirmed', to: 'cancelled' },
      { from: 'confirmed', to: 'completed' }
    ];
    
    return highPriorityChanges.some(change => 
      change.from === previousStatus && change.to === newStatus
    ) ? 'high' : 'normal';
  }

  isCriticalError(errorType, service) {
    const criticalErrors = ['DATABASE_ERROR', 'AUTHENTICATION_ERROR', 'PAYMENT_ERROR'];
    const criticalServices = ['auth-service', 'payment-service'];
    
    return criticalErrors.includes(errorType) || criticalServices.includes(service);
  }

  // Get notification statistics
  getStats() {
    const stats = {
      queueSize: this.notificationQueue.length,
      isProcessing: this.processingNotifications,
      timestamp: new Date().toISOString()
    };

    console.log(`📬 [notification] Current Stats:`, stats);
    return stats;
  }

  // Reset notification queue
  reset() {
    this.notificationQueue = [];
    this.processingNotifications = false;
    console.log(`📬 [notification] Notification queue reset`);
  }
}

// Create singleton instance
const notificationListener = new NotificationListener();

// Export the listener and instance
module.exports = {
  NotificationListener,
  notificationListener
};
