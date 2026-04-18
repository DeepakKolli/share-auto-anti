const express = require('express');
const router = express.Router();
const pricingController = require('../controllers/pricingController');

// GET /api/pricing/estimate -> Dynamic price calculation before booking
router.get('/estimate', pricingController.getPriceEstimate);

module.exports = router;
