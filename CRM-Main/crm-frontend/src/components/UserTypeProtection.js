"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getToken } from '@/utils/auth';
import BlockedScreen from './BlockedScreen';
import { getApiBase } from '@/utils/apiBase';

/**
 * Component to protect routes based on userType
 * Only allows access to routes matching the user's type (retailers/restaurants)
 */
export default function UserTypeProtection({ children, allowedUserType }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedReason, setBlockedReason] = useState('');

  useEffect(() => {
    const checkUserType = async () => {
      try {
        const token = getToken();
        if (!token) {
          router.push('/auth/login');
          return;
        }

        // Decode token to get userType (simple base64 decode)
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const userType = payload.userType || 'retailers';

          // Check if userType matches allowed type - FORCE redirect if mismatch
          if (allowedUserType && userType !== allowedUserType) {
            // Forcefully redirect based on userType
            if (userType === 'retailers') {
              window.location.href = '/dashboard';
            } else if (userType === 'restaurants') {
              window.location.href = '/restaurant';
            } else if (userType === 'services') {
              window.location.href = '/services';
            } else {
              window.location.href = '/auth/login';
            }
            return;
          }

          // Validate token with backend
          const API_BASE = getApiBase();
          const response = await fetch(`${API_BASE}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.status === 401 || response.status === 403) {
            const data = await response.json();
            if (data.blocked || data.forceLogout) {
              setIsBlocked(true);
              setBlockedReason(data.error || 'Your account has been blocked');
              return;
            }
            router.push('/auth/login');
            return;
          }

          if (response.ok) {
            const result = await response.json();
            const currentUserType = result.data?.userType || result.data?.shop?.userType || 'retailers';

            // Check if userType changed
            if (payload.userType && payload.userType !== currentUserType) {
              setIsBlocked(true);
              setBlockedReason('Your account type has changed. Please login again.');
              return;
            }

            // Check if user or shop is blocked
            if (result.data?.isBlocked || result.data?.shop?.isBlocked) {
              setIsBlocked(true);
              setBlockedReason('Your account has been blocked');
              return;
            }

            // Double check userType matches - force redirect if not
            if (allowedUserType && currentUserType !== allowedUserType) {
              if (currentUserType === 'retailers') {
                window.location.href = '/dashboard';
              } else if (currentUserType === 'restaurants') {
                window.location.href = '/restaurant';
              } else if (currentUserType === 'services') {
                window.location.href = '/services';
              } else {
                window.location.href = '/auth/login';
              }
              return;
            }

            setIsAuthorized(true);
          } else {
            router.push('/auth/login');
          }
        } catch (error) {
          console.error('Error checking user type:', error);
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Error in UserTypeProtection:', error);
        router.push('/auth/login');
      } finally {
        setIsChecking(false);
      }
    };

    checkUserType();
  }, [router, allowedUserType]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (isBlocked) {
    return <BlockedScreen reason={blockedReason} />;
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
