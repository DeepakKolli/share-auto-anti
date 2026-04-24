const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true, // Idempotency
        index: true
    },
    poolId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'FAILED', 'EXPIRED'],
        default: 'PENDING'
    },
    attempts: {
        type: Number,
        default: 0
    },
    expiresAt: {
        type: Date,
        required: true
    },
    transactionId: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Payment', paymentSchema);
