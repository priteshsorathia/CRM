"use client";
import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

const statusStyle = {
    'Approved': { cls: 'bg-green-50 text-green-700 border border-green-200', icon: CheckCircle2, iconCls: 'text-green-500' },
    'Pending': { cls: 'bg-amber-50 text-amber-700 border border-amber-200', icon: Clock, iconCls: 'text-amber-500' },
    'Rejected': { cls: 'bg-red-50 text-red-700 border border-red-200', icon: XCircle, iconCls: 'text-red-500' },
};

export default function TimeTracking({ projects = [] }) {
    const defaultSheets = projects.flatMap(p => p.timesheets || []);
    const [sheets, setSheets] = useState([]);

    useEffect(() => {
        setSheets(defaultSheets);
    }, [projects]);

    const totalHours = sheets.reduce((sum, s) => sum + s.hours, 0);
    const billableHours = sheets.filter(s => s.billable).reduce((sum, s) => sum + s.hours, 0);
    const pendingCount = sheets.filter(s => s.status === 'Pending').length;

    const approve = (id) => setSheets(prev => prev.map(s => s.id === id ? { ...s, status: 'Approved' } : s));
    const reject = (id) => setSheets(prev => prev.map(s => s.id === id ? { ...s, status: 'Rejected' } : s));

    return (
        <div className="space-y-5">
            {/* Summary Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Total Hours This Week', value: `${totalHours}h`, sub: `${sheets.length} entries`, bg: 'bg-indigo-50', c: 'text-indigo-600', border: 'border-indigo-100' },
                    { label: 'Billable Hours', value: `${billableHours}h`, sub: 'Revenue generating', bg: 'bg-green-50', c: 'text-green-600', border: 'border-green-100' },
                    { label: 'Pending Approvals', value: pendingCount, sub: 'Awaiting manager review', bg: 'bg-amber-50', c: 'text-amber-600', border: 'border-amber-100' },
                ].map(s => (
                    <div key={s.label} className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4 hover:shadow-md hover:-translate-y-[2px] transition-all`}>
                        <div className={`p-3 rounded-lg ${s.bg} border ${s.border}`}>
                            <Clock size={20} className={s.c} />
                        </div>
                        <div>
                            <p className={`text-2xl font-bold ${s.c}`}>{s.value}</p>
                            <p className="text-sm font-semibold text-gray-700">{s.label}</p>
                            <p className="text-xs text-gray-400">{s.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Timesheet Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Weekly Timesheet</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Week of March 11 – 17, 2024</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[640px]">
                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                            <tr>
                                {['Date', 'Project', 'Task', 'Hours', 'Billable', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sheets.map(row => {
                                const st = statusStyle[row.status];
                                const Icon = st?.icon;
                                return (
                                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs font-medium">{row.date}</td>
                                        <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{row.project}</td>
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.task}</td>
                                        <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">{row.hours}h</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {row.billable
                                                ? <span className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-md text-xs font-bold">Billable</span>
                                                : <span className="px-2 py-1 bg-gray-100 text-gray-500 border border-gray-200 rounded-md text-xs font-semibold">Internal</span>}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold w-fit ${st?.cls}`}>
                                                {Icon && <Icon size={11} className={st?.iconCls} />}{row.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {row.status === 'Pending' && (
                                                <div className="flex gap-1.5">
                                                    <button onClick={() => approve(row.id)} className="px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 text-xs font-bold hover:bg-green-100 transition-colors">Approve</button>
                                                    <button onClick={() => reject(row.id)} className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-bold hover:bg-red-100 transition-colors">Reject</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {/* Totals Row */}
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-6 text-sm">
                    <span className="font-bold text-gray-700">Totals:</span>
                    <span className="text-gray-600"><strong className="text-gray-900">{totalHours}h</strong> total</span>
                    <span className="text-gray-600"><strong className="text-green-700">{billableHours}h</strong> billable</span>
                    <span className="text-gray-600"><strong className="text-gray-900">{totalHours - billableHours}h</strong> internal</span>
                </div>
            </div>
        </div>
    );
}
