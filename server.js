const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const assignmentRoutes = require('./routes/assignmentRoutes');

const app = express();
const PORT = process.env.PORT || 3008;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', assignmentRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'Driver Assignment Module is running', port: PORT });
});

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/share_auto_prototype';
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Driver Assignment Module server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });
