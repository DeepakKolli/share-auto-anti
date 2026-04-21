const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');

router.post('/assign-driver', assignmentController.assignDriver);
router.get('/drivers/available', assignmentController.getAvailableDrivers);
router.patch('/drivers/status', assignmentController.updateDriverStatus);

module.exports = router;
