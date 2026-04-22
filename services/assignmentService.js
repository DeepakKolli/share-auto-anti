const Driver = require('../models/Driver');
const Pool = require('../models/Pool');
const internalEmitter = require('./internalEmitter');
const { reportEvent } = require('./analyticsReporter');

const WEIGHTS = {
    distance: 10,
    load: 5,
    rating: 2
};

class AssignmentService {
    /**
     * Finds the best driver for a pool based on proximity, load, and rating.
     */
    async findBestDriver(poolId, pickupLocation = { type: 'Point', coordinates: [83.3167, 17.6868] }) {
        const pool = await Pool.findById(poolId);
        if (!pool) throw new Error('Pool not found');
        if (pool.status !== 'POOL_READY') throw new Error('Pool is not in POOL_READY state');

        // 1. Get candidate drivers with distance from pickup
        const candidates = await Driver.aggregate([
            {
                $geoNear: {
                    near: pickupLocation,
                    distanceField: "distance", // In meters
                    spherical: true,
                    query: { 
                        status: 'ONLINE_AVAILABLE', 
                        routeIds: pool.routeId 
                    }
                }
            }
        ]);

        if (candidates.length === 0) {
            console.log(`No available drivers found for route ${pool.routeId}`);
            return null;
        }

        // 2. Calculate scores
        // score = (dist_w * proximity) + (load_w * active_trips) - (rating_w * rating)
        // Note: Lower distance in KM is better, so we use distance / 1000
        const scoredDrivers = candidates.map(driver => {
            const distanceKm = driver.distance / 1000;
            const score = (WEIGHTS.distance * distanceKm) + 
                          (WEIGHTS.load * (driver.activeTrips || 0)) - 
                          (WEIGHTS.rating * (driver.rating || 4.5));
            return { ...driver, finalScore: score };
        });

        // 3. Sort by lowest score
        scoredDrivers.sort((a, b) => a.finalScore - b.finalScore);
        return scoredDrivers[0];
    }

    /**
     * Atomically assigns a driver to a pool
     */
    async assignDriver(poolId) {
        const pool = await Pool.findById(poolId);
        if (!pool) return { success: false, message: 'Pool not found' };

        // For this MVP, we assume a default pickup point if none provided
        const bestDriverCandidate = await this.findBestDriver(poolId);
        
        if (!bestDriverCandidate) {
            return { success: false, message: 'No drivers available' };
        }

        // Atomic assignment using findOneAndUpdate to prevent race conditions
        const assignedDriver = await Driver.findOneAndUpdate(
            { 
                _id: bestDriverCandidate._id,
                status: 'ONLINE_AVAILABLE' // Double check availability
            },
            {
                $set: { 
                    status: 'ON_TRIP',
                    isAvailable: false,
                    currentRoute: pool.routeId
                },
                $inc: { activeTrips: 1 },
                $push: { assignedPools: pool._id }
            },
            { new: true }
        );

        if (!assignedDriver) {
            // Driver was snatched by someone else or went offline
            return this.assignDriver(poolId); // Retry
        }

        // Update Pool status
        await Pool.findByIdAndUpdate(poolId, {
            $set: { 
                status: 'DRIVER_ASSIGNED',
                driverId: assignedDriver._id
            }
        });

        // Broadcast real-time notifications
        await internalEmitter.notifyDriverAssigned(poolId, pool.routeId, {
            id: assignedDriver._id,
            name: assignedDriver.name,
            phone: assignedDriver.phone,
            rating: assignedDriver.rating
        });

        // 4. Report to Analytics (Module 10)
        await reportEvent('DRIVER_ASSIGNED', {
            poolId,
            driverId: assignedDriver._id,
            routeId: pool.routeId
        });

        return { success: true, driver: assignedDriver };
    }
}

module.exports = new AssignmentService();
