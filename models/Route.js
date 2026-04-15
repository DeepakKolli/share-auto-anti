const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
    routeId: { 
        type: String, 
        required: true, 
        unique: true,
        index: true
    },
    routeName: { 
        type: String, 
        required: true 
    },
    capacity: {
        type: Number,
        default: 3,
        required: true
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Route', routeSchema);
