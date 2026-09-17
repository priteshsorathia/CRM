"use client";
import { FaClipboardList, FaExclamationCircle, FaClock, FaLaptop, FaUser } from 'react-icons/fa';

const icons = {
    project: { icon: FaClipboardList, bg: 'bg-indigo-50', c: 'text-indigo-500' },
    invoice: { icon: FaExclamationCircle, bg: 'bg-amber-50', c: 'text-amber-500' },
    expense: { icon: FaClock, bg: 'bg-purple-50', c: 'text-purple-500' },
    asset: { icon: FaLaptop, bg: 'bg-blue-50', c: 'text-blue-500' },
    employee: { icon: FaUser, bg: 'bg-emerald-50', c: 'text-emerald-500' },
};

const statusStyle = {
    completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    review: 'bg-purple-50 text-purple-700 border border-purple-200',
};

export default function ActivityItem({ activity }) {
    const cfg = icons[activity.type] || icons.project;
    const Icon = cfg.icon;

    return (
        <div className="flex items-start gap-4 py-3 px-1 hover:bg-gray-50 rounded-xl transition-colors">
            <div className={`mt-0.5 p-2.5 rounded-xl ${cfg.bg} flex-shrink-0`}>
                <Icon size={13} className={cfg.c} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{activity.title}</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">{activity.timestamp}</p>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg whitespace-nowrap flex-shrink-0 ${statusStyle[activity.status] || 'bg-gray-100 text-gray-600'}`}>
                {activity.status}
            </span>
        </div>
    );
}
