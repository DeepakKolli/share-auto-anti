const express = require('express');
const router = express.Router();
const poolController = require('../controllers/poolController');

router.post('/request-ride', poolController.requestRide);
router.get('/:id', poolController.getPoolDetails);

module.exports = router;
