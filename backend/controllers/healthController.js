/**
 * healthController.js
 * Controller for health vitals and biomarker readings.
 * Enforces one reading per user per biomarker type per date (same-day in-place edit).
 */

const HealthRecord = require('../models/HealthRecord');

const getTodayDateString = () => new Date().toISOString().slice(0, 10);

/**
 * @desc    Record or update a health biomarker measurement
 * @route   POST /api/health
 * @access  Private
 */
const createOrUpdateReading = async (req, res) => {
  try {
    const { type, value, unit, date } = req.body;
    const readingDate = date || getTodayDateString();

    if (!type || value === undefined || value === null) {
      return res.status(400).json({ error: 'Biomarker type and value are required.' });
    }

    const numValue = Number(value);
    if (isNaN(numValue)) {
      return res.status(400).json({ error: 'Biomarker value must be a valid number.' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(readingDate)) {
      return res.status(400).json({ error: 'Date must be formatted as YYYY-MM-DD.' });
    }

    const existingRecord = await HealthRecord.findOne({
      user: req.user._id,
      type: type.trim(),
      date: readingDate
    });

    const isUpdate = !!existingRecord;

    const record = await HealthRecord.findOneAndUpdate(
      {
        user: req.user._id,
        type: type.trim(),
        date: readingDate
      },
      {
        value: numValue,
        unit: unit !== undefined ? unit.trim() : (existingRecord ? existingRecord.unit : '')
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
  getUserReadings
};
