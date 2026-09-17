"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Shield,
  FileText,
  HelpCircle,
  Globe,
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [dashboardHref, setDashboardHref] = useState("/");

  useEffect(() => {
    try {
      const userDataStr = localStorage.getItem("userData");
      const userStr = localStorage.getItem("user");
      let user = {};
      if (userDataStr) user = { ...user, ...JSON.parse(userDataStr) };
      if (userStr) user = { ...user, ...JSON.parse(userStr) };

      if (user && Object.keys(user).length > 0) {
        const userType = user.userType || user.user_type;
        const role = user.role || user.user_role;
        
        if (userType === "restaurants") {
          if (role) {
            const r = String(role).trim().toLowerCase();
            const isAdmin = r === 'admin' || r === 'administrator' || r === 'owner' || r === 'shop_owner' || r === 'restaurant_owner' || r.endsWith('_owner');
            const isChef = r === 'chef' || r === 'cook' || r === 'kitchen';
            
            if (isAdmin) setDashboardHref('/restaurant');
            else if (isChef) setDashboardHref('/restaurant/kitchen');
            else setDashboardHref('/restaurant/hrms');
          } else {
            setDashboardHref('/restaurant');
          }
        } else if (userType === "services") {
          setDashboardHref('/services');
        } else {
          setDashboardHref('/dashboard');
        }
      }
    } catch (e) {
      console.error("Error parsing user data in footer", e);
    }
  }, []);

  return (
    <footer className="bg-gray-50 border-t border-gray-200 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Section */}
        <div className="flex flex-row flex-wrap justify-between items-center gap-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href={dashboardHref} className="cursor-pointer hover:opacity-85 transition-opacity">
              <img
                src="/shop-logo.png"
                alt="CRM Logo"
                className="h-6 lg:h-8 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Links */}
          <div className="flex flex-row flex-wrap items-center gap-x-3 gap-y-1 justify-end">
            <Link
              href="/auth/privacy"
              className="flex items-center gap-1 text-[11px] lg:text-sm text-gray-700 hover:text-blue-700 hover:underline transition-colors"
            >
              <Shield size={12} className="text-gray-500" />
              Privacy
            </Link>

            <Link
              href="/auth/terms"
              className="flex items-center gap-1 text-[11px] lg:text-sm text-gray-700 hover:text-blue-700 hover:underline transition-colors"
            >
              <FileText size={12} className="text-gray-500" />
              Terms
            </Link>

            <Link
              href="/auth/support"
              className="flex items-center gap-1 text-[11px] lg:text-sm text-gray-700 hover:text-blue-700 hover:underline transition-colors"
            >
              <HelpCircle size={12} className="text-gray-500" />
              Support
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-300 my-4"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0">
          <p className="text-gray-600 text-[10px] lg:text-sm text-center md:text-left">
            &copy; {currentYear}{" "}
            <span className="font-medium text-gray-800">
              CRM Private Limited
            </span>
            <span className="mx-1">•</span> All rights reserved.
          </p>

          {/* Version */}
          <div className="mt-2 md:mt-0">
            <span className="text-xs font-mono text-gray-700 bg-white border border-gray-300 px-2.5 py-1 rounded">
              v{process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
