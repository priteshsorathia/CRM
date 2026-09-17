/**
 * API Interceptor utility to handle token validation and automatic logout
 */

import { getToken, forceLogout } from './auth';

/**
 * Enhanced fetch wrapper that handles token validation and automatic logout
 */
export async function authenticatedFetch(url, options = {}) {
  const token = getToken();
  
  // If no token, force logout
  if (!token) {
    forceLogout('No authentication token found');
    throw new Error('No authentication token');
  }

  // Add Authorization header
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      console.error('❌ 401 Unauthorized - Token expired or invalid');
      
      // Try to parse response to check for forceLogout flag
      try {
        const data = await response.clone().json();
        if (data.forceLogout || data.blocked) {
          forceLogout(data.error || 'Your session has expired. Please login again.');
        } else {
          forceLogout('Your session has expired. Please login again.');
        }
      } catch {
        forceLogout('Your session has expired. Please login again.');
      }
      
      throw new Error('Unauthorized: Token expired or invalid');
    }

    // Handle 403 Forbidden - token not authorized
    if (response.status === 403) {
      console.error('❌ 403 Forbidden - Access denied');
      
      // Try to parse response to check for forceLogout flag
      try {
        const data = await response.clone().json();
        if (data.forceLogout || data.blocked) {
          forceLogout(data.error || 'Access denied. Please login again.');
        } else {
          // Don't logout for access denied (userType mismatch), just throw error
          throw new Error(data.error || 'Access denied');
        }
      } catch (error) {
        if (error.message.includes('Access denied')) {
          throw error;
        }
        forceLogout('Access denied. Please login again.');
      }
      
      throw new Error('Forbidden: Access denied');
    }

    // Check response body for forceLogout flag (even if status is 200)
    try {
      const data = await response.clone().json();
      if (data.forceLogout || data.blocked) {
        forceLogout(data.error || 'Your account status has changed. Please login again.');
        throw new Error('Account status changed');
      }
    } catch (error) {
      if (error.message === 'Account status changed') {
        throw error;
      }
      // Ignore JSON parse errors for non-JSON responses
    }

    return response;
  } catch (error) {
    // If it's already a logout error, re-throw
    if (error.message.includes('No authentication token') || 
        error.message.includes('Unauthorized') || 
        error.message.includes('Forbidden')) {
      throw error;
    }
    
    // Network errors - don't logout, just throw
    console.error('Network error:', error);
    throw error;
  }
}

/**
 * Check fetch response and handle token errors
 */
export function checkResponse(response) {
  if (response.status === 401) {
    console.error('❌ 401 Unauthorized - Token expired or invalid');
    forceLogout('Your session has expired. Please login again.');
    return false;
  }

  if (response.status === 403) {
    console.error('❌ 403 Forbidden - Access denied');
    forceLogout('Access denied. Please login again.');
    return false;
  }

  return true;
}

/**
 * Check if response indicates token is invalid
 */
export function isTokenInvalid(response) {
  return response.status === 401 || response.status === 403;
}

/**
 * Handle API error and logout if needed
 */
export function handleApiError(error, response) {
  if (response && isTokenInvalid(response)) {
    forceLogout('Your session has expired. Please login again.');
  }
  throw error;
}
