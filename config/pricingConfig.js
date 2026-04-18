/**
 * Pricing & Discount Configuration
 */
const pricingConfig = {
    // Discount slabs based on seat fill percentage (availableSeats vs totalSeats)
    DISCOUNT_SLABS: [
        { minFill: 0.8, discount: 0.30 }, // >80% fill: 30% discount
        { minFill: 0.5, discount: 0.20 }, // 50-80% fill: 20% discount (Adjusted from prompt's 10-20% range to 20% for simplicity)
        { minFill: 0.0, discount: 0.10 }  // <50% fill: 10% discount
    ],

    // Peak multipliers for office hours
    PEAK_MULTIPLIERS: [
        { start: 8, end: 11, factor: 1.5 },  // Morning Rush: 8 AM - 11 AM
        { start: 17, end: 20, factor: 1.5 }, // Evening Rush: 5 PM - 8 PM
    ],

    // Global Constants
    MIN_FARE_FLOOR: 20,      // Minimum per-seat fare (absolute floor)
    DRIVER_MIN_GUARANTEE: 100 // Driver must earn at least this much for a trip (if calculation drops below)
};

module.exports = pricingConfig;
