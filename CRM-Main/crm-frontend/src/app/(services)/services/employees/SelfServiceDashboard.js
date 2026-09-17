"use client";
import { CalendarCheck, PlaneTakeoff, ListChecks, Laptop, FileText, UserCog } from 'lucide-react';

const selfCards = [
    { icon: CalendarCheck, label: 'My Attendance', sub: 'View monthly records', bg: 'bg-indigo-50', iconColor: 'text-indigo-600', border: 'border-indigo-100' },
    { icon: PlaneTakeoff, label: 'Apply Leave', sub: 'Submit leave request', bg: 'bg-amber-50', iconColor: 'text-amber-600', border: 'border-amber-100' },
    { icon: ListChecks, label: 'Leave Status', sub: 'Track your requests', bg: 'bg-green-50', iconColor: 'text-green-600', border: 'border-green-100' },
    { icon: Laptop, label: 'My Assets', sub: 'Assigned equipment', bg: 'bg-purple-50', iconColor: 'text-purple-600', border: 'border-purple-100' },
    { icon: FileText, label: 'Payslips', sub: 'Download salary slips', bg: 'bg-blue-50', iconColor: 'text-blue-600', border: 'border-blue-100' },
    { icon: UserCog, label: 'Update Profile', sub: 'Edit your details', bg: 'bg-gray-50', iconColor: 'text-gray-600', border: 'border-gray-200' },
];

export default function SelfServiceDashboard() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-1">Employee Self Service</h3>
            <p className="text-sm text-gray-500 mb-6">Quick access to your personal tools and information.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {selfCards.map(card => {
                    const Icon = card.icon;
                    return (
                        <button
                            key={card.label}
                            className="flex items-center gap-4 p-5 rounded-xl border border-gray-200 hover:shadow-md hover:-translate-y-[2px] transition-all text-left group bg-white"
                        >
                            <div className={`p-3.5 rounded-lg border ${card.border} ${card.bg} group-hover:scale-105 transition-transform flex-shrink-0`}>
                                <Icon size={22} className={card.iconColor} />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 text-sm">{card.label}</p>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">{card.sub}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
