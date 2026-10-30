/**
 * wellnessRoutes.js
 * Express router for wellness and mood endpoints.
 * Protected by JWT middleware.
 */

const express = require('express');
const router = express.Router();
const { saveMood, getUserMoods, getTodayMood } = require('../controllers/wellnessController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/mood', saveMood);
router.get('/mood', getUserMoods);
router.get('/mood/today', getTodayMood);

module.exports = router;
