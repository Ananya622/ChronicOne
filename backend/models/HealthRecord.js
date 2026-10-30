/**
 * HealthRecord.js
 * Mongoose model for condition-related biometric vitals & measurements.
 * Enforces one reading per user per biomarker type per date via compound unique index.
 */

const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    type: {
      type: String,
      required: [true, 'Biomarker type is required'],
      trim: true
    },
    value: {
      type: Number,
      required: [true, 'Biomarker value is required']
    },
    unit: {
      type: String,
      default: '',
      trim: true
    },
    date: {
      type: String,
      required: [true, 'Date is required (YYYY-MM-DD)'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD']
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index: exactly one measurement per user + type + date
healthRecordSchema.index({ user: 1, type: 1, date: 1 }, { unique: true });

const HealthRecord = mongoose.model('HealthRecord', healthRecordSchema);

module.exports = HealthRecord;
