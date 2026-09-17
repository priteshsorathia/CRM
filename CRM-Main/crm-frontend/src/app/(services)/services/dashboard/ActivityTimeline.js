"use client";
import React from 'react';
import GlassCard from '../components/GlassCard';
import SectionHeader from '../components/SectionHeader';
import StatusBadge from '../components/StatusBadge';
import { recentActivities } from '../data/dummyData';
import { motion } from 'framer-motion';

export default function ActivityTimeline() {
    return (
        <GlassCard delay={0.7} className="h-full">
            <SectionHeader title="Activity Timeline" subtitle="Latest global events" />
            <div className="relative pl-4 border-l border-gray-100 ml-2 mt-6 pb-2">
                {recentActivities.map((activity, idx) => (
                    <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + (idx * 0.1) }}
                        className={`relative mb-8 ${idx === recentActivities.length - 1 ? 'mb-0' : ''}`}
                    >
                        <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-indigo-400 shadow-[0_0_0_4px_white]" />
                        <div className="pl-6">
                            <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 block mb-1">
                                {activity.timestamp}
                            </span>
                            <p className="text-sm text-gray-800 font-medium mb-2">{activity.title}</p>
                            <StatusBadge status={activity.status} />
                        </div>
                    </motion.div>
                ))}
            </div>
        </GlassCard>
    );
}
