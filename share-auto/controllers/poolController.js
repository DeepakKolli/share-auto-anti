const poolService = require('../services/poolService');
const Pool = require('../models/Pool');

// POST /request-ride
exports.requestRide = async (req, res) => {
    try {
        const { userId, routeId, departureTime, seats } = req.body;
        
        if (!userId || !routeId || !departureTime) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        const numericSeats = parseInt(seats || 1, 10);
        if (numericSeats > 3) {
             return res.status(400).json({ error: "Cannot book more than 3 seats." });
        }

        const result = await poolService.requestRide({
            userId,
            routeId,
            departureTimeStr: departureTime,
            seats: numericSeats
        });

        return res.status(200).json({
            message: result.isNew ? "New pool created successfully" : "Joined existing matching pool",
            pool: result.pool
        });
    } catch (error) {
        console.error("[Controller Error]", error);
        return res.status(500).json({ error: "Internal Server Error during ride request." });
    }
};

// GET /pools/:id
exports.getPoolDetails = async (req, res) => {
    try {
        const pool = await Pool.findById(req.params.id);
        if (!pool) return res.status(404).json({ error: "Pool not found" });
        return res.status(200).json({ pool });
    } catch (error) {
        return res.status(500).json({ error: "Server error while fetching." });
    }
}
