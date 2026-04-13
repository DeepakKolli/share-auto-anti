const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Route file imports
const routeAdminRoutes = require('./routes/routeAdminRoutes');
const stopRoutes = require('./routes/stopRoutes');
const autoAssignmentRoutes = require('./routes/autoAssignmentRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// API Endpoint Mounts
app.use('/api/routes', routeAdminRoutes);
app.use('/api/stops', stopRoutes);
app.use('/api/assignments', autoAssignmentRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Module 2 Route Management is up and running!', timestamp: new Date() });
});

// MongoDB Connect (Standard local URL for test/prototype)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/share_auto_prototype';

mongoose.connect(MONGODB_URI)
  .then(() => {
      console.log(`[DB] Module 2 successfully connected to MongoDB at ${MONGODB_URI}`);
  })
  .catch(err => {
      console.error("[DB Error] MongoDB connection failed:", err.message);
  });

const PORT = process.env.PORT || 3002; // Runs on 3002 to stay independent of Module 1 (port 3000)
if (require.main === module) {
  app.listen(PORT, () => {
      console.log(`[SERVER] Route Management Engine running on port ${PORT}.`);
  });
}

module.exports = app;
