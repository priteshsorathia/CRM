"use client";

import { useTokenValidation } from "@/hooks/useTokenValidation";
import UserTypeProtection from "@/components/UserTypeProtection";
import { isPublicRoute } from "@/constants/routes";
import { usePathname } from "next/navigation";

export default function TokenValidationWrapper({ children }) {
  const pathname = usePathname();
  const publicPath = isPublicRoute(pathname);

  // Validate token every 5 minutes
  useTokenValidation(5 * 60 * 1000, !publicPath);
  
  if (publicPath) {
    return children;
  }

  return (
    <UserTypeProtection allowedUserType="restaurants">
      {children}
    </UserTypeProtection>
  );
}
