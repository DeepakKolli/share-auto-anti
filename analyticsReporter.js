const axios = require('axios');

const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3010/api/analytics/log';

const reportEvent = async (type, metadata = {}) => {
    try {
        await axios.post(ANALYTICS_SERVICE_URL, { type, metadata });
        console.log(`[AnalyticsReporter] Event reported: ${type}`);
    } catch (error) {
        console.warn(`[AnalyticsReporter] Failed to report event ${type}:`, error.message);
    }
};

module.exports = { reportEvent };
