const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
    name: String,
    phone: String,
    status: {
        type: String,
        enum: ['OFFLINE', 'ONLINE_AVAILABLE', 'ON_TRIP'],
        default: 'OFFLINE'
    },
    currentLocation: {
        type: { type: String, default: 'Point' },
        coordinates: [Number]
    },
    activeTrips: { type: Number, default: 0 },
    rating: { type: Number, default: 4.5 },
    routeIds: [String],
    isAvailable: Boolean
});

driverSchema.index({ currentLocation: "2dsphere" });

module.exports = mongoose.model('Driver', driverSchema);
