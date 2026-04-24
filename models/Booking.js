const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    poolId: mongoose.Schema.Types.ObjectId,
    seatsBooked: Number,
    farePaid: Number,
    status: String
});

module.exports = mongoose.model('Booking', bookingSchema);
