"use client";
import { Users, UserCheck, Plane, Clock, UserX, UserPlus } from 'lucide-react';

const cards = [
    { key: 'total', label: 'Total Employees', icon: Users, bg: 'bg-indigo-50', iconColor: 'text-indigo-600', border: 'border-indigo-100', activeRing: 'ring-indigo-500' },
    { key: 'active', label: 'Active Employees', icon: UserCheck, bg: 'bg-green-50', iconColor: 'text-green-600', border: 'border-green-100', activeRing: 'ring-green-500' },
    { key: 'onLeave', label: 'On Leave', icon: Plane, bg: 'bg-amber-50', iconColor: 'text-amber-600', border: 'border-amber-100', activeRing: 'ring-amber-500' },
    { key: 'probation', label: 'On Probation', icon: Clock, bg: 'bg-blue-50', iconColor: 'text-blue-600', border: 'border-blue-100', activeRing: 'ring-blue-500' },
    { key: 'resigned', label: 'Resigned', icon: UserX, bg: 'bg-red-50', iconColor: 'text-red-600', border: 'border-red-100', activeRing: 'ring-red-500' },
    { key: 'newJoiners', label: 'New Joiners This Month', icon: UserPlus, bg: 'bg-purple-50', iconColor: 'text-purple-600', border: 'border-purple-100', activeRing: 'ring-purple-500' },
];

const normalizeStatus = (value) => String(value || '').trim().toLowerCase();

export default function EmployeeOverview({ employees = [], loading = false, activeFilter = 'total', onFilterChange }) {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const stats = employees.reduce((acc, emp) => {
        acc.total += 1;

        const status = normalizeStatus(emp.status);
        if (status === 'active') acc.active += 1;
        if (status === 'on_leave' || status === 'on leave') acc.onLeave += 1;
        if (status === 'probation') acc.probation += 1;
        if (status === 'resigned') acc.resigned += 1;

        const joinDate = emp.join_date ? new Date(emp.join_date) : null;
        if (joinDate && joinDate.getFullYear() === year && joinDate.getMonth() === month) {
            acc.newJoiners += 1;
        }

        return acc;
    }, { total: 0, active: 0, onLeave: 0, probation: 0, resigned: 0, newJoiners: 0 });

    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5 mb-6">
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
                            <Icon size={18} className={card.iconColor} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">{card.label}</p>
                            <p className="text-lg font-bold text-gray-900 leading-none">{loading ? '—' : stats[card.key]}</p>
                            <p className="text-[10px] font-medium text-gray-500 mt-1">Directory Stats</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
