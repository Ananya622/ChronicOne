/**
 * auth-guard.js (common)
 * Lightweight authentication session guard and logout handler for dashboard pages.
 * Strictly ZERO localStorage or sessionStorage usage.
 */

// Verifies that a valid session exists via the centralized API client.
// Checks in-memory session or validates HttpOnly cookie with /api/auth/me.
// Redirects to index.html if unauthenticated.
async function requireAuth() {
  if (typeof window.api !== 'undefined') {
    let user = window.api.getCurrentUser();
    if (user) {
      return user;
    }
    // Restore session from HttpOnly cookie on page load / refresh
    try {
      user = await window.api.checkAuth();
      if (user) {
        return user;
      }
    } catch (error) {
      console.warn('Network connectivity issue during authentication check:', error.message || error);
      if (typeof showToast === 'function') {
        showToast('Temporary network issue connecting to server. Retrying session...', 'info');
      }
      return null;
    }
  }

  // If unauthenticated or session expired, redirect to index.html
  window.location.href = 'index.html';
  return null;
}

// Logs out the active user by clearing the HttpOnly cookie on backend and redirecting
async function logoutUser() {
  if (typeof window.api !== 'undefined' && typeof window.api.logout === 'function') {
    await window.api.logout();
  } else {
    window.location.href = 'index.html';
  }
}

// Export for module systems if applicable
if (typeof window !== 'undefined') {
  window.requireAuth = requireAuth;
  window.logoutUser = logoutUser;
}
