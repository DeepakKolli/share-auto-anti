const mongoose = require('mongoose');
const axios = require('axios');
const Booking = require('./models/Booking');
const Pool = require('./models/Pool');
const Payment = require('./models/Payment');

const MONGO_URI = 'mongodb://127.0.0.1:27017/share_auto_prototype';
const POOL_ID = new mongoose.Types.ObjectId();

async function runSimulation() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('--- Payment Module Simulation ---');

        // 1. Cleanup
        await Booking.deleteMany({});
        await Pool.deleteMany({});
        await Payment.deleteMany({});

        // 2. Seed Pool & Bookings
        const pool = new Pool({
            _id: POOL_ID,
            routeId: 'R101',
            departureTime: new Date(),
            status: 'POOL_READY',
            totalSeats: 3,
            bookedSeats: 3
        });
        await pool.save();

        const bookings = [
            { _id: new mongoose.Types.ObjectId(), userId: new mongoose.Types.ObjectId(), poolId: POOL_ID, seatsBooked: 1, farePaid: 45, status: 'CONFIRMED' },
            { _id: new mongoose.Types.ObjectId(), userId: new mongoose.Types.ObjectId(), poolId: POOL_ID, seatsBooked: 1, farePaid: 45, status: 'CONFIRMED' },
            { _id: new mongoose.Types.ObjectId(), userId: new mongoose.Types.ObjectId(), poolId: POOL_ID, seatsBooked: 1, farePaid: 45, status: 'CONFIRMED' }
        ];
        await Booking.insertMany(bookings);
        console.log('Pool and Bookings seeded.');

        // 3. Initiate Payments
        console.log('\nStep 1: Initiating payments for pool...');
        const initRes = await axios.post('http://localhost:3009/api/payments/initiate', { poolId: POOL_ID });
        console.log('Initiation Result:', initRes.data.message, `(Count: ${initRes.data.count})`);

        const payments = await Payment.find({ poolId: POOL_ID });
        
        // 4. Process 2 successes
        console.log('\nStep 2: Processing 2 successful payments...');
        await axios.post('http://localhost:3009/api/payments/process', { paymentId: payments[0]._id, success: true });
        await axios.post('http://localhost:3009/api/payments/process', { paymentId: payments[1]._id, success: true });

        let currentPool = await Pool.findById(POOL_ID);
        console.log('Pool Status after 2 payments:', currentPool.status);

        // 5. Simulate 1 failure
        console.log('\nStep 3: Simulating 1 payment failure (Max attempts reached)...');
        // Setting attempt to 2 to trigger hard failure
        await Payment.findByIdAndUpdate(payments[2]._id, { $set: { attempts: 1 } }); 
        const failRes = await axios.post('http://localhost:3009/api/payments/process', { paymentId: payments[2]._id, success: false });
        console.log('Failure Processing Result:', failRes.data.payment.status);

        // 6. Verify Seat Release
        console.log('\nVerification:');
        const updatedPool = await Pool.findById(POOL_ID);
        const failedBooking = await Booking.findById(payments[2].bookingId);

        console.log('- Pool Status:', updatedPool.status); // Should be partially_full
        console.log('- Failed Booking Status:', failedBooking.status); // Should be CANCELLED
        
        if (updatedPool.status === 'partially_full' && failedBooking.status === 'CANCELLED') {
            console.log('\n✅ SUCCESS: Payment failure correctly triggered seat release and pool recalculation!');
        } else {
            console.log('\n❌ FAILURE: States did not update correctly.');
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
