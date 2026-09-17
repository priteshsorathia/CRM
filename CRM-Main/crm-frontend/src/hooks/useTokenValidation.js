"use client";

import { useEffect, useRef } from 'react';
import { getToken, validateToken, forceLogout } from '@/utils/auth';

/**
 * Hook to periodically validate token and auto-logout if invalid
 * @param {number} interval - Validation interval in milliseconds (default: 5 minutes)
 * @param {boolean} enabled - Whether token validation should run
 */
export function useTokenValidation(interval = 5 * 60 * 1000, enabled = true) {
  const intervalRef = useRef(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined' || !enabled) return;

    const validate = async () => {
      const token = getToken();
      
      // If no token, force logout
      if (!token) {
        forceLogout('No authentication token found');
        return;
      }

      // Validate token with backend
      try {
        const validation = await validateToken();
        if (!validation.valid && validation.reason !== 'offline' && validation.reason !== 'endpoint_not_found') {
          // Token is invalid or user is blocked - force logout
          if (validation.blocked) {
            forceLogout(validation.error || 'Your account has been blocked. Please contact administrator.');
          } else {
            forceLogout('Your session has expired. Please login again.');
          }
        }
      } catch (error) {
        console.error('Token validation error in hook:', error);
        // Don't logout on network errors, just log
      }
    };

    // Validate immediately
    validate();

    // Set up periodic validation
    intervalRef.current = setInterval(validate, interval);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval]);
}
