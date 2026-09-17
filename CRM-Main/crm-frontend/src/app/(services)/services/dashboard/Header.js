"use client";
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FaSearch, FaBars } from 'react-icons/fa';
import { ChevronDown, User as UserIcon } from 'lucide-react';

const pageTitles = {
    '/services': { title: 'Dashboard', subtitle: 'Executive overview' },
    '/services/assets': { title: 'Asset Management', subtitle: 'Track and manage all company assets' },
    '/services/projects': { title: 'Projects', subtitle: 'Manage active projects' },
    '/services/clients': { title: 'Clients', subtitle: 'Client management' },
    '/services/hrms/staff': { title: 'Employees', subtitle: 'HR and team management' },
    '/services/invoices': { title: 'Invoices', subtitle: 'Billing and payments' },
    '/services/expenses': { title: 'Expenses', subtitle: 'Expense tracking' },
    '/services/reports': { title: 'Reports', subtitle: 'Analytics and insights' },
    '/services/settings': { title: 'Settings', subtitle: 'Platform configuration' },
};

import { getApiBase } from '@/utils/apiBase';

export default function Header({ setMobileOpen }) {
    const pathname = usePathname();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [user, setUser] = useState(null);
    const dropdownRef = useRef();

    const { title, subtitle } = pageTitles[pathname] || { title: 'CRM Services', subtitle: '' };

    useEffect(() => {
        const loadUser = async () => {
            const userData = localStorage.getItem("userData");
            if (userData) {
                setUser(JSON.parse(userData));
            }

            const token = localStorage.getItem("authToken");
            if (token) {
                try {
                    const response = await fetch(`${getApiBase()}/auth/me`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (response.ok) {
                        const resData = await response.json();
                        if (resData.success && resData.data) {
                            localStorage.setItem("userData", JSON.stringify(resData.data));
                            setUser(resData.data);
                        }
                    }
                } catch (err) {
                    console.error("Failed to sync user data in services Header:", err);
                }
            }
        };
        loadUser();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const getUserDisplayName = () => {
        if (!user) return "User";
        return user.full_name || user.name || user.username || user.email?.split("@")[0] || "User";
    };

    const getUserRole = () => {
        if (!user) return "user";
        const role = user.role || user.user_role;
        return role === "shop_owner" ? "Shop Owner" : role === "admin" ? "Administrator" : role || "User";
    };

    const getUserInitials = () => {
        if (!user) return "U";
        const source = user.name || user.email?.split("@")[0] || "User";
        const parts = source.trim().split(/\s+/);
        const first = parts[0]?.[0] || "";
        const second = parts[1]?.[0] || "";
        return (first + second).toUpperCase();
    };

    return (
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200 px-5 lg:px-8 py-3.5 flex items-center justify-between gap-4">
            {/* Left: Mobile toggle + page title */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setMobileOpen(true)}
                    className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                >
                    <FaBars size={18} />
                </button>
                <div>
                    <h1 className="text-lg font-bold text-gray-900 leading-tight">{title}</h1>
                    {subtitle && <p className="text-xs text-gray-400 font-medium tracking-wide mt-0.5 hidden sm:block">{subtitle}</p>}
                </div>
            </div>

            {/* Right: Search + user dropdown */}
            <div className="flex items-center gap-2 sm:gap-4">
            

                <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

                {/* User dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setOpen((prev) => !prev)}
                        className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-slate-50 transition-all duration-200 border border-transparent hover:border-slate-200"
                    >
                        <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white ring-offset-1 ring-offset-slate-100">
                            {getUserInitials()}
                        </div>
                        <div className="hidden sm:flex flex-col items-start leading-tight">
                            <span className="font-bold text-sm text-slate-800 max-w-[120px] truncate">
                                {getUserDisplayName()}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                                {getUserRole()}
                            </span>
                        </div>
                        <ChevronDown
                            size={14}
                            className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
                        />
                    </button>

                    {open && (
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-4 bg-slate-50/50 flex items-center gap-3 border-b border-slate-100">
                                <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                    {getUserInitials()}
                                </div>
                                <div className="flex flex-col truncate">
                                    <h4 className="text-sm font-bold text-slate-800 truncate">
                                        {getUserDisplayName()}
                                    </h4>
                                    <p className="text-xs text-slate-500 truncate mb-1">
                                        {user?.email || "No email"}
                                    </p>
                                    <span className="inline-block self-start px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-lg uppercase tracking-wider">
                                        {getUserRole()}
                                    </span>
                                </div>
                            </div>

                            <div className="p-2">
                                <Link
                                    href="/services/my-profile"
                                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-colors group"
                                    onClick={() => setOpen(false)}
                                >
                                    <div className="p-1.5 bg-slate-100 rounded-lg group-hover:bg-indigo-100 transition-colors">
                                        <UserIcon size={16} />
                                    </div>
                                    My Profile
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
