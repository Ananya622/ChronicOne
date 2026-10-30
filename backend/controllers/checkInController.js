/**
 * checkInController.js
 * Controller for daily habit check-ins and streak calculation.
 * Ensures users can only access and modify their own check-in records.
 */

const CheckIn = require('../models/CheckIn');
const { calculateDailyScore, classifyDay, calculateStreak } = require('../utils/streakEngine');
const { getTodayDateString, isValidCalendarDate, isFutureDate } = require('../utils/dateUtils');

/**
 * @desc    Create or update a check-in record for a date (idempotent same-day editing)
 * @route   POST /api/checkin
 * @access  Private
 */
const createOrUpdateCheckIn = async (req, res) => {
  try {
    const { date, habits, notes } = req.body;
    const checkInDate = date || getTodayDateString();

    if (!isValidCalendarDate(checkInDate)) {
      return res.status(400).json({ error: 'Date must be formatted as YYYY-MM-DD.' });
    }

    if (isFutureDate(checkInDate)) {
      return res.status(400).json({ error: 'Cannot log check-in for a future date.' });
    }

    if (!habits || typeof habits !== 'object' || Array.isArray(habits)) {
      return res.status(400).json({ error: 'Habits object is required.' });
    }

    const habitEntries = Object.entries(habits);
    if (habitEntries.length === 0) {
      return res.status(400).json({ error: 'At least one habit must be provided.' });
    }

    const validatedHabits = {};
    for (const [habitId, score] of habitEntries) {
      if (typeof habitId !== 'string' || !habitId.trim()) {
        return res.status(400).json({ error: 'Invalid habit identifier.' });
      }
      if (typeof score !== 'number' && typeof score !== 'string') {
        return res.status(400).json({
          error: `Score for habit '${habitId}' must be a numeric value between 0 and 1.`
        });
      }
      if (typeof score === 'string' && score.trim() === '') {
        return res.status(400).json({
          error: `Score for habit '${habitId}' cannot be empty.`
        });
      }
      const num = Number(score);
      if (!Number.isFinite(num) || num < 0 || num > 1) {
        return res.status(400).json({
          error: `Invalid score for habit '${habitId}'. Must be a finite number between 0 and 1.`
        });
      }
      validatedHabits[habitId.trim()] = Math.round(num * 100) / 100;
    }

    // Auto-calculate daily score and day classification
    const dailyScore = calculateDailyScore(validatedHabits);
    const classification = classifyDay(dailyScore);

    // Upsert: updates existing same-day record in-place, or creates new if none exists
    const existingCheckIn = await CheckIn.findOne({ user: req.user._id, date: checkInDate });
    const isUpdate = !!existingCheckIn;

    const sanitizedNotes = notes !== undefined ? String(notes).trim().slice(0, 1000) : (existingCheckIn ? existingCheckIn.notes : '');

    const checkIn = await CheckIn.findOneAndUpdate(
      { user: req.user._id, date: checkInDate },
      {
        habits: validatedHabits,
        dailyScore,
        classification,
        status: classification,
        notes: sanitizedNotes
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
  getStreakStats,
  getTodayDateString,
  isValidCalendarDate,
  isFutureDate
};
