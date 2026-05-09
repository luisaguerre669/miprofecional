// Booking Service - Business Logic Layer
// Handles all booking business logic independently from HTTP layer

const Booking = require('../../models/Booking');
const Professional = require('../../models/Professional');
const logger = require('../../utils/logger');

class BookingService {
  constructor() {
    this.validateBookingData = this.validateBookingData.bind(this);
    this.checkAvailability = this.checkAvailability.bind(this);
    this.validateStatusTransition = this.validateStatusTransition.bind(this);
  }

  // Validate booking data
  validateBookingData(data) {
    const { professional, service, date, price, notes } = data;

    if (!professional || !service || !date) {
      const error = new Error('Professional, service, and date are required');
      error.statusCode = 400;
      error.errorType = 'Missing required fields';
      throw error;
    }

    // Validate date is in the future (at least 1 hour from now)
    const bookingDate = new Date(date);
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    
    if (bookingDate <= oneHourFromNow) {
      const error = new Error('Booking date must be at least 1 hour in the future');
      error.statusCode = 400;
      error.errorType = 'Invalid date';
      throw error;
    }

    return { bookingDate, professional, service, price, notes };
  }

  // Check professional availability
  async checkAvailability(professionalId, bookingDate, userId) {
    // Check if professional exists and is active
    const professional = await Professional.findById(professionalId);
    if (!professional) {
      const error = new Error('The specified professional does not exist');
      error.statusCode = 404;
      error.errorType = 'Professional not found';
      throw error;
    }

    if (!professional.isActive) {
      const error = new Error('This professional is not currently accepting bookings');
      error.statusCode = 400;
      error.errorType = 'Professional not available';
      throw error;
    }

    // MARKETPLACE LOGIC: Check for conflicts (1-hour window)
    const timeWindowStart = new Date(bookingDate.getTime() - 30 * 60 * 1000);
    const timeWindowEnd = new Date(bookingDate.getTime() + 30 * 60 * 1000);

    // Check professional conflict
    const professionalConflict = await Booking.findOne({
      professional: professionalId,
      date: { $gte: timeWindowStart, $lte: timeWindowEnd },
      status: { $in: ['pending', 'confirmed'] }
    });

    if (professionalConflict) {
      const error = new Error('This professional already has a booking at this time');
      error.statusCode = 409;
      error.errorType = 'Time slot not available';
      error.conflictData = {
        date: professionalConflict.date,
        status: professionalConflict.status
      };
      throw error;
    }

    // Check user conflict
    const userConflict = await Booking.findOne({
      user: userId,
      date: { $gte: timeWindowStart, $lte: timeWindowEnd },
      status: { $in: ['pending', 'confirmed'] }
    });

    if (userConflict) {
      const error = new Error('You already have a booking at this time');
      error.statusCode = 409;
      error.errorType = 'User already booked';
      error.conflictData = {
        date: userConflict.date,
        professional: userConflict.professional
      };
      throw error;
    }

    return professional;
  }

  // Create booking
  async createBooking(bookingData) {
    const { userId, professional, service, date, price, notes } = bookingData;

    // Validate data
    const { bookingDate } = this.validateBookingData(bookingData);

    // Check availability
    const professionalData = await this.checkAvailability(professional, bookingDate, userId);

    // Create booking
    const booking = new Booking({
      user: userId,
      professional,
      service,
      date: bookingDate,
      price: price || professionalData.pricing.hourlyRate || 0,
      notes: notes || ''
    });

    await booking.save();

    // Populate for response
    await booking.populate([
      { path: 'user', select: 'name email phone' },
      { path: 'professional', select: 'businessName profession contact.phone location.city' }
    ]);

    // Log booking creation
    logger.info('Booking created', {
      bookingId: booking._id,
      userId,
      professionalId: professional,
      service,
      date: bookingDate
    });

    return booking;
  }

  // Get user bookings
  async getUserBookings(options) {
    const { userId, status, limit = 20, skip = 0, sortBy = 'date', sortOrder = 'asc' } = options;

    // Enhanced query with proper population
    const bookings = await Booking.find({ user: userId })
      .populate({
        path: 'professional',
        select: 'businessName profession contact.phone location.city isActive verification.isVerified',
        match: { isActive: true }
      })
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    // Filter out bookings where professional is not active
    const activeBookings = bookings.filter(booking => booking.professional);

    // Apply status filter if provided
    const filteredBookings = status 
      ? activeBookings.filter(booking => booking.status === status)
      : activeBookings;

    const total = await Booking.countDocuments({ user: userId });

    return {
      bookings: filteredBookings,
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
  }

  // Get booking by ID
  async getBookingById(bookingId, userId) {
    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email phone')
      .populate('professional', 'businessName profession contact.phone location.city availability');

    if (!booking) {
      const error = new Error('The specified booking does not exist');
      error.statusCode = 404;
      error.errorType = 'Booking not found';
      throw error;
    }

    // Check ownership
    if (booking.user._id.toString() !== userId) {
      const error = new Error('You can only view your own bookings');
      error.statusCode = 403;
      error.errorType = 'Access denied';
      throw error;
    }

    return booking;
  }

  // Validate status transition
  validateStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['completed', 'cancelled'],
      'cancelled': [],
      'completed': []
    };

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

      const error = new Error(errorMessage);
      error.statusCode = 400;
      error.errorType = 'Invalid status transition';
      error.currentStatus = currentStatus;
      error.requestedStatus = newStatus;
      throw error;
    }
  }

  // Update booking status
  async updateBookingStatus(bookingId, status, userId) {
    // Validate status
    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      const error = new Error('Status must be one of: pending, confirmed, cancelled, completed');
      error.statusCode = 400;
      error.errorType = 'Invalid status';
      throw error;
    }

    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email')
      .populate('professional', 'businessName contact.email');

    if (!booking) {
      const error = new Error('The specified booking does not exist');
      error.statusCode = 404;
      error.errorType = 'Booking not found';
      throw error;
    }

    // Check ownership
    if (booking.user._id.toString() !== userId) {
      const error = new Error('You can only update your own bookings');
      error.statusCode = 403;
      error.errorType = 'Access denied';
      throw error;
    }

    // Validate transition
    this.validateStatusTransition(booking.status, status);

    // Business rules
    if (status === 'completed') {
      if (booking.date > new Date()) {
        const error = new Error('Bookings can only be marked as completed after the scheduled date');
        error.statusCode = 400;
        error.errorType = 'Cannot complete future booking';
        throw error;
      }
    }

    if (status === 'cancelled') {
      const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
      if (booking.date <= twoHoursFromNow) {
        const error = new Error('Bookings can only be cancelled at least 2 hours in advance');
        error.statusCode = 400;
        error.errorType = 'Too late to cancel';
        throw error;
      }
    }

    // Update status
    const previousStatus = booking.status;
    booking.status = status;
    await booking.save();

    // Log status change
    logger.info('Booking status updated', {
      bookingId,
      previousStatus,
      newStatus: status,
      userId
    });

    return {
      booking,
      previousStatus,
      newStatus: status
    };
  }

  // Delete booking
  async deleteBooking(bookingId, userId) {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      const error = new Error('The specified booking does not exist');
      error.statusCode = 404;
      error.errorType = 'Booking not found';
      throw error;
    }

    // Check ownership
    if (booking.user.toString() !== userId) {
      const error = new Error('You can only delete your own bookings');
      error.statusCode = 403;
      error.errorType = 'Access denied';
      throw error;
    }

    // Business logic: can only delete pending or confirmed bookings
    if (['completed', 'cancelled'].includes(booking.status)) {
      const error = new Error('Cannot delete bookings that are completed or cancelled');
      error.statusCode = 400;
      error.errorType = 'Cannot delete booking';
      throw error;
    }

    // Can only delete bookings that are at least 2 hours in the future
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
    if (booking.date <= twoHoursFromNow) {
      const error = new Error('Bookings can only be cancelled at least 2 hours in advance');
      error.statusCode = 400;
      error.errorType = 'Too late to cancel';
      throw error;
    }

    await Booking.findByIdAndDelete(bookingId);

    // Log deletion
    logger.info('Booking deleted', {
      bookingId,
      userId
    });
  }

  // Get booking statistics
  async getBookingStats(userId) {
    const stats = await Booking.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          pendingBookings: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          confirmedBookings: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
          cancelledBookings: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          completedBookings: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          totalSpent: { $sum: '$price' },
          avgPrice: { $avg: '$price' }
        }
      }
    ]);

    return stats[0] || {
      totalBookings: 0,
      pendingBookings: 0,
      confirmedBookings: 0,
      cancelledBookings: 0,
      completedBookings: 0,
      totalSpent: 0,
      avgPrice: 0
    };
  }
}

module.exports = new BookingService();
