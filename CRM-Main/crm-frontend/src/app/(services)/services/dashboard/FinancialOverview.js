"use client";
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, Tooltip, CartesianGrid } from 'recharts';
import SectionHeader from '../components/SectionHeader';
import GlassCard from '../components/GlassCard';
import { revenueData, expenseData, profitMarginData } from '../data/dummyData';

export default function FinancialOverview() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) return <div className="h-96 w-full animate-pulse bg-white/50 rounded-2xl"></div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            <GlassCard className="lg:col-span-8" delay={0.2}>
                <SectionHeader
                    title="Revenue Growth"
                    subtitle="Monthly revenue trend analysis"
                />
                <div className="h-[280px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }} dy={10} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                cursor={{ stroke: '#f3f4f6', strokeWidth: 2 }}
                                formatter={(val) => [`$${val.toLocaleString()}`, 'Revenue']}
                            />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="#6366f1"
                                strokeWidth={3}
                                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>

            <div className="lg:col-span-4 flex flex-col gap-6">
                <GlassCard className="flex-1" delay={0.3}>
                    <SectionHeader title="Expenses" />
                    <div className="h-[120px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={expenseData} margin={{ top: 0, right: 0, left: 0, bottom: -10 }}>
                                <Tooltip
                                    cursor={{ fill: '#f9fafb' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                    formatter={(val) => [`$${val.toLocaleString()}`, 'Expense']}
                                />
                                <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                <GlassCard className="flex-1" delay={0.4}>
                    <SectionHeader title="Profit Margins" />
                    <div className="h-[120px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={profitMarginData} margin={{ top: 0, right: 0, left: 0, bottom: -10 }}>
                                <defs>
                                    <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                    formatter={(val) => [`${val}%`, 'Margin']}
                                />
                                <Area type="monotone" dataKey="margin" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorMargin)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
