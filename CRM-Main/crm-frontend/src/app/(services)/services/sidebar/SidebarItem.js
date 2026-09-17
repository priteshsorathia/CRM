"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const SidebarItem = ({ icon, text, href, collapsed, onClick }) => {
    const pathname = usePathname();
    const isActive = pathname === href || (href !== '/services' && pathname.startsWith(href));

    return (
        <li>
            <Link
                href={href}
                onClick={onClick}
                className={`flex items-center py-2.5 transition-all duration-300 group rounded-xl ${
                    isActive
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                } ${
                    collapsed
                        ? "justify-center px-0 w-11 h-11 mx-auto"
                        : "px-4 gap-3"
                }`}
            >
                <span
                    className={`text-lg transition-all duration-300 flex-shrink-0 ${
                        isActive ? "scale-110" : "group-hover:scale-110 group-hover:text-indigo-400"
                    }`}
                >
                    {icon}
                </span>
                {!collapsed && (
                    <span className="whitespace-nowrap font-medium tracking-wide truncate">
                        {text}
                    </span>
                )}
            </Link>
        </li>
    );
};
