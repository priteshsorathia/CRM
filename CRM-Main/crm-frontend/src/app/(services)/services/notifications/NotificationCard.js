"use client";
import React from 'react';
import { Bell, Briefcase, CreditCard, Package, UserPlus, X } from 'lucide-react';

const severityStyles = {
    success: {
        bg: 'bg-green-50',
        icon: 'text-green-600',
        border: 'border-green-100',
        dot: 'bg-green-500'
    },
    warning: {
        bg: 'bg-amber-50',
        icon: 'text-amber-600',
        border: 'border-amber-100',
        dot: 'bg-amber-500'
    },
    danger: {
        bg: 'bg-red-50',
        icon: 'text-red-600',
        border: 'border-red-100',
        dot: 'bg-red-500'
    },
    info: {
        bg: 'bg-blue-50',
        icon: 'text-blue-600',
        border: 'border-blue-100',
        dot: 'bg-blue-500'
    },
    default: {
        bg: 'bg-gray-50',
        icon: 'text-gray-600',
        border: 'border-gray-200',
        dot: 'bg-gray-400'
    }
};

const typeIcons = {
    Assets: Package,
    HR: UserPlus,
    Projects: Briefcase,
    Billing: CreditCard,
    default: Bell
};

export default function NotificationCard({ notification, onRead, onDismiss }) {
    const Icon = typeIcons[notification?.type] || typeIcons.default;
    const { title, description, time, read, severity, type } = notification;
    const style = severityStyles[severity] || severityStyles.default;

    return (
        <div
            onClick={() => onRead(notification.id)}
            className={`relative group bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all cursor-pointer ${!read ? 'border-l-4 border-l-indigo-600' : ''}`}
        >
            {onDismiss && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDismiss(notification.id);
                    }}
                    className="absolute right-3 top-3 p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Dismiss"
                >
                    <X size={16} />
                </button>
            )}
            <div className="flex items-start gap-4">
                {/* Icon Container */}
                <div className={`p-2.5 rounded-lg ${style.bg} border ${style.border} flex-shrink-0`}>
                    <Icon size={18} className={style.icon} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className={`text-sm font-bold truncate ${!read ? 'text-gray-900' : 'text-gray-600'}`}>
                            {title}
                        </h4>
                        <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">{time}</span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                        {description}
                    </p>

                    <div className="flex items-center gap-3 mt-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${style.bg} ${style.icon}`}>
                            {type}
                        </span>
                        {!read && (
                            <span className="flex items-center gap-1.5">
                                <span className={`h-1.5 w-1.5 rounded-full ${style.dot} animate-pulse`} />
                                <span className="text-[10px] font-bold text-indigo-600 uppercase">New</span>
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Mark as read indicator (hover) */}
            {!read && (
                <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase underline">Mark as read</span>
                </div>
            )}
        </div>
    );
}
