/**
 * wellnessController.js
 * Controller for mood tracking and wellness logging.
 * Enforces one mood log per user per calendar date (same-day in-place edit).
 */

const MoodRecord = require('../models/MoodRecord');

const getTodayDateString = () => new Date().toISOString().slice(0, 10);

/**
 * @desc    Save or update mood for a date
 * @route   POST /api/wellness/mood
 * @access  Private
 */
const saveMood = async (req, res) => {
  try {
    const { mood, date } = req.body;
    const moodDate = date || getTodayDateString();

    const allowedMoods = ['great', 'good', 'neutral', 'low', 'flareup'];
    if (!mood || !allowedMoods.includes(mood)) {
      return res.status(400).json({
        error: `Invalid mood status. Must be one of: ${allowedMoods.join(', ')}`
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(moodDate)) {
      return res.status(400).json({ error: 'Date must be formatted as YYYY-MM-DD.' });
    }

    const record = await MoodRecord.findOneAndUpdate(
      { user: req.user._id, date: moodDate },
      { mood },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      message: 'Mood recorded successfully',
      record
    });
  } catch (error) {
    console.error('saveMood error:', error.message);
    return res.status(500).json({ error: 'Internal server error while saving mood.' });
  }
};

/**
 * @desc    Get all mood records for authenticated user
 * @route   GET /api/wellness/mood
 * @access  Private
 */
const getUserMoods = async (req, res) => {
  try {
    const moods = await MoodRecord.find({ user: req.user._id }).sort({ date: -1 });
    return res.status(200).json({ moods });
  } catch (error) {
    console.error('getUserMoods error:', error.message);
    return res.status(500).json({ error: 'Internal server error while fetching moods.' });
  }
};

/**
 * @desc    Get today's mood record for authenticated user
 * @route   GET /api/wellness/mood/today
 * @access  Private
 */
const getTodayMood = async (req, res) => {
  try {
    const today = getTodayDateString();
    const moodRecord = await MoodRecord.findOne({ user: req.user._id, date: today });
    return res.status(200).json({ moodRecord: moodRecord || null });
  } catch (error) {
    console.error('getTodayMood error:', error.message);
    return res.status(500).json({ error: 'Internal server error while fetching today mood.' });
  }
};

module.exports = {
  saveMood,
  getUserMoods,
  getTodayMood
};
