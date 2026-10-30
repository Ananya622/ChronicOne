/**
 * api.js
 * Centralized API client for ChronicOne.
 * Uses secure HttpOnly cookies for session management with CSRF defense.
 * Strictly ZERO localStorage or sessionStorage usage.
 */

(function (window) {
  'use strict';

  // Configurable base URL (defaults to same-origin relative paths)
  const API_BASE_URL = window.API_BASE_URL || '';

  // In-memory session state (never written to browser storage)
  let inMemoryUser = null;

  const api = {
    /**
     * Retrieves the current user profile from in-memory state
     */
    getCurrentUser: function () {
      return inMemoryUser;
    },

    /**
     * Stores the user profile in in-memory state
     */
    setCurrentUser: function (user) {
      if (user) {
        inMemoryUser = { ...user };
        if (inMemoryUser._id && !inMemoryUser.id) {
          inMemoryUser.id = inMemoryUser._id;
        }
      } else {
        inMemoryUser = null;
      }
    },

    /**
     * Backward-compatible session setter (accepts token, user or just user)
     */
    setSession: function (tokenOrUser, user) {
      this.setCurrentUser(user || tokenOrUser);
    },

    /**
     * Clears in-memory session state
     */
    clearSession: function () {
      inMemoryUser = null;
    },

    /**
     * Checks if an in-memory session exists
     */
    isAuthenticated: function () {
      return !!inMemoryUser;
    },

    /**
     * Validates session with backend /api/auth/me and initializes in-memory profile
     */
    checkAuth: async function () {
      try {
        const res = await this.get('/api/auth/me');
        if (res && res.user) {
          this.setCurrentUser(res.user);
          return res.user;
        }
        this.clearSession();
        return null;
      } catch (e) {
        this.clearSession();
        return null;
      }
    },

    /**
     * Logs out by calling backend /api/auth/logout to clear HttpOnly cookie
     */
    logout: async function () {
      try {
        await this.post('/api/auth/logout');
      } catch (e) {
        // Continue even if network error
      }
      this.clearSession();
      window.location.href = 'index.html';
    },

    /**
     * Core fetch wrapper with JSON serialization, HttpOnly cookie credentials, and CSRF protection
     */
    request: async function (endpoint, options = {}) {
      const url = `${API_BASE_URL}${endpoint}`;
      const method = (options.method || 'GET').toUpperCase();
      const headers = {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest', // CSRF defense
        ...(options.headers || {})
      };

      let body = options.body;
      if (body && typeof body === 'object' && !(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(body);
      }

      try {
        const response = await fetch(url, {
          method,
          headers,
          body,
          credentials: 'same-origin' // Automatically send and receive HttpOnly session cookie
        });

        // 401 Unauthorized handling: session expired or unauthenticated
        if (response.status === 401) {
          this.clearSession();
          const isAuthPage = window.location.pathname.endsWith('index.html') ||
                             window.location.pathname === '/' ||
                             window.location.pathname === '';
          if (!isAuthPage) {
            window.location.href = 'index.html';
          }
        }

        let data = null;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          data = text ? { raw: text } : {};
        }

        if (!response.ok) {
          const errorMessage = data && (data.error || data.message)
            ? (data.error || data.message)
            : `Request failed with status ${response.status}`;
          const error = new Error(errorMessage);
          error.status = response.status;
          error.data = data;
          throw error;
        }

        return data;
      } catch (err) {
        if (!err.status) {
          err.status = 0;
          err.isNetworkError = true;
          err.message = err.message || 'Unable to connect to ChronicOne server. Please verify your connection.';
        }
        throw err;
      }
    },

    get: function (endpoint, headers) {
      return this.request(endpoint, { method: 'GET', headers });
    },

    post: function (endpoint, body, headers) {
      return this.request(endpoint, { method: 'POST', body, headers });
    },

    put: function (endpoint, body, headers) {
      return this.request(endpoint, { method: 'PUT', body, headers });
    },

    patch: function (endpoint, body, headers) {
      return this.request(endpoint, { method: 'PATCH', body, headers });
    },

    delete: function (endpoint, headers) {
      return this.request(endpoint, { method: 'DELETE', headers });
    }
  };

  window.api = api;
})(window);
