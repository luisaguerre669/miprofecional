const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { basicVerification } = require('../middleware/basicVerification');
const { requireActiveSubscriptionLight } = require('../middleware/requireActiveSubscription');
const { bookingsController } = require('../modules/bookings');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// POST /api/bookings - Create booking (exact same signature as original)
router.post('/', basicVerification, requireActiveSubscriptionLight, bookingsController.createBooking.bind(bookingsController));

// GET /api/bookings - Get user bookings (exact same signature as original)
router.get('/', bookingsController.getUserBookings.bind(bookingsController));

// GET /api/bookings/:id - Get booking by ID (exact same signature as original)
router.get('/:id', bookingsController.getBooking.bind(bookingsController));

// PUT /api/bookings/:id - Update booking status (exact same signature as original)
router.put('/:id', basicVerification, requireActiveSubscriptionLight, bookingsController.updateBookingStatus.bind(bookingsController));

// DELETE /api/bookings/:id - Delete booking (exact same signature as original)
router.delete('/:id', bookingsController.deleteBooking.bind(bookingsController));

module.exports = router;
