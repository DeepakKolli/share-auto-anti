const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');

// POST   /api/assignments                         → Assign auto to route
router.post('/', assignmentController.assignAuto);

// GET    /api/assignments?routeId=&direction=      → Get active autos
router.get('/', assignmentController.getActiveAssignments);

// PATCH  /api/assignments/:autoNumber              → Update auto status/position
router.patch('/:autoNumber', assignmentController.updateAssignment);

module.exports = router;
