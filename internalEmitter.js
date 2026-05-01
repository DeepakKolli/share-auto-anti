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

    async notifyAdmin(event, data) {
        return this.emit('admin', event, data);
    }
}

module.exports = new InternalEmitter();
