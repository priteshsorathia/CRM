"use client";
import { IndianRupee, CheckCircle2, AlertOctagon, FileText, TrendingDown } from 'lucide-react';

const INR = "\u20B9";
const fmt = (n) => `${INR}${(n / 1000).toFixed(1)}k`;

const cards = [
    { key: 'totalInvoiced', label: 'Total Invoiced', sub: 'All time', icon: IndianRupee, bg: 'bg-indigo-50', iconColor: 'text-indigo-600', border: 'border-indigo-100', activeRing: 'ring-indigo-500' },
    { key: 'Paid', label: 'Total Collected', sub: 'Received payments', icon: CheckCircle2, bg: 'bg-green-50', iconColor: 'text-green-600', border: 'border-green-100', activeRing: 'ring-green-500' },
    { key: 'outstanding', label: 'Outstanding', sub: 'Pending collection', icon: TrendingDown, bg: 'bg-amber-50', iconColor: 'text-amber-600', border: 'border-amber-100', activeRing: 'ring-amber-500' },
    { key: 'Overdue', label: 'Overdue Amount', sub: 'Past due date', icon: AlertOctagon, bg: 'bg-red-50', iconColor: 'text-red-600', border: 'border-red-100', activeRing: 'ring-red-500' },
    { key: 'Draft', label: 'Draft Invoices', sub: 'Not yet sent', icon: FileText, bg: 'bg-gray-100', iconColor: 'text-gray-500', border: 'border-gray-200', activeRing: 'ring-gray-400' },
];

export default function BillingOverview({ invoices = [], activeFilter = 'All', onFilterChange } = {}) {
    const stats = (Array.isArray(invoices) ? invoices : []).reduce((acc, inv) => {
        const amount = Number(inv.amount || 0) || 0;
        const paid = Number(inv.paid || 0) || 0;
        const status = String(inv.status || 'Draft');
        const due = inv.dueDate ? new Date(inv.dueDate) : null;
        const isOverdue =
            due &&
            !Number.isNaN(due.getTime()) &&
            due < new Date() &&
            (amount - paid) > 0 &&
            status !== 'Paid';

        acc.totalInvoiced += amount;
        acc.Paid += paid;
        acc.outstanding += Math.max(0, amount - paid);
        if (isOverdue) acc.Overdue += Math.max(0, amount - paid);
        if (status === 'Draft') acc.Draft += 1;
        return acc;
    }, { totalInvoiced: 0, Paid: 0, Overdue: 0, Draft: 0, outstanding: 0 });

    return (
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 lg:gap-5 mb-6">
            {cards.map(card => {
                const Icon = card.icon;
                const raw = stats[card.key] || 0;
                const val = typeof raw === 'number' && raw > 999 ? fmt(raw) : raw;
                const isActive = activeFilter === card.key;
                
                return (
                    <div 
                        key={card.key} 
                        onClick={() => onFilterChange(card.key)}
                        className={`bg-white rounded-xl shadow-sm border p-4 flex items-center gap-3.5 hover:shadow-md transition-all cursor-pointer group ${
                            isActive 
                            ? `border-transparent ring-2 ${card.activeRing} shadow-md scale-102 z-10` 
                            : 'border-gray-100'
                        }`}
                    >
                        <div className={`p-2.5 rounded-lg ${card.bg} border ${card.border} flex-shrink-0`}>
                            <Icon size={14} className={card.iconColor} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5 truncate">{card.label}</p>
                            <p className="text-lg font-bold text-gray-900 leading-none">{val}</p>
                            <p className="text-[10px] font-medium text-gray-500 mt-1">{card.sub}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
