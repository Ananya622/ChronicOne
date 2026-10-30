/**
 * healthRoutes.js
 * Express router for health biomarker endpoints.
 * Protected by JWT middleware.
 */

const express = require('express');
const router = express.Router();
const { createOrUpdateReading, getUserReadings } = require('../controllers/healthController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', createOrUpdateReading);
router.get('/', getUserReadings);

module.exports = router;
