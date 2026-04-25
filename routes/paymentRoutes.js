const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/payments/initiate', paymentController.initiatePayments);
router.post('/payments/process', paymentController.processPayment);
router.get('/payments/:paymentId', paymentController.getPaymentStatus);
router.get('/payments/booking/:bookingId', paymentController.getBookingPayment);

module.exports = router;
