"use client";
import React from 'react';

export const SidebarSection = ({ title, children, collapsed }) => {
    return (
        <div className="mb-6">
            {!collapsed && (
                <p className="px-4 text-[10px] font-semibold tracking-widest text-slate-400 uppercase mb-3">
                    {title}
                </p>
            )}
            <ul className="space-y-1">
                {children}
            </ul>
        </div>
    );
};
