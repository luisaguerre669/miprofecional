// Booking Controller for MiProfesional Backend

const Booking = require('../models/Booking');
const User = require('../models/User');
const Professional = require('../models/Professional');

// Create booking
const createBooking = async (req, res) => {
  try {
    const { professional, service, date, price, notes } = req.body;
    
    // Validate required fields
    if (!professional || !service || !date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Professional, service, and date are required'
      });
    }

    // Validate date is in the future (at least 1 hour from now)
    const bookingDate = new Date(date);
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    
    if (bookingDate <= oneHourFromNow) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date',
        message: 'Booking date must be at least 1 hour in the future'
      });
    }

    // Check if professional exists and is active
    const professionalDoc = await Professional.findById(professional);
    if (!professionalDoc) {
      return res.status(404).json({
        success: false,
        error: 'Professional not found',
        message: 'The specified professional does not exist'
      });
    }

    if (!professionalDoc.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Professional not available',
        message: 'This professional is not currently accepting bookings'
      });
    }

    // MARKETPLACE LOGIC: Check for any existing booking at the exact same time (1-hour window)
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
      return res.status(409).json({
        success: false,
        error: 'Time slot not available',
        message: 'This professional already has a booking at this time',
        conflictingBooking: {
          date: professionalConflict.date,
          status: professionalConflict.status
        }
      });
    }

    // Check if user already has a booking at the same time (any professional)
    const userConflict = await Booking.findOne({
      user: req.usuario.id,
      date: {
        $gte: timeWindowStart,
        $lte: timeWindowEnd
      },
      status: { $in: ['pending', 'confirmed'] }
    });

    if (userConflict) {
      return res.status(409).json({
        success: false,
        error: 'User already booked',
        message: 'You already have a booking at this time',
        conflictingBooking: {
          date: userConflict.date,
          professional: userConflict.professional
        }
      });
    }

    // Create booking with marketplace validation
    const booking = new Booking({
      user: req.usuario.id,
      professional,
      service,
      date: bookingDate,
      price: price || professionalDoc.pricing.hourlyRate || 0,
      notes: notes || ''
    });

    await booking.save();

    // Populate for response
    await booking.populate([
      { path: 'user', select: 'name email phone' },
      { path: 'professional', select: 'businessName profession contact.phone location.city' }
    ]);

    // Emit booking created event (event-driven architecture)
    const { eventSystem } = require('../events');
    eventSystem.emitBookingCreated(
      booking._id,
      booking.user._id,
      booking.professional._id,
      booking.service,
      booking.date,
      booking.price,
      { ip: req.ip, userAgent: req.get('User-Agent') }
    ).catch(eventError => {
      // Event emission should not block the response
      console.error('Event emission error:', eventError);
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking',
      message: 'An error occurred while creating the booking'
    });
  }
};

// Get user bookings
const getUserBookings = async (req, res) => {
  try {
    const { status, limit = 20, skip = 0, sortBy = 'date', sortOrder = 'asc' } = req.query;

    // Validate pagination parameters
    const parsedLimit = Math.min(parseInt(limit) || 20, 100); // Max 100 items
    const parsedSkip = Math.max(parseInt(skip) || 0, 0);

    // Build query with status filter
    const query = { user: req.usuario.id };
    if (status) {
      query.status = status;
    }

    // Optimized query with lean() and minimal projections
    const bookings = await Booking.find(query)
      .select('service date price status notes createdAt')
      .populate({
        path: 'professional',
        select: 'businessName profession contact.phone location.city isActive verification.isVerified',
        match: { isActive: true },
        options: { lean: true } // Use lean for better performance
      })
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(parsedSkip)
      .limit(parsedLimit)
      .lean(); // Use lean for better performance

    // Filter out bookings where professional is not active (due to populate match)
    const activeBookings = bookings.filter(booking => booking.professional);

    // Get total count with same filters
    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      message: 'User bookings retrieved successfully',
      data: {
        bookings: activeBookings,
        pagination: {
          total,
          limit: parsedLimit,
          skip: parsedSkip,
          pages: Math.ceil(total / parsedLimit),
          hasMore: parsedSkip + parsedLimit < total
        },
        filters: {
          status,
          activeOnly: true
        }
      }
    });

  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve bookings',
      message: 'An error occurred while retrieving your bookings'
    });
  }
};

// Get booking by ID
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate('user', 'name email phone')
      .populate('professional', 'businessName profession contact.phone location.city availability');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        message: 'The specified booking does not exist'
      });
    }

    // Check if user owns this booking
    if (booking.user._id.toString() !== req.usuario.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only view your own bookings'
      });
    }

    res.json({
      success: true,
      message: 'Booking retrieved successfully',
      data: booking
    });

  } catch (error) {
    console.error('Get booking by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve booking',
      message: 'An error occurred while retrieving the booking'
    });
  }
};

// Update booking status
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: 'Status must be one of: pending, confirmed, cancelled, completed'
      });
    }

    const booking = await Booking.findById(id)
      .populate('user', 'name email')
      .populate('professional', 'businessName contact.email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        message: 'The specified booking does not exist'
      });
    }

    // MARKETPLACE OWNERSHIP VALIDATION: Only booking owner can update
    if (booking.user._id.toString() !== req.usuario.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only update your own bookings'
      });
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
    if (!validTransitions[currentStatus].includes(status)) {
      let errorMessage = `Cannot change status from ${currentStatus} to ${status}. `;
      
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

      return res.status(400).json({
        success: false,
        error: 'Invalid status transition',
        message: errorMessage,
        currentStatus,
        requestedStatus: status
      });
    }

    // Additional business rules
    if (status === 'completed') {
      // Can only mark as completed if booking date is in the past
      if (booking.date > new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Cannot complete future booking',
          message: 'Bookings can only be marked as completed after the scheduled date'
        });
      }
    }

    if (status === 'cancelled') {
      // Can only cancel if booking is at least 2 hours in the future
      const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
      if (booking.date <= twoHoursFromNow) {
        return res.status(400).json({
          success: false,
          error: 'Too late to cancel',
          message: 'Bookings can only be cancelled at least 2 hours in advance'
        });
      }
    }

    // Update status
    const previousStatus = booking.status;
    booking.status = status;
    await booking.save();

    // Log the status change for marketplace analytics
    console.log(`Booking ${id} status changed: ${previousStatus} → ${status} by user ${req.usuario.id}`);

    // Emit booking updated event (event-driven architecture)
    const { eventSystem } = require('../events');
    eventSystem.emitBookingUpdated(
      booking._id,
      booking.user._id,
      booking.professional._id,
      previousStatus,
      status,
      { ip: req.ip, userAgent: req.get('User-Agent') }
    ).catch(eventError => {
      // Event emission should not block the response
      console.error('Event emission error:', eventError);
    });

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: {
        booking,
        previousStatus,
        newStatus: status
      }
    });

  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking status',
      message: 'An error occurred while updating the booking status'
    });
  }
};

// Delete booking
const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        message: 'The specified booking does not exist'
      });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.usuario.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only delete your own bookings'
      });
    }

    // Business logic: can only delete pending or confirmed bookings
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete booking',
        message: 'Cannot delete bookings that are completed or cancelled'
      });
    }

    // Can only delete bookings that are at least 2 hours in the future
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
    if (booking.date <= twoHoursFromNow) {
      return res.status(400).json({
        success: false,
        error: 'Too late to cancel',
        message: 'Bookings can only be cancelled at least 2 hours in advance'
      });
    }

    await Booking.findByIdAndDelete(id);

    // Emit booking cancelled event (event-driven architecture)
    const { eventSystem } = require('../events');
    eventSystem.emitBookingCancelled(
      id,
      booking.user.toString(),
      booking.professional.toString(),
      'user_deleted',
      { ip: req.ip, userAgent: req.get('User-Agent') }
    ).catch(eventError => {
      // Event emission should not block the response
      console.error('Event emission error:', eventError);
    });

    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });

  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete booking',
      message: 'An error occurred while deleting the booking'
    });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
  deleteBooking
};
