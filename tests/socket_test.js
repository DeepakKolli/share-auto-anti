const io = require('socket.io-client');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Config
const GATEWAY_URL = 'http://localhost:3007';
const JWT_SECRET = 'fallback_secret';
const TEST_TOKEN = jwt.sign({ id: 'test_user_69' }, JWT_SECRET);

async function runTest() {
    console.log('--- STARTING SOCKET GATEWAY TEST ---');

    // 1. Connect as an authenticated client
    const socket = io(GATEWAY_URL, {
        auth: { token: TEST_TOKEN },
        transports: ['websocket']
    });

    socket.on('connect', () => {
        console.log('[Client] Connected to Gateway');
        
        // 2. Join a pool room
        socket.emit('join_pool', 'POOL_69');
    });

    socket.on('joined_pool', (data) => {
        console.log('[Client] Successfully joined:', data.poolId);
        
        // 3. Trigger internal emit from "another module"
        triggerInternalEmit();
    });

    socket.on('seat_update', (data) => {
        console.log('[Client] RECEIVED SEAT UPDATE!:', data);
        console.log('✅ TEST PASSED: Internal emit reached authenticated client.');
        cleanup();
    });

    socket.on('connect_error', (err) => {
        console.error('[Client] Connection Error:', err.message);
        process.exit(1);
    });

    async function triggerInternalEmit() {
        try {
            console.log('[Backend] Sending internal emit to Gateway...');
            await axios.post(`${GATEWAY_URL}/api/internal/emit`, {
                room: 'pool:POOL_69',
                event: 'seat_update',
                data: { availableSeats: 2, bookedSeats: 1 }
            });
        } catch (error) {
            console.error('[Backend] Internal emit failed:', error.message);
            process.exit(1);
        }
    }

    function cleanup() {
        socket.disconnect();
        console.log('Test finished.');
        process.exit(0);
    }

    // Timeout safety
    setTimeout(() => {
        console.error('❌ TEST FAILED: Timeout waiting for event.');
        process.exit(1);
    }, 10000);
}

runTest();
