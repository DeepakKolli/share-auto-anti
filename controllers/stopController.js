const Stop = require('../models/Stop');
const Route = require('../models/Route');

// POST /api/stops → Add a stop to a route
exports.addStop = async (req, res) => {
    try {
        const { stopId, routeId, stopName, sequenceNumber, distanceKm, isMajorHub } = req.body;

        if (!stopId || !routeId || !stopName || sequenceNumber === undefined) {
            return res.status(400).json({ 
                error: "Missing required fields: stopId, routeId, stopName, sequenceNumber" 
            });
        }

        // Validate route exists
        const route = await Route.findOne({ routeId });
        if (!route) {
            return res.status(404).json({ error: `Route '${routeId}' does not exist.` });
        }

        // Prevent duplicate stopId
        const existingStop = await Stop.findOne({ stopId });
        if (existingStop) {
            return res.status(409).json({ error: `Stop with ID '${stopId}' already exists.` });
        }

        // Validate sequence order — no duplicate sequence numbers on the same route
        const conflictingStop = await Stop.findOne({ routeId, sequenceNumber });
        if (conflictingStop) {
            return res.status(409).json({ 
                error: `Sequence number ${sequenceNumber} already exists on route '${routeId}' (stop: ${conflictingStop.stopName}).` 
            });
        }

        const newStop = new Stop({ stopId, routeId, stopName, sequenceNumber, distanceKm, isMajorHub });
        await newStop.save();

        return res.status(201).json({
            message: "Stop added successfully",
            stop: newStop
        });
    } catch (error) {
        console.error("[Stop Controller Error]", error);
        return res.status(500).json({ error: "Internal server error during stop creation." });
    }
};

// GET /api/stops/:routeId → Get all stops for a route (ordered by sequence)
exports.getStopsByRoute = async (req, res) => {
    try {
        const { routeId } = req.params;

        const route = await Route.findOne({ routeId });
        if (!route) {
            return res.status(404).json({ error: `Route '${routeId}' not found.` });
        }

        const stops = await Stop.find({ routeId }).sort('sequenceNumber');

        return res.status(200).json({ 
            routeId,
            routeName: route.routeName,
            stops 
        });
    } catch (error) {
        console.error("[Stop Controller Error]", error);
        return res.status(500).json({ error: "Failed to fetch stops." });
    }
};

// POST /api/stops/validate → Validate origin comes before destination
exports.validateStopOrder = async (req, res) => {
    try {
        const { routeId, originStopId, destinationStopId } = req.body;

        if (!routeId || !originStopId || !destinationStopId) {
            return res.status(400).json({ error: "Missing: routeId, originStopId, destinationStopId" });
        }

        const originStop = await Stop.findOne({ stopId: originStopId, routeId });
        const destinationStop = await Stop.findOne({ stopId: destinationStopId, routeId });

        if (!originStop) {
            return res.status(404).json({ error: `Origin stop '${originStopId}' not found on route '${routeId}'.` });
        }
        if (!destinationStop) {
            return res.status(404).json({ error: `Destination stop '${destinationStopId}' not found on route '${routeId}'.` });
        }

        // Direction-aware: for UP direction, origin.seq < destination.seq
        // For DOWN direction, origin.seq > destination.seq
        const direction = req.body.direction || 'UP';
        let isValid = false;

        if (direction === 'UP') {
            isValid = originStop.sequenceNumber < destinationStop.sequenceNumber;
        } else {
            isValid = originStop.sequenceNumber > destinationStop.sequenceNumber;
        }

        return res.status(200).json({
            valid: isValid,
            direction,
            originSequence: originStop.sequenceNumber,
            destinationSequence: destinationStop.sequenceNumber,
            message: isValid 
                ? "Valid: origin correctly precedes destination for this direction."
                : `Invalid: for ${direction} direction, origin must ${direction === 'UP' ? 'come before' : 'come after'} destination in sequence.`
        });
    } catch (error) {
        console.error("[Stop Controller Error]", error);
        return res.status(500).json({ error: "Validation failed." });
    }
};
