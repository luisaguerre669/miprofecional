// Bookings Service - Business Logic Layer
// Lógica de negocio para bookings con Soft Global Lock integration

console.log("🔧 Bookings Service - Business Logic Layer");

const { bookingRepository } = require('./repository');
const { bookingLockService } = require('../../services/bookingLockService');
const { eventSystem } = require('../../events');
const { BOOKING_EVENTS } = require('../../events/eventTypes');
const Booking = require('../../models/Booking');
const User = require('../../models/User');
const Professional = require('../../models/Professional');

class BookingsService {
  constructor() {
    this.name = 'bookings-service';
    this.repository = bookingRepository;
    this.lockService = bookingLockService;
    this.eventSystem = eventSystem;
  }

  /**
   * Create booking with complete business logic (from existing controller)
   * Mantiene compatibilidad exacta con el sistema actual
   */
  async createBooking(bookingData, metadata = {}) {
    try {
      console.log(`🔧 [${this.name}] Creating booking:`, {
        userId: bookingData.user,
        professionalId: bookingData.professional,
        date: bookingData.date,
        requestId: metadata.requestId
      });

      const { professional, service, date, price, notes } = bookingData;
      
      // Step 1: Validate required fields (from original controller)
      if (!professional || !service || !date) {
        return {
          success: false,
          error: 'Missing required fields',
          message: 'Professional, service, and date are required',
          code: 'MISSING_FIELDS'
        };
      }

      // Step 2: Validate date is in the future (at least 1 hour from now)
      const bookingDate = new Date(date);
      const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
      
      if (bookingDate <= oneHourFromNow) {
        return {
          success: false,
          error: 'Invalid date',
          message: 'Booking date must be at least 1 hour in the future',
          code: 'INVALID_DATE'
        };
      }

      // Step 3: Check if professional exists and is active
      const professionalDoc = await Professional.findById(professional);
      if (!professionalDoc) {
        return {
          success: false,
          error: 'Professional not found',
          message: 'The specified professional does not exist',
          code: 'PROFESSIONAL_NOT_FOUND'
        };
      }

      if (!professionalDoc.isActive) {
        return {
          success: false,
          error: 'Professional not available',
          message: 'This professional is not currently accepting bookings',
          code: 'PROFESSIONAL_INACTIVE'
        };
      }

      // Step 4: MARKETPLACE LOGIC - Check for any existing booking at the exact same time (1-hour window)
      const timeWindowStart = new Date(bookingDate.getTime() - 30 * 60 * 1000); // 30 min before
      const timeWindowEnd = new Date(bookingDate.getTime() + 30 * 60 * 1000);   // 30 min after

      // Check if professional already has a booking in this time window
      const professionalConflict = await Booking.findOne({
        professional,
        date: {
          $gte: timeWindowStart,
          $lte: timeWindowEnd
        },
        status: { $in: ['pending', 'confirmed'] }
      });

      if (professionalConflict) {
        return {
          success: false,
          error: 'Time slot not available',
          message: 'This professional already has a booking at this time',
          code: 'TIME_SLOT_UNAVAILABLE',
          conflictingBooking: {
            date: professionalConflict.date,
            status: professionalConflict.status
          }
        };
      }

      // Check if user already has a booking at the same time (any professional)
      const userConflict = await Booking.findOne({
        user: bookingData.user,
        date: {
          $gte: timeWindowStart,
          $lte: timeWindowEnd
        },
        status: { $in: ['pending', 'confirmed'] }
      });

      if (userConflict) {
        return {
          success: false,
          error: 'User already booked',
          message: 'You already have a booking at this time',
          code: 'USER_ALREADY_BOOKED',
          conflictingBooking: {
            date: userConflict.date,
            professional: userConflict.professional
          }
        };
      }

      // Step 5: Create booking with marketplace validation
      const booking = new Booking({
        user: bookingData.user,
        professional,
        service,
        date: bookingDate,
        price: price || professionalDoc.pricing?.hourlyRate || 0,
        notes: notes || ''
      });

      await booking.save();

      // Step 6: Populate for response (optimizado)
      await booking.populate([
        { path: 'user', select: 'name email phone' },
        { path: 'professional', select: 'businessName profession contact.phone location.city' }
      ]);

      // Step 7: Emit booking created event (event-driven architecture)
      this.eventSystem.emitBookingCreated(
        booking._id,
        booking.user._id,
        booking.professional._id,
        booking.service,
        booking.date,
        booking.price,
        { ip: metadata.ip, userAgent: metadata.userAgent }
      ).catch(eventError => {
        // Event emission should not block the response
        console.error('Event emission error:', eventError);
      });

      console.log(`🔧 [${this.name}] Booking created successfully:`, {
        bookingId: booking._id,
        status: booking.status
      });

      return {
        success: true,
        booking,
        message: 'Booking created successfully'
      };

    } catch (error) {
      console.error(`🔧 [${this.name}] Failed to create booking:`, error);
      
      return {
        success: false,
        error: 'Failed to create booking',
        message: 'An error occurred while creating the booking',
        code: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Get user bookings with enhanced marketplace logic (from existing controller)
   */
  async getUserBookings(userId, options = {}) {
    try {
      console.log(`🔧 [${this.name}] Getting user bookings:`, { userId, options });

      const { status, limit = 20, skip = 0, sortBy = 'date', sortOrder = 'asc' } = options;

      // MARKETPLACE: Optimized query with lean() and select() for performance
      const bookings = await Booking.find({ user: userId })
        .select('user professional service date price notes status createdAt updatedAt')
        .populate({
          path: 'professional',
          select: 'businessName profession contact.phone location.city isActive verification.isVerified',
          match: { isActive: true } // Only show active professionals
        })
        .lean() // Return plain JavaScript objects for better performance
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit));

      // Filter out bookings where professional is not active (due to populate match)
      const activeBookings = bookings.filter(booking => booking.professional);

      // Apply status filter if provided
      const filteredBookings = status 
        ? activeBookings.filter(booking => booking.status === status)
        : activeBookings;

      const total = await Booking.countDocuments({ user: userId });

      return {
        success: true,
        bookings: filteredBookings,
        total,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          pages: Math.ceil(total / parseInt(limit))
        },
        filters: {
          status,
          activeOnly: true
        }
      };

    } catch (error) {
      console.error(`🔧 [${this.name}] Failed to get user bookings:`, error);
      
      return {
        success: false,
        error: 'Failed to retrieve bookings',
        message: 'An error occurred while retrieving your bookings'
      };
    }
  }

  /**
   * Get booking by ID with user permission check (from existing controller)
   */
  async getBookingById(bookingId, userId = null) {
    try {
      console.log(`🔧 [${this.name}] Getting booking:`, { bookingId, userId });

      const booking = await Booking.findById(bookingId)
        .select('user professional service date price notes status createdAt updatedAt')
        .populate('user', 'name email phone')
        .populate('professional', 'businessName profession contact.phone location.city availability')
        .lean(); // Return plain JavaScript object for better performance
      
      if (!booking) {
        return {
          success: false,
          error: 'Booking not found',
          message: 'The specified booking does not exist'
        };
      }

      // Check if user owns this booking
      if (userId && booking.user._id.toString() !== userId) {
        return {
          success: false,
          error: 'Access denied',
          message: 'You can only view your own bookings'
        };
      }

      return {
        success: true,
        booking,
        message: 'Booking retrieved successfully'
      };

    } catch (error) {
      console.error(`🔧 [${this.name}] Failed to get booking:`, error);
      
      return {
        success: false,
        error: 'Failed to retrieve booking',
        message: 'An error occurred while retrieving the booking'
      };
    }
  }

  /**
   * Update booking status with complete business logic (from existing controller)
   */
  async updateBookingStatus(bookingId, newStatus, userId, metadata = {}) {
    try {
      console.log(`🔧 [${this.name}] Updating booking status:`, { bookingId, newStatus, userId });

      // Validate status
      if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(newStatus)) {
        return {
          success: false,
          error: 'Invalid status',
          message: 'Status must be one of: pending, confirmed, cancelled, completed',
          code: 'INVALID_STATUS'
        };
      }

      const booking = await Booking.findById(bookingId)
        .select('user professional service date price notes status createdAt updatedAt')
        .populate('user', 'name email')
        .populate('professional', 'businessName contact.email')
        .lean(); // Return plain JavaScript object for better performance

      if (!booking) {
        return {
          success: false,
          error: 'Booking not found',
          message: 'The specified booking does not exist',
          code: 'BOOKING_NOT_FOUND'
        };
      }

      // MARKETPLACE OWNERSHIP VALIDATION: Only booking owner can update
      if (booking.user._id.toString() !== userId) {
        return {
          success: false,
          error: 'Access denied',
          message: 'You can only update your own bookings',
          code: 'ACCESS_DENIED'
        };
      }

      // MARKETPLACE STATUS FLOW CONTROL
      const currentStatus = booking.status;
      const validTransitions = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['completed', 'cancelled'],
        'cancelled': [], // Cannot change from cancelled
        'completed': []  // Cannot change from completed
      };

      // Check if status transition is valid
      if (!validTransitions[currentStatus].includes(newStatus)) {
        let errorMessage = `Cannot change status from ${currentStatus} to ${newStatus}. `;
        
        switch (currentStatus) {
          case 'cancelled':
            errorMessage += 'Cancelled bookings cannot be modified.';
            break;
          case 'completed':
            errorMessage += 'Completed bookings cannot be modified.';
            break;
          case 'pending':
            errorMessage += 'Pending bookings can only be confirmed or cancelled.';
            break;
          case 'confirmed':
            errorMessage += 'Confirmed bookings can only be completed or cancelled.';
            break;
        }

        return {
          success: false,
          error: 'Invalid status transition',
          message: errorMessage,
          currentStatus,
          requestedStatus: newStatus,
          code: 'INVALID_TRANSITION'
        };
      }

      // Additional business rules
      if (newStatus === 'completed') {
        // Can only mark as completed if booking date is in the past
        if (booking.date > new Date()) {
          return {
            success: false,
            error: 'Cannot complete future booking',
            message: 'Bookings can only be marked as completed after the scheduled date',
            code: 'FUTURE_COMPLETION'
          };
        }
      }

      if (newStatus === 'cancelled') {
        // Can only cancel if booking is at least 2 hours in the future
        const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
        if (booking.date <= twoHoursFromNow) {
          return {
            success: false,
            error: 'Too late to cancel',
            message: 'Bookings can only be cancelled at least 2 hours in advance',
            code: 'LATE_CANCELLATION'
          };
        }
      }

      // Update status
      const previousStatus = booking.status;
      booking.status = newStatus;
      await booking.save();

      // Log the status change for marketplace analytics
      console.log(`Booking ${bookingId} status changed: ${previousStatus} → ${newStatus} by user ${userId}`);

      // Emit booking updated event (event-driven architecture)
      this.eventSystem.emitBookingUpdated(
        booking._id,
        booking.user._id,
        booking.professional._id,
        previousStatus,
        newStatus,
        { ip: metadata.ip, userAgent: metadata.userAgent }
      ).catch(eventError => {
        // Event emission should not block the response
        console.error('Event emission error:', eventError);
      });

      return {
        success: true,
        booking,
        previousStatus,
        newStatus,
        message: 'Booking status updated successfully'
      };

    } catch (error) {
      console.error(`🔧 [${this.name}] Failed to update booking status:`, error);
      
      return {
        success: false,
        error: 'Failed to update booking status',
        message: 'An error occurred while updating the booking status',
        code: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Delete booking with complete business logic (from existing controller)
   */
  async deleteBooking(bookingId, userId, metadata = {}) {
    try {
      console.log(`🔧 [${this.name}] Deleting booking:`, { bookingId, userId });

      const booking = await Booking.findById(bookingId)
        .select('user professional service date price notes status createdAt updatedAt')
        .lean(); // Return plain JavaScript object for better performance

      if (!booking) {
        return {
          success: false,
          error: 'Booking not found',
          message: 'The specified booking does not exist',
          code: 'BOOKING_NOT_FOUND'
        };
      }

      // Check if user owns this booking
      if (booking.user.toString() !== userId) {
        return {
          success: false,
          error: 'Access denied',
          message: 'You can only delete your own bookings',
          code: 'ACCESS_DENIED'
        };
      }

      // Business logic: can only delete pending or confirmed bookings
      if (['completed', 'cancelled'].includes(booking.status)) {
        return {
          success: false,
          error: 'Cannot delete booking',
          message: 'Cannot delete bookings that are completed or cancelled',
          code: 'INVALID_STATUS_FOR_DELETION'
        };
      }

      // Can only delete bookings that are at least 2 hours in the future
      const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
      if (booking.date <= twoHoursFromNow) {
        return {
          success: false,
          error: 'Too late to cancel',
          message: 'Bookings can only be cancelled at least 2 hours in advance',
          code: 'LATE_CANCELLATION'
        };
      }

      await Booking.findByIdAndDelete(bookingId);

      // Emit booking cancelled event (event-driven architecture)
      this.eventSystem.emitBookingCancelled(
        bookingId,
        booking.user.toString(),
        booking.professional.toString(),
        'user_deleted',
        { ip: metadata.ip, userAgent: metadata.userAgent }
      ).catch(eventError => {
        // Event emission should not block the response
        console.error('Event emission error:', eventError);
      });

      return {
        success: true,
        message: 'Booking deleted successfully'
      };

    } catch (error) {
      console.error(`🔧 [${this.name}] Failed to delete booking:`, error);
      
      return {
        success: false,
        error: 'Failed to delete booking',
        message: 'An error occurred while deleting the booking',
        code: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Get professional bookings with filtering
   */
  async getProfessionalBookings(professionalId, options = {}) {
    try {
      console.log(`🔧 [${this.name}] Getting professional bookings:`, { professionalId, options });

      const result = await this.repository.findByProfessional(professionalId, options);

      return {
        success: true,
        bookings: result.bookings,
        total: result.total,
        hasMore: result.hasMore
      };

    } catch (error) {
      console.error(`🔧 [${this.name}] Failed to get professional bookings:`, error);
      
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  /**
   * Confirm booking with business logic validation
   */
  async confirmBooking(bookingId, metadata = {}) {
    try {
      console.log(`🔧 [${this.name}] Confirming booking:`, { bookingId });

      // Step 1: Get booking
      const bookingResult = await this.getBookingById(bookingId);
      if (!bookingResult.success) {
        return bookingResult;
      }

      const booking = bookingResult.booking;

      // Step 2: Business validation
      const validationResult = this.validateBookingConfirmation(booking);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.error,
          code: 'VALIDATION_ERROR'
        };
      }

      // Step 3: Confirm booking through lock service
      const confirmResult = await this.lockService.confirmBooking(bookingId, metadata);

      if (!confirmResult.success) {
        return {
          success: false,
          error: confirmResult.error,
          code: 'CONFIRMATION_FAILED'
        };
      }

      // Step 4: Post-confirmation business logic
      await this.executePostConfirmationLogic(confirmResult.booking, metadata);

      console.log(`🔧 [${this.name}] Booking confirmed successfully:`, {
        bookingId,
        newStatus: confirmResult.booking.status
      });

      return {
        success: true,
        booking: confirmResult.booking
      };

    } catch (error) {
      console.error(`🔧 [${this.name}] Failed to confirm booking:`, error);
      
      return {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Cancel booking with business logic validation
   */
  async cancelBooking(bookingId, reason, metadata = {}) {
    try {
      console.log(`🔧 [${this.name}] Cancelling booking:`, { bookingId, reason });

      // Step 1: Get booking
      const bookingResult = await this.getBookingById(bookingId);
      if (!bookingResult.success) {
        return bookingResult;
      }

      const booking = bookingResult.booking;

      // Step 2: Business validation
      const validationResult = this.validateBookingCancellation(booking);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.error,
          code: 'VALIDATION_ERROR'
        };
      }

      // Step 3: Cancel booking through lock service
      const cancelResult = await this.lockService.cancelBooking(bookingId, reason, metadata);

      if (!cancelResult.success) {
        return {
          success: false,
          error: cancelResult.error,
          code: 'CANCELLATION_FAILED'
        };
      }

      // Step 4: Post-cancellation business logic
      await this.executePostCancellationLogic(cancelResult.booking, reason, metadata);

      console.log(`🔧 [${this.name}] Booking cancelled successfully:`, {
        bookingId,
        newStatus: cancelResult.booking.status,
        reason
      });

      return {
        success: true,
        booking: cancelResult.booking
      };

    } catch (error) {
      console.error(`🔧 [${this.name}] Failed to cancel booking:`, error);
      
      return {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Complete booking with business logic validation
   */
  async completeBooking(bookingId, metadata = {}) {
    try {
      console.log(`🔧 [${this.name}] Completing booking:`, { bookingId });

      // Step 1: Get booking
      const bookingResult = await this.getBookingById(bookingId);
      if (!bookingResult.success) {
        return bookingResult;
      }

      const booking = bookingResult.booking;

      // Step 2: Business validation
      const validationResult = this.validateBookingCompletion(booking);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.error,
          code: 'VALIDATION_ERROR'
        };
      }

      // Step 3: Complete booking
      const completeResult = await this.lockService.completeBooking(bookingId, metadata);

      if (!completeResult.success) {
        return {
          success: false,
          error: completeResult.error,
          code: 'COMPLETION_FAILED'
        };
      }

      // Step 4: Post-completion business logic
      await this.executePostCompletionLogic(completeResult.booking, metadata);

      console.log(`🔧 [${this.name}] Booking completed successfully:`, {
        bookingId,
        newStatus: completeResult.booking.status
      });

      return {
        success: true,
        booking: completeResult.booking
      };

    } catch (error) {
      console.error(`🔧 [${this.name}] Failed to complete booking:`, error);
      
      return {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Check slot availability
   */
  async checkSlotAvailability(professionalId, date, duration = 60) {
    try {
      console.log(`🔧 [${this.name}] Checking slot availability:`, {
        professionalId,
        date,
        duration
      });

      const result = await this.lockService.checkSlotAvailability(
        professionalId,
        date,
        duration
      );

      return result;

    } catch (error) {
      console.error(`🔧 [${this.name}] Failed to check availability:`, error);
      
      return {
        professionalId,
        date,
        duration,
        available: false,
        error: 'Internal server error'
      };
    }
  }

  /**
   * Get booking lock status
   */
  async getLockStatus(bookingId) {
    try {
      console.log(`🔧 [${this.name}] Getting lock status:`, { bookingId });

      const result = await this.lockService.getLockStatus(bookingId);
      return result;

    } catch (error) {
      console.error(`🔧 [${this.name}] Failed to get lock status:`, error);
      
      return { error: 'Internal server error' };
    }
  }

  /**
   * Get booking statistics
   */
  async getBookingStats(professionalId = null) {
    try {
      console.log(`🔧 [${this.name}] Getting booking stats:`, { professionalId });

      const stats = await this.repository.getStats(professionalId);

      return stats;

    } catch (error) {
      console.error(`🔧 [${this.name}] Failed to get booking stats:`, error);
      
      return {
        error: 'Internal server error'
      };
    }
  }

  /**
   * Get upcoming bookings
   */
  async getUpcomingBookings(options = {}) {
    try {
      console.log(`🔧 [${this.name}] Getting upcoming bookings:`, options);

      const bookings = await this.repository.getUpcomingBookings(options);

      return {
        success: true,
        bookings
      };

    } catch (error) {
      console.error(`🔧 [${this.name}] Failed to get upcoming bookings:`, error);
      
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  // Business Logic Validation Methods

  /**
   * Validate booking data
   */
  validateBookingData(bookingData) {
    const { user, professional, service, date, price, notes } = bookingData;

    // Required fields
    if (!user || !professional || !service || !date) {
      return {
        isValid: false,
        error: 'Missing required fields: user, professional, service, date'
      };
    }

    // Date validation
    const bookingDate = new Date(date);
    if (bookingDate <= new Date()) {
      return {
        isValid: false,
        error: 'Booking date must be in the future'
      };
    }

    // Price validation
    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      return {
        isValid: false,
        error: 'Price must be a non-negative number'
      };
    }

    // Notes validation
    if (notes && typeof notes !== 'string') {
      return {
        isValid: false,
        error: 'Notes must be a string'
      };
    }

    return { isValid: true };
  }

  /**
   * Check user permissions
   */
  async checkUserPermissions(userId, professionalId) {
    try {
      // Check if user exists
      const user = await this.repository.findUserById(userId);
      if (!user) {
        return {
          hasPermission: false,
          error: 'User not found'
        };
      }

      // Check if professional exists
      const professional = await this.repository.findProfessionalById(professionalId);
      if (!professional) {
        return {
          hasPermission: false,
          error: 'Professional not found'
        };
      }

      // Check if user is blocked by professional (business logic)
      if (await this.isUserBlockedByProfessional(userId, professionalId)) {
        return {
          hasPermission: false,
          error: 'User is blocked by this professional'
        };
      }

      return { hasPermission: true };

    } catch (error) {
      console.error(`🔧 [${this.name}] Error checking permissions:`, error);
      
      return {
        hasPermission: false,
        error: 'Permission check failed'
      };
    }
  }

  /**
   * Validate booking confirmation
   */
  validateBookingConfirmation(booking) {
    // Check if booking can be confirmed
    if (!booking.canTransitionTo('confirmed')) {
      return {
        isValid: false,
        error: `Cannot confirm booking from status: ${booking.status}`
      };
    }

    // Check if lock is expired
    if (booking.isLockExpired()) {
      return {
        isValid: false,
        error: 'Booking lock has expired'
      };
    }

    // Additional business validations
    if (booking.date <= new Date()) {
      return {
        isValid: false,
        error: 'Cannot confirm booking for past date'
      };
    }

    return { isValid: true };
  }

  /**
   * Validate booking cancellation
   */
  validateBookingCancellation(booking) {
    // Check if booking can be cancelled
    if (!booking.canTransitionTo('cancelled')) {
      return {
        isValid: false,
        error: `Cannot cancel booking from status: ${booking.status}`
      };
    }

    // Business rule: cannot cancel completed bookings
    if (booking.status === 'completed') {
      return {
        isValid: false,
        error: 'Cannot cancel completed booking'
      };
    }

    return { isValid: true };
  }

  /**
   * Validate booking completion
   */
  validateBookingCompletion(booking) {
    // Check if booking can be completed
    if (!booking.canTransitionTo('completed')) {
      return {
        isValid: false,
        error: `Cannot complete booking from status: ${booking.status}`
      };
    }

    // Business rule: can only complete confirmed bookings
    if (booking.status !== 'confirmed') {
      return {
        isValid: false,
        error: 'Can only complete confirmed bookings'
      };
    }

    // Business rule: cannot complete future bookings
    if (booking.date > new Date()) {
      return {
        isValid: false,
        error: 'Cannot complete future booking'
      };
    }

    return { isValid: true };
  }

  // Post-Processing Business Logic

  /**
   * Execute post-creation business logic
   */
  async executePostCreationLogic(booking, metadata) {
    try {
      console.log(`🔧 [${this.name}] Executing post-creation logic:`, booking._id);

      // Update professional statistics
      await this.updateProfessionalStats(booking.professional, 'booking_created');

      // Send notifications (async, non-blocking)
      this.sendBookingNotifications(booking, 'created', metadata).catch(error => {
        console.error(`🔧 [${this.name}] Failed to send notifications:`, error);
      });

      // Update user analytics (async, non-blocking)
      this.updateUserAnalytics(booking.user, 'booking_created', metadata).catch(error => {
        console.error(`🔧 [${this.name}] Failed to update analytics:`, error);
      });

    } catch (error) {
      console.error(`🔧 [${this.name}] Error in post-creation logic:`, error);
    }
  }

  /**
   * Execute post-confirmation business logic
   */
  async executePostConfirmationLogic(booking, metadata) {
    try {
      console.log(`🔧 [${this.name}] Executing post-confirmation logic:`, booking._id);

      // Update professional statistics
      await this.updateProfessionalStats(booking.professional, 'booking_confirmed');

      // Send notifications
      this.sendBookingNotifications(booking, 'confirmed', metadata).catch(error => {
        console.error(`🔧 [${this.name}] Failed to send notifications:`, error);
      });

      // Update calendar
      this.updateProfessionalCalendar(booking, 'confirmed').catch(error => {
        console.error(`🔧 [${this.name}] Failed to update calendar:`, error);
      });

    } catch (error) {
      console.error(`🔧 [${this.name}] Error in post-confirmation logic:`, error);
    }
  }

  /**
   * Execute post-cancellation business logic
   */
  async executePostCancellationLogic(booking, reason, metadata) {
    try {
      console.log(`🔧 [${this.name}] Executing post-cancellation logic:`, booking._id);

      // Update professional statistics
      await this.updateProfessionalStats(booking.professional, 'booking_cancelled');

      // Send notifications
      this.sendBookingNotifications(booking, 'cancelled', { ...metadata, reason }).catch(error => {
        console.error(`🔧 [${this.name}] Failed to send notifications:`, error);
      });

      // Update calendar
      this.updateProfessionalCalendar(booking, 'cancelled').catch(error => {
        console.error(`🔧 [${this.name}] Failed to update calendar:`, error);
      });

      // Process refunds if applicable
      this.processRefund(booking, metadata).catch(error => {
        console.error(`🔧 [${this.name}] Failed to process refund:`, error);
      });

    } catch (error) {
      console.error(`🔧 [${this.name}] Error in post-cancellation logic:`, error);
    }
  }

  /**
   * Execute post-completion business logic
   */
  async executePostCompletionLogic(booking, metadata) {
    try {
      console.log(`🔧 [${this.name}] Executing post-completion logic:`, booking._id);

      // Update professional statistics
      await this.updateProfessionalStats(booking.professional, 'booking_completed');

      // Send notifications
      this.sendBookingNotifications(booking, 'completed', metadata).catch(error => {
        console.error(`🔧 [${this.name}] Failed to send notifications:`, error);
      });

      // Process payment
      this.processPayment(booking, metadata).catch(error => {
        console.error(`🔧 [${this.name}] Failed to process payment:`, error);
      });

      // Request review
      this.requestReview(booking, metadata).catch(error => {
        console.error(`🔧 [${this.name}] Failed to request review:`, error);
      });

    } catch (error) {
      console.error(`🔧 [${this.name}] Error in post-completion logic:`, error);
    }
  }

  // Helper Methods

  /**
   * Check if user has booking permission
   */
  hasBookingPermission(booking, userId) {
    return booking.user.toString() === userId || 
           booking.professional.toString() === userId;
  }

  /**
   * Check if user is blocked by professional
   */
  async isUserBlockedByProfessional(userId, professionalId) {
    // In a real implementation, check blocked users list
    return false;
  }

  /**
   * Get error code from error message
   */
  getErrorCode(error) {
    if (error.includes('not available')) return 'SLOT_UNAVAILABLE';
    if (error.includes('not found')) return 'NOT_FOUND';
    if (error.includes('permission')) return 'PERMISSION_DENIED';
    if (error.includes('validation')) return 'VALIDATION_ERROR';
    return 'INTERNAL_ERROR';
  }

  // Async Business Operations (non-blocking)

  /**
   * Update professional statistics
   */
  async updateProfessionalStats(professionalId, action) {
    console.log(`🔧 [${this.name}] Updating professional stats:`, { professionalId, action });
    // Implementation would update professional statistics
  }

  /**
   * Send booking notifications
   */
  async sendBookingNotifications(booking, action, metadata = {}) {
    console.log(`🔧 [${this.name}] Sending notifications:`, { 
      bookingId: booking._id, 
      action, 
      userId: booking.user,
      professionalId: booking.professional 
    });
    // Implementation would send notifications
  }

  /**
   * Update user analytics
   */
  async updateUserAnalytics(userId, action, metadata) {
    console.log(`🔧 [${this.name}] Updating user analytics:`, { userId, action });
    // Implementation would update analytics
  }

  /**
   * Update professional calendar
   */
  async updateProfessionalCalendar(booking, action) {
    console.log(`🔧 [${this.name}] Updating professional calendar:`, { 
      bookingId: booking._id, 
      action 
    });
    // Implementation would update calendar
  }

  /**
   * Process refund
   */
  async processRefund(booking, metadata) {
    console.log(`🔧 [${this.name}] Processing refund:`, { bookingId: booking._id });
    // Implementation would process refund
  }

  /**
   * Process payment
   */
  async processPayment(booking, metadata) {
    console.log(`🔧 [${this.name}] Processing payment:`, { bookingId: booking._id });
    // Implementation would process payment
  }

  /**
   * Request review
   */
  async requestReview(booking, metadata) {
    console.log(`🔧 [${this.name}] Requesting review:`, { bookingId: booking._id });
    // Implementation would request review
  }
}

// Create service instance
const bookingService = new BookingsService();

module.exports = {
  BookingsService,
  bookingService
};
