const axios = require('axios');

class InternalEmitter {
    constructor() {
        this.gatewayUrl = process.env.GATEWAY_INTERNAL_URL || 'http://localhost:3007/api/internal/emit';
    }

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

    async notifyPaymentStatus(userId, status, data) {
        return this.emit(`user:${userId}`, 'payment_status_update', { status, ...data });
    }

    async notifyPoolPaymentComplete(poolId) {
        return this.emit(`pool:${poolId}`, 'all_payments_received', { poolId });
    }
}

module.exports = new InternalEmitter();
