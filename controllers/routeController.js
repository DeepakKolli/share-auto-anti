const Route = require('../models/Route');
const Stop = require('../models/Stop');

// POST /api/routes → Create a new route
exports.createRoute = async (req, res) => {
    try {
        const { routeId, routeName, distanceKm } = req.body;

        if (!routeId || !routeName) {
            return res.status(400).json({ error: "Missing required fields: routeId, routeName" });
        }

        // Prevent duplicate routes
        const existing = await Route.findOne({ routeId });
        if (existing) {
            return res.status(409).json({ error: `Route with ID '${routeId}' already exists.` });
        }

        const newRoute = new Route({ routeId, routeName, distanceKm });
        await newRoute.save();

        return res.status(201).json({
            message: "Route created successfully",
            route: newRoute
        });
    } catch (error) {
        console.error("[Route Controller Error]", error);
        return res.status(500).json({ error: "Internal server error during route creation." });
    }
};

// GET /api/routes → Get all active routes
exports.getAllRoutes = async (req, res) => {
    try {
        const routes = await Route.find({ isActive: true }).sort('routeName');
        return res.status(200).json({ routes });
    } catch (error) {
        console.error("[Route Controller Error]", error);
        return res.status(500).json({ error: "Failed to fetch routes." });
    }
};

// GET /api/routes/:routeId/stops → Get stops for a particular route (ordered by sequence)
exports.getRouteStops = async (req, res) => {
    try {
        const { routeId } = req.params;

        const route = await Route.findOne({ routeId });
        if (!route) {
            return res.status(404).json({ error: `Route '${routeId}' not found.` });
        }

        const stops = await Stop.find({ routeId }).sort('sequenceNumber');

        return res.status(200).json({
            route: {
                routeId: route.routeId,
                routeName: route.routeName,
                distanceKm: route.distanceKm
            },
            stops
        });
    } catch (error) {
        console.error("[Route Controller Error]", error);
        return res.status(500).json({ error: "Failed to fetch route stops." });
    }
};

// PUT /api/routes/:routeId → Update a route
exports.updateRoute = async (req, res) => {
    try {
        const { routeId } = req.params;
        const { routeName, distanceKm, isActive } = req.body;

        const route = await Route.findOneAndUpdate(
            { routeId },
            { $set: { routeName, distanceKm, isActive } },
            { new: true }
        );

        if (!route) {
            return res.status(404).json({ error: `Route '${routeId}' not found.` });
        }

        return res.status(200).json({
            message: "Route updated successfully",
            route
        });
    } catch (error) {
        console.error("[Route Controller Error]", error);
        return res.status(500).json({ error: "Failed to update route." });
    }
};
