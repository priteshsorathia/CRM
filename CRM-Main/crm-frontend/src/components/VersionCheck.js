'use client';

import { useEffect } from 'react';
import { getVersionCheck } from '@/services/systemService';

/**
 * VersionCheck Component
 * Performs a silent fetch to the version API for developer visibility in the Network tab.
 * Does not render any UI on the frontend as requested.
 */
const VersionCheck = () => {
  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const data = await getVersionCheck();
        // Silent success - available in Network tab
      } catch (err) {
        // Silent error - available in Network tab
      }
    };

    fetchInfo();
  }, []);

  // Return null to ensure no UI is shown on the frontend
  return null;
};

export default VersionCheck;
