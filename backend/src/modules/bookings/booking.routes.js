// Booking Routes - Modular Architecture Preparation
// Defines all booking routes with proper middleware

const express = require('express');
const { body, param } = require('express-validator');
const bookingController = require('./booking.controller');
const authMiddleware = require('../../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Validation rules
const createBookingValidation = [
  body('professional').notEmpty().withMessage('Professional ID is required'),
  body('service').notEmpty().isLength({ min: 2, max: 200 }).withMessage('Service name must be between 2 and 200 characters'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
];

const updateStatusValidation = [
  param('id').isMongoId().withMessage('Invalid booking ID'),
  body('status').isIn(['pending', 'confirmed', 'cancelled', 'completed']).withMessage('Invalid status')
];

const idValidation = [
  param('id').isMongoId().withMessage('Invalid booking ID')
];

// Booking CRUD routes
router.post('/', createBookingValidation, bookingController.handleValidationErrors, bookingController.createBooking);
router.get('/', bookingController.getUserBookings);
router.get('/stats', bookingController.getBookingStats);
router.get('/:id', idValidation, bookingController.handleValidationErrors, bookingController.getBookingById);
router.put('/:id', updateStatusValidation, bookingController.handleValidationErrors, bookingController.updateBookingStatus);
router.delete('/:id', idValidation, bookingController.handleValidationErrors, bookingController.deleteBooking);

module.exports = router;
