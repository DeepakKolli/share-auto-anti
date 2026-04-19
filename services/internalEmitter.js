const axios = require('axios');

/**
 * Utility to send real-time notifications via the Module 7 Gateway
 */
class InternalEmitter {
    constructor() {
        this.gatewayUrl = process.env.GATEWAY_INTERNAL_URL || 'http://localhost:3007/api/internal/emit';
    }

    /**
     * Emits an event to a specific room via the Gateway
     * @param {string} room - The room name (e.g., 'pool:123' or 'route:RT-01')
     * @param {string} event - The socket event name
     * @param {object} data - The payload
     */
    async emit(room, event, data) {
        try {
            await axios.post(this.gatewayUrl, { room, event, data });
            console.log(`[InternalEmitter] Success: "${event}" -> "${room}"`);
            return true;
        } catch (error) {
            console.error(`[InternalEmitter] Error emitting "${event}":`, error.message);
            return false;
        }
    }

    // --- Helper shortcuts ---
    
    async notifyPoolUpdate(poolId, poolData) {
        return this.emit(`pool:${poolId}`, 'pool_update', poolData);
    }

    async notifySeatUpdate(poolId, seatData) {
        return this.emit(`pool:${poolId}`, 'seat_update', seatData);
    }

    async notifyDriverAssignment(routeId, poolData) {
        return this.emit(`route:${routeId}`, 'driver_notification', poolData);
    }

    async notifyBookingConfirmed(userId, bookingData) {
        // Assume user joins a private room based on their userId
        return this.emit(`user:${userId}`, 'booking_confirmed', bookingData);
    }
}

module.exports = new InternalEmitter();
