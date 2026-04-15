const Driver = require('../models/Driver');
const Pool = require('../models/Pool');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const internalEmitter = require('../../../module7-realtime-system/backend/services/internalEmitter');

class DriverController {
    // 1. Auth Logic
    async register(req, res) {
        try {
            const { name, phone, password, vehicleNumber, vehicleType, licenseNumber } = req.body;
            
            const existingDriver = await Driver.findOne({ $or: [{ phone }, { vehicleNumber }, { licenseNumber }] });
            if (existingDriver) {
                return res.status(400).json({ success: false, message: 'Driver with these credentials already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const driver = new Driver({
                name, phone, password: hashedPassword, vehicleNumber, vehicleType, licenseNumber
            });

            await driver.save();
            res.status(201).json({ success: true, message: 'Driver registered successfully' });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async login(req, res) {
        try {
            const { phone, password } = req.body;
            const driver = await Driver.findOne({ phone });

            if (!driver || !(await bcrypt.compare(password, driver.password))) {
                return res.status(401).json({ success: false, message: 'Invalid phone or password' });
            }

            const token = jwt.sign(
                { driverId: driver._id, phone: driver.phone },
                process.env.JWT_SECRET || 'driver_secret_key',
                { expiresIn: '24h' }
            );

            res.json({ success: true, token, driver: { id: driver._id, name: driver.name, phone: driver.phone } });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // 2. Status APIs
    async goOnline(req, res) {
        try {
            const driver = await Driver.findByIdAndUpdate(req.driverId, { isOnline: true }, { new: true });
            res.json({ success: true, data: driver });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async goOffline(req, res) {
        try {
            const driver = await Driver.findByIdAndUpdate(req.driverId, { isOnline: false }, { new: true });
            res.json({ success: true, data: driver });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // 3. Pool Operations (ATOMIC)
    async acceptPool(req, res) {
        try {
            const { poolId } = req.body;
            const driverId = req.driverId;

            // Atomic update to prevent race conditions
            const pool = await Pool.findOneAndUpdate(
                { _id: poolId, status: 'waiting', driverId: null },
                { status: 'assigned', driverId: driverId },
                { new: true }
            );

            if (!pool) {
                return res.status(400).json({ success: false, message: 'Pool is no longer available or already assigned' });
            }

            // Update driver status
            await Driver.findByIdAndUpdate(driverId, {
                isAvailable: false,
                $push: { assignedPools: poolId }
            });

            // Emit notifications via Central Gateway
            await internalEmitter.emit(`pool:${poolId}`, 'pool_accepted', { poolId, driverId });
            await internalEmitter.emit(`route:${pool.routeId}`, 'remove_pool', { poolId });

            res.json({ success: true, message: 'Pool accepted successfully', data: pool });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async completePool(req, res) {
        try {
            const { poolId } = req.body;
            const driverId = req.driverId;

            const pool = await Pool.findOne({ _id: poolId, driverId: driverId });
            if (!pool) {
                return res.status(404).json({ success: false, message: 'Pool not found or not assigned to you' });
            }

            if (pool.status === 'completed') {
                return res.status(400).json({ success: false, message: 'Pool already completed' });
            }

            // Calculate earnings: ₹20 per seat
            const totalBookedSeats = pool.passengers.reduce((sum, p) => sum + p.seats, 0);
            const earnings = totalBookedSeats * 20;

            // Update Pool
            pool.status = 'completed';
            await pool.save();

            // Update Driver
            await Driver.findByIdAndUpdate(driverId, {
                isAvailable: true,
                $pull: { assignedPools: poolId },
                $inc: { 'earnings.totalEarnings': earnings, 'earnings.todayEarnings': earnings }
            });

            // Emit via Gateway
            await internalEmitter.emit(`pool:${poolId}`, 'ride_completed', { poolId, driverId });

            res.json({ success: true, message: 'Pool completed', earnings });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async getMyAssignedPools(req, res) {
        try {
            const pools = await Pool.find({ driverId: req.driverId, status: 'assigned' });
            res.json({ success: true, data: pools });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async getDriverData(req, res) {
        try {
            const driver = await Driver.findById(req.driverId).select('-password');
            res.json({ success: true, data: driver });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
}

module.exports = new DriverController();
