"use client";
import { Clock, CheckCircle2, XCircle, Wallet, IndianRupee } from 'lucide-react';

const cards = [
  { key: 'totalAmount', label: 'Total Expenses (YTD)', sub: 'All categories', icon: IndianRupee, bg: 'bg-indigo-50', iconColor: 'text-indigo-600', border: 'border-indigo-100', format: true },
  { key: 'pending', label: 'Pending Approval', sub: 'Awaiting review', icon: Clock, bg: 'bg-amber-50', iconColor: 'text-amber-600', border: 'border-amber-100' },
  { key: 'approved', label: 'Approved', sub: 'This fiscal year', icon: CheckCircle2, bg: 'bg-green-50', iconColor: 'text-green-600', border: 'border-green-100' },
  { key: 'rejected', label: 'Rejected', sub: 'Review required', icon: XCircle, bg: 'bg-red-50', iconColor: 'text-red-600', border: 'border-red-100' },
  { key: 'reimbursed', label: 'Reimbursed', sub: 'Payment processed', icon: Wallet, bg: 'bg-blue-50', iconColor: 'text-blue-600', border: 'border-blue-100' },
];

const getStats = (expenses) => {
  const data = Array.isArray(expenses) ? expenses : [];
  const statusCount = data.reduce((acc, e) => {
    const s = String(e.status || 'Pending');
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return {
    totalAmount: data.reduce((sum, e) => sum + Number(e.amount || 0), 0),
    pending: statusCount.Pending || 0,
    approved: statusCount.Approved || 0,
    rejected: statusCount.Rejected || 0,
    reimbursed: statusCount.Reimbursed || 0
  };
};

export default function ExpenseOverview({ expenses, currentFilter, onFilterChange }) {
  const stats = getStats(expenses);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const val = card.format
          ? `₹${(Number(stats[card.key] || 0) / 1000).toFixed(1)}k`
          : Number(stats[card.key] || 0);

        const filterValue = card.key === 'totalAmount' ? 'All' : card.key.charAt(0).toUpperCase() + card.key.slice(1);
        const isActive = currentFilter === filterValue;

        return (
          <div
            key={card.key}
            onClick={() => onFilterChange && onFilterChange(filterValue)}
            className={`bg-white rounded-xl border p-4 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-all cursor-pointer active:scale-95 group ${
              isActive && index !== 0 
              ? 'ring-2 ring-indigo-500 ring-offset-2 border-indigo-200 shadow-indigo-100' 
              : 'border-gray-100 hover:border-indigo-100'
            } ${index === 0 ? 'col-span-2 sm:col-span-1' : 'col-span-1'}`}
          >
            <div className={`p-2.5 rounded-lg border flex-shrink-0 ${card.bg} ${card.border} ${isActive ? 'scale-110' : ''}`}>
              <Icon size={14} className={card.iconColor} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-gray-900 tracking-tight leading-none">{val}</p>
              <p className={`text-[9px] font-bold mt-1 truncate uppercase tracking-widest ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                {card.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

