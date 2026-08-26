/**
 * auth-guard.js (common)
 * Lightweight authentication session guard and logout handler for dashboard pages.
 */

// Verifies that a valid currentUser session exists in LocalStorage.
// Redirects to index.html if unauthenticated.
function requireAuth() {
  const currentUserId = localStorage.getItem('currentUser');
  if (!currentUserId) {
    window.location.href = 'index.html';
    return null;
  }

  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (!user) {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
    return null;
  }

  return user;
}

// Logs out the active user and redirects to the login screen
function logoutUser() {
  localStorage.removeItem('currentUser');
  window.location.href = 'index.html';
}

// Export for module systems if applicable
if (typeof window !== 'undefined') {
  window.requireAuth = requireAuth;
  window.logoutUser = logoutUser;
}
