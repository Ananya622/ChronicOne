/**
 * utils.js
 * Common utility functions for formatting, date handling, and UI feedback.
 */

// Returns today's date formatted as YYYY-MM-DD
function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  window.getTodayDate = getTodayDate;
  window.getUserInitials = getUserInitials;
  window.showToast = showToast;
}
