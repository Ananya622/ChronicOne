/**
 * streakEngine.js
 * Authoritative Server-Side Streak State Machine for ChronicOne.
 * Directly ported from frontend/js/streak/streak.js to preserve 100% identical business rules.
 *
 * Rules:
 * - Success: FULL (1.0) or PARTIAL (0.5 - 0.99)
 * - Unsuccessful: LOW (0.01 - 0.49) or MISSED (0.0)
 * - Grace Days: Up to 2 maximum normal grace days to protect active streak
 * - Relapse: Triggered when an active streak experiences an unprotected missed day
 * - Recovery Challenge: 3 consecutive successful days required after relapse
 * - Recovery Bonus: Successfully completing recovery awards +1 extra grace day protection
 */

function calculateDailyScore(habits) {
  if (!habits || typeof habits !== 'object') return 0;
  const values = Object.values(habits instanceof Map ? Object.fromEntries(habits) : habits);
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  return Math.round((sum / values.length) * 100) / 100;
}

function classifyDay(score) {
  if (score === 1) return 'FULL';
  if (score >= 0.5) return 'PARTIAL';
  if (score > 0) return 'LOW';
  return 'MISSED';
}

// Helper to parse YYYY-MM-DD into UTC midnight timestamp
function parseUtcDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return 0;
  const parts = dateStr.slice(0, 10).split('-');
  if (parts.length !== 3) return 0;
  return Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

function calculateStreak(checkIns, todayDate = new Date().toISOString().slice(0, 10)) {
  const maxGraceDays = 2;
  const recoveryGoal = 3;

  if (!checkIns || checkIns.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      graceDaysTotal: maxGraceDays,
      graceDaysUsed: 0,
      graceDaysRemaining: maxGraceDays,
      graceUsedToday: false,
      relapse: false,
      recoveryActive: false,
      recoveryDays: 0,
      recoveryGoal,
      recoveryComplete: false,
      recoveryBonusAvailable: false,
      recoveryBonusUsed: false,
      status: 'INITIAL',
      statusLabel: '🌱 Not started'
    };
  }

  // 1. Deduplicate by date (keep latest if multiple exist)
  const normalizedMap = {};
  checkIns.forEach((entry) => {
    if (entry && entry.date) {
      normalizedMap[entry.date] = entry;
    }
  });

  // 2. Sort chronologically ascending using UTC date arithmetic
  const sortedEntries = Object.values(normalizedMap).sort((a, b) => {
    return parseUtcDate(a.date) - parseUtcDate(b.date);
  });

  let runningStreak = 0;
  let bestStreak = 0;
  let graceDaysUsed = 0;
  let prevTimeUtc = null;
  let graceUsedToday = false;

  let inRelapse = false;
  let recoveryActive = false;
  let recoveryDays = 0;
  let recoveryComplete = false;
  let recoveryBonusAvailable = false;
  let recoveryBonusUsed = false;

  for (let i = 0; i < sortedEntries.length; i++) {
    const entry = sortedEntries[i];
    const currTimeUtc = parseUtcDate(entry.date);

    const classification = entry.classification || entry.status;
    const isSuccess = classification === 'FULL' || classification === 'PARTIAL';

    if (prevTimeUtc === null) {
      if (isSuccess) {
        runningStreak = 1;
        inRelapse = false;
      } else {
        runningStreak = 0;
        inRelapse = false;
      }
    } else {
      const diffTime = currTimeUtc - prevTimeUtc;
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      // Handle missing calendar days
      if (diffDays > 1) {
        const missingDays = diffDays - 1;
        for (let m = 0; m < missingDays; m++) {
          if (recoveryActive && !recoveryComplete) {
            recoveryDays = 0;
          }

          if (graceDaysUsed < maxGraceDays && runningStreak > 0) {
            graceDaysUsed += 1;
          } else if (recoveryBonusAvailable && runningStreak > 0) {
            recoveryBonusAvailable = false;
            recoveryBonusUsed = true;
          } else if (runningStreak > 0) {
            runningStreak = 0;
            inRelapse = true;
            recoveryActive = true;
            recoveryDays = 0;
            recoveryComplete = false;
          } else {
            runningStreak = 0;
          }
        }
      }

      // Evaluate current entry
      if (isSuccess) {
        if (runningStreak > 0) {
          runningStreak += 1;
        } else {
          runningStreak = 1;
        }

        if (recoveryActive && !recoveryComplete) {
          recoveryDays += 1;
          inRelapse = false;
          if (recoveryDays >= recoveryGoal) {
            recoveryDays = recoveryGoal;
            recoveryComplete = true;
            recoveryActive = false;
            recoveryBonusAvailable = true;
          }
        } else if (inRelapse && !recoveryComplete) {
          recoveryActive = true;
          recoveryDays = 1;
          inRelapse = false;
        }
      } else {
        // Unsuccessful day (LOW or MISSED)
        if (recoveryActive && !recoveryComplete) {
          recoveryDays = 0;
        }

        if (graceDaysUsed < maxGraceDays && runningStreak > 0) {
          graceDaysUsed += 1;
          if (entry.date === todayDate) graceUsedToday = true;
          inRelapse = false;
        } else if (recoveryBonusAvailable && runningStreak > 0) {
          recoveryBonusAvailable = false;
          recoveryBonusUsed = true;
          if (entry.date === todayDate) graceUsedToday = true;
          inRelapse = false;
        } else if (runningStreak > 0) {
          runningStreak = 0;
          inRelapse = true;
          recoveryActive = true;
          recoveryDays = 0;
          recoveryComplete = false;
        } else {
          runningStreak = 0;
        }
      }
    }

    if (runningStreak > bestStreak) {
      bestStreak = runningStreak;
    }

    prevTimeUtc = currTimeUtc;
  }

  const currentStreak = runningStreak;
  const graceDaysRemaining = Math.max(0, maxGraceDays - graceDaysUsed);

  let status = 'STABLE';
  let statusLabel = '🟢 Active';

  if (sortedEntries.length === 0) {
    status = 'INITIAL';
    statusLabel = '🌱 Not started';
  } else if (inRelapse) {
    status = 'RELAPSE';
    statusLabel = '⚠️ Relapse Detected';
  } else if (recoveryActive && !recoveryComplete) {
    status = 'RECOVERY';
    statusLabel = `🔄 Recovery (${recoveryDays}/${recoveryGoal})`;
  } else if (recoveryComplete && recoveryBonusAvailable) {
    status = 'STABLE';
    statusLabel = '🎉 Recovery Achieved (+1 Bonus)';
  } else if (graceUsedToday) {
    status = 'WARNING';
    statusLabel = '🛡️ Grace Protected';
  } else if (graceDaysRemaining === 0 && !recoveryBonusAvailable && currentStreak > 0) {
    status = 'WARNING';
    statusLabel = '🟡 Warning (Grace Maxed)';
  } else if (currentStreak === 0) {
    status = 'BROKEN';
    statusLabel = '⚪ Streak Reset';
  }

  return {
    currentStreak,
    bestStreak,
    graceDaysTotal: maxGraceDays,
    graceDaysUsed,
    graceDaysRemaining,
    graceUsedToday,
    relapse: inRelapse,
    recoveryActive,
    recoveryDays,
    recoveryGoal,
    recoveryComplete,
    recoveryBonusAvailable,
    recoveryBonusUsed,
    status,
    statusLabel
  };
}

module.exports = {
  calculateDailyScore,
  classifyDay,
  calculateStreak
};
