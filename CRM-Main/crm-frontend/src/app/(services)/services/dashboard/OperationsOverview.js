"use client";
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import GlassCard from '../components/GlassCard';
import SectionHeader from '../components/SectionHeader';
import { clientDistribution } from '../data/dummyData';

export default function OperationsOverview() {
    const [isClient, setIsClient] = useState(false);
    const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b'];

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) return <div className="h-64 animate-pulse bg-white/50 rounded-2xl w-full"></div>;

    return (
        <GlassCard delay={0.5}>
            <SectionHeader title="Client Portfolio" subtitle="Revenue distribution" />
            <div className="h-[280px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={clientDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={4}
                        >
                            {clientDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                            formatter={(value) => `${value}%`}
                        />
                        <Legend
                            verticalAlign="middle"
                            align="right"
                            layout="vertical"
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: '13px', fontWeight: 500, color: '#4b5563' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    );
}
