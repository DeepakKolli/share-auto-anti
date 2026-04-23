const mongoose = require('mongoose');
const axios = require('axios');
const Driver = require('./models/Driver');
const Pool = require('./models/Pool');

const MONGO_URI = 'mongodb://localhost:27017/share-auto';
const POOL_SERVICE_URL = 'http://localhost:3001/api/pools/request'; // Assuming Module 1 port

async function runSimulation() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('--- Driver Assignment Simulation ---');

        // 1. Cleanup & Seed Drivers
        await Driver.deleteMany({});
        await Pool.deleteMany({});

        const drivers = [
            {
                name: "Best Choice (High Rating, Close)",
                phone: "1111111111",
                status: 'ONLINE_AVAILABLE',
                currentLocation: { type: 'Point', coordinates: [83.3180, 17.6880] }, // ~200m away
                rating: 4.9,
                activeTrips: 0,
                routeIds: ['R101'],
                isAvailable: true
            },
            {
                name: "Second Choice (Farther, Busy)",
                phone: "2222222222",
                status: 'ONLINE_AVAILABLE',
                currentLocation: { type: 'Point', coordinates: [83.3500, 17.7500] }, // ~several KM away
                rating: 4.2,
                activeTrips: 2,
                routeIds: ['R101'],
                isAvailable: true
            }
        ];

        await Driver.insertMany(drivers);
        console.log('Drivers seeded.');

        // 2. Create a pool and add passengers (Simulating via Module 1 logic)
        // We'll just create a Pool directly in POOL_READY state to test Module 8's endpoint
        const testPool = new Pool({
            routeId: 'R101',
            status: 'POOL_READY',
            totalSeats: 3,
            bookedSeats: 2
        });
        await testPool.save();
        console.log(`Test Pool created: ${testPool._id}`);

        // 3. Trigger Assignment
        console.log('Triggering assignment in Module 8...');
        const response = await axios.post('http://localhost:3008/api/assign-driver', {
            tripId: testPool._id
        });

        console.log('Assignment Response:', response.data.message);
        console.log('Assigned Driver:', response.data.driver.name);

        // 4. Verify DB updates
        const updatedPool = await Pool.findById(testPool._id);
        const updatedDriver = await Driver.findById(response.data.driver._id);

        console.log('\nVerification:');
        console.log('- Pool Status:', updatedPool.status); // Should be DRIVER_ASSIGNED
        console.log('- Driver Status:', updatedDriver.status); // Should be ON_TRIP
        console.log('- Driver activeTrips:', updatedDriver.activeTrips); // Should be 1

        if (updatedDriver.name === "Best Choice (High Rating, Close)") {
            console.log('\n✅ SUCCESS: Intelligent assignment logic picked the optimal driver!');
        } else {
            console.log('\n❌ FAILURE: Assignment logic picked the wrong driver.');
        }

    } catch (error) {
        console.error('Simulation failed:', error.message);
        if (error.response) console.log(error.response.data);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

runSimulation();
