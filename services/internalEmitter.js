const axios = require('axios');

/**
 * Utility to send real-time notifications via the Module 7 Gateway
 */
class InternalEmitter {
    constructor() {
        // Default to localhost:3007 (Module 7)
        this.gatewayUrl = process.env.GATEWAY_INTERNAL_URL || 'http://localhost:3007/api/internal/emit';
    }

    /**
     * Emits an event to a specific room via the Gateway
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

    async notifyDriverAssigned(poolId, routeId, driverData) {
        // Notify both pool room and route room
        await this.emit(`pool:${poolId}`, 'driver_assigned', driverData);
        await this.emit(`route:${routeId}`, 'pool_assignment_update', { poolId, driverId: driverData.id });
    }
}

module.exports = new InternalEmitter();
