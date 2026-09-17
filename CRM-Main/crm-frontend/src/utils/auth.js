/**
 * Get token from localStorage
 */
export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken') || localStorage.getItem('token');
}

function clearClientAuthCookies() {
  if (typeof window === "undefined") return;

  const cookieNames = ["authToken", "token"];
  const host = window.location.hostname;
  const parts = host.split(".");
  const maybeParentDomain =
    parts.length > 2 ? `.${parts.slice(-2).join(".")}` : null;

  const domains = [null, host, `.${host}`, maybeParentDomain].filter(Boolean);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";

  for (const name of cookieNames) {
    // Clear host-only cookie
    document.cookie = `${name}=; path=/; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}`;
    // Clear domain-scoped variants
    for (const domain of domains) {
      document.cookie = `${name}=; path=/; domain=${domain}; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}`;
    }
  }
}

/**
 * Check if user is authenticated (has token)
 */
export function isAuthenticated() {
  const token = getToken();
  if (!token) return false;

  // App routing is protected by Next middleware using the `authToken` cookie.
  // If the cookie is missing, treat the session as unauthenticated to avoid
  // redirect loops where localStorage has a token but middleware blocks routes.
  if (typeof window !== "undefined") {
    const hasCookie = document.cookie
      .split(";")
      .some((c) => c.trim().startsWith("authToken="));
    if (!hasCookie) return false;
  }

  // If token looks like a JWT, validate its expiry client-side to avoid redirect loops.
  // If decoding fails, fall back to "has token" (server-side validation still applies elsewhere).
  try {
    const parts = token.split(".");
    if (parts.length >= 2) {
      const payloadJson = atob(parts[1]);
      const payload = JSON.parse(payloadJson);
      const exp = Number(payload?.exp);
      if (Number.isFinite(exp)) {
        const nowSeconds = Date.now() / 1000;
        if (exp <= nowSeconds + 5) {
          // Expired token: clear locally to prevent stuck loading/redirect loops.
          if (typeof window !== "undefined") {
            localStorage.removeItem("authToken");
            localStorage.removeItem("token");
          }
          return false;
        }
      }
    }
  } catch {
    // ignore
  }

  return true;
}

/**
 * Login and store token
 */
export function login(token) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('authToken', token);
  localStorage.setItem('token', token); // Also store as 'token' for compatibility
}

/**
 * Forcefully logout - clears all tokens and redirects to login
 */
export function logout() {
  if (typeof window === 'undefined') return;

  const alreadyLoggingOut = sessionStorage.getItem("isLoggingOut") === "1";
  if (alreadyLoggingOut && window.location.pathname === "/auth/login") {
    return;
  }
  sessionStorage.setItem("isLoggingOut", "1");

  const token = getToken();

  // Clear all possible token storage locations
  localStorage.removeItem('authToken');
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
  localStorage.removeItem('user');
  localStorage.removeItem('rememberMe');
  localStorage.removeItem('redirectAfterLogin');

  // Clear sessionStorage
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('userData');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('justLoggedIn');

  // Clear all known auth cookie variants
  clearClientAuthCookies();

  // Best-effort backend logout for server-set cookies/session cleanup
  try {
    const { getApiBase } = require("./apiBase");
    const API_BASE = getApiBase();
    if (API_BASE) {
      fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // non-blocking
  }

  // Force redirect to login with full page reload
  window.location.replace('/auth/login');
}

/**
 * Validate token with backend
 */
export async function validateToken() {
  const token = getToken();
  if (!token) {
    return { valid: false, reason: 'no_token' };
  }

  try {
    const API_BASE = require('./apiBase').getApiBase();

    // Try to validate with backend using /auth/me endpoint
    const response = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401 || response.status === 403) {
      const data = await response.json().catch(() => ({}));
      if (data.blocked || data.forceLogout) {
        return { valid: false, reason: 'blocked', blocked: true, error: data.error };
      }
      return { valid: false, reason: 'invalid_token' };
    }

    if (response.ok) {
      const data = await response.json();
      const user = data.data || data.user || null;

      // Check if user or shop is blocked
      if (user?.isBlocked || user?.shop?.isBlocked) {
        return { valid: false, reason: 'blocked', blocked: true };
      }

      return { valid: true, user };
    }

    // If endpoint doesn't exist (404), assume token is valid for development
    if (response.status === 404) {
      console.warn('Token validation endpoint not found, assuming token is valid (development mode)');
      return { valid: true, reason: 'endpoint_not_found' };
    }

    return { valid: false, reason: 'validation_failed' };
  } catch (error) {
    // If backend is not available (network error), assume token is valid for development
    // In production, you might want to return false here
    if (error.message.includes('fetch') || error.message.includes('network') || error.name === 'TypeError') {
      console.warn('Backend not available or connection failed, assuming token is valid (offline mode)');
      return { valid: true, reason: 'offline' };
    }
    console.error('Token validation error:', error);
    return { valid: false, reason: 'validation_error' };
  }
}

/**
 * Force logout if token is invalid
 */
export function forceLogout(reason = 'Session expired') {
  console.warn(`Force logout: ${reason}`);
  logout();
}

/**
 * Get the current user's role from localStorage
 * @returns {string|null} The user's role (e.g., 'shop_owner', 'owner', 'Cashier', etc.) or null
 */
export function getUserRole() {
  if (typeof window === 'undefined') return null;

  try {
    const userStr = localStorage.getItem('userData') || localStorage.getItem('user');
    if (!userStr) return null;

    const user = JSON.parse(userStr);
    // Role may be stored as 'role' or 'user_role'
    return user.role || user.user_role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Check if the current user is a shop owner
 * @returns {boolean} True if user is shop_owner or owner
 */
export function isShopOwner() {
  const role = getUserRole();
  return role === 'shop_owner' || role === 'owner';
}
