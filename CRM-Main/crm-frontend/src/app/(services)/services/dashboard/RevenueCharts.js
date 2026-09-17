"use client";
import { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { getApiBase } from '@/utils/apiBase';

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b'];

const Card = ({ title, children }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
                <div>
                    <h2 className="text-base font-bold text-gray-900">{title}</h2>
                </div>
            </div>
        </div>
        <div className="p-4 h-[240px]">{children}</div>
    </div>
);

export default function RevenueCharts() {
    const [mounted, setMounted] = useState(false);
    const [charts, setCharts] = useState(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const fetchCharts = async () => {
            try {
                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                const res = await fetch(`${getApiBase()}/api/services/dashboard`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json().catch(() => ({}));
                if (data.success) setCharts(data.charts || {});
                else setCharts({});
            } catch (e) {
                console.error('Failed to fetch services dashboard charts:', e);
                setCharts({});
            }
        };
        fetchCharts();
    }, []);

    if (!mounted) return null;

    const revenueData = Array.isArray(charts?.revenueData) ? charts.revenueData : [];
    const expenseData = Array.isArray(charts?.expenseData) ? charts.expenseData : [];
    const profitData = Array.isArray(charts?.profitData) ? charts.profitData : [];
    const clientDistribution = Array.isArray(charts?.clientDistribution) ? charts.clientDistribution : [];

    return (
        <div className="grid grid-cols-1 gap-4 lg:gap-5">
            <Card title="Revenue Trend">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${Number(v || 0) / 1000}k`} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: 12 }} formatter={v => [`₹${Number(v || 0).toLocaleString('en-IN')}`, 'Revenue']} />
                        <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="target" stroke="#e5e7eb" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </Card>

            <Card title="Expense Breakdown">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expenseData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${Number(v || 0) / 1000}k`} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: 12 }} cursor={{ fill: '#f9fafb' }} formatter={v => [`₹${Number(v || 0).toLocaleString('en-IN')}`, 'Expense']} />
                        <Bar dataKey="expense" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={32} />
                    </BarChart>
                </ResponsiveContainer>
            </Card>

            <Card title="Profit Margin">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={profitData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${Number(v || 0) / 1000}k`} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: 12 }} formatter={v => [`₹${Number(v || 0).toLocaleString('en-IN')}`, 'Profit']} />
                        <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} fill="url(#gProfit)" />
                    </AreaChart>
                </ResponsiveContainer>
            </Card>

            {/* Client Distribution — custom layout to avoid recharts Legend positioning bugs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-base font-bold text-gray-900">Client Distribution</h2>
                </div>
                {/* Mobile: stack (pie top, legend bottom). sm+: side by side */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Pie chart */}
                    <div className="relative mx-auto sm:mx-0 flex-shrink-0" style={{ width: 170, height: 170 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={clientDistribution.length > 0 ? clientDistribution : [{ name: 'No Data', value: 100 }]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={78}
                                    paddingAngle={4}
                                    dataKey="value"
                                    cornerRadius={6}
                                    stroke="none"
                                >
                                    {clientDistribution.length > 0 ? (
                                        clientDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)
                                    ) : (
                                        <Cell fill="#f1f5f9" />
                                    )}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: 12 }}
                                    formatter={v => [`${v}%`, 'Share']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center label — always centered over the pie */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Revenue</span>
                            <span className="text-base font-extrabold text-gray-900 mt-1">Share</span>
                        </div>
                    </div>

                    {/* Custom legend */}
                    <div className="flex flex-col gap-2.5 flex-1 min-w-0">
                        {clientDistribution.length > 0 ? (
                            clientDistribution.map((entry, i) => (
                                <div key={i} className="flex items-center gap-2 min-w-0">
                                    <span
                                        className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
                                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                    />
                                    <span className="text-xs font-semibold text-slate-600 truncate">{entry.name}</span>
                                    <span className="ml-auto text-xs font-bold text-slate-800 flex-shrink-0 pl-2">{entry.value}%</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-gray-400 italic">No data available</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
