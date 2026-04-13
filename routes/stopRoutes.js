const express = require('express');
const router = express.Router();
const stopController = require('../controllers/stopController');

// POST   /api/stops           → Add a stop to a route
router.post('/', stopController.addStop);

// GET    /api/stops/:routeId  → Get stops by route (ordered by sequence)
router.get('/:routeId', stopController.getStopsByRoute);

// POST   /api/stops/validate  → Validate origin < destination for pooling
router.post('/validate', stopController.validateStopOrder);

module.exports = router;
