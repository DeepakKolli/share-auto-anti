const mongoose = require('mongoose');

const autoAssignmentSchema = new mongoose.Schema({
    driverName: { 
        type: String, 
        required: true 
    },
    autoNumber: { 
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
    direction: { 
        type: String, 
        enum: ['UP', 'DOWN'], 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['WAITING', 'EN_ROUTE', 'FULL', 'OFF_DUTY'], 
        default: 'WAITING',
        index: true
    },
    currentStopIndex: { 
        type: Number, 
        default: 0 
    },
    assignedAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Compound index for the most common query: active autos on a route+direction
autoAssignmentSchema.index({ routeId: 1, direction: 1, status: 1 });

module.exports = mongoose.model('AutoAssignment', autoAssignmentSchema);
