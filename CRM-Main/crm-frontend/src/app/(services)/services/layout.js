"use client";
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './sidebar/Sidebar';
import Header from './dashboard/Header';
import Footer from '@/components/layout/Footer';
import { isPublicRoute } from '@/constants/routes';

export default function ServicesLayout({ children }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();

    if (isPublicRoute(pathname)) {
        return <>{children}</>;
    }

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <Sidebar
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
            />
            <div
                className={`flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden transition-all duration-300 
                  ${collapsed ? 'md:pl-[72px]' : 'md:pl-[260px]'}
                `}
            >
                <Header setMobileOpen={setMobileOpen} />
                <main className="flex-1 p-4 lg:p-6 min-w-0 max-w-full overflow-x-hidden">
                    {children}
                </main>
                <Footer />
            </div>
        </div>
    );
}
