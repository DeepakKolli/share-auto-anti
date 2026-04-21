const assignmentService = require('../services/assignmentService');
const Driver = require('../models/Driver');

exports.assignDriver = async (req, res) => {
    try {
        const { tripId } = req.body;
        if (!tripId) {
            return res.status(400).json({ error: 'tripId is required' });
        }

        const result = await assignmentService.assignDriver(tripId);
        if (result.success) {
            res.json({ message: 'Driver assigned successfully', driver: result.driver });
        } else {
            res.status(404).json({ error: result.message });
        }
    } catch (error) {
        console.error('Error in assignDriver:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getAvailableDrivers = async (req, res) => {
    try {
        const { routeId } = req.query;
        const query = { status: 'ONLINE_AVAILABLE' };
        if (routeId) {
            query.routeIds = routeId;
        }

        const drivers = await Driver.find(query).select('-password');
        res.json(drivers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateDriverStatus = async (req, res) => {
    try {
        const { driverId, status } = req.body;
        if (!driverId || !status) {
            return res.status(400).json({ error: 'driverId and status are required' });
        }

        const driver = await Driver.findByIdAndUpdate(
            driverId,
            { 
                $set: { 
                    status,
                    isAvailable: status === 'ONLINE_AVAILABLE' 
                } 
            },
            { new: true }
        ).select('-password');

        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        res.json({ message: 'Status updated', driver });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
