"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { SidebarItem } from './SidebarItem';
import { SidebarSection } from './SidebarSection';
import { useRole } from '@/app/(services)/context/RoleContext';
import { logout } from '@/utils/auth';
import {
    FaChartPie, FaProjectDiagram, FaUsers, FaLaptopCode,
    FaUsersCog, FaShieldAlt,
    FaFileInvoiceDollar, FaReceipt, FaChartLine, FaCog, FaAngleLeft, FaAngleRight,
    FaMoneyBillWave, FaBook, FaBell, FaHistory, FaSignOutAlt
} from 'react-icons/fa';

export default function Sidebar({ mobileOpen = false, setMobileOpen = () => { }, collapsed = false, setCollapsed = () => { } }) {
    const { can, userRole } = useRole();

    const hasAnyAccess = (module) => {
        if (!module) return true; // Default to show if no module specified (e.g. Dashboard)
        return can(module, 'READ') || can(module, 'CREATE') || can(module, 'UPDATE') || can(module, 'DELETE');
    };

    const navItems = [
        {
            section: 'Overview',
            items: [
                { text: 'Dashboard', icon: <FaChartPie size={17} />, href: '/services' },
                { text: 'Notifications', icon: <FaBell size={17} />, href: '/services/notifications' },
                { text: 'Activity Logs', icon: <FaHistory size={17} />, href: '/services/activity-logs', module: 'ACTIVITY_LOGS' },
                // Only show Roles management to Admin role

                ...(can('ROLES', 'READ') ? [{ text: 'Roles', icon: <FaShieldAlt size={17} />, href: '/services/roles', module: 'ROLES' }] : []),
            ].filter(item => hasAnyAccess(item.module))
        },
        {
            section: 'Operations',
            items: [
                { text: 'Projects', icon: <FaProjectDiagram size={17} />, href: '/services/projects', module: 'PROJECT' },
                { text: 'Clients', icon: <FaUsers size={17} />, href: '/services/clients', module: 'CLIENTS' },
                { text: 'HRMS', icon: <FaUsersCog size={17} />, href: '/services/hrms', module: 'EMPLOYEE' },
                { text: 'Assets', icon: <FaLaptopCode size={17} />, href: '/services/assets', module: 'ASSETS' },
            ].filter(item => hasAnyAccess(item.module))
        },
        {
            section: 'Finance',
            items: [
                { text: 'Billing', icon: <FaFileInvoiceDollar size={17} />, href: '/services/billing', module: 'BILLING' },
                { text: 'Expenses', icon: <FaReceipt size={17} />, href: '/services/expenses', module: 'EXPENSES' },
                { text: 'Accounting', icon: <FaBook size={17} />, href: '/services/accounting', module: 'ACCOUNTING' },
                { text: 'Reports', icon: <FaChartLine size={17} />, href: '/services/reports', module: 'REPORTS' },
            ].filter(item => hasAnyAccess(item.module))
        },
    ];

    return (
        <>
            {/* Mobile overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setMobileOpen(false)}
                    />
                )}
            </AnimatePresence>

            <motion.aside
                animate={{ width: collapsed ? '72px' : '260px' }}
                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                className={`fixed top-0 left-0 h-screen z-50 bg-slate-900 text-slate-100 border-r border-white/5 flex flex-col shadow-xl overflow-hidden
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          transition-transform md:transition-none`}
            >

                {/* ─────────────────────────────────────────── */}
                {/* TOP: Single logo area                        */}
                {/* ─────────────────────────────────────────── */}
                <div className={`flex items-center ${collapsed ? 'justify-center px-3 py-5' : 'flex-col gap-3 justify-center px-5 py-5'} bg-gradient-to-br from-slate-800 to-slate-950 border-b border-white/5 mb-2`}>
                    <Link href="/services" className="flex flex-col items-center w-full">
                        {collapsed ? (
                            /* Collapsed: show only the icon/mark */
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg border border-slate-200">
                                <Image src="/shop-logo.png" alt="CRM" width={36} height={36} className="object-contain w-8 h-8" />
                            </div>
                        ) : (
                            /* Expanded: Match restaurant layout visually */
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center w-full">
                                <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-white p-1 shadow-lg overflow-hidden border border-slate-200 hover:scale-105 transition-transform flex items-center justify-center mb-3">
                                    <Image src="/shop-logo.png" alt="CRM" width={64} height={64} className="object-contain w-full h-full z-10 relative rounded-full" priority />
                                </div>
                                <div className="text-center w-full">
                                    <h2 className="text-white text-base md:text-lg font-bold truncate px-2 mb-1">
                                        CRM
                                    </h2>
                                    <p className="text-[10px] text-slate-300 font-medium uppercase tracking-widest">
                                        SERVICES PLATFORM
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </Link>


                </div>

                {/* ─────────────────────────────────────────── */}
                {/* NAVIGATION                                   */}
                {/* ─────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 space-y-1 scrollbar-hide">
                    {navItems.map(group => (
                        <SidebarSection key={group.section} title={group.section} collapsed={collapsed}>
                            {group.items.map(item => (
                                <SidebarItem key={item.text} icon={item.icon} text={item.text} href={item.href} collapsed={collapsed} onClick={() => setMobileOpen(false)} />
                            ))}
                        </SidebarSection>
                    ))}
                </div>

                {/* ─────────────────────────────────────────── */}
                {/* BOTTOM FOOTER: Settings + Logo              */}
                {/* ─────────────────────────────────────────── */}
                <div className="px-3 pt-4 pb-5 border-t border-white/5 space-y-1">
                    <SidebarItem icon={<FaCog size={17} />} text="Settings" href="/services/settings" collapsed={collapsed} onClick={() => setMobileOpen(false)} />
                    <SidebarItem
                        icon={<FaSignOutAlt size={17} />}
                        text="Logout"
                        href="#logout"
                        collapsed={collapsed}
                        onClick={(e) => {
                            e.preventDefault();
                            if (mobileOpen) setMobileOpen(false);
                            logout();
                        }}
                    />

                    <div className={`mt-5 flex items-center ${collapsed ? 'justify-center' : 'justify-start px-2'}`}>
                        {collapsed ? (
                            <div className="w-9 h-9 rounded-xl overflow-hidden bg-white/10 border border-white/10 flex items-center justify-center">
                                <Image src="/shop-logo.png" alt="CRM" width={36} height={36} className="object-contain w-8 h-8" />
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                <span className="text-slate-500 font-bold tracking-widest text-[9px] uppercase">© 2024 CRM Inc.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Collapse Toggle Button */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className="hidden md:flex absolute top-4 right-0 translate-x-1/2 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 items-center justify-center text-white hover:bg-indigo-500 hover:border-indigo-400 transition-all duration-300 shadow-lg z-50"
                >
                    {collapsed ? (
                        <span className="text-sm font-bold" aria-hidden="true">&#8250;</span>
                    ) : (
                        <span className="text-sm font-bold" aria-hidden="true">&#8249;</span>
                    )}
                </button>
            </motion.aside>
        </>
    );
}
