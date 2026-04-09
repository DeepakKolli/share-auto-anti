const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const poolRoutes = require('./routes/poolRoutes');
const expiryJob = require('./cron/expiryJob');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/pools', poolRoutes);

// MongoDB Connect (Standard local URL for test/prototype)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/share_auto_prototype';

mongoose.connect(MONGODB_URI)
  .then(() => {
      console.log(`[DB] Successfully connected to MongoDB at ${MONGODB_URI}`);
      
      // Safety check: remove deprecation notice if run in an older context, but mostly init cron
      expiryJob.start(); // Start background worker
  })
  .catch(err => {
      console.error("[DB Error] MongoDB connection failed:", err.message);
  });

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
      console.log(`[SERVER] Ride pooling engine is running on port ${PORT}.`);
  });
}

module.exports = app;
