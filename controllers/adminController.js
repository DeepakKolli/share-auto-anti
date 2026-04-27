const analyticsService = require('../services/analyticsService');
const Driver = require('../models/Driver');
const Pool = require('../models/Pool');

exports.getOverview = async (req, res) => {
    try {
        const kpis = await analyticsService.getKPIs();
        
        // Add counts of live stuff
        const onlineDrivers = await Driver.countDocuments({ status: 'ONLINE' });
        const busyDrivers = await Driver.countDocuments({ status: 'BUSY' });
        const activePools = await Pool.countDocuments({ 
            status: { $in: ['waiting', 'partially_full', 'full', 'POOL_READY', 'WAITING_FOR_PAYMENTS'] } 
        });

        res.json({
            ...kpis,
            onlineDrivers,
            busyDrivers,
            activePools
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getLiveDrivers = async (req, res) => {
    try {
        const drivers = await Driver.find({ status: { $ne: 'OFFLINE' } });
        res.json(drivers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getActivePools = async (req, res) => {
    try {
        const pools = await Pool.find({ 
            status: { $in: ['waiting', 'partially_full', 'full', 'POOL_READY', 'WAITING_FOR_PAYMENTS'] } 
        });
        res.json(pools);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
