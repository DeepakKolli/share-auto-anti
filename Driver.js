const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
    status: String,
    currentLocation: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
    },
    rating: Number,
    activeTrips: Number
});

module.exports = mongoose.model('Driver', driverSchema);
