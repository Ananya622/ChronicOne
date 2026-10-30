/**
 * MoodRecord.js
 * Mongoose model for daily wellness and mood tracking.
 * Enforces one mood log per user per calendar date via compound unique index.
 */

const mongoose = require('mongoose');

const moodRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    date: {
      type: String,
      required: [true, 'Date is required (YYYY-MM-DD)'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD']
    },
    mood: {
      type: String,
      required: [true, 'Mood status is required'],
      enum: {
        values: ['great', 'good', 'neutral', 'low', 'flareup'],
        message: '{VALUE} is not a valid mood state'
      }
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index: exactly one mood log per user per date
moodRecordSchema.index({ user: 1, date: 1 }, { unique: true });

const MoodRecord = mongoose.model('MoodRecord', moodRecordSchema);

module.exports = MoodRecord;
