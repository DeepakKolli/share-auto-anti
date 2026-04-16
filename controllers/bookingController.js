const Booking = require('../models/Booking');
const seatAllocationService = require('../services/seatAllocationService');
const internalEmitter = require('../../../module7-realtime-system/backend/services/internalEmitter');
const { reportEvent } = require('../services/analyticsReporter');

const bookingController = {
        /**
         * POST /api/bookings
         * Creates a new booking with atomic seat allocation.
         */
        createBooking: async (req, res) => {
            const { poolId, seatsBooked } = req.body;
            const userId = req.user.id;

            if (!poolId || !seatsBooked) {
                return res.status(400).json({ success: false, message: 'Missing poolId or seatsBooked' });
            }

            if (seatsBooked > 4) {
                return res.status(400).json({ success: false, message: 'Max 4 seats allowed per booking' });
            }

            try {
                // 1. Fetch metadata for pricing
                const PoolModel = require('../models/Pool');
                const RouteModel = require('../../../module2-route-management/backend/models/Route');
                const pricingService = require('../../../module6-pricing-module/backend/services/pricingService');

                const pool = await PoolModel.findById(poolId);
                const route = await RouteModel.findOne({ routeId: pool.routeId });

                if (!pool || !route) {
                    throw new Error('Pool or Route metadata missing for pricing');
                }

                // 2. Calculate dynamic fare
                const fillPercentage = (pool.totalSeats - pool.availableSeats) / pool.totalSeats;
                const dynamicFare = pricingService.calculateDynamicFare(route.baseFare, fillPercentage, 0);
                const perSeatFare = pricingService.calculatePerSeatFare(dynamicFare, pool.totalSeats);
                const totalFarePaid = perSeatFare * seatsBooked;

                // 3. Atomic seat allocation
                const updatedPool = await seatAllocationService.allocateSeats(poolId, seatsBooked);

                // 4. Create booking record with locked fare
                const booking = await Booking.create({
                    userId,
                    poolId,
                    seatsBooked,
                    farePaid: totalFarePaid,
                    status: 'CONFIRMED'
                });

                // 5. Emit real-time update via Central Gateway (Module 7)
                await internalEmitter.notifySeatUpdate(poolId, {
                    poolId,
                    totalSeats: updatedPool.totalSeats,
                    availableSeats: updatedPool.availableSeats,
                    bookedSeats: updatedPool.bookedSeats
                });

                // 6. Report to Analytics (Module 10)
                await reportEvent('BOOKING_CREATED', {
                    bookingId: booking._id,
                    poolId,
                    userId,
                    seatsBooked,
                    amount: totalFarePaid
                });

                res.status(201).json({
                    success: true,
                    message: 'Booking successful',
                    booking,
                    pool: {
                        availableSeats: updatedPool.availableSeats,
                        bookedSeats: updatedPool.bookedSeats
                    }
                });
            } catch (error) {
                res.status(400).json({
                    success: false,
                    message: error.message || 'Booking failed'
                });
            }
        },

        /**
         * GET /api/bookings/user/:userId
         */
        getUserBookings: async (req, res) => {
            try {
                const bookings = await Booking.find({ userId: req.params.userId })
                    .populate('poolId')
                    .sort({ createdAt: -1 });

                res.json({ success: true, bookings });
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        },

        /**
         * GET /api/pools/:poolId/seats
         */
        getPoolSeatStatus: async (req, res) => {
            try {
                const Pool = require('../models/Pool');
                const pool = await Pool.findById(req.params.poolId);
                
                if (!pool) {
                    return res.status(404).json({ success: false, message: 'Pool not found' });
                }

                res.json({
                    success: true,
                    pool: {
                        totalSeats: pool.totalSeats,
                        availableSeats: pool.availableSeats,
                        bookedSeats: pool.bookedSeats
                    }
                });
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        },

        /**
         * PATCH /api/bookings/:id/cancel
         */
        cancelBooking: async (req, res) => {
            try {
                const booking = await Booking.findById(req.params.id);

                if (!booking) {
                    return res.status(404).json({ success: false, message: 'Booking not found' });
                }

                if (booking.status === 'CANCELLED') {
                    return res.status(400).json({ success: false, message: 'Booking already cancelled' });
                }

                // 1. Release seats atomically
                const updatedPool = await seatAllocationService.releaseSeats(booking.poolId, booking.seatsBooked);

                // 2. Update booking status
                booking.status = 'CANCELLED';
                await booking.save();

                // 3. Emit real-time update via Central Gateway (Module 7)
                await internalEmitter.notifySeatUpdate(booking.poolId, {
                    poolId: booking.poolId,
                    totalSeats: updatedPool.totalSeats,
                    availableSeats: updatedPool.availableSeats,
                    bookedSeats: updatedPool.bookedSeats
                });

                // 4. Report to Analytics (Module 10)
                await reportEvent('BOOKING_CANCELLED', {
                    bookingId: booking._id,
                    poolId: booking.poolId,
                    userId: booking.userId,
                    reason: 'User Cancelled'
                });

                res.json({
                    success: true,
                    message: 'Booking cancelled successfully',
                    booking,
                    pool: {
                        availableSeats: updatedPool.availableSeats,
                        bookedSeats: updatedPool.bookedSeats
                    }
                });
            } catch (error) {
                res.status(400).json({ success: false, message: error.message });
            }
        },

        /**
         * POST /api/bookings/release
         * Specifically for payment failures.
         */
        releasePaymentFailedSeat: async (req, res) => {
            try {
                const { bookingId, reason } = req.body;
                const booking = await Booking.findById(bookingId);

                if (!booking) {
                    return res.status(404).json({ success: false, message: 'Booking not found' });
                }

                if (booking.status === 'CANCELLED') {
                    return res.json({ success: true, message: 'Already released' });
                }

                // 1. Release seats atomically
                const updatedPool = await seatAllocationService.releaseSeats(booking.poolId, booking.seatsBooked);

                // 2. Update booking status
                booking.status = 'CANCELLED';
                await booking.save();

                // 3. Revert Pool status if it was in payment phase
                const PoolModel = require('../models/Pool');
                const pool = await PoolModel.findById(booking.poolId);
                if (pool.status === 'WAITING_FOR_PAYMENTS' || pool.status === 'POOL_READY') {
                    // Revert to partially_full so others can fill the released seat
                    pool.status = 'partially_full';
                    await pool.save();
                }

                // 4. Notify Gateway
                await internalEmitter.notifySeatUpdate(booking.poolId, {
                    poolId: booking.poolId,
                    availableSeats: updatedPool.availableSeats,
                    bookedSeats: updatedPool.bookedSeats,
                    status: pool.status
                });

                res.json({ success: true, message: `Seat released due to: ${reason}` });
            } catch (error) {
                console.error('[BookingController] Release Failed:', error);
                res.status(500).json({ success: false, message: error.message });
            }
        }
};

module.exports = bookingController;
