const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const socketAuthMiddleware = require('./middleware/authMiddleware');
const gatewaySocket = require('./socket/gatewaySocket');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// --- Internal API: Cross-Module Notification Bridge ---
/**
 * POST /api/internal/emit
 * Allows other modules to trigger socket broadcasts.
 * Body: { room, event, data }
 */
app.post('/api/internal/emit', (req, res) => {
    const { room, event, data } = req.body;

    if (!room || !event || !data) {
        return res.status(400).json({ success: false, message: 'Missing room, event, or data' });
    }

    // Broadcast to the target room
    io.to(room).emit(event, data);

    console.log(`[Gateway API] Internal emit: event "${event}" to "${room}"`);
    res.json({ success: true, message: `Event ${event} broadcasted to ${room}` });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        module: 'Module 7: Real-Time Gateway',
        status: 'UP',
        timestamp: new Date()
    });
});

// Socket.IO Setup
io.use(socketAuthMiddleware); // Apply JWT authentication
gatewaySocket(io);

const PORT = process.env.PORT || 3007;

server.listen(PORT, () => {
    console.log(`[SERVER] Real-Time Gateway running on port ${PORT}`);
});

module.exports = { server, io };
