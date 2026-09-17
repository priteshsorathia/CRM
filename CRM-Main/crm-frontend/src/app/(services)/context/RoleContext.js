"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getUserRole } from "@/utils/auth";
import { getApiBase } from "@/utils/apiBase";

const RoleContext = createContext();

// Default permissions for when nothing is set in localStorage
const DEFAULT_PERMISSIONS = {
  Admin: {
    PROJECT: { CREATE: true, READ: true, UPDATE: true, DELETE: true },
    ASSETS: { CREATE: true, READ: true, UPDATE: true, DELETE: true },
    EMPLOYEE: { CREATE: true, READ: true, UPDATE: true, DELETE: true },
    LEAVE_MANAGEMENT: { CREATE: true, READ: true, UPDATE: true, DELETE: true },
    ROLES: { CREATE: true, READ: true, UPDATE: true, DELETE: true },
    CLIENTS: { CREATE: true, READ: true, UPDATE: true, DELETE: true },
    BILLING: { CREATE: true, READ: true, UPDATE: true, DELETE: true },
    EXPENSES: { CREATE: true, READ: true, UPDATE: true, DELETE: true },
    ACCOUNTING: { CREATE: true, READ: true, UPDATE: true, DELETE: true },
    REPORTS: { CREATE: true, READ: true, UPDATE: true, DELETE: true },
    ACTIVITY_LOGS: { CREATE: true, READ: true, UPDATE: true, DELETE: true },
    SETTINGS: { CREATE: true, READ: true, UPDATE: true, DELETE: true },
    TASK: { CREATE: true, READ: true, UPDATE: true, DELETE: true }
  },
};

export const RoleProvider = ({ children }) => {
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);


  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (!token) {
          setPermissions(DEFAULT_PERMISSIONS);
          setLoading(false);
          return;
        }

        const API_BASE = getApiBase();

        // 1. Fetch LATEST user data (to see if designation was changed by admin)
        // Note: authRoutes are mounted at /auth (not /api/auth)
        const userRes = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        let activeRole = '';
        if (userRes.ok) {
          const userResult = await userRes.json();
          const user = userResult.data || userResult.user;
          // Designation role from Employee profile
          activeRole = user?.role || user?.employee?.role || '';

          if (user) {
            localStorage.setItem('userData', JSON.stringify(user));
            localStorage.setItem('user', JSON.stringify(user));
          }
        } else {
          // Fallback to local storage if API fails
          activeRole = getUserRole() || '';
        }

        const rawRole = String(activeRole || "").trim().toLowerCase();
        const isAdminNormalized = (
          rawRole === 'admin' || 
          rawRole === 'shop_owner' || 
          rawRole === 'owner' || 
          rawRole === 'manager' ||
          rawRole.endsWith('_owner')
        );

        const normalizedRole = isAdminNormalized ? 'Admin' : activeRole;
        setUserRole(normalizedRole);

        // 2. Fetch full permission matrix
        // Note: permissions are mounted at /api/roles/permissions
        const res = await fetch(`${API_BASE}/api/roles/permissions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.permissions && Object.keys(data.permissions).length > 0) {
            setPermissions(data.permissions);
          } else {
            console.warn("No permissions found in DB, using defaults");
            setPermissions(DEFAULT_PERMISSIONS);
          }
        } else {
          console.error("Failed to fetch permissions from API, using defaults");
          setPermissions(DEFAULT_PERMISSIONS);
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
        setPermissions(DEFAULT_PERMISSIONS);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const can = (module, action) => {
    if (!userRole) return false;

    // Admin bypass
    if (userRole === 'Admin') return true;

    // Case-insensitive lookup (important for matching designation roles)
    let rolePermissions = permissions[userRole];
    if (!rolePermissions && userRole) {
      const keys = Object.keys(permissions);
      const matchedKey = keys.find(k => k.toLowerCase() === userRole.toLowerCase());
      if (matchedKey) {
        rolePermissions = permissions[matchedKey];
      }
    }

    if (!rolePermissions || !rolePermissions[module]) {
      return false;
    }

    return !!rolePermissions[module][action];
  };

  const updatePermissions = (updatedSet) => {
    setPermissions(updatedSet);
  };

  return (
    <RoleContext.Provider value={{ permissions, can, userRole, updatePermissions, loading }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
};
