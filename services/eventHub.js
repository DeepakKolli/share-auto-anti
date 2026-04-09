const EventEmitter = require('events');
class EventHub extends EventEmitter {}
const eventHub = new EventHub();

// Mock event listeners just to log the triggers
eventHub.on('user_joined_pool', ({poolId, userId, seats}) => {
    console.log(`[EVENT] user_joined_pool: User ${userId} joined pool ${poolId} with ${seats} seats`);
});

eventHub.on('seat_updated', ({poolId, availableSeats}) => {
    console.log(`[EVENT] seat_updated: Pool ${poolId} has ${availableSeats} seats left`);
});

eventHub.on('pool_full', ({poolId}) => {
    console.log(`[EVENT] pool_full: Pool ${poolId} is now FULL`);
});

eventHub.on('driver_assigned', ({poolId}) => {
     console.log(`[EVENT] driver_assigned: Driver assigning sequence triggered for pool ${poolId}`);
});

eventHub.on('pool_cancelled', ({poolId, reason}) => {
    console.log(`[EVENT] pool_cancelled: Pool ${poolId} cancelled. Reason: ${reason}`);
});

module.exports = eventHub;
