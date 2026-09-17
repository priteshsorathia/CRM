"use client";
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import apiClient from '@/utils/apiClient';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 text-sm">
            <p className="font-bold text-gray-800 mb-2">{label}</p>
            {payload.map(p => (
                <p key={p.name} className="font-semibold" style={{ color: p.color }}>
                    {p.name}: ₹{(p.value / 1000).toFixed(0)}k
                </p>
            ))}
        </div>
    );
};

export default function DepreciationChart() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const fetchReport = async () => {
            try {
                const response = await apiClient.get('/api/assets/reports/depreciation');
                if (response.data.success) {
                    setData(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching depreciation report:', error);
                if (error.response?.status === 403) {
                    setAccessDenied(true);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, []);

    if (!mounted || loading) return <div className="h-72 bg-white rounded-xl border border-gray-200 animate-pulse" />;

    if (accessDenied) return (
        <div className="h-72 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <p className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">Access Restricted</p>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-tight">Report restricted to authorized personnel</p>
        </div>
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="mb-4">
                <h3 className="font-bold text-gray-900">Depreciation Analysis</h3>
                <p className="text-sm text-gray-500 mt-0.5">Annual asset value and depreciation trend</p>
            </div>
            <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}k`} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
                        <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '12px' }} />
                        <Bar dataKey="value" name="Book Value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={28} />
                        <Bar dataKey="depreciation" name="Depreciation" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={28} />
                        <Line type="monotone" dataKey="value" stroke="#a5b4fc" strokeWidth={2} dot={false} name="Trend" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
