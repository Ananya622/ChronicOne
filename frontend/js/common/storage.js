/**
 * storage.js
 * In-memory client cache and API synchronization layer for ChronicOne.
 * Uses MongoDB Atlas via the Express backend as the single source of truth.
 * Strictly ZERO localStorage or sessionStorage usage.
 */

// In-memory cache of authenticated user's records loaded from MongoDB via API
const inMemoryCache = {
  checkIns: [],
  healthRecords: [],
  moodRecords: [],
  streakStats: null,
  synced: false
};

// Get the currently authenticated user object from the API client in-memory state
function getCurrentUser() {
  if (typeof window.api !== 'undefined' && typeof window.api.getCurrentUser === 'function') {
    const u = window.api.getCurrentUser();
    if (u) {
      if (u._id && !u.id) u.id = u._id;
      return u;
    }
  }
  return null;
}

/**
 * Synchronizes all persistent application data from the Express / MongoDB API
 */
async function syncAllDataFromApi() {
  if (typeof window.api === 'undefined') {
    return inMemoryCache;
  }

  try {
    const [meRes, checkInsRes, streakRes, healthRes, moodRes] = await Promise.all([
      window.api.get('/api/auth/me').catch(() => null),
      window.api.get('/api/checkin').catch(() => ({ checkIns: [] })),
      window.api.get('/api/streak').catch(() => null),
      window.api.get('/api/health-records').catch(() => ({ records: [] })),
      window.api.get('/api/wellness/mood').catch(() => ({ moods: [] }))
    ]);

    if (meRes && meRes.user) {
      window.api.setCurrentUser(meRes.user);
    }
    if (checkInsRes && Array.isArray(checkInsRes.checkIns)) {
      inMemoryCache.checkIns = checkInsRes.checkIns;
    }
    if (streakRes) {
      inMemoryCache.streakStats = streakRes;
    }
    if (healthRes && Array.isArray(healthRes.records)) {
      inMemoryCache.healthRecords = healthRes.records;
    }
    if (moodRes && Array.isArray(moodRes.moods)) {
      inMemoryCache.moodRecords = moodRes.moods;
    }
    inMemoryCache.synced = true;
    return inMemoryCache;
  } catch (err) {
    console.error('Failed to sync data from API:', err);
    return inMemoryCache;
  }
}

// Get check-ins filtered strictly for the current user, sorted chronologically ascending
function getUserCheckIns(user = null) {
  const activeUser = user || getCurrentUser();
  if (!activeUser) return [];

  const userId = activeUser.id || activeUser._id;

  return inMemoryCache.checkIns
    .filter(c => {
      const cUserId = c.userId || (c.user && (c.user._id || c.user));
      return cUserId === userId || !cUserId; // If already user-scoped from API
    })
    .sort((a, b) => new Date(a.date + 'T00:00:00') - new Date(b.date + 'T00:00:00'));
}

// Get health records filtered strictly for the current user, sorted descending (latest first)
function getUserHealthRecords(user = null) {
  const activeUser = user || getCurrentUser();
  if (!activeUser) return [];

  const userId = activeUser.id || activeUser._id;

  return inMemoryCache.healthRecords
    .filter(r => {
      const rUserId = r.userId || (r.user && (r.user._id || r.user));
      return rUserId === userId || !rUserId;
    })
    .sort((a, b) => new Date(b.date + 'T00:00:00') - new Date(a.date + 'T00:00:00'));
}

// Get mood records filtered strictly for the current user, sorted descending
function getUserMoodRecords(user = null) {
  const activeUser = user || getCurrentUser();
  if (!activeUser) return [];

  const userId = activeUser.id || activeUser._id;

  return inMemoryCache.moodRecords
    .filter(m => {
      const mUserId = m.userId || (m.user && (m.user._id || m.user));
      return mUserId === userId || !mUserId;
    })
    .sort((a, b) => new Date(b.date + 'T00:00:00') - new Date(a.date + 'T00:00:00'));
}

// Get today's check-in record for the active user (if one exists)
function getTodayCheckIn(user = null) {
  const today = typeof getTodayDate === 'function' ? getTodayDate() : new Date().toISOString().slice(0, 10);
  const userCheckIns = getUserCheckIns(user);
  return userCheckIns.find(c => c.date === today) || null;
}

// Get today's mood record for the active user (if one exists)
function getTodayMood(user = null) {
  const today = typeof getTodayDate === 'function' ? getTodayDate() : new Date().toISOString().slice(0, 10);
  const userMoods = getUserMoodRecords(user);
  return userMoods.find(m => m.date === today) || null;
}

// Authoritative streak retrieved directly from the backend streak engine
function getAuthoritativeStreak() {
  return inMemoryCache.streakStats;
}

// Updates check-in and streak cache after saving
function updateCachedCheckIn(checkIn, streakStats) {
  if (checkIn && checkIn.date) {
    const idx = inMemoryCache.checkIns.findIndex(c => c.date === checkIn.date);
    if (idx !== -1) {
      inMemoryCache.checkIns[idx] = checkIn;
    } else {
      inMemoryCache.checkIns.push(checkIn);
    }
    inMemoryCache.checkIns.sort((a, b) => new Date(a.date + 'T00:00:00') - new Date(b.date + 'T00:00:00'));
  }
  if (streakStats) {
    inMemoryCache.streakStats = streakStats;
  }
}

// Updates health reading cache after saving
function updateCachedHealthRecord(record) {
  if (record && record.type && record.date) {
    const idx = inMemoryCache.healthRecords.findIndex(r => r.type === record.type && r.date === record.date);
    if (idx !== -1) {
      inMemoryCache.healthRecords[idx] = record;
    } else {
      inMemoryCache.healthRecords.unshift(record);
    }
    inMemoryCache.healthRecords.sort((a, b) => new Date(b.date + 'T00:00:00') - new Date(a.date + 'T00:00:00'));
  }
}

// Updates mood record cache after saving
function updateCachedMoodRecord(record) {
  if (record && record.date) {
    const idx = inMemoryCache.moodRecords.findIndex(m => m.date === record.date);
    if (idx !== -1) {
      inMemoryCache.moodRecords[idx] = record;
    } else {
      inMemoryCache.moodRecords.unshift(record);
    }
    inMemoryCache.moodRecords.sort((a, b) => new Date(b.date + 'T00:00:00') - new Date(a.date + 'T00:00:00'));
  }
}

// Ensure user always has habits configured (self-heals older test accounts)
function getEffectiveUserHabits(user) {
  if (user && Array.isArray(user.habits) && user.habits.length > 0) {
    return user.habits;
  }
  let resolved = ['medication', 'exercise', 'diet'];
  if (user && user.conditions && typeof window.getRecommendedHabitsForConditions === 'function') {
    const rec = window.getRecommendedHabitsForConditions(user.conditions);
    if (rec && rec.length > 0) resolved = rec;
  }
  if (user) {
    user.habits = resolved;
  }
  return resolved;
}

// Export for module systems if applicable
if (typeof window !== 'undefined') {
  window.inMemoryCache = inMemoryCache;
  window.getCurrentUser = getCurrentUser;
  window.syncAllDataFromApi = syncAllDataFromApi;
  window.getUserCheckIns = getUserCheckIns;
  window.getUserHealthRecords = getUserHealthRecords;
  window.getUserMoodRecords = getUserMoodRecords;
  window.getTodayCheckIn = getTodayCheckIn;
  window.getTodayMood = getTodayMood;
  window.getAuthoritativeStreak = getAuthoritativeStreak;
  window.updateCachedCheckIn = updateCachedCheckIn;
  window.updateCachedHealthRecord = updateCachedHealthRecord;
  window.updateCachedMoodRecord = updateCachedMoodRecord;
  window.getEffectiveUserHabits = getEffectiveUserHabits;
}
