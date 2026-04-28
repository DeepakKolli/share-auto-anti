const mongoose = require('mongoose');

const poolSchema = new mongoose.Schema({
    routeId: String,
    status: String,
    totalSeats: Number,
    bookedSeats: Number,
    availableSeats: Number
});

module.exports = mongoose.model('Pool', poolSchema);
