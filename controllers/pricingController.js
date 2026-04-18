const pricingService = require('../services/pricingService');
// Reference models from other modules to maintain shared DB access
const Route = require('../../module2-route-management/backend/models/Route');
const Pool = require('../../module5-booking-module/backend/models/Pool');

const pricingController = {
    /**
     * GET /api/pricing/estimate
     * Params: routeId, poolId, waitTime (optional)
     */
    getPriceEstimate: async (req, res) => {
        const { routeId, poolId, waitTimeMinutes } = req.query;

        try {
            // 1. Fetch Route base fare
            const route = await Route.findOne({ routeId });
            if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

            // 2. Fetch Pool status for fill percentage
            const pool = await Pool.findById(poolId);
            if (!pool) return res.status(404).json({ success: false, message: 'Pool not found' });

            const fillPercentage = (pool.totalSeats - pool.availableSeats) / pool.totalSeats;

            // 3. Calculate dynamic fare
            const dynamicFare = pricingService.calculateDynamicFare(
                route.baseFare, 
                fillPercentage, 
                parseInt(waitTimeMinutes) || 0
            );

            // 4. Calculate per-seat fare (estimating based on total available to book)
            const perSeatFare = pricingService.calculatePerSeatFare(dynamicFare, pool.totalSeats);

            res.json({
                success: true,
                data: {
                    baseFare: route.baseFare,
                    dynamicFare,
                    perSeatFare,
                    fillPercentage: (fillPercentage * 100).toFixed(0) + '%',
                    isPeak: pricingService._getCurrentPeakMultiplier() > 1.0
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = pricingController;
