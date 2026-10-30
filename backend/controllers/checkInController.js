/**
 * checkInController.js
 * Controller for daily habit check-ins and streak calculation.
 * Ensures users can only access and modify their own check-in records.
 */

const CheckIn = require('../models/CheckIn');
const { calculateDailyScore, classifyDay, calculateStreak } = require('../utils/streakEngine');

const getTodayDateString = () => new Date().toISOString().slice(0, 10);

/**
 * @desc    Create or update a check-in record for a date (idempotent same-day editing)
 * @route   POST /api/checkin
 * @access  Private
 */
const createOrUpdateCheckIn = async (req, res) => {
  try {
    const { date, habits, notes } = req.body;
    const checkInDate = date || getTodayDateString();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(checkInDate)) {
      return res.status(400).json({ error: 'Date must be formatted as YYYY-MM-DD.' });
    }

    if (!habits || typeof habits !== 'object') {
      return res.status(400).json({ error: 'Habits object is required.' });
    }

    // Auto-calculate daily score and day classification
    const dailyScore = calculateDailyScore(habits);
    const classification = classifyDay(dailyScore);

    // Upsert: updates existing same-day record in-place, or creates new if none exists
    const existingCheckIn = await CheckIn.findOne({ user: req.user._id, date: checkInDate });
    const isUpdate = !!existingCheckIn;

    const checkIn = await CheckIn.findOneAndUpdate(
      { user: req.user._id, date: checkInDate },
      {
        habits,
        dailyScore,
        classification,
        status: classification,
        notes: notes !== undefined ? notes : (existingCheckIn ? existingCheckIn.notes : '')
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    // Compute updated streak stats
    const allUserCheckIns = await CheckIn.find({ user: req.user._id }).sort({ date: 1 });
    const streakStats = calculateStreak(allUserCheckIns, getTodayDateString());

    return res.status(isUpdate ? 200 : 201).json({
      message: isUpdate ? 'Check-in updated successfully' : 'Check-in recorded successfully',
      checkIn,
      streakStats
    });
  } catch (error) {
    console.error('createOrUpdateCheckIn error:', error.message);
    return res.status(500).json({ error: 'Internal server error while saving check-in.' });
  }
};

/**
 * @desc    Get all check-in records for authenticated user
 * @route   GET /api/checkin
 * @access  Private
 */
const getUserCheckIns = async (req, res) => {
  try {
    const checkIns = await CheckIn.find({ user: req.user._id }).sort({ date: 1 });
    return res.status(200).json({ checkIns });
  } catch (error) {
    console.error('getUserCheckIns error:', error.message);
    return res.status(500).json({ error: 'Internal server error while fetching check-ins.' });
  }
};

/**
 * @desc    Get today's check-in record for authenticated user
 * @route   GET /api/checkin/today
 * @access  Private
 */
const getTodayCheckIn = async (req, res) => {
  try {
    const today = getTodayDateString();
    const checkIn = await CheckIn.findOne({ user: req.user._id, date: today });
    return res.status(200).json({ checkIn: checkIn || null });
  } catch (error) {
    console.error('getTodayCheckIn error:', error.message);
    return res.status(500).json({ error: 'Internal server error while fetching today check-in.' });
  }
};

/**
 * @desc    Get streak statistics calculated from user's full check-in history
 * @route   GET /api/streak
 * @access  Private
 */
const getStreakStats = async (req, res) => {
  try {
    const checkIns = await CheckIn.find({ user: req.user._id }).sort({ date: 1 });
    const streakStats = calculateStreak(checkIns, getTodayDateString());
    return res.status(200).json(streakStats);
  } catch (error) {
    console.error('getStreakStats error:', error.message);
    return res.status(500).json({ error: 'Internal server error while calculating streak.' });
  }
};

module.exports = {
  createOrUpdateCheckIn,
  getUserCheckIns,
  getTodayCheckIn,
  getStreakStats
};
