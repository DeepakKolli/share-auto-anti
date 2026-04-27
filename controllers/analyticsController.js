const analyticsService = require('../services/analyticsService');

exports.logExternalEvent = async (req, res) => {
    try {
        const { type, metadata } = req.body;
        if (!type) return res.status(400).json({ error: 'Event type is required' });

        const log = await analyticsService.logEvent(type, metadata);
        res.json({ success: true, logId: log._id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getLogs = async (req, res) => {
    try {
        const { type, limit = 50 } = req.query;
        const filter = type ? { type } : {};
        const logs = await require('../models/AnalyticsLog').find(filter)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit));
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
