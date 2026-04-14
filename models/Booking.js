const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    routeId: {
        type: String, // Matching Route.routeId
        required: true
    },
    seatsBooked: {
        type: Number,
        required: true,
        min: [1, 'Must book at least 1 seat']
    },
    status: {
        type: String,
        enum: ['CONFIRMED', 'CANCELLED'],
        default: 'CONFIRMED'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Booking', bookingSchema);
