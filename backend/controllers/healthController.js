/**
 * healthController.js
 * Controller for health vitals and biomarker readings.
 * Enforces one reading per user per biomarker type per date (same-day in-place edit).
 */

const HealthRecord = require('../models/HealthRecord');

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

// Technical input sanity boundaries matching authentic ChronicOne biomarkers
const BIOMARKER_SANITY_BOUNDS = {
  bloodGlucose: { min: 20, max: 1000, label: 'Blood Glucose', unit: 'mg/dL' },
  blood_glucose: { min: 20, max: 1000, label: 'Blood Glucose', unit: 'mg/dL' },
  bloodPressure: { min: 40, max: 300, label: 'Blood Pressure', unit: 'mmHg' },
  blood_pressure: { min: 40, max: 300, label: 'Blood Pressure', unit: 'mmHg' },
  heartRate: { min: 30, max: 250, label: 'Heart Rate', unit: 'bpm' },
  heart_rate: { min: 30, max: 250, label: 'Heart Rate', unit: 'bpm' },
  peakFlow: { min: 50, max: 900, label: 'Peak Flow', unit: 'L/min' },
  peak_flow: { min: 50, max: 900, label: 'Peak Flow', unit: 'L/min' },
  jointPain: { min: 0, max: 10, label: 'Joint Pain Level', unit: '/ 10' },
  joint_pain: { min: 0, max: 10, label: 'Joint Pain Level', unit: '/ 10' },
  weight: { min: 10, max: 500, label: 'Body Weight', unit: 'kg' },
  sleepHours: { min: 0, max: 24, label: 'Sleep Duration', unit: 'hrs' },
  sleep_hours: { min: 0, max: 24, label: 'Sleep Duration', unit: 'hrs' }
};

/**
 * @desc    Record or update a health biomarker measurement
 * @route   POST /api/health-records (and /api/health)
 * @access  Private
 */
const createOrUpdateReading = async (req, res) => {
  try {
    const { type, value, unit, date } = req.body;
    const readingDate = date || getTodayDateString();

    if (!type || typeof type !== 'string' || !type.trim()) {
      return res.status(400).json({ error: 'Biomarker type is required.' });
    }

    // Explicitly reject invalid JavaScript types (arrays, objects, booleans, null, undefined)
    if (
      value === undefined ||
      value === null ||
      typeof value === 'boolean' ||
      Array.isArray(value) ||
      typeof value === 'object'
    ) {
      return res.status(400).json({ error: 'Biomarker value must be a valid number.' });
    }

    // Reject empty or whitespace-only strings
    if (typeof value === 'string' && value.trim() === '') {
      return res.status(400).json({ error: 'Biomarker value cannot be empty.' });
    }

    // Reject types other than number and string
    if (typeof value !== 'number' && typeof value !== 'string') {
      return res.status(400).json({ error: 'Biomarker value must be a valid number.' });
    }

    // Numeric conversion and finite validation (rejects NaN, Infinity, -Infinity, non-numeric strings)
    const numValue = Number(value);
    if (!Number.isFinite(numValue)) {
      return res.status(400).json({ error: 'Biomarker value must be a valid finite number.' });
    }

    // Strict calendar-date validation
    if (typeof readingDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(readingDate)) {
      return res.status(400).json({ error: 'Date must be formatted as YYYY-MM-DD.' });
    }

    if (!isValidCalendarDate(readingDate)) {
      return res.status(400).json({ error: 'Date must be a valid calendar date.' });
    }

    if (isFutureDate(readingDate)) {
      return res.status(400).json({ error: 'Cannot record health readings for a future date.' });
    }

    const cleanType = type.trim();
    const bounds = BIOMARKER_SANITY_BOUNDS[cleanType];

    if (bounds) {
      if (numValue < bounds.min || numValue > bounds.max) {
        return res.status(400).json({
          error: `${bounds.label} must be between ${bounds.min} and ${bounds.max} ${bounds.unit}.`
        });
      }
    } else {
      if (numValue < 0 || numValue > 10000) {
        return res.status(400).json({
          error: 'Biomarker value must be a non-negative finite number.'
        });
      }
    }

    const normalizedValue = Math.round(numValue * 100) / 100;
    const existingRecord = await HealthRecord.findOne({
      user: req.user._id,
      type: cleanType,
      date: readingDate
    });

    const isUpdate = !!existingRecord;

    const record = await HealthRecord.findOneAndUpdate(
      {
        user: req.user._id,
        type: cleanType,
        date: readingDate
      },
      {
        value: normalizedValue,
        unit: unit !== undefined ? String(unit).trim().slice(0, 50) : (existingRecord ? existingRecord.unit : (bounds ? bounds.unit : ''))
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    return res.status(isUpdate ? 200 : 201).json({
      message: isUpdate ? 'Health reading updated successfully' : 'Health reading recorded successfully',
      record,
      isUpdate
    });
  } catch (error) {
    console.error('createOrUpdateReading error:', error.message);
    return res.status(500).json({ error: 'Internal server error while saving health reading.' });
  }
};

/**
 * @desc    Get all health records for authenticated user (sorted latest first)
 * @route   GET /api/health
 * @access  Private
 */
const getUserReadings = async (req, res) => {
  try {
    const filter = { user: req.user._id };
    if (req.query.type) {
      filter.type = req.query.type;
    }
    if (req.query.date) {
      if (!isValidCalendarDate(req.query.date)) {
        return res.status(400).json({ error: 'Date query parameter must be a valid calendar date in YYYY-MM-DD format.' });
      }
      filter.date = req.query.date;
    }

    const records = await HealthRecord.find(filter).sort({ date: -1, createdAt: -1 });
    return res.status(200).json({ records });
  } catch (error) {
    console.error('getUserReadings error:', error.message);
    return res.status(500).json({ error: 'Internal server error while fetching health readings.' });
  }
};

module.exports = {
  createOrUpdateReading,
  getUserReadings,
  isValidCalendarDate,
  isFutureDate,
  getTodayDateString,
  APP_TIMEZONE
};
