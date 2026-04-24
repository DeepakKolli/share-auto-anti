const paymentService = require('../services/paymentService');
const Payment = require('../models/Payment');

exports.initiatePayments = async (req, res) => {
    try {
        const { poolId } = req.body;
        if (!poolId) {
            return res.status(400).json({ error: 'poolId is required' });
        }

        const payments = await paymentService.initiatePoolPayments(poolId);
        res.json({ message: 'Payments initiated', count: payments.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.processPayment = async (req, res) => {
    try {
        const { paymentId, success = true } = req.body;
        if (!paymentId) {
            return res.status(400).json({ error: 'paymentId is required' });
        }

        const payment = await paymentService.processPayment(paymentId, success);
        res.json({ message: `Payment ${payment.status}`, payment });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getPaymentStatus = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const payment = await Payment.findById(paymentId);
        if (!payment) return res.status(404).json({ error: 'Payment not found' });
        res.json(payment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getBookingPayment = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const payment = await Payment.findOne({ bookingId });
        if (!payment) return res.status(404).json({ error: 'No payment found for this booking' });
        res.json(payment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
