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
    // Direction is NOT stored here — it's runtime-dynamic (UP / DOWN)
    distanceKm: { 
        type: Number, 
        default: 0 
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
