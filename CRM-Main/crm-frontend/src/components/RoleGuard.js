"use client";

import { useRole } from "@/app/(services)/context/RoleContext";
import { usePathname, useRouter } from "next/navigation";
import { ShieldX, Lock, Home, ArrowLeft } from "lucide-react";

/**
 * RoleGuard Component
 * Enhances URL security by checking sub-paths like /new, /edit, /delete.
 * Prevents unauthorized users from bypassing UI restrictions.
 */
export default function RoleGuard({ children }) {
  const { can, userRole, loading } = useRole();
  const pathname = usePathname();
  const router = useRouter();

  // Map module base paths to required permissions
  const routePermissions = {
    "/services/projects/tasks": "TASK",
    "/services/projects": "PROJECT",
    "/services/assets": "ASSETS",
    "/services/hrms": "EMPLOYEE",
    "/services/hrms/leave-management": "LEAVE_MANAGEMENT",
    "/services/employees": "EMPLOYEE",
    "/services/clients": "CLIENTS",
    "/services/billing": "BILLING",
    "/services/expenses": "EXPENSES",
    "/services/accounting": "ACCOUNTING",
    "/services/reports": "REPORTS",
    "/services/activity-logs": "ACTIVITY_LOGS",
    "/services/roles": "ROLES",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-sm font-medium text-gray-500 animate-pulse">Verifying Access...</p>
        </div>
      </div>
    );
  }

  // AUTHORIZATION CHECK (Synchronous)
  let isAuthorized = false;
  let detectedModuleKey = "";

  // 1. Admin bypass
  if (userRole === "Admin" || userRole === "shop_owner" || userRole === "owner" || userRole === "admin") {
    isAuthorized = true;
  } else {
    // 2. Specialized sub-path checks
    const lowerPath = pathname.toLowerCase();
    
    // Find the matching module base route
    const match = Object.entries(routePermissions).find(([route]) => 
      lowerPath === route || lowerPath.startsWith(`${route}/`)
    );

    if (match) {
      const [_route, moduleKey] = match;
      detectedModuleKey = moduleKey;

      // Determine required action based on path keywords
      let requiredAction = "READ"; // Default to READ for the module pages
      
      if (lowerPath.includes("/new") || lowerPath.includes("/create") || lowerPath.includes("/onboarding")) {
        requiredAction = "CREATE";
      } else if (lowerPath.includes("/edit") || lowerPath.includes("/update")) {
        requiredAction = "UPDATE";
      } else if (lowerPath.includes("/delete") || lowerPath.includes("/remove")) {
        requiredAction = "DELETE";
      }

      // Final Check using the can() function from context
      if (can(moduleKey, requiredAction)) {
        isAuthorized = true;
      } else {
        console.warn(`🚫 Access Denied: Need ${requiredAction} on ${moduleKey} for path ${pathname}`);
        isAuthorized = false;
      }
    } else {
      // Pages without explicit module protection (like dashboard /services)
      isAuthorized = true;
    }
  }

  // PREMIUM BLOCKED SCREEN
  if (!isAuthorized) {
    const pageName = detectedModuleKey || pathname.split('/').pop().replace(/-/g, ' ').toUpperCase();
    
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-6 border-4 border-dashed border-rose-50 rounded-[4rem] m-6">
        <div className="max-w-xl w-full bg-white rounded-[3rem] shadow-2xl shadow-rose-100 border border-gray-100 overflow-hidden relative">
          <div className="p-12 sm:p-20 text-center relative z-10">
            <div className="relative inline-block mb-10">
              <div className="absolute inset-0 bg-rose-500 rounded-full blur-2xl opacity-10 animate-pulse" />
              <div className="w-28 h-28 bg-gradient-to-br from-rose-500 to-red-600 rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-rose-200">
                <ShieldX className="w-14 h-14 text-white" />
              </div>
              <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center border border-gray-100 rotate-12 transition-transform hover:rotate-0">
                <Lock className="w-6 h-6 text-rose-500" />
              </div>
            </div>

            <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter">
              Permission Required
            </h1>
            
            <p className="text-gray-600 mb-12 font-medium leading-relaxed">
              Your role as <span className="text-rose-600 font-bold underline underline-offset-4 decoration-rose-200">{userRole}</span> 
              doesn't have sufficient rights to access the <b>{pageName}</b> module. 
              Please contact your administrator if you need to perform this action.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => router.back()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-4 px-10 rounded-2xl transition-all active:scale-95 border border-gray-200"
              >
                <ArrowLeft className="w-5 h-5" />
                Go Back
              </button>
              
              <button 
                onClick={() => router.push("/services")}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-12 rounded-2xl transition-all shadow-xl shadow-indigo-100 active:scale-95"
              >
                <Home className="w-5 h-5" />
                Dashboard
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 border-t border-gray-50 px-10 py-5 flex items-center justify-center text-[10px] text-gray-400 font-black tracking-[0.3em] uppercase">
            <span>Enterprise Security Enforcement</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
