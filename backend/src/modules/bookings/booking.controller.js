// Booking Controller - Modular Architecture Preparation
// Handles HTTP requests/responses only - Business logic in service layer

const bookingService = require('./booking.service');
const { body, validationResult } = require('express-validator');

const bookingController = {
  // Validation middleware
  handleValidationErrors: (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your input',
        errors: errors.array()
      });
    }
    next();
  },

  // POST /api/bookings - Create booking
  createBooking: async (req, res) => {
    try {
      const bookingData = {
        ...req.body,
        userId: req.usuario.id
      };
      
      const result = await bookingService.createBooking(bookingData);
      
      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: result
      });

    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.errorType || 'Failed to create booking',
        message: error.message
      });
    }
  },

  // GET /api/bookings - Get user bookings
  getUserBookings: async (req, res) => {
    try {
      const options = {
        userId: req.usuario.id,
        ...req.query
      };
      
      const result = await bookingService.getUserBookings(options);
      
      res.json({
        success: true,
        message: 'User bookings retrieved successfully',
        data: result
      });

    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.errorType || 'Failed to retrieve bookings',
        message: error.message
      });
    }
  },

  // GET /api/bookings/:id - Get booking by ID
  getBookingById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await bookingService.getBookingById(id, req.usuario.id);
      
      res.json({
        success: true,
        message: 'Booking retrieved successfully',
        data: result
      });

    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.errorType || 'Failed to retrieve booking',
        message: error.message
      });
    }
  },

  // PUT /api/bookings/:id - Update booking status
  updateBookingStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const result = await bookingService.updateBookingStatus(id, status, req.usuario.id);
      
      res.json({
        success: true,
        message: 'Booking status updated successfully',
        data: result
      });

    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.errorType || 'Failed to update booking status',
        message: error.message
      });
    }
  },

  // DELETE /api/bookings/:id - Delete booking
  deleteBooking: async (req, res) => {
    try {
      const { id } = req.params;
      
      await bookingService.deleteBooking(id, req.usuario.id);
      
      res.json({
        success: true,
        message: 'Booking deleted successfully'
      });

    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.errorType || 'Failed to delete booking',
        message: error.message
      });
    }
  },

  // GET /api/bookings/stats - Get booking statistics for user
  getBookingStats: async (req, res) => {
    try {
      const result = await bookingService.getBookingStats(req.usuario.id);
      
      res.json({
        success: true,
        message: 'Booking statistics retrieved successfully',
        data: result
      });

    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.errorType || 'Failed to retrieve booking statistics',
        message: error.message
      });
    }
  }
};

module.exports = bookingController;
