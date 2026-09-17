"use client";
import { Users, UserCheck, CalendarClock, IndianRupee } from 'lucide-react';

const cards = [
    { key: 'total', label: 'Total Clients', sub: 'All clients', icon: Users, bg: 'bg-indigo-50', iconColor: 'text-indigo-600', border: 'border-indigo-100', activeRing: 'ring-indigo-500' },
    { key: 'active', label: 'Active Clients', sub: 'Under contract', icon: UserCheck, bg: 'bg-green-50', iconColor: 'text-green-600', border: 'border-green-100', activeRing: 'ring-green-500' },
    { key: 'expiryCount', label: 'Expiring Soon', sub: 'Within 30 Days', icon: CalendarClock, bg: 'bg-amber-50', iconColor: 'text-amber-600', border: 'border-amber-100', activeRing: 'ring-amber-500' },
    { key: 'totalRevenue', label: 'Total Collected (YTD)', sub: 'Payments received', icon: IndianRupee, bg: 'bg-blue-50', iconColor: 'text-blue-600', border: 'border-blue-100', activeRing: 'ring-blue-500' },
];

export default function ClientOverview({ clients = [], totalCollected = 0, activeFilter = 'total', onFilterChange }) {
    const getDaysLeft = (endDate) => {
        if (!endDate) return 999;
        const diff = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const stats = {
        total: clients.length,
        active: clients.filter(c => c.status === 'Active').length,
        expiryCount: clients.filter(c => {
            const daysLeft = getDaysLeft(c.contractEnd);
            return daysLeft > 0 && daysLeft <= 30;
        }).length,
        totalRevenue: `₹ ${(Number(totalCollected) / 1000).toFixed(1)}k`,
    };

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5 mb-6">
            {cards.map(card => {
                const Icon = card.icon;
                const isActive = activeFilter === card.key;
                
                return (
                    <div
                        key={card.key}
                        onClick={() => onFilterChange(card.key)}
                        className={`bg-white rounded-2xl border p-3.5 sm:p-5 shadow-sm flex items-center gap-2.5 sm:gap-4 hover:shadow-md transition-all cursor-pointer ${
                            isActive 
                            ? `border-transparent ring-2 ${card.activeRing} shadow-md scale-102 lg:scale-105 z-10` 
                            : 'border-gray-200'
                        }`}
                    >
                        <div className={`p-3 rounded-xl border flex-shrink-0 ${card.bg} ${card.border}`}>
                            <Icon size={20} className={card.iconColor} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">{card.label}</p>
                            <p className="text-lg font-bold text-gray-900 leading-none">{stats[card.key]}</p>
                            <p className="text-[10px] font-medium text-gray-500 mt-1">{card.sub}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
