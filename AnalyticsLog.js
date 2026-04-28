const mongoose = require('mongoose');

const analyticsLogSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['BOOKING_CREATED', 'BOOKING_CANCELLED', 'PAYMENT_SUCCESS', 'DRIVER_ASSIGNED', 'POOL_READY', 'POOL_COMPLETED'],
        index: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('AnalyticsLog', analyticsLogSchema);
