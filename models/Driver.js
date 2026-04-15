const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Driver name is required']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    vehicleNumber: {
        type: String,
        required: [true, 'Vehicle number is required'],
        unique: true
    },
    vehicleType: {
        type: String,
        enum: ['auto', 'cab'],
        required: true
    },
    licenseNumber: {
        type: String,
        required: [true, 'License number is required'],
        unique: true
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    currentRoute: {
        type: String, // routeId
        default: null
    },
    socketId: {
        type: String,
        default: null
    },
    earnings: {
        totalEarnings: { type: Number, default: 0 },
        todayEarnings: { type: Number, default: 0 }
    },
    assignedPools: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pool'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Driver', driverSchema);
