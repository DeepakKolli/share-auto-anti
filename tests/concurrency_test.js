const mongoose = require('mongoose');
const Pool = require('../models/Pool');
const Booking = require('../models/Booking');
const seatAllocationService = require('../services/seatAllocationService');

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/share_auto_prototype';

async function runTest() {
    console.log('--- STARTING CONCURRENCY TEST ---');
    
    // 1. Connect to DB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // 2. Setup Test Pool
    const testPool = await Pool.create({
        routeId: 'TEST_ROUTE_CONCURRENCY',
        departureTime: new Date(Date.now() + 3600000), // 1 hour later
        totalSeats: 3,
        availableSeats: 3,
        bookedSeats: 0,
        status: 'waiting'
    });
    console.log(`Created test pool with 3 seats: ${testPool._id}`);

    // 3. Mock 5 simultaneous booking requests for 1 seat each
    // Only 3 should succeed, 2 should fail.
    const requests = [1, 1, 1, 1, 1].map(async (seats, index) => {
        try {
            console.log(`[Request ${index}] Attempting to book ${seats} seat...`);
            const pool = await seatAllocationService.allocateSeats(testPool._id, seats);
            console.log(`[Request ${index}] SUCCESS! Pool now has ${pool.availableSeats} available seats.`);
            return { index, success: true };
        } catch (error) {
            console.log(`[Request ${index}] FAILED: ${error.message}`);
            return { index, success: false };
        }
    });

    const results = await Promise.all(requests);

    // 4. Verify results
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log('--- TEST RESULTS ---');
    console.log(`Successful bookings: ${successCount} (Expected: 3)`);
    console.log(`Failed bookings: ${failureCount} (Expected: 2)`);

    const finalPool = await Pool.findById(testPool._id);
    console.log(`Final Pool State: Available=${finalPool.availableSeats}, Booked=${finalPool.bookedSeats}`);

    if (successCount === 3 && failureCount === 2 && finalPool.availableSeats === 0) {
        console.log('✅ TEST PASSED: Atomic seat handling worked perfectly.');
    } else {
        console.error('❌ TEST FAILED: Seat allocation inconsistency detected.');
    }

    // 5. Cleanup
    await Pool.deleteOne({ _id: testPool._id });
    await Booking.deleteMany({ poolId: testPool._id });
    await mongoose.disconnect();
    process.exit(0);
}

runTest().catch(err => {
    console.error('Test Execution Error:', err);
    process.exit(1);
});
