"use client";
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { attendanceData } from '../data/employeeDummyData';

const statusStyle = {
    'Present': 'bg-green-50 text-green-700 border border-green-200',
    'Absent': 'bg-red-50 text-red-700 border border-red-200',
    'Half Day': 'bg-amber-50 text-amber-700 border border-amber-200',
    'Leave': 'bg-blue-50 text-blue-700 border border-blue-200',
};

export default function AttendanceTab() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [empFilter, setEmpFilter] = useState('All');

    const employees = ['All', ...attendanceData.map(a => a.employee)];
    const filtered = empFilter === 'All' ? attendanceData : attendanceData.filter(a => a.employee === empFilter);

    return (
        <div className="space-y-5">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-700" />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Employee</label>
                    <div className="relative">
                        <select value={empFilter} onChange={e => setEmpFilter(e.target.value)} className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                            {employees.map(e => <option key={e}>{e}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                    </div>
                </div>
                <div className="ml-auto flex gap-2">
                    <div className="px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-xs font-bold text-green-700">{attendanceData.filter(a => a.status === 'Present').length} Present</div>
                    <div className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-xs font-bold text-red-700">{attendanceData.filter(a => a.status === 'Absent').length} Absent</div>
                    <div className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700">{attendanceData.filter(a => a.status === 'Leave').length} Leave</div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[640px]">
                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                            <tr>
                                {['Employee', 'Check In', 'Check Out', 'Working Hours', 'Status', 'Late Arrival', 'Overtime', 'Actions'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map(row => (
                                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{row.employee}</td>
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-mono text-xs">{row.checkIn}</td>
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-mono text-xs">{row.checkOut}</td>
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.hours}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${statusStyle[row.status]}`}>{row.status}</span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {row.late ? <span className="px-2 py-1 bg-amber-50 border border-amber-200 rounded-md text-xs font-bold text-amber-700">Late</span> : <span className="text-gray-400 text-xs">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.overtime}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <button className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors">Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
