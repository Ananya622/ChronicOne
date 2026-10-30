/**
 * utils.js
 * Common utility functions for formatting, date handling, and UI feedback.
 */

const APP_TIMEZONE = 'Asia/Kolkata';

// Returns today's date formatted as YYYY-MM-DD in authoritative Asia/Kolkata timezone
function getTodayDate(now = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: APP_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);
  } catch (err) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: APP_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(now);
    const map = {};
    for (const p of parts) map[p.type] = p.value;
    return `${map.year}-${map.month}-${map.day}`;
  }
}

// Generates 2-letter uppercase initials from a user's full name
function getUserInitials(name) {
  if (!name) return 'US';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// Displays a non-blocking floating toast notification
function showToast(message, type = 'success') {
  const container = document.getElementById('dashToastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✨' : 'ℹ️'}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// Export for module systems if applicable
if (typeof window !== 'undefined') {
  window.APP_TIMEZONE = APP_TIMEZONE;
  window.getTodayDate = getTodayDate;
  window.getUserInitials = getUserInitials;
  window.showToast = showToast;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    APP_TIMEZONE,
    getTodayDate,
    getUserInitials,
    showToast
  };
}
