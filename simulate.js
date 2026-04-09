const mongoose = require('mongoose');
const poolService = require('./services/poolService');
const Pool = require('./models/Pool');
const expiryJob = require('./cron/expiryJob');

async function runSimulation() {
    console.log("=== STARTING RIDE POOLING ENGINE SIMULATION ===");
    
    // Connect and wipe
    await mongoose.connect('mongodb://127.0.0.1:27017/share_auto_prototype');
    await Pool.deleteMany({}); 
    console.log("[Setup] Database Cleaned.");

    // Reference Time
    const commonTime = new Date();
    commonTime.setMinutes(commonTime.getMinutes() + 20); // departing in 20 mins

    console.log("\n--- SCENARIO 1: First Rider (Creates Pool) ---");
    const req1 = await poolService.requestRide({
        userId: "UserA", routeId: "MVP_COLONY_TO_RK_BEACH", departureTimeStr: commonTime.toISOString(), seats: 1
    });
    console.log(`[Result] Pool ID: ${req1.pool._id} | Status: ${req1.pool.status} | Available: ${req1.pool.availableSeats}`);

    console.log("\n--- SCENARIO 2: Second Rider (Triggers Driver) ---");
    const req2 = await poolService.requestRide({
        userId: "UserB", routeId: "MVP_COLONY_TO_RK_BEACH", departureTimeStr: commonTime.toISOString(), seats: 1
    });
    console.log(`[Result] Pool ID: ${req2.pool._id} | Status: ${req2.pool.status} | Available: ${req2.pool.availableSeats}`);

    console.log("\n--- SCENARIO 3: Third Rider (Fills Pool) ---");
    const req3 = await poolService.requestRide({
        userId: "UserC", routeId: "MVP_COLONY_TO_RK_BEACH", departureTimeStr: commonTime.toISOString(), seats: 1
    });
    console.log(`[Result] Pool ID: ${req3.pool._id} | Status: ${req3.pool.status} | Available: ${req3.pool.availableSeats}`);

    console.log("\n--- SCENARIO 4: Overflow Rider (Creates New Pool) ---");
    const req4 = await poolService.requestRide({
        userId: "UserD", routeId: "MVP_COLONY_TO_RK_BEACH", departureTimeStr: commonTime.toISOString(), seats: 1
    });
    console.log(`[Result] Pool ID: ${req4.pool._id} | Status: ${req4.pool.status} | Available: ${req4.pool.availableSeats}`);

    console.log("\n--- SCENARIO 5: Expiry ChronJob Check (Truncates & Dispatches) ---");
    // Backdate the new pool to force the 15-minute expiry rule
    await Pool.updateOne({ _id: req4.pool._id }, { $set: { createdAt: new Date(Date.now() - 20 * 60000) } });
    await expiryJob.checkExpiries(); // manual invoke
    
    const checkExpiredPool = await Pool.findById(req4.pool._id);
    console.log(`[Result] Expired Pool Status changed to: ${checkExpiredPool.status}`);

    // Create an empty pool and expire it to test cancellation
    console.log("\n--- SCENARIO 6: Expire an Empty Pool ---");
    const emptyPool = new Pool({
        routeId: "EMPTY_ROUTE", departureTime: commonTime, status: "waiting", passengers: [],
        createdAt: new Date(Date.now() - 20 * 60000) // 20 mins ago
    });
    await emptyPool.save();
    await expiryJob.checkExpiries(); // manual invoke again
    const finalEmptyPool = await Pool.findById(emptyPool._id);
    console.log(`[Result] Empty Pool Status changed to: ${finalEmptyPool.status}`);
    
    console.log("\n=== SIMULATION COMPLETE ===");
    process.exit(0);
}

runSimulation().catch(err => {
    console.error("Simulation failed:", err);
    process.exit(1);
});
