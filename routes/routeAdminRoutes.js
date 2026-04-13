const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');

// POST   /api/routes          → Create a new route
router.post('/', routeController.createRoute);

// GET    /api/routes           → Get all active routes
router.get('/', routeController.getAllRoutes);

// GET    /api/routes/:routeId/stops → Get stops of a specific route
router.get('/:routeId/stops', routeController.getRouteStops);

// PUT    /api/routes/:routeId  → Update route details
router.put('/:routeId', routeController.updateRoute);

module.exports = router;
