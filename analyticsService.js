const AnalyticsLog = require('../models/AnalyticsLog');
const RevenueStats = require('../models/RevenueStats');
const internalEmitter = require('./internalEmitter');

class AnalyticsService {
    /**
     * Entry point for all system-wide events
     */
    async logEvent(type, metadata = {}) {
        try {
            // 1. Save to AnalyticsLogs
            const log = await AnalyticsLog.create({ type, metadata });
            console.log(`[AnalyticsService] Logged: ${type}`);

            // 2. Specialized handling for revenue
            if (type === 'PAYMENT_SUCCESS' && metadata.amount) {
                await this._updateRevenue(metadata.amount, metadata.routeId);
            }

            // 3. Broadcast to real-time Admin room
            await internalEmitter.notifyAdmin('SYSTEM_EVENT', {
                type,
                metadata,
                timestamp: log.timestamp
            });

            return log;
        } catch (error) {
            console.error(`[AnalyticsService] Error logging event ${type}:`, error.message);
            throw error;
        }
    }

    /**
     * Updates revenue aggregates atomically
     */
    async _updateRevenue(amount, routeId) {
        const today = new Date().toISOString().split('T')[0];
        
        let stats = await RevenueStats.findOne();
        if (!stats) stats = new RevenueStats();

        // Global
        stats.totalRevenue += amount;

        // Route-wise
        const currentRouteRev = stats.routeWiseRevenue.get(routeId) || 0;
        stats.routeWiseRevenue.set(routeId, currentRouteRev + amount);

        // Daily
        const currentDailyRev = stats.dailyRevenue.get(today) || 0;
        stats.dailyRevenue.set(today, currentDailyRev + amount);

        stats.lastUpdated = new Date();
        await stats.save();

        // Broadcast revenue update
        await internalEmitter.notifyAdmin('REVENUE_UPDATED', {
            totalRevenue: stats.totalRevenue,
            todayRevenue: stats.dailyRevenue.get(today)
        });
    }

    /**
     * Aggregates KPIs for the Dashboard
     */
    async getKPIs() {
        const stats = await RevenueStats.findOne();
        const logs = await AnalyticsLog.find().sort({ timestamp: -1 }).limit(10);
        
        // Simple counts from logs for simulation purposes
        // In a real system, these would be separate counters
        const activePoolsCount = await AnalyticsLog.countDocuments({ 
            type: 'POOL_READY',
            timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
        });

        return {
            totalRevenue: stats ? stats.totalRevenue : 0,
            activePoolsCount,
            recentLogs: logs
        };
    }
}

module.exports = new AnalyticsService();
