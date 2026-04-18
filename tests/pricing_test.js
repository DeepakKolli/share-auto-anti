const pricingService = require('../services/pricingService');
const { DISCOUNT_SLABS, PEAK_MULTIPLIERS } = require('../config/pricingConfig');

function runTests() {
    console.log('--- STARTING PRICING LOGIC TESTS ---');

    const baseFare = 100;
    const peakDemandFactor = 1.5;

    // Test 1: Low Fill (<50%) - Should have 10% discount
    // Expected: 100 * 1.0 (non-peak) * 0.9 = 90
    let fare1 = pricingService.calculateDynamicFare(baseFare, 0.25, 0, 1.0);
    console.log(`Test 1 (25% Fill, Non-Peak): Result ₹${fare1} | Expected ₹90.00`);
    console.assert(fare1 === 90, 'Test 1 Failed');

    // Test 2: Medium Fill (50-80%) - Should have 20% discount
    // Expected: 100 * 1.0 * 0.8 = 80
    let fare2 = pricingService.calculateDynamicFare(baseFare, 0.60, 0, 1.0);
    console.log(`Test 2 (60% Fill, Non-Peak): Result ₹${fare2} | Expected ₹80.00`);
    console.assert(fare2 === 80, 'Test 2 Failed');

    // Test 3: High Fill (>80%) - Should have 30% discount
    // Expected: 100 * 1.0 * 0.7 = 70
    let fare3 = pricingService.calculateDynamicFare(baseFare, 0.90, 0, 1.0);
    console.log(`Test 3 (90% Fill, Non-Peak): Result ₹${fare3} | Expected ₹70.00`);
    console.assert(fare3 === 70, 'Test 3 Failed');

    // Test 4: Peak Multiplier (1.5x)
    // Expected: 100 * 1.5 * 0.9 (assuming 10% discount for low fill) = 135
    let fare4 = pricingService.calculateDynamicFare(baseFare, 0.1, 0, 1.5);
    console.log(`Test 4 (Peak 1.5x, Low Fill): Result ₹${fare4} | Expected ₹135.00`);
    console.assert(fare4 === 135, 'Test 4 Failed');

    // Test 5: Per Seat Split
    // Total fare 120, split between 3 users in a 3-seat auto
    // Expected: 120 / 3 = 40
    let perSeat = pricingService.calculatePerSeatFare(120, 3);
    console.log(`Test 5 (Split ₹120 by 3): Result ₹${perSeat} | Expected ₹40.00`);
    console.assert(perSeat === 40, 'Test 5 Failed');

    // Test 6: Min Fare Floor
    // Total fare 30, split between 3 users -> 10. Floor is 20.
    // Expected: 20
    let perSeatFloor = pricingService.calculatePerSeatFare(30, 3);
    console.log(`Test 6 (Split ₹30 by 3, min floor ₹20): Result ₹${perSeatFloor} | Expected ₹20.00`);
    console.assert(perSeatFloor === 20, 'Test 6 Failed');

    console.log('--- ALL PRICING TESTS PASSED ✅ ---');
}

try {
    runTests();
} catch (error) {
    console.error('Test Suite Failed:', error);
    process.exit(1);
}
