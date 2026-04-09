const Pool = require('../models/Pool');
const eventHub = require('../services/eventHub');

const EXPIRY_MINUTES = 15; // Set according to requirements

async function checkExpiries() {
    const cutoffTime = new Date(Date.now() - (EXPIRY_MINUTES * 60000));

    // Identify pools that have sat around waiting and are older than X mins
    const expiredPools = await Pool.find({
        status: { $in: ['waiting', 'partially_full'] },
        createdAt: { $lte: cutoffTime }
    });

    for (const pool of expiredPools) {
        if (pool.passengers && pool.passengers.length > 0) {
           // Proceed with whatever we have: Partial Dispatch
           pool.status = 'assigned';
           console.log(`[EXPIRY LOGIC] Pool ${pool._id} force assigned via partial dispatch (waited >${EXPIRY_MINUTES}m).`);
           eventHub.emit('driver_assigned', { poolId: pool._id });
        } else {
           // Just a safety condition in case a pool has literally nobody but is open
           pool.status = 'cancelled';
           console.log(`[EXPIRY LOGIC] Pool ${pool._id} cancelled (empty for >${EXPIRY_MINUTES}m).`);
           eventHub.emit('pool_cancelled', { poolId: pool._id, reason: 'time_expired_empty' });
        }
        await pool.save();
    }
}

module.exports = {
    // Start interval
    start: () => {
        setInterval(checkExpiries, 60000); // Check once a minute
        console.log(`[CRON] Pool expiry worker started loop. Checking strictly for age threshold > ${EXPIRY_MINUTES}m.`);
    },
    // Export raw function for tests without interval
    checkExpiries
};
