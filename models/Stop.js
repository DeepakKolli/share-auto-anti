const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
    stopId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    routeId: {
        type: String,
        required: true,
        index: true
    },
    stopName: {
        type: String,
        required: true
    },
    sequenceNumber: {
        type: Number,
        required: true
    },
    distanceKm: {
        type: Number,
        default: 0
    },
    isMajorHub: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index: one route's stops always queried together, sorted by sequence
stopSchema.index({ routeId: 1, sequenceNumber: 1 });

module.exports = mongoose.model('Stop', stopSchema);
