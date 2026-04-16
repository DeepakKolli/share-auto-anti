const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

const controller = require('../controllers/bookingController');

// POST /api/bookings - Book seats (Atomic + Gateway Emit)
router.post('/bookings', authMiddleware, controller.createBooking);

// GET /api/bookings/:userId - Get user bookings
router.get('/bookings/:userId', authMiddleware, controller.getUserBookings);

// GET /api/pools/:poolId/seats - Get current seat status
router.get('/pools/:poolId/seats', controller.getPoolSeatStatus);

// PATCH /api/bookings/:id/cancel - Cancel booking (Atomic rollback + Gateway Emit)
router.patch('/bookings/:id/cancel', authMiddleware, controller.cancelBooking);

// POST /api/bookings/release - Internal route for payment failure/timeout
router.post('/bookings/release', controller.releasePaymentFailedSeat);

module.exports = router;
