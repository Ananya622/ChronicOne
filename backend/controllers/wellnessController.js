/**
 * wellnessController.js
 * Controller for mood tracking and wellness logging.
 * Enforces one mood log per user per calendar date (same-day in-place edit).
 */

const MoodRecord = require('../models/MoodRecord');

/**
 * Validates that a string is in exact YYYY-MM-DD format and represents an actual calendar date.
 * Rejects impossible dates (e.g., 2026-02-31, 2026-13-10, 2026-04-31).
 */
const isValidCalendarDate = (dateString) => {
  if (typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }
  const [yearStr, monthStr, dayStr] = dateString.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  // Construct UTC date and verify that year, month, and day match without rollover
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  return (
    dateObj.getUTCFullYear() === year &&
    dateObj.getUTCMonth() === month - 1 &&
    dateObj.getUTCDate() === day
  );
};

// Explicit application timezone (UTC standard across ChronicOne backend)
const APP_TIMEZONE = process.env.APP_TIMEZONE || 'UTC';

/**
 * Returns today's date formatted as YYYY-MM-DD in the authoritative application timezone.
 */
const getTodayDateString = (now = new Date()) => {
  if (APP_TIMEZONE === 'UTC') {
    return now.toISOString().slice(0, 10);
  }
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);
};

/**
 * Checks whether a YYYY-MM-DD string is in the future.
 * Uses the exact same authoritative application timezone as getTodayDateString().
 */
const isFutureDate = (dateString, now = new Date()) => {
  const today = getTodayDateString(now);
  return dateString > today;
};

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
    if (!mood || typeof mood !== 'string' || !allowedMoods.includes(mood.trim().toLowerCase())) {
      return res.status(400).json({
        error: `Invalid mood status. Must be one of: ${allowedMoods.join(', ')}`
      });
    }

    if (typeof moodDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(moodDate)) {
      return res.status(400).json({ error: 'Date must be formatted as YYYY-MM-DD.' });
    }

    if (!isValidCalendarDate(moodDate)) {
      return res.status(400).json({ error: 'Date must be a valid calendar date.' });
    }

    if (isFutureDate(moodDate)) {
      return res.status(400).json({ error: 'Cannot record mood for a future date.' });
    }

    const cleanMood = mood.trim().toLowerCase();

    const record = await MoodRecord.findOneAndUpdate(
      { user: req.user._id, date: moodDate },
      { mood: cleanMood },
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
    const filter = { user: req.user._id };
    if (req.query.date) {
      if (!isValidCalendarDate(req.query.date)) {
        return res.status(400).json({ error: 'Date query parameter must be a valid calendar date in YYYY-MM-DD format.' });
      }
      filter.date = req.query.date;
    }
    const moods = await MoodRecord.find(filter).sort({ date: -1 });
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
  getTodayMood,
  isValidCalendarDate,
  isFutureDate,
  getTodayDateString,
  APP_TIMEZONE
};
