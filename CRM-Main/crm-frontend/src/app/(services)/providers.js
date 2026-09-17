"use client";
import { SidebarProvider, useSidebar } from "@/app/(services)/context/SidebarContext";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import ServicesSidebar from "@/components/layout/ServicesSidebar";
import { isPublicRoute, requiresShopOwner } from "@/constants/routes";
import { AuthProvider } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { ShopProvider } from "@/context/ShopContext";
import { useEffect, useState } from "react";
import { isAuthenticated, isShopOwner, validateToken, forceLogout } from "@/utils/auth";
import AccessDenied from "@/components/AccessDenied";
import Loader from "@/components/Loader";

import { RoleProvider } from "@/app/(services)/context/RoleContext";

function ServicesLayout({ children }) {
    return (
        <>
            {children}
        </>
    );
}

export function Providers({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [hasShopOwnerAccess, setHasShopOwnerAccess] = useState(false);

    useEffect(() => {
        if (isPublicRoute(pathname)) {
            setIsAuthorized(true);
            setHasShopOwnerAccess(true);
            setIsChecking(false);
            return;
        }

        if (typeof window !== "undefined") {
            const checkAuth = async () => {
                const hasToken = isAuthenticated();

                if (!hasToken) {
                    forceLogout('No authentication token found');
                    setIsAuthorized(false);
                    setHasShopOwnerAccess(false);
                    setIsChecking(false);
                    return;
                }

                try {
                    const validation = await validateToken();
                    if (!validation.valid) {
                        forceLogout('Invalid or expired token');
                        setIsAuthorized(false);
                        setHasShopOwnerAccess(false);
                        setIsChecking(false);
                        return;
                    }

                    setIsAuthorized(true);

                    if (requiresShopOwner(pathname)) {
                        const isOwner = isShopOwner();
                        setHasShopOwnerAccess(isOwner);
                    } else {
                        setHasShopOwnerAccess(true);
                    }
                    setIsChecking(false);
                } catch (error) {
                    console.error('Auth check error:', error);
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

    if (isChecking) {
        return (
            <div className="bg-white h-screen w-screen rounded-lg shadow p-6">
                <Loader
                    variant="container"
                    message="Loading Services..."
                    className="py-8"
                />
            </div>
        );
    }

    if (!isAuthorized && !isPublicRoute(pathname)) {
        return (
            <div className="bg-white h-screen w-screen rounded-lg shadow p-6">
                <Loader
                    variant="container"
                    message="Loading Services..."
                    className="py-8"
                />
            </div>
        );
    }

    if (isAuthorized && !hasShopOwnerAccess && requiresShopOwner(pathname)) {
        return (
            <SidebarProvider>
                <RoleProvider>
                    <AuthProvider>
                        <ShopProvider>
                            <ServicesLayout>
                                <AccessDenied />
                            </ServicesLayout>
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
                        {isPublicRoute(pathname) ? (
                            children
                        ) : (
                            <ServicesLayout>{children}</ServicesLayout>
                        )}
                    </ShopProvider>
                </AuthProvider>
            </RoleProvider>
        </SidebarProvider>
    );
}

