"use client";

import React from "react";
import { useRole } from "@/app/(services)/context/RoleContext";

/**
 * PermissionWrapper
 * 
 * Hides children if the user doesn't have the required permission.
 * 
 * @param {string} module - The module name (e.g., 'PROJECT', 'EMPLOYEE')
 * @param {string} action - The action name (e.g., 'CREATE', 'UPDATE', 'DELETE', 'READ')
 * @param {React.ReactNode} fallback - Optional fallback to show if permission is denied
 */
export default function PermissionWrapper({ module, action, children, fallback = null }) {
  const { can, loading } = useRole();

  if (loading) return null;

  if (can(module, action)) {
    return <>{children}</>;
  }

  return fallback;
}
