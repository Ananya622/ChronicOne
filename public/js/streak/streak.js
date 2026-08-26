/**
 * streak.js
 * Centralized Basic Streak, Grace Day, Relapse & Simple Recovery Engine for ChronicOne.
 * 
 * Rules:
 *   FULL (100%)       -> Successful day (streak +1, no grace used, recovery progress +1)
 *   PARTIAL (50-99%)  -> Successful day (streak +1, no grace used, recovery progress +1)
 *   LOW (1-49%)       -> Unsuccessful day:
 *                        - If active streak & grace available: 1 grace day used to protect streak
 *                        - If active streak, grace exhausted, but recovery bonus available: bonus consumed to protect streak
 *                        - If active streak & NO grace/bonus left: streak resets to 0 -> RELAPSE = TRUE, recovery resets to 0
 *                        - If recovery in progress: recovery progress resets to 0
 *   MISSED (0%)       -> Unsuccessful day:
 *                        - If active streak & grace available: 1 grace day used to protect streak
 *                        - If active streak, grace exhausted, but recovery bonus available: bonus consumed to protect streak
 *                        - If active streak & NO grace/bonus left: streak resets to 0 -> RELAPSE = TRUE, recovery resets to 0
 *                        - If recovery in progress: recovery progress resets to 0
 *   Date gap (>1 day) -> Missing calendar day(s):
 *                        - Uses available grace / recovery bonus per missing day to bridge the gap
 *                        - If insufficient protection on active streak: streak resets to 0 -> RELAPSE = TRUE
 * 
 * Recovery Rules (Part 5):
 *   - Recovery starts ONLY after a relapse has occurred.
 *   - Goal: 3 consecutive successful days (FULL or PARTIAL).
 *   - Each successful day: recoveryDays += 1 (capped at 3/3).
 *   - Unsuccessful day during recovery: recoveryDays resets to 0.
 *   - Upon reaching 3/3: recoveryComplete = true, recoveryActive = false, recoveryBonusAvailable = true (one-time bonus).
 *   - Calculations are deterministic, user-scoped, and 100% idempotent.
 */

function calculateStreak(user = null) {
  const maxGraceDays = 2;
  const recoveryGoal = 3;

  // 1. Retrieve history strictly belonging to active user
  const activeUser = user || (typeof getCurrentUser === 'function' ? getCurrentUser() : null);
  if (!activeUser) {
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

  const rawHistory = typeof getUserCheckIns === 'function' ? getUserCheckIns(activeUser) : [];
  const userHabits = typeof getEffectiveUserHabits === 'function' ? getEffectiveUserHabits(activeUser) : (activeUser.habits || []);
  const todayDate = typeof getTodayDate === 'function' ? getTodayDate() : new Date().toISOString().slice(0, 10);

  if (!rawHistory || rawHistory.length === 0) {
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

  // 2. Normalize and deduplicate by date (latest record per date)
  const normalizedMap = {};
  rawHistory.forEach(rawEntry => {
    const entry = typeof normalizeCheckIn === 'function' ? normalizeCheckIn(rawEntry, userHabits) : rawEntry;
    if (entry && entry.date) {
      normalizedMap[entry.date] = entry;
    }
  });

  // 3. Sort entries chronologically by calendar date ascending
  const sortedEntries = Object.values(normalizedMap).sort((a, b) => {
    return new Date(a.date + 'T00:00:00') - new Date(b.date + 'T00:00:00');
  });

  let runningStreak = 0;
  let bestStreak = 0;
  let graceDaysUsed = 0;
  let prevDate = null;
  let graceUsedToday = false;

  // Recovery & Bonus tracking
  let inRelapse = false;
  let recoveryActive = false;
  let recoveryDays = 0;
  let recoveryComplete = false;
  let recoveryBonusAvailable = false;
  let recoveryBonusUsed = false;

  // 4. Chronological streak, grace, relapse, and recovery evaluation
  for (let i = 0; i < sortedEntries.length; i++) {
    const entry = sortedEntries[i];
    const currDate = new Date(entry.date + 'T00:00:00');

    // Determine if this day was successful (FULL or PARTIAL)
    const classification = entry.classification || entry.status;
    const isSuccess = (classification === 'FULL' || classification === 'PARTIAL');

    if (prevDate === null) {
      // First recorded check-in day
      if (isSuccess) {
        runningStreak = 1;
        inRelapse = false;
      } else {
        // Unsuccessful on first day: NO active streak to protect, NOT a relapse
        runningStreak = 0;
        inRelapse = false;
      }
    } else {
      // Calculate difference in calendar days between check-ins
      const diffTime = currDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      // Handle missing calendar days between records
      if (diffDays > 1) {
        const missingDays = diffDays - 1;
        for (let m = 0; m < missingDays; m++) {
          if (recoveryActive && !recoveryComplete) {
            recoveryDays = 0; // Calendar gap resets recovery progress
          }

          if (graceDaysUsed < maxGraceDays && runningStreak > 0) {
            // Use 1 normal grace day
            graceDaysUsed += 1;
          } else if (recoveryBonusAvailable && runningStreak > 0) {
            // Use recovery bonus grace day
            recoveryBonusAvailable = false;
            recoveryBonusUsed = true;
          } else if (runningStreak > 0) {
            // Missing day with no grace/bonus breaks active streak -> Relapse triggered
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

      // Now evaluate the current check-in entry
      if (isSuccess) {
        // Successful day continues or starts a new streak
        if (runningStreak > 0) {
          runningStreak += 1;
        } else {
          runningStreak = 1;
        }

        // Advance recovery progress if recovery was initiated
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
          recoveryDays = 0; // Unsuccessful day resets recovery progress to 0
        }

        if (graceDaysUsed < maxGraceDays && runningStreak > 0) {
          // Normal grace day used
          graceDaysUsed += 1;
          if (entry.date === todayDate) graceUsedToday = true;
          inRelapse = false;
        } else if (recoveryBonusAvailable && runningStreak > 0) {
          // Recovery bonus used
          recoveryBonusAvailable = false;
          recoveryBonusUsed = true;
          if (entry.date === todayDate) graceUsedToday = true;
          inRelapse = false;
        } else if (runningStreak > 0) {
          // Active streak with NO grace/bonus remaining -> RELAPSE
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

    // Track the highest consecutive streak achieved in history
    if (runningStreak > bestStreak) {
      bestStreak = runningStreak;
    }

    prevDate = currDate;
  }

  const currentStreak = runningStreak;
  const graceDaysRemaining = Math.max(0, maxGraceDays - graceDaysUsed);

  // Status mapping
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

// Alias for complete backward compatibility
function calculateUserStreak(user = null) {
  return calculateStreak(user);
}

// Export for module systems if applicable
if (typeof window !== 'undefined') {
  window.calculateStreak = calculateStreak;
  window.calculateUserStreak = calculateUserStreak;
}
