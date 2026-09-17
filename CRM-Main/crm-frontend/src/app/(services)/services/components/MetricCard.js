"use client";
import { motion } from 'framer-motion';
import { FaProjectDiagram, FaUsers, FaUserTie, FaLaptopCode, FaMoneyBillWave, FaFileInvoiceDollar, FaChartLine, FaClock, FaExclamationTriangle } from 'react-icons/fa';

const config = {
    projects: { icon: FaProjectDiagram, bg: 'bg-indigo-50', icon_color: 'text-indigo-600', border: 'border-indigo-100' },
    clients: { icon: FaUsers, bg: 'bg-blue-50', icon_color: 'text-blue-600', border: 'border-blue-100' },
    employees: { icon: FaUserTie, bg: 'bg-emerald-50', icon_color: 'text-emerald-600', border: 'border-emerald-100' },
    assets: { icon: FaLaptopCode, bg: 'bg-purple-50', icon_color: 'text-purple-600', border: 'border-purple-100' },
    revenue: { icon: FaMoneyBillWave, bg: 'bg-green-50', icon_color: 'text-green-600', border: 'border-green-100' },
    expenses: { icon: FaFileInvoiceDollar, bg: 'bg-rose-50', icon_color: 'text-rose-600', border: 'border-rose-100' },
    profit: { icon: FaChartLine, bg: 'bg-teal-50', icon_color: 'text-teal-600', border: 'border-teal-100' },
    pending: { icon: FaClock, bg: 'bg-amber-50', icon_color: 'text-amber-600', border: 'border-amber-100' },
    overdue: { icon: FaExclamationTriangle, bg: 'bg-red-50', icon_color: 'text-red-600', border: 'border-red-100' },
};

export default function MetricCard({ metric, delay = 0 }) {
    const cfg = config[metric.type] || config.projects;
    const Icon = cfg.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay, ease: [0.23, 1, 0.32, 1] }}
            onClick={metric?.onClick}
            role={metric?.onClick ? "button" : undefined}
            tabIndex={metric?.onClick ? 0 : undefined}
            className={`p-4 rounded-xl border-2 transition-all text-left bg-white border-gray-100 hover:border-gray-300 hover:shadow-md ${metric?.onClick ? 'cursor-pointer' : ''}`}
        >
            <div className="flex items-center gap-4">
                <div className={`w-11 h-11 ${cfg.bg} rounded-xl flex items-center justify-center shrink-0 border ${cfg.border} shadow-sm group-hover:scale-110 transition-transform`}>
                    <Icon className={cfg.icon_color} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start w-full">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">{metric.title}</p>
                        {metric.growth && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg -mt-1 ${metric.isPositive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                {metric.growth}
                            </span>
                        )}
                    </div>
                    <p className="text-lg font-bold text-gray-900 leading-none group-hover:text-blue-600 transition-colors uppercase">{metric.value}</p>
                </div>
            </div>
        </motion.div>
    );
}
