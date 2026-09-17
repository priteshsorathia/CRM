"use client";
import { motion } from "framer-motion";
import { FaProjectDiagram, FaUsers, FaUserTie, FaLaptopCode, FaMoneyBillWave, FaFileInvoiceDollar, FaChartLine, FaClock, FaExclamationTriangle } from "react-icons/fa";

export default function MetricTile({ metric, delay = 0 }) {
    const getIconForType = (type) => {
        switch (type) {
            case 'projects': return <FaProjectDiagram className="w-5 h-5 text-indigo-500" />;
            case 'clients': return <FaUsers className="w-5 h-5 text-blue-500" />;
            case 'employees': return <FaUserTie className="w-5 h-5 text-emerald-500" />;
            case 'assets': return <FaLaptopCode className="w-5 h-5 text-purple-500" />;
            case 'revenue': return <FaMoneyBillWave className="w-5 h-5 text-green-500" />;
            case 'expenses': return <FaFileInvoiceDollar className="w-5 h-5 text-red-500" />;
            case 'profit': return <FaChartLine className="w-5 h-5 text-teal-500" />;
            case 'pending': return <FaClock className="w-5 h-5 text-amber-500" />;
            case 'overdue': return <FaExclamationTriangle className="w-5 h-5 text-rose-500" />;
            default: return <FaChartLine className="w-5 h-5 text-gray-500" />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: delay, ease: [0.23, 1, 0.32, 1] }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden cursor-pointer"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-50" />

            <div className="flex justify-between items-start mb-4">
                <span className="text-gray-500 text-sm font-medium tracking-wide">{metric.title}</span>
                <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-50">
                    {getIconForType(metric.type)}
                </div>
            </div>

            <div className="flex items-baseline space-x-3">
                <h3 className="text-3xl font-light tracking-tight text-gray-900">{metric.value}</h3>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center">
                <span className={`text-xs font-semibold px-2 py-1 rounded-md ${metric.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {metric.growth}
                </span>
                <span className="text-xs text-gray-400 ml-2">vs last month</span>
            </div>
        </motion.div>
    );
}
