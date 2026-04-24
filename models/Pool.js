const mongoose = require('mongoose');

const poolSchema = new mongoose.Schema({
    routeId: String,
    departureTime: Date,
    status: String,
    totalSeats: Number,
    availableSeats: Number,
    bookedSeats: Number,
    passengers: [{
        userId: String,
        seats: Number
    }]
});

module.exports = mongoose.model('Pool', poolSchema);
