const AutoAssignment = require('../models/AutoAssignment');
const Route = require('../models/Route');

// POST /api/assignments → Assign an auto driver to a route
exports.assignAuto = async (req, res) => {
    try {
        const { driverName, autoNumber, routeId, direction } = req.body;

        if (!driverName || !autoNumber || !routeId || !direction) {
            return res.status(400).json({ 
                error: "Missing required fields: driverName, autoNumber, routeId, direction" 
            });
        }

        // Validate direction enum
        if (!['UP', 'DOWN'].includes(direction)) {
            return res.status(400).json({ error: "Direction must be 'UP' or 'DOWN'." });
        }

        // Validate route exists
        const route = await Route.findOne({ routeId });
        if (!route) {
            return res.status(404).json({ error: `Route '${routeId}' not found.` });
        }

        // Upsert: if auto already exists, reassign it; else create new
        const assignment = await AutoAssignment.findOneAndUpdate(
            { autoNumber },
            { 
                driverName, 
                routeId, 
                direction, 
                status: 'WAITING', 
                currentStopIndex: 0,
                assignedAt: new Date()
            },
            { new: true, upsert: true }
        );

        return res.status(200).json({
            message: `Auto ${autoNumber} assigned to route '${routeId}' (${direction})`,
            assignment
        });
    } catch (error) {
        console.error("[Assignment Controller Error]", error);
        return res.status(500).json({ error: "Internal server error during auto assignment." });
    }
};

// GET /api/assignments?routeId=&direction= → Get active autos on a route
exports.getActiveAssignments = async (req, res) => {
    try {
        const { routeId, direction } = req.query;

        // Build dynamic filter
        const filter = { status: { $ne: 'OFF_DUTY' } };
        if (routeId) filter.routeId = routeId;
        if (direction) filter.direction = direction;

        const assignments = await AutoAssignment.find(filter).sort('assignedAt');

        return res.status(200).json({ assignments });
    } catch (error) {
        console.error("[Assignment Controller Error]", error);
        return res.status(500).json({ error: "Failed to fetch assignments." });
    }
};

// PATCH /api/assignments/:autoNumber → Update auto status/position
exports.updateAssignment = async (req, res) => {
    try {
        const { autoNumber } = req.params;
        const { currentStopIndex, status } = req.body;

        const updateFields = {};
        if (currentStopIndex !== undefined) updateFields.currentStopIndex = currentStopIndex;
        if (status) {
            if (!['WAITING', 'EN_ROUTE', 'FULL', 'OFF_DUTY'].includes(status)) {
                return res.status(400).json({ error: "Invalid status. Must be: WAITING, EN_ROUTE, FULL, OFF_DUTY" });
            }
            updateFields.status = status;
        }

        const assignment = await AutoAssignment.findOneAndUpdate(
            { autoNumber },
            { $set: updateFields },
            { new: true }
        );

        if (!assignment) {
            return res.status(404).json({ error: `Auto '${autoNumber}' not found.` });
        }

        return res.status(200).json({
            message: `Auto ${autoNumber} updated`,
            assignment
        });
    } catch (error) {
        console.error("[Assignment Controller Error]", error);
        return res.status(500).json({ error: "Failed to update assignment." });
    }
};
