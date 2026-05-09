// Booking Lock Service - Soft Global Lock Implementation
// Implementa Soft Global Lock + Event Versioning para consistencia distribuida

console.log("🔒 Booking Lock Service - Soft Global Lock Implementation");

const { v4: uuidv4 } = require('uuid');
const Booking = require('../models/Booking');
const { eventSystem } = require('../events');
const { BOOKING_EVENTS } = require('../events/eventTypes');

class BookingLockService {
  constructor() {
    this.name = 'booking-lock-service';
    this.lockTTL = 10; // 10 seconds default TTL
    this.maxRetries = 3;
    this.retryDelay = 1000;
    
    // Idempotency cache (in production, use Redis)
    this.idempotencyCache = new Map();
    this.idempotencyCacheMaxSize = 1000;
  }

  /**
   * Create booking with Soft Global Lock
   * Flujo principal para evitar doble booking
   */
  async createBookingWithLock(bookingData, metadata = {}) {
    const startTime = Date.now();
    const lockId = uuidv4();
    const requestId = metadata.requestId || uuidv4();
    
    try {
      console.log(`🔒 [${this.name}] Creating booking with lock:`, {
        professionalId: bookingData.professional,
        date: bookingData.date,
        lockId,
        requestId
      });

      // Step 1: Check idempotency
      const existingBooking = await this.checkIdempotency(requestId);
      if (existingBooking) {
        console.log(`🔒 [${this.name}] Idempotency hit - returning existing booking:`, existingBooking._id);
        return {
          success: true,
          booking: existingBooking,
          idempotency: true,
          duration: Date.now() - startTime
        };
      }

      // Step 2: Atomic booking creation with lock
      const booking = await Booking.atomicCreateBooking(bookingData, lockId);
      
      // Step 3: Store idempotency mapping
      await this.storeIdempotency(requestId, booking._id);
      
      // Step 4: Emit versioned event
      const event = this.createVersionedEvent(booking, 'BOOKING_CREATED', metadata);
      await eventSystem.emitBookingCreated(
        booking._id,
        booking.user,
        booking.professional,
        booking.service,
        booking.date,
        booking.price,
        { ...metadata, lockId, requestId, event }
      );
      
      console.log(`🔒 [${this.name}] Booking created with lock:`, {
        bookingId: booking._id,
        lockId,
        status: booking.status,
        duration: Date.now() - startTime
      });
      
      return {
        success: true,
        booking,
        lockId,
        requestId,
        idempotency: false,
        duration: Date.now() - startTime
      };
      
    } catch (error) {
      console.error(`🔒 [${this.name}] Failed to create booking with lock:`, error.message);
      
      // Clean up idempotency cache on error
      this.idempotencyCache.delete(requestId);
      
      return {
        success: false,
        error: error.message,
        lockId,
        requestId,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Confirm booking (release lock)
   */
  async confirmBooking(bookingId, metadata = {}) {
    const startTime = Date.now();
    
    try {
      console.log(`🔒 [${this.name}] Confirming booking:`, { bookingId });
      
      const booking = await Booking.findById(bookingId);
      
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      if (!booking.canTransitionTo('confirmed')) {
        throw new Error(`Cannot confirm booking from status: ${booking.status}`);
      }
      
      // Confirm booking (releases lock automatically)
      await booking.confirm();
      
      // Emit versioned event
      const event = this.createVersionedEvent(booking, 'BOOKING_CONFIRMED', metadata);
      await eventSystem.emitBookingUpdated(
        booking._id,
        booking.user,
        booking.professional,
        booking.status,
        'confirmed',
        { ...metadata, event }
      );
      
      console.log(`🔒 [${this.name}] Booking confirmed:`, {
        bookingId,
        newStatus: booking.status,
        version: booking.version,
        duration: Date.now() - startTime
      });
      
      return {
        success: true,
        booking,
        duration: Date.now() - startTime
      };
      
    } catch (error) {
      console.error(`🔒 [${this.name}] Failed to confirm booking:`, error.message);
      
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Cancel booking (release lock)
   */
  async cancelBooking(bookingId, reason, metadata = {}) {
    const startTime = Date.now();
    
    try {
      console.log(`🔒 [${this.name}] Cancelling booking:`, { bookingId, reason });
      
      const booking = await Booking.findById(bookingId);
      
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      if (!booking.canTransitionTo('cancelled')) {
        throw new Error(`Cannot cancel booking from status: ${booking.status}`);
      }
      
      // Cancel booking (releases lock automatically)
      await booking.cancel();
      
      // Emit versioned event
      const event = this.createVersionedEvent(booking, 'BOOKING_CANCELLED', metadata);
      await eventSystem.emitBookingCancelled(
        booking._id,
        booking.user,
        booking.professional,
        reason,
        { ...metadata, event }
      );
      
      console.log(`🔒 [${this.name}] Booking cancelled:`, {
        bookingId,
        newStatus: booking.status,
        version: booking.version,
        reason,
        duration: Date.now() - startTime
      });
      
      return {
        success: true,
        booking,
        duration: Date.now() - startTime
      };
      
    } catch (error) {
      console.error(`🔒 [${this.name}] Failed to cancel booking:`, error.message);
      
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Apply versioned event to booking
   */
  async applyVersionedEvent(bookingId, event, metadata = {}) {
    const startTime = Date.now();
    
    try {
      console.log(`🔒 [${this.name}] Applying versioned event:`, {
        bookingId,
        eventType: event.type,
        eventVersion: event.version
      });
      
      // Apply event with version checking
      const result = await Booking.applyEventVersioned(bookingId, event);
      
      if (result.success) {
        console.log(`🔒 [${this.name}] Event applied successfully:`, {
          bookingId,
          eventType: event.type,
          previousVersion: result.previousVersion,
          newVersion: result.newVersion,
          newStatus: result.newStatus,
          duration: Date.now() - startTime
        });
      } else {
        console.warn(`🔒 [${this.name}] Event application failed:`, {
          bookingId,
          eventType: event.type,
          reason: result.reason,
          duration: Date.now() - startTime
        });
      }
      
      return result;
      
    } catch (error) {
      console.error(`🔒 [${this.name}] Failed to apply versioned event:`, error.message);
      
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Check slot availability
   */
  async checkSlotAvailability(professionalId, date, duration = 60) {
    try {
      const isAvailable = await Booking.checkSlotAvailability(professionalId, date, duration);
      
      console.log(`🔒 [${this.name}] Slot availability check:`, {
        professionalId,
        date,
        duration,
        available: isAvailable
      });
      
      return {
        professionalId,
        date,
        duration,
        available: isAvailable
      };
      
    } catch (error) {
      console.error(`🔒 [${this.name}] Failed to check slot availability:`, error.message);
      
      return {
        professionalId,
        date,
        duration,
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Get booking lock status
   */
  async getLockStatus(bookingId) {
    try {
      const booking = await Booking.findById(bookingId);
      
      if (!booking) {
        return { error: 'Booking not found' };
      }
      
      return {
        bookingId,
        status: booking.status,
        isLocked: booking.isLocked(),
        lockId: booking.lockId,
        lockExpiresAt: booking.lockExpiresAt,
        isExpired: booking.isLockExpired(),
        version: booking.version,
        canTransitionTo: {
          confirmed: booking.canTransitionTo('confirmed'),
          cancelled: booking.canTransitionTo('cancelled'),
          completed: booking.canTransitionTo('completed')
        }
      };
      
    } catch (error) {
      console.error(`🔒 [${this.name}] Failed to get lock status:`, error.message);
      
      return { error: error.message };
    }
  }

  /**
   * Create versioned event
   */
  createVersionedEvent(booking, eventType, metadata = {}) {
    const event = {
      eventId: uuidv4(),
      aggregateId: booking._id.toString(),
      aggregateType: 'booking',
      type: eventType,
      version: booking.version + 1,
      timestamp: new Date().toISOString(),
      data: {
        bookingId: booking._id,
        userId: booking.user,
        professionalId: booking.professional,
        service: booking.service,
        date: booking.date,
        price: booking.price,
        status: booking.status
      },
      metadata: {
        source: metadata.source || 'api',
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        requestId: metadata.requestId,
        lockId: booking.lockId,
        ...metadata
      }
    };
    
    return event;
  }

  /**
   * Check idempotency
   */
  async checkIdempotency(requestId) {
    // Check cache first
    const cachedBookingId = this.idempotencyCache.get(requestId);
    if (cachedBookingId) {
      return await Booking.findById(cachedBookingId);
    }
    
    // Check database
    const existingBooking = await Booking.findByRequestId(requestId);
    if (existingBooking) {
      // Cache for future requests
      this.storeIdempotency(requestId, existingBooking._id);
    }
    
    return existingBooking;
  }

  /**
   * Store idempotency mapping
   */
  async storeIdempotency(requestId, bookingId) {
    // Store in cache
    this.idempotencyCache.set(requestId, bookingId);
    
    // Limit cache size
    if (this.idempotencyCache.size > this.idempotencyCacheMaxSize) {
      const firstKey = this.idempotencyCache.keys().next().value;
      this.idempotencyCache.delete(firstKey);
    }
    
    // In production, store in Redis or database
    // For now, just use memory cache
  }

  /**
   * Get lock statistics
   */
  getLockStats() {
    return {
      name: this.name,
      lockTTL: this.lockTTL,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
      idempotencyCacheSize: this.idempotencyCache.size,
      idempotencyCacheMaxSize: this.idempotencyCacheMaxSize,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clean up expired locks
   */
  async cleanupExpiredLocks() {
    try {
      console.log(`🔒 [${this.name}] Cleaning up expired locks...`);
      
      const results = await Booking.cleanupExpiredLocks();
      
      console.log(`🔒 [${this.name}] Cleanup completed:`, {
        cleanedCount: results.length,
        results
      });
      
      return results;
      
    } catch (error) {
      console.error(`🔒 [${this.name}] Failed to cleanup expired locks:`, error.message);
      
      return [];
    }
  }

  /**
   * Get distributed consistency status
   */
  async getConsistencyStatus() {
    try {
      const stats = {
        pendingLocks: 0,
        expiredLocks: 0,
        totalBookings: 0,
        versionConflicts: 0
      };
      
      // Count pending locks
      stats.pendingLocks = await Booking.countDocuments({
        status: 'pending_lock',
        lockExpiresAt: { $gt: new Date() }
      });
      
      // Count expired locks
      stats.expiredLocks = await Booking.countDocuments({
        status: 'pending_lock',
        lockExpiresAt: { $lt: new Date() }
      });
      
      // Count total bookings
      stats.totalBookings = await Booking.countDocuments();
      
      // Check for version conflicts (simplified)
      const recentBookings = await Booking.find({
        updatedAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
      }).select('version eventId');
      
      stats.versionConflicts = recentBookings.filter(b => !b.eventId).length;
      
      return {
        ...stats,
        health: stats.expiredLocks === 0 ? 'healthy' : 'warning',
        recommendations: this.getConsistencyRecommendations(stats),
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`🔒 [${this.name}] Failed to get consistency status:`, error.message);
      
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get consistency recommendations
   */
  getConsistencyRecommendations(stats) {
    const recommendations = [];
    
    if (stats.expiredLocks > 0) {
      recommendations.push({
        type: 'warning',
        message: `${stats.expiredLocks} expired locks found - run cleanup`,
        action: 'Call cleanupExpiredLocks()'
      });
    }
    
    if (stats.versionConflicts > 0) {
      recommendations.push({
        type: 'error',
        message: `${stats.versionConflicts} bookings without eventId - version conflicts possible`,
        action: 'Check event ordering and versioning'
      });
    }
    
    if (stats.pendingLocks > 100) {
      recommendations.push({
        type: 'warning',
        message: `High number of pending locks (${stats.pendingLocks}) - possible system overload`,
        action: 'Check system performance and lock TTL'
      });
    }
    
    return recommendations;
  }
}

// Create singleton instance
const bookingLockService = new BookingLockService();

module.exports = {
  BookingLockService,
  bookingLockService
};
