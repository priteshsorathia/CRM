"use client";
import { FolderOpen, PlayCircle, CheckCircle2, PauseCircle, AlertOctagon } from 'lucide-react';

const cards = [
    { key: 'total', label: 'Total Projects', sub: 'All time', icon: FolderOpen, bg: 'bg-indigo-50', iconColor: 'text-indigo-600', border: 'border-indigo-100', activeRing: 'ring-indigo-500' },
    { key: 'active', label: 'Active', sub: 'In progress', icon: PlayCircle, bg: 'bg-blue-50', iconColor: 'text-blue-600', border: 'border-blue-100', activeRing: 'ring-blue-500' },
    { key: 'completed', label: 'Completed', sub: 'Delivered', icon: CheckCircle2, bg: 'bg-green-50', iconColor: 'text-green-600', border: 'border-green-100', activeRing: 'ring-green-500' },
    { key: 'onHold', label: 'On Hold', sub: 'Paused', icon: PauseCircle, bg: 'bg-amber-50', iconColor: 'text-amber-600', border: 'border-amber-100', activeRing: 'ring-amber-500' },
    { key: 'overdue', label: 'Overdue', sub: 'Past deadline', icon: AlertOctagon, bg: 'bg-red-50', iconColor: 'text-red-600', border: 'border-red-100', activeRing: 'ring-red-500' },
];

export default function ProjectOverview({ projects = [], activeFilter = 'total', onFilterChange }) {
    const projectStats = {
        total: projects.length,
        active: projects.filter(p => p.status === 'Active').length,
        completed: projects.filter(p => p.status === 'Completed').length,
        onHold: projects.filter(p => p.status === 'On Hold').length,
        overdue: projects.filter(p => p.status === 'Overdue').length,
    };

    return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-5 mb-6">
            {cards.map(card => {
                const Icon = card.icon;
                const isActive = activeFilter === card.key;

                return (
                    <div
                        key={card.key}
                        onClick={() => onFilterChange(card.key)}
                        className={`bg-white rounded-2xl border p-3.5 sm:p-5 shadow-sm flex items-center gap-2.5 sm:gap-4 hover:shadow-md transition-all cursor-pointer ${isActive
                                ? `border-transparent ring-2 ${card.activeRing} shadow-md scale-102 lg:scale-105 z-10`
                                : 'border-gray-200'
                            }`}
                    >
                        <div className={`p-3 rounded-xl border flex-shrink-0 ${card.bg} ${card.border}`}>
                            <Icon size={18} className={card.iconColor} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">{card.label}</p>
                            <p className="text-lg font-bold text-gray-900 leading-none">{projectStats[card.key]}</p>
                            <p className="text-[10px] font-medium text-gray-500 mt-1">{card.sub}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
