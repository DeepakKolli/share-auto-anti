const mongoose = require('mongoose');

const revenueStatsSchema = new mongoose.Schema({
    totalRevenue: {
        type: Number,
        default: 0
    },
    routeWiseRevenue: {
        type: Map,
        of: Number,
        default: {}
    },
    dailyRevenue: {
        type: Map,
        of: Number,
        default: {}
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('RevenueStats', revenueStatsSchema);
