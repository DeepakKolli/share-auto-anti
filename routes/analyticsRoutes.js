const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.post('/log', analyticsController.logExternalEvent);
router.get('/logs', analyticsController.getLogs);

module.exports = router;
