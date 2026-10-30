/**
 * CheckIn.js
 * Mongoose model for daily habit check-ins.
 * Enforces one check-in per user per calendar date via compound unique index.
 */

const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema(
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
    habits: {
      type: Map,
      of: Number,
      default: {}
    },
    dailyScore: {
      type: Number,
      required: [true, 'Daily score is required'],
      min: [0, 'Daily score cannot be less than 0'],
      max: [1, 'Daily score cannot exceed 1']
    },
    classification: {
      type: String,
      required: [true, 'Classification is required'],
      enum: {
        values: ['FULL', 'PARTIAL', 'LOW', 'MISSED'],
        message: '{VALUE} is not a valid classification'
      }
    },
    status: {
      type: String,
      default: function () {
        return this.classification;
      }
    },
    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters']
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index: exactly one check-in per user per date
checkInSchema.index({ user: 1, date: 1 }, { unique: true });

const CheckIn = mongoose.model('CheckIn', checkInSchema);

module.exports = CheckIn;
