"use client";
import { SidebarProvider, useSidebar } from "@/app/(restaurants)/context/SidebarContext";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import RestaurantSidebar from "@/components/layout/RestaurantSidebar";
import { isPublicRoute } from "@/constants/routes";
import { AuthProvider } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { ShopProvider } from "@/context/ShopContext";
import { useEffect, useState } from "react";
import { isAuthenticated, validateToken, forceLogout } from "@/utils/auth";
import AccessDenied from "@/components/AccessDenied";
import RestaurantLoader from "@/components/RestaurantLoader";
import QuickInvoiceGenerator from "@/components/QuickInvoiceGenerator";

function RestaurantLayout({ children }) {
  const { collapsed, mobileOpen } = useSidebar();
  
  return (
    <div className="flex h-screen overflow-hidden">
      <RestaurantSidebar />
      <div 
        className={`flex-1 flex flex-col h-screen min-w-0 w-full overflow-hidden transition-all duration-300 ${
          collapsed ? "md:ml-[70px]" : "md:ml-[250px]"
        }`}
      >
        <Header />
        <main className="flex-1 min-w-0 overflow-y-auto flex flex-col justify-between">
          <div className="flex-1">{children}</div>
          <Footer />
        </main>
        <QuickInvoiceGenerator />
      </div>
    </div>
  );
}

export function Providers({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check if route is public
    if (isPublicRoute(pathname)) {
      setIsAuthorized(true);
      setIsChecking(false);
      return;
    }

    // For protected routes, check authentication
    if (typeof window !== "undefined") {
      const checkAuth = async () => {
        const hasToken = isAuthenticated();
        
        if (!hasToken) {
          // No token - redirect to login
          forceLogout('No authentication token found');
          setIsAuthorized(false);
          setIsChecking(false);
          return;
        }

        // Validate token with backend
        try {
          const validation = await validateToken();
          if (!validation.valid) {
            // Token is invalid - force logout
            forceLogout('Invalid or expired token');
            setIsAuthorized(false);
            setIsChecking(false);
            return;
          }

          // Token is valid
          // If staff/manager just logged in and landed on /restaurant, send them to HRMS (their default module).
          try {
            const justLoggedIn = sessionStorage.getItem("justLoggedIn") === "1";
            if (justLoggedIn) {
              const rawUser = localStorage.getItem("userData") || localStorage.getItem("user");
              const u = rawUser ? JSON.parse(rawUser) : null;
              const role = String(u?.role || u?.user_role || u?.user?.role || "").trim().toLowerCase();
              const isStaffOrManager = role === "staff" || role === "manager";
              const isCook = role === "cook" || role === "chef" || role === "kitchen";

              if (isCook && pathname === "/restaurant") {
                sessionStorage.removeItem("justLoggedIn");
                router.replace("/restaurant/hrms/attendance");
                return;
              }

              if (isStaffOrManager && pathname === "/restaurant") {
                sessionStorage.removeItem("justLoggedIn");
                router.replace("/restaurant/hrms");
                return;
              }

              sessionStorage.removeItem("justLoggedIn");
            }
          } catch {
            // non-blocking
          }

          setIsAuthorized(true);
          setIsChecking(false);
        } catch (error) {
          console.error('Auth check error:', error);
          // On error, if we have a token but validation failed, logout
          if (hasToken) {
            forceLogout('Token validation failed');
          }
          setIsAuthorized(false);
          setIsChecking(false);
        }
      };

      checkAuth();
    }
  }, [pathname, router]);

  // Show loading state while checking authentication
  if (isChecking) {
    return (
      <div className="bg-white h-screen w-screen rounded-lg shadow p-6">
        <RestaurantLoader
          variant="container"
          message="Loading Restaurant..."
          className="py-8"
        />
      </div>
    );
  }

  // If not authenticated, show loading (redirect is in progress)
  if (!isAuthorized && !isPublicRoute(pathname)) {
    return (
      <div className="bg-white h-screen w-screen rounded-lg shadow p-6">
        <RestaurantLoader
          variant="container"
          message="Loading Restaurant..."
          className="py-8"
        />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AuthProvider>
        <ShopProvider>
          {isPublicRoute(pathname) ? (
            children
          ) : (
            <RestaurantLayout>{children}</RestaurantLayout>
          )}
        </ShopProvider>
      </AuthProvider>
    </SidebarProvider>
  );
}
