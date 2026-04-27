const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/overview', adminController.getOverview);
router.get('/drivers/live', adminController.getLiveDrivers);
router.get('/pools/active', adminController.getActivePools);

module.exports = router;
