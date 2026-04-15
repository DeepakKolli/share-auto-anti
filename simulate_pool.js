const io = require('socket.io-client');
const axios = require('axios');

const DRIVER_SERVER = 'http://127.0.0.1:3004';
const INTERNAL_API = 'http://127.0.0.1:3004/api/internal/notify-pool';

const simulate = async () => {
    console.log('--- Starting Real-time Pool Simulation ---');

    // 1. Connect a mock driver
    const socket = io(DRIVER_SERVER);

    socket.on('connect', () => {
        console.log('[Mock Driver] Connected to Socket.IO');

        // Simulate going online on R101
        socket.emit('driver_online', { driverId: '69de81ccd118af79c0f08c00' });
        socket.emit('subscribe_route', { driverId: '69de81ccd118af79c0f08c00', routeId: 'R101' });
    });

    socket.on('route_subscribed', (data) => {
        console.log(`[Mock Driver] Successfully subscribed to ${data.routeId}`);
        
        // 2. Trigger a pool alert via internal API
        console.log('[Simulator] Triggering new pool alert for R101...');
        axios.post(INTERNAL_API, {
            routeId: 'R101',
            poolId: `POOL_${Date.now()}`,
            totalSeats: 3,
            departureTime: new Date()
        }).catch(err => console.error('Webhook failed:', err.message));
    });

    socket.on('new_pool_available', (pool) => {
        console.log('✅ SUCCESS: Mock Driver received real-time alert!');
        console.log('Pool Details:', pool);
        
        console.log('\nSimulation complete. Closing in 2s...');
        setTimeout(() => process.exit(0), 2000);
    });

    socket.on('connect_error', (err) => {
        console.error('Connection error:', err.message);
        process.exit(1);
    });
};

simulate();
