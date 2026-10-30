/**
 * checkInRoutes.js
 * Express router for Check-In and Streak endpoints.
 * All routes protected by JWT middleware.
 */

const express = require('express');
const router = express.Router();
const {
  createOrUpdateCheckIn,
  getUserCheckIns,
  getTodayCheckIn,
  getStreakStats
} = require('../controllers/checkInController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', createOrUpdateCheckIn);
router.get('/', getUserCheckIns);
router.get('/today', getTodayCheckIn);
router.get('/stats', getStreakStats);

module.exports = router;
