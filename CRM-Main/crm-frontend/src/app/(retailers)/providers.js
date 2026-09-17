"use client";
import { SidebarProvider } from "@/app/(retailers)/context/SidebarContext";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { isPublicRoute, requiresShopOwner } from "@/constants/routes";
import { AuthProvider } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { DashboardProvider } from "@/app/(retailers)/context/DashboardContext";
import { ShopProvider } from "@/context/ShopContext"; // This exists at @/context/ShopContext
import { useEffect, useState } from "react";
import { isAuthenticated, isShopOwner, validateToken, forceLogout } from "@/utils/auth";
import AccessDenied from "@/components/AccessDenied";
import Loader from "@/components/Loader";
import { useSidebar } from "@/app/(retailers)/context/SidebarContext";
import { RoleProvider } from "@/app/(services)/context/RoleContext";

function RetailerLayout({ children }) {
  const { collapsed, mobileOpen } = useSidebar();
  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 
          ${collapsed ? "md:ml-[70px]" : "md:ml-[250px]"}
        `}
      >
        <Header />
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
        <Footer />
      </div>
    </div>
  );
}

export function Providers({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [hasShopOwnerAccess, setHasShopOwnerAccess] = useState(false);

  useEffect(() => {
    // Check if route is public
    if (isPublicRoute(pathname)) {
      setIsAuthorized(true);
      setHasShopOwnerAccess(true);
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
          setHasShopOwnerAccess(false);
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
            setHasShopOwnerAccess(false);
            setIsChecking(false);
            return;
          }

          // Token is valid
          setIsAuthorized(true);

          // Check if route requires shop owner and if user has that role
          if (requiresShopOwner(pathname)) {
            const isOwner = isShopOwner();
            setHasShopOwnerAccess(isOwner);
          } else {
            // Route doesn't require shop owner, so access is granted
            setHasShopOwnerAccess(true);
          }
          setIsChecking(false);
        } catch (error) {
          console.error('Auth check error:', error);
          // On error, if we have a token but validation failed, logout
          if (hasToken) {
            forceLogout('Token validation failed');
          }
          setIsAuthorized(false);
          setHasShopOwnerAccess(false);
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
        <Loader
          variant="container"
          message="Loading CRM..."
          className="py-8"
        />
      </div>
    );
  }

  // If not authenticated, show loading (redirect is in progress)
  if (!isAuthorized && !isPublicRoute(pathname)) {
    return (
      <div className="bg-white h-screen w-screen rounded-lg shadow p-6">
        <Loader
          variant="container"
          message="Loading CRM..."
          className="py-8"
        />
      </div>
    );
  }

  // If authenticated but doesn't have shop owner access for shop-owner-only routes
  if (isAuthorized && !hasShopOwnerAccess && requiresShopOwner(pathname)) {
    return (
      <SidebarProvider>
        <RoleProvider>
          <AuthProvider>
            <ShopProvider>
              <DashboardProvider>
                <RetailerLayout>
                  <AccessDenied />
                </RetailerLayout>
              </DashboardProvider>
            </ShopProvider>
          </AuthProvider>
        </RoleProvider>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <RoleProvider>
        <AuthProvider>
          <ShopProvider>
            {" "}
            {/* ShopProvider is now properly imported */}
            {isPublicRoute(pathname) ? (
              children
            ) : (
              <DashboardProvider>
                <RetailerLayout>{children}</RetailerLayout>
              </DashboardProvider>
            )}
          </ShopProvider>
        </AuthProvider>
      </RoleProvider>
    </SidebarProvider>
  );
}
