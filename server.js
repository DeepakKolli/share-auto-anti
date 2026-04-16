const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const bookingRoutes = require('./routes/bookingRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', bookingRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        module: 'Module 5: Booking & Seat Allocation',
        status: 'UP (Real-time via Gateway)',
        timestamp: new Date()
    });
});

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/share_auto_prototype';

mongoose.connect(MONGODB_URI)
    .then(() => console.log(`[DB] Connected to MongoDB at ${MONGODB_URI}`))
    .catch(err => console.error('[DB Error] Connection failed:', err));

const PORT = process.env.PORT || 3005;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`[SERVER] Module 5 running on port ${PORT}`);
    });
}

module.exports = app;
