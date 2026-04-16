const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    poolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pool',
        required: true,
        index: true
    },
    seatsBooked: {
        type: Number,
        required: true,
        min: [1, 'Must book at least 1 seat'],
        max: [4, 'Cannot book more than 4 seats at once']
    },
    farePaid: {
        type: Number,
        required: true,
        min: [0, 'Fare cannot be negative']
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
