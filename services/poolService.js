const Pool = require('../models/Pool');
const eventHub = require('./eventHub');

const DRIVER_ASSIGNMENT_THRESHOLD = 2; // Seats required before assigning driver automatically

class PoolService {
  /**
   * Main logic for ride grouping: matches by route, time boundary (+/- 10 mins) and availability.
   */
  async requestRide({ userId, routeId, departureTimeStr, seats = 1 }) {
    const requestedTime = new Date(departureTimeStr);
    
    // Time Window logic +/- 10 mins
    const minTime = new Date(requestedTime.getTime() - 10 * 60000);
    const maxTime = new Date(requestedTime.getTime() + 10 * 60000);

    // Atomic match and join preventing concurrency overbooking
    const matchedPool = await Pool.findOneAndUpdate(
      {
        routeId: routeId,
        status: { $in: ["waiting", "partially_full"] },
        availableSeats: { $gte: seats }, // strict capacity control
        departureTime: { $gte: minTime, $lte: maxTime }
      },
      {
        $inc: { availableSeats: -seats },
        $push: {
          passengers: { userId, seats, joinedAt: new Date() }
        }
      },
      { new: true, sort: { departureTime: 1 } } // Attempt grouping with the earliest departure one
    );

    if (matchedPool) {
      await this.handlePostJoinUpdates(matchedPool, userId, seats);
      return { pool: matchedPool, isNew: false };
    }

    // No match, so we spawn a new pool
    const newPool = new Pool({
      routeId,
      departureTime: requestedTime,
      totalSeats: 3, // Auto typically has 3 seats
      availableSeats: 3 - seats,
      passengers: [{ userId, seats, joinedAt: new Date() }],
      status: "waiting"
    });

    await newPool.save();
    
    // Check if new pool already met thresholds with initial seats
    await this.handlePostJoinUpdates(newPool, userId, seats);
    return { pool: newPool, isNew: true };
  }

  /**
   * Internal logic that transitions pool status based on occupancy and business rules
   */
  async handlePostJoinUpdates(pool, userId, seats) {
    eventHub.emit('user_joined_pool', { poolId: pool._id, userId, seats });
    eventHub.emit('seat_updated', { poolId: pool._id, availableSeats: pool.availableSeats });

    let updatedStatus = pool.status;

    // Check full capacity
    if (pool.availableSeats === 0) {
      updatedStatus = 'full';
      eventHub.emit('pool_full', { poolId: pool._id });
    } else if (updatedStatus === 'waiting') {
        updatedStatus = 'partially_full';
    }

    // Trigger driver assignment if threshold reached
    const occupiedSeats = pool.totalSeats - pool.availableSeats;
    if (occupiedSeats >= DRIVER_ASSIGNMENT_THRESHOLD && ['waiting', 'partially_full', 'full'].includes(updatedStatus)) {
      updatedStatus = 'assigned';
      eventHub.emit('driver_assigned', { poolId: pool._id });
    }

    if (updatedStatus !== pool.status) {
      pool.status = updatedStatus;
      await Pool.updateOne({ _id: pool._id }, { $set: { status: updatedStatus } });
    }
  }
}

module.exports = new PoolService();
