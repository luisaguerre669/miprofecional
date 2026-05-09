// Bookings Controller - Modular API Endpoints (Refactored)
// Controlador modular para bookings - SOLO request/response, sin lógica de negocio

console.log("📋 Bookings Controller - Modular API Endpoints");

const { bookingService } = require('./service');

class BookingsController {
  constructor() {
    this.name = 'bookings-controller';
    this.bookingService = bookingService;
  }

  /**
   * Create booking - SOLO request/response handling
   * POST /api/bookings
   */
  async createBooking(req, res) {
    try {
      console.log(`📋 [${this.name}] Creating booking:`, {
        userId: req.usuario?.id,
        professionalId: req.body.professional,
        date: req.body.date
      });

      // Extract data from request
      const { professional, service, date, price, notes } = req.body;
      
      // Call service layer with business logic
      const result = await this.bookingService.createBooking({
        user: req.usuario.id,
        professional,
        service,
        date,
        price,
        notes
      }, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Handle response based on service result
      if (!result.success) {
        return res.status(this.getErrorCode(result.code)).json({
          success: false,
          error: result.error,
          message: result.message
        });
      }

      // Return success response
      res.status(201).json({
        success: true,
        message: result.message,
        data: result.booking
      });

    } catch (error) {
      console.error(`📋 [${this.name}] Failed to create booking:`, error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to create booking',
        message: 'An error occurred while creating the booking'
      });
    }
  }

  /**
   * Get booking by ID - SOLO request/response handling
   * GET /api/bookings/:id
   */
  async getBooking(req, res) {
    try {
      const { id } = req.params;
      
      console.log(`📋 [${this.name}] Getting booking:`, {
        bookingId: id,
        userId: req.usuario?.id
      });

      // Call service layer
      const result = await this.bookingService.getBookingById(id, req.usuario.id);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: result.error,
          message: result.message
        });
      }

      res.json({
        success: true,
        message: result.message,
        data: result.booking
      });

    } catch (error) {
      console.error(`📋 [${this.name}] Failed to get booking:`, error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve booking',
        message: 'An error occurred while retrieving the booking'
      });
    }
  }

  /**
   * Get user bookings - SOLO request/response handling
   * GET /api/bookings
   */
  async getUserBookings(req, res) {
    try {
      const { 
        status, 
        limit = 20, 
        skip = 0, 
        sortBy = 'date', 
        sortOrder = 'asc' 
      } = req.query;
      
      console.log(`📋 [${this.name}] Getting user bookings:`, {
        userId: req.usuario?.id,
        status,
        limit,
        skip
      });

      // Call service layer
      const result = await this.bookingService.getUserBookings(req.usuario.id, {
        status,
        limit: parseInt(limit),
        skip: parseInt(skip),
        sortBy,
        sortOrder
      });

      res.json({
        success: true,
        message: result.message || 'User bookings retrieved successfully',
        data: {
          bookings: result.bookings,
          pagination: result.pagination,
          filters: result.filters
        }
      });

    } catch (error) {
      console.error(`📋 [${this.name}] Failed to get user bookings:`, error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve bookings',
        message: 'An error occurred while retrieving your bookings'
      });
    }
  }

  /**
   * Update booking status - SOLO request/response handling
   * PUT /api/bookings/:id
   */
  async updateBookingStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      console.log(`📋 [${this.name}] Updating booking status:`, {
        bookingId: id,
        newStatus: status,
        userId: req.usuario?.id
      });

      // Call service layer
      const result = await this.bookingService.updateBookingStatus(
        id, 
        status, 
        req.usuario.id,
        {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      );

      if (!result.success) {
        return res.status(this.getErrorCode(result.code)).json({
          success: false,
          error: result.error,
          message: result.message
        });
      }

      res.json({
        success: true,
        message: result.message,
        data: {
          booking: result.booking,
          previousStatus: result.previousStatus,
          newStatus: result.newStatus
        }
      });

    } catch (error) {
      console.error(`📋 [${this.name}] Failed to update booking status:`, error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to update booking status',
        message: 'An error occurred while updating the booking status'
      });
    }
  }

  /**
   * Delete booking - SOLO request/response handling
   * DELETE /api/bookings/:id
   */
  async deleteBooking(req, res) {
    try {
      const { id } = req.params;
      
      console.log(`📋 [${this.name}] Deleting booking:`, {
        bookingId: id,
        userId: req.usuario?.id
      });

      // Call service layer
      const result = await this.bookingService.deleteBooking(
        id,
        req.usuario.id,
        {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      );

      if (!result.success) {
        return res.status(this.getErrorCode(result.code)).json({
          success: false,
          error: result.error,
          message: result.message
        });
      }

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error(`📋 [${this.name}] Failed to delete booking:`, error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to delete booking',
        message: 'An error occurred while deleting the booking'
      });
    }
  }

  /**
   * Get error code from service result
   */
  getErrorCode(code) {
    const errorCodes = {
      'MISSING_FIELDS': 400,
      'INVALID_DATE': 400,
      'PROFESSIONAL_NOT_FOUND': 404,
      'PROFESSIONAL_INACTIVE': 400,
      'TIME_SLOT_UNAVAILABLE': 409,
      'USER_ALREADY_BOOKED': 409,
      'BOOKING_NOT_FOUND': 404,
      'ACCESS_DENIED': 403,
      'INVALID_STATUS': 400,
      'INVALID_TRANSITION': 400,
      'FUTURE_COMPLETION': 400,
      'LATE_CANCELLATION': 400,
      'INVALID_STATUS_FOR_DELETION': 400,
      'INTERNAL_ERROR': 500
    };
    
    return errorCodes[code] || 500;
  }
}

// Create controller instance
const bookingsController = new BookingsController();

module.exports = {
  BookingsController,
  bookingsController
};
