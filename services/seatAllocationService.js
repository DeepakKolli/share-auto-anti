const Pool = require('../models/Pool');

class SeatAllocationService {
    /**
     * Atomically allocates seats in a pool.
     * Prevents overbooking using MongoDB query-level condition.
     */
    async allocateSeats(poolId, seatsBooked) {
        try {
            const updatedPool = await Pool.findOneAndUpdate(
                { 
                    _id: poolId, 
                    availableSeats: { $gte: seatsBooked } 
                },
                { 
                    $inc: { 
                        availableSeats: -seatsBooked,
                        bookedSeats: seatsBooked
                    } 
                },
                { new: true, runValidators: true }
            );

            if (!updatedPool) {
                throw new Error('Overbooking prevented: Not enough available seats or pool not found');
            }

            return updatedPool;
        } catch (error) {
            console.error(`[SeatAllocationService] Allocation failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Atomically releases seats back to the pool (e.g., on cancellation).
     */
    async releaseSeats(poolId, seatsToRelease) {
        try {
            const updatedPool = await Pool.findOneAndUpdate(
                { _id: poolId },
                { 
                    $inc: { 
                        availableSeats: seatsToRelease,
                        bookedSeats: -seatsToRelease
                    } 
                },
                { new: true, runValidators: true }
            );

            if (!updatedPool) {
                throw new Error('Pool not found for seat release');
            }

            return updatedPool;
        } catch (error) {
            console.error(`[SeatAllocationService] Release failed: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new SeatAllocationService();
