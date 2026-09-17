"use client";
import React, { useState } from 'react';
import { X, Check, XCircle, CalendarDays } from 'lucide-react';
import { leaveRequests, leaveBalance, holidays } from '../data/employeeDummyData';

const statusStyle = {
    'Pending': 'bg-amber-50 text-amber-700 border border-amber-200',
    'Approved': 'bg-green-50 text-green-700 border border-green-200',
    'Rejected': 'bg-red-50 text-red-700 border border-red-200',
};

function RequestsTab() {
    const [requests, setRequests] = useState(leaveRequests);
    const [showModal, setShowModal] = useState(false);

    const updateStatus = (id, status) => setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={() => setShowModal(true)} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-colors">+ Apply Leave</button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[640px]">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>{['Employee', 'Type', 'From', 'To', 'Days', 'Reason', 'Status', 'Actions'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {requests.map(r => (
                                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{r.employee}</td>
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.type}</td>
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.from}</td>
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.to}</td>
                                    <td className="px-4 py-3 font-bold text-gray-800">{r.days}</td>
                                    <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate">{r.reason}</td>
                                    <td className="px-4 py-3 whitespace-nowrap"><span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${statusStyle[r.status]}`}>{r.status}</span></td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {r.status === 'Pending' && (
                                            <div className="flex gap-1">
                                                <button onClick={() => updateStatus(r.id, 'Approved')} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"><Check size={14} /></button>
                                                <button onClick={() => updateStatus(r.id, 'Rejected')} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"><XCircle size={14} /></button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Apply Leave Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-200">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="font-bold text-gray-900 text-lg">Apply for Leave</h3>
                            <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Leave Type <span className="text-red-500">*</span></label>
                                <select className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white">
                                    {['Casual Leave', 'Sick Leave', 'Annual Leave', 'Maternity Leave'].map(o => <option key={o}>{o}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 block mb-1.5">From Date <span className="text-red-500">*</span></label>
                                    <input type="date" className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 block mb-1.5">To Date <span className="text-red-500">*</span></label>
                                    <input type="date" className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Reason</label>
                                <textarea rows={3} className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none" placeholder="Describe the reason..." />
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end mt-6">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                            <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-sm">Submit Request</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function BalanceTab() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {leaveBalance.map(lb => (
                <div key={lb.type} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <p className="text-sm font-bold text-gray-700 mb-3">{lb.type}</p>
                    <div className="flex justify-between mb-2">
                        <span className="text-xs text-gray-500 font-medium">Used: <span className="text-gray-800 font-bold">{lb.used}</span></span>
                        <span className="text-xs text-gray-500 font-medium">Total: <span className="text-gray-800 font-bold">{lb.total}</span></span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                        <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${(lb.used / lb.total) * 100}%` }} />
                    </div>
                    <p className="text-2xl font-bold text-indigo-600">{lb.remaining} <span className="text-xs text-gray-400 font-semibold">remaining</span></p>
                </div>
            ))}
        </div>
    );
}

function HolidayTab() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                <CalendarDays size={18} className="text-indigo-600" />
                <h3 className="font-bold text-gray-900">Holiday Calendar 2024</h3>
            </div>
            <div className="divide-y divide-gray-100">
                {holidays.map(h => (
                    <div key={h.date} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div>
                            <p className="font-semibold text-gray-900 text-sm">{h.name}</p>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">{new Date(h.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${h.type === 'National' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{h.type}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

const tabs = ['Leave Requests', 'Leave Balance', 'Holiday Calendar'];

export default function LeaveManagement() {
    const [activeTab, setActiveTab] = useState('Leave Requests');

    return (
        <div>
            <div className="flex gap-1 mb-5 bg-white border border-gray-200 rounded-xl p-1 w-fit shadow-sm">
                {tabs.map(t => (
                    <button
                        key={t} onClick={() => setActiveTab(t)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === t ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                    >{t}</button>
                ))}
            </div>
            {activeTab === 'Leave Requests' && <RequestsTab />}
            {activeTab === 'Leave Balance' && <BalanceTab />}
            {activeTab === 'Holiday Calendar' && <HolidayTab />}
        </div>
    );
}
