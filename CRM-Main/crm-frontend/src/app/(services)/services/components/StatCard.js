"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { FaLaptop, FaCheckCircle, FaUserCheck, FaWrench, FaArchive, FaExclamationCircle } from 'react-icons/fa';

export default function StatCard({ title, value, type, delay = 0 }) {
    const getIconAndColors = (t) => {
        switch (t) {
            case 'total': return { icon: <FaLaptop size={20} />, bg: 'bg-indigo-50/50', text: 'text-indigo-600', iconBg: 'bg-indigo-100/50' };
            case 'available': return { icon: <FaCheckCircle size={20} />, bg: 'bg-emerald-50/50', text: 'text-emerald-600', iconBg: 'bg-emerald-100/50' };
            case 'assigned': return { icon: <FaUserCheck size={20} />, bg: 'bg-blue-50/50', text: 'text-blue-600', iconBg: 'bg-blue-100/50' };
            case 'maintenance': return { icon: <FaWrench size={20} />, bg: 'bg-amber-50/50', text: 'text-amber-600', iconBg: 'bg-amber-100/50' };
            case 'retired': return { icon: <FaArchive size={20} />, bg: 'bg-gray-50/50', text: 'text-gray-600', iconBg: 'bg-gray-200/50' };
            case 'expiring': return { icon: <FaExclamationCircle size={20} />, bg: 'bg-rose-50/50', text: 'text-rose-600', iconBg: 'bg-rose-100/50' };
            default: return { icon: <FaLaptop size={20} />, bg: 'bg-gray-50', text: 'text-gray-600', iconBg: 'bg-gray-100' };
        }
    };

    const { icon, bg, text, iconBg } = getIconAndColors(type);

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay, ease: [0.23, 1, 0.32, 1] }}
            whileHover={{ y: -4, scale: 1.02 }}
            className={`relative ${bg} backdrop-blur-sm border border-white/40 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group`}
        >
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/20 rounded-full blur-2xl group-hover:bg-white/40 transition-all duration-500" />

            <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-gray-500 text-sm font-semibold tracking-wide uppercase">{title}</span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg} ${text} shadow-sm border border-white/60`}>
                    {icon}
                </div>
            </div>

            <div className="relative z-10 flex items-baseline gap-2">
                <h3 className={`text-4xl font-light tracking-tight ${text.replace('text-', 'text-gray-900 ')}`}>{value}</h3>
            </div>
        </motion.div>
    );
}
