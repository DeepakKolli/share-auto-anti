const Payment = require('../models/Payment');
const Pool = require('../models/Pool');
const Booking = require('../models/Booking');
const internalEmitter = require('./internalEmitter');
const { reportEvent } = require('./analyticsReporter');
const axios = require('axios');

class PaymentService {
    /**
     * Initiates payments for all users in a pool
     */
    async initiatePoolPayments(poolId) {
        // 1. Fetch all active bookings for this pool
        const bookings = await Booking.find({ poolId, status: 'CONFIRMED' });
        if (bookings.length === 0) {
            console.log(`[PaymentService] No active bookings found for pool ${poolId}`);
            return [];
        }

        const expiresAt = new Date(Date.now() + 5 * 60000); // 5 minute expiry
        
        const paymentPromises = bookings.map(async (b) => {
            // Using bookingId as idempotency key
            return Payment.findOneAndUpdate(
                { bookingId: b._id },
                {
                    $setOnInsert: {
                        userId: b.userId,
                        poolId: poolId,
                        amount: b.farePaid,
                        status: 'PENDING',
                        expiresAt: expiresAt
                    }
                },
                { upsert: true, new: true }
            );
        });

        const payments = await Promise.all(paymentPromises);

        // 2. Update Pool Status to WAITING_FOR_PAYMENTS
        await Pool.findByIdAndUpdate(poolId, { $set: { status: 'WAITING_FOR_PAYMENTS' } });
        
        // Notify users
        for (const p of payments) {
            await internalEmitter.notifyPaymentStatus(p.userId, 'PENDING', { 
                paymentId: p._id, 
                amount: p.amount,
                expiresAt: p.expiresAt 
            });
        }

        return payments;
    }

    /**
     * Simulates payment processing
     */
    async processPayment(paymentId, simulateSuccess = true) {
        const payment = await Payment.findById(paymentId);
        if (!payment) throw new Error('Payment not found');
        if (payment.status !== 'PENDING') throw new Error('Payment already processed or expired');

        payment.attempts += 1;
        
        if (simulateSuccess) {
            payment.status = 'SUCCESS';
            payment.transactionId = `TXN_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        } else {
            if (payment.attempts >= 2) {
                payment.status = 'FAILED';
            } else {
                // Stay pending for one more retry
                payment.status = 'PENDING';
            }
        }

        await payment.save();

        if (payment.status === 'SUCCESS') {
            await this._checkAndFinalizePool(payment.poolId);
            
            // Log to Analytics (Module 10)
            await reportEvent('PAYMENT_SUCCESS', {
                paymentId: payment._id,
                bookingId: payment.bookingId,
                userId: payment.userId,
                poolId: payment.poolId,
                amount: payment.amount
            });
        } else if (payment.status === 'FAILED') {
            await this._handlePaymentFailure(payment);
        }

        return payment;
    }

    /**
     * Checks if all users in a pool have paid
     */
    async _checkAndFinalizePool(poolId) {
        // We need to know who is supposed to pay. 
        // In a real system, we'd check against the Booking records for this pool.
        // For simulation, we'll check all payments associated with this poolId.
        const allPayments = await Payment.find({ poolId });
        const allSuccess = allPayments.every(p => p.status === 'SUCCESS');

        if (allSuccess) {
            console.log(`[PaymentService] All payments successful for pool ${poolId}`);
            
            // 1. Update Pool Status to DRIVER_ASSIGNED or similar trigger
            // In our flow, we notify Module 8 to finish assignment
            const ASSIGNMENT_SERVICE_URL = process.env.ASSIGNMENT_SERVICE_URL || 'http://localhost:3008/api/assign-driver';
            await axios.post(ASSIGNMENT_SERVICE_URL, { tripId: poolId });

            await internalEmitter.notifyPoolPaymentComplete(poolId);
        }
    }

    /**
     * Handles what happens when a payment fails or expires
     */
    async _handlePaymentFailure(payment) {
        console.log(`[PaymentService] Payment failed for user ${payment.userId} in pool ${payment.poolId}`);
        
        // Notify Booking/Pooling to release seat
        const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://localhost:3005/api/bookings/release';
        try {
            await axios.post(BOOKING_SERVICE_URL, { 
                bookingId: payment.bookingId,
                reason: 'Payment Failed/Expired'
            });
        } catch (error) {
            console.error('[PaymentService] Failed to notify Booking Module:', error.message);
        }

        await internalEmitter.notifyPaymentStatus(payment.userId, payment.status, {
            bookingId: payment.bookingId,
            message: 'Payment failed or expired. Your seat has been released.'
        });
    }

    /**
     * Background task to expire old payments
     */
    async expirePayments() {
        const expired = await Payment.find({
            status: 'PENDING',
            expiresAt: { $lt: new Date() }
        });

        for (const p of expired) {
            p.status = 'EXPIRED';
            await p.save();
            await this._handlePaymentFailure(p);
        }

        return expired.length;
    }
}

module.exports = new PaymentService();
