const mongoose = require('mongoose');

const poolSchema = new mongoose.Schema({
    routeId: String,
    status: {
        type: String,
        enum: ["waiting", "partially_full", "full", "POOL_READY", "DRIVER_ASSIGNED", "completed", "cancelled"],
        index: true
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        default: null
    },
    totalSeats: Number,
    bookedSeats: Number
});

module.exports = mongoose.model('Pool', poolSchema);
