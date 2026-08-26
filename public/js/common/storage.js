/**
 * storage.js
 * Common LocalStorage access layer for ChronicOne.
 * Provides safe getters, setters, and user-scoped data queries.
 */

// Safe array retrieval from LocalStorage
function getStorageArray(key) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : [];
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
    return [];
  }
}

// Safe array storage to LocalStorage
function setStorageArray(key, arr) {
  try {
    localStorage.setItem(key, JSON.stringify(arr));
  } catch (e) {
    console.error(`Error writing ${key} to localStorage:`, e);
  }
}

// Get the currently authenticated user object from LocalStorage
function getCurrentUser() {
  const currentUserId = localStorage.getItem('currentUser');
  if (!currentUserId) return null;

  const users = getStorageArray('users');
  return users.find(u => u.id === currentUserId) || null;
}

// Get check-ins filtered strictly for the current user, sorted chronologically ascending
function getUserCheckIns(user = null) {
  const activeUser = user || getCurrentUser();
  if (!activeUser) return [];

  const checkIns = getStorageArray('checkIns');
  return checkIns
    .filter(c => c.userId === activeUser.id)
    .sort((a, b) => new Date(a.date + 'T00:00:00') - new Date(b.date + 'T00:00:00'));
}

// Get health records filtered strictly for the current user, sorted descending (latest first)
function getUserHealthRecords(user = null) {
  const activeUser = user || getCurrentUser();
  if (!activeUser) return [];

  const records = getStorageArray('healthRecords');
  return records
    .filter(r => r.userId === activeUser.id)
    .sort((a, b) => new Date(b.date + 'T00:00:00') - new Date(a.date + 'T00:00:00'));
}

// Get mood records filtered strictly for the current user, sorted descending
function getUserMoodRecords(user = null) {
  const activeUser = user || getCurrentUser();
  if (!activeUser) return [];

  const moods = getStorageArray('moodRecords');
  return moods
    .filter(m => m.userId === activeUser.id)
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
    const allUsers = getStorageArray('users');
    const idx = allUsers.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      allUsers[idx].habits = resolved;
      setStorageArray('users', allUsers);
    }
  }
  return resolved;
}

// Export for module systems if applicable
if (typeof window !== 'undefined') {
  window.getStorageArray = getStorageArray;
  window.setStorageArray = setStorageArray;
  window.getCurrentUser = getCurrentUser;
  window.getUserCheckIns = getUserCheckIns;
  window.getUserHealthRecords = getUserHealthRecords;
  window.getUserMoodRecords = getUserMoodRecords;
  window.getTodayCheckIn = getTodayCheckIn;
  window.getTodayMood = getTodayMood;
  window.getEffectiveUserHabits = getEffectiveUserHabits;
}
