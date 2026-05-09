// Booking Lock Controller - Soft Global Lock API Endpoints
// Implementa endpoints para booking con Soft Global Lock + Event Versioning

console.log("🔒 Booking Lock Controller - Soft Global Lock API Endpoints");

const { bookingLockService } = require('../services/bookingLockService');
const { idempotency, cacheResponse } = require('../middleware/idempotencyMiddleware');

class BookingLockController {
  constructor() {
    this.name = 'booking-lock-controller';
  }

  /**
   * Create booking with Soft Global Lock
   * POST /api/bookings/locked
   */
  async createBookingWithLock(req, res) {
    try {
      console.log(`🔒 [${this.name}] Creating booking with lock:`, {
        userId: req.user?.id,
        professionalId: req.body.professional,
        date: req.body.date,
        requestId: req.idempotency?.key
      });

      // Validate required fields
      const { professional, service, date, price, notes } = req.body;
      
      if (!professional || !service || !date) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: professional, service, date',
          code: 'MISSING_FIELDS'
        });
      }

      // Validate date is in the future
      const bookingDate = new Date(date);
      if (bookingDate <= new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Booking date must be in the future',
          code: 'INVALID_DATE'
        });
      }

      // Create booking with lock
      const result = await bookingLockService.createBookingWithLock({
        user: req.user.id,
        professional,
        service,
        date: bookingDate,
        price: price || 0,
        notes: notes || ''
      }, {
        requestId: req.idempotency?.key,
        source: 'api',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      if (!result.success) {
        return res.status(409).json({
          success: false,
          error: result.error,
          code: 'BOOKING_CREATION_FAILED',
          requestId: result.requestId
        });
      }

      // Return success response
      const response = {
        success: true,
        booking: result.booking,
        lockId: result.lockId,
        requestId: result.requestId,
        idempotency: result.idempotency,
        message: result.idempotency ? 
          'Booking retrieved (idempotent request)' : 
          'Booking created with lock - pending confirmation',
        nextSteps: [
          'Confirm booking to complete reservation',
          'Lock will expire in 10 seconds if not confirmed',
          'Use lockId for subsequent operations'
        ]
      };

      res.status(201).json(response);

    } catch (error) {
      console.error(`🔒 [${this.name}] Failed to create booking with lock:`, error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Confirm booking (release lock)
   * POST /api/bookings/:bookingId/confirm
   */
  async confirmBooking(req, res) {
    try {
      const { bookingId } = req.params;
      
      console.log(`🔒 [${this.name}] Confirming booking:`, {
        bookingId,
        userId: req.user?.id
      });

      const result = await bookingLockService.confirmBooking(bookingId, {
        source: 'api',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          code: 'BOOKING_CONFIRMATION_FAILED'
        });
      }

      res.json({
        success: true,
        booking: result.booking,
        message: 'Booking confirmed successfully',
        lockStatus: 'released'
      });

    } catch (error) {
      console.error(`🔒 [${this.name}] Failed to confirm booking:`, error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Cancel booking (release lock)
   * POST /api/bookings/:bookingId/cancel
   */
  async cancelBooking(req, res) {
    try {
      const { bookingId } = req.params;
      const { reason } = req.body;
      
      console.log(`🔒 [${this.name}] Cancelling booking:`, {
        bookingId,
        userId: req.user?.id,
        reason
      });

      const result = await bookingLockService.cancelBooking(bookingId, reason || 'User cancelled', {
        source: 'api',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          code: 'BOOKING_CANCELLATION_FAILED'
        });
      }

      res.json({
        success: true,
        booking: result.booking,
        message: 'Booking cancelled successfully',
        lockStatus: 'released'
      });

    } catch (error) {
      console.error(`🔒 [${this.name}] Failed to cancel booking:`, error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Check slot availability
   * GET /api/bookings/availability
   */
  async checkAvailability(req, res) {
    try {
      const { professionalId, date, duration = 60 } = req.query;
      
      console.log(`🔒 [${this.name}] Checking availability:`, {
        professionalId,
        date,
        duration
      });

      if (!professionalId || !date) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: professionalId, date',
          code: 'MISSING_PARAMS'
        });
      }

      const result = await bookingLockService.checkSlotAvailability(
        professionalId,
        new Date(date),
        parseInt(duration)
      );

      res.json({
        success: true,
        availability: result
      });

    } catch (error) {
      console.error(`🔒 [${this.name}] Failed to check availability:`, error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get booking lock status
   * GET /api/bookings/:bookingId/lock-status
   */
  async getLockStatus(req, res) {
    try {
      const { bookingId } = req.params;
      
      console.log(`🔒 [${this.name}] Getting lock status:`, {
        bookingId,
        userId: req.user?.id
      });

      const result = await bookingLockService.getLockStatus(bookingId);

      if (result.error) {
        return res.status(404).json({
          success: false,
          error: result.error,
          code: 'BOOKING_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        lockStatus: result
      });

    } catch (error) {
      console.error(`🔒 [${this.name}] Failed to get lock status:`, error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get consistency status
   * GET /api/bookings/consistency-status
   */
  async getConsistencyStatus(req, res) {
    try {
      console.log(`🔒 [${this.name}] Getting consistency status`);

      const result = await bookingLockService.getConsistencyStatus();

      if (result.error) {
        return res.status(500).json({
          success: false,
          error: result.error,
          code: 'CONSISTENCY_CHECK_FAILED'
        });
      }

      res.json({
        success: true,
        consistencyStatus: result
      });

    } catch (error) {
      console.error(`🔒 [${this.name}] Failed to get consistency status:`, error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Apply versioned event
   * POST /api/bookings/:bookingId/apply-event
   */
  async applyVersionedEvent(req, res) {
    try {
      const { bookingId } = req.params;
      const event = req.body;
      
      console.log(`🔒 [${this.name}] Applying versioned event:`, {
        bookingId,
        eventType: event.type,
        eventVersion: event.version
      });

      // Validate event structure
      if (!event.eventId || !event.type || !event.version) {
        return res.status(400).json({
          success: false,
          error: 'Missing required event fields: eventId, type, version',
          code: 'INVALID_EVENT'
        });
      }

      const result = await bookingLockService.applyVersionedEvent(bookingId, event, {
        source: 'api',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        result
      });

    } catch (error) {
      console.error(`🔒 [${this.name}] Failed to apply versioned event:`, error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get lock statistics
   * GET /api/bookings/lock-stats
   */
  async getLockStats(req, res) {
    try {
      console.log(`🔒 [${this.name}] Getting lock statistics`);

      const stats = bookingLockService.getLockStats();

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error(`🔒 [${this.name}] Failed to get lock stats:`, error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Manual cleanup expired locks
   * POST /api/bookings/cleanup-expired-locks
   */
  async cleanupExpiredLocks(req, res) {
    try {
      console.log(`🔒 [${this.name}] Manual cleanup of expired locks`);

      const results = await bookingLockService.cleanupExpiredLocks();

      res.json({
        success: true,
        results,
        message: `Cleaned up ${results.length} expired locks`
      });

    } catch (error) {
      console.error(`🔒 [${this.name}] Failed to cleanup expired locks:`, error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
}

// Create controller instance
const bookingLockController = new BookingLockController();

module.exports = {
  BookingLockController,
  bookingLockController
};
