"use client";
import { Monitor, CheckCircle2, UserCheck, Wrench, Archive, AlertTriangle } from 'lucide-react';

const cards = [
    { key: 'total', label: 'Total Assets', sub: 'Calculated from registry', icon: Monitor, bg: 'bg-indigo-50', iconColor: 'text-indigo-600', border: 'border-indigo-100' },
    { key: 'available', label: 'Available Assets', sub: 'Ready to assign', icon: CheckCircle2, bg: 'bg-green-50', iconColor: 'text-green-600', border: 'border-green-100' },
    { key: 'assigned', label: 'Assigned Assets', sub: 'Currently in use', icon: UserCheck, bg: 'bg-blue-50', iconColor: 'text-blue-600', border: 'border-blue-100' },
    { key: 'maintenance', label: 'Under Maintenance', sub: 'Being serviced', icon: Wrench, bg: 'bg-amber-50', iconColor: 'text-amber-600', border: 'border-amber-100' },
    { key: 'retired', label: 'Retired Assets', sub: 'Decommissioned', icon: Archive, bg: 'bg-gray-100', iconColor: 'text-gray-500', border: 'border-gray-200' },
    { key: 'expiring', label: 'Expiring Licenses', sub: 'Action required', icon: AlertTriangle, bg: 'bg-red-50', iconColor: 'text-red-600', border: 'border-red-100' },
];

export default function AssetOverview({ assets = [], onFilterChange }) {
    const stats = {
        total: assets.length,
        available: assets.filter(a => a.status === 'Available').length,
        assigned: assets.filter(a => a.status === 'Assigned').length,
        maintenance: assets.filter(a => a.status === 'Maintenance').length,
        retired: assets.filter(a => a.status === 'Retired' || a.status === 'Expired').length,
        expiring: assets.filter(a => {
            if (!a.warrantyExpiry) return false;
            const expiry = new Date(a.warrantyExpiry);
            const now = new Date();
            const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
            return diffDays > 0 && diffDays < 30; // 30 days threshold
        }).length
    };

    const handleCardClick = (key) => {
        if (!onFilterChange) return;
        
        switch (key) {
            case 'total': onFilterChange('All'); break;
            case 'available': onFilterChange('Available'); break;
            case 'assigned': onFilterChange('Assigned'); break;
            case 'maintenance': onFilterChange('Maintenance'); break;
            case 'retired': onFilterChange('Retired'); break;
            case 'expiring': onFilterChange('Expiring'); break;
            default: onFilterChange('All');
        }
    };

    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5 mb-6">
            {cards.map(card => {
                const Icon = card.icon;
                return (
                    <div
                        key={card.key}
                        onClick={() => handleCardClick(card.key)}
                        className="bg-white rounded-2xl border border-gray-200 p-3.5 sm:p-5 shadow-sm flex items-center gap-2.5 sm:gap-4 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
                    >
                        <div className={`p-3 rounded-xl border flex-shrink-0 ${card.bg} ${card.border} group-hover:scale-110 transition-transform`}>
                            <Icon size={18} className={card.iconColor} />
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
