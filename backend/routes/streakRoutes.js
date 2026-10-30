/**
 * streakRoutes.js
 * Dedicated router for streak queries.
 */

const express = require('express');
const router = express.Router();
const { getStreakStats } = require('../controllers/checkInController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getStreakStats);
router.get('/:userId', getStreakStats); // Supported for backward compatibility

module.exports = router;
