"use client";
import React, { useState, useEffect } from 'react';
import { UserCog, Plus, Search, Mail, Phone, RefreshCw, Eye, Pencil, Trash2, ShieldCheck, Briefcase, User } from 'lucide-react';
import api from '../../../lib/axios';
import { useRouter } from 'next/navigation';

const roleColors = {
    Admin: 'bg-indigo-100 text-indigo-700',
    Staff: 'bg-blue-100 text-blue-700',
    SuperAdmin: 'bg-purple-100 text-purple-700',
};

const StatCard = ({ title, value, icon, bgColor, active, onClick }) => (
    <div
        onClick={onClick}
        className={`bg-white p-4 md:p-5 rounded-2xl shadow-sm border flex items-center space-x-3 md:space-x-4 cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${active ? 'border-indigo-400 ring-1 ring-indigo-200' : 'border-gray-100'}`}
    >
        <div className={`p-2.5 md:p-3 rounded-xl ${bgColor} text-white shadow-sm shrink-0`}>
            {React.cloneElement(icon, { size: 18, className: "md:w-5 md:h-5" })}
        </div>
        <div className="flex flex-col">
            <h3 className="text-gray-400 font-semibold tracking-wide text-[10px] uppercase mb-0.5">{title}</h3>
            <p className="text-xl font-semibold text-gray-800 tracking-tight">{value ?? 0}</p>
        </div>
    </div>
);

export default function EmployeesPage() {
    const router = useRouter();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState({ type: '', value: '' });

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/employees`);
            if (res.data.success) {
                setEmployees(res.data.data || []);
            }
        } catch (err) {
            console.error('Fetch Employees Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEmployees(); }, []);

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to remove this employee?')) return;
        try {
            setLoading(true);
            await api.delete(`/employees/${id}`);
            setEmployees(prev => prev.filter(e => e.id !== id));
        } catch (err) {
            console.error("Delete Error:", err);
            alert('Failed to delete employee.');
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        total: employees.length,
        staff: employees.filter(e => e.role === 'Staff').length,
        admins: employees.filter(e => e.role === 'Admin' || e.role === 'SuperAdmin').length,
    };

    const filteredEmployees = employees.filter(e => {
        const matchesSearch = !search ||
            (e.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (e.email || '').toLowerCase().includes(search.toLowerCase()) ||
            (e.username || '').toLowerCase().includes(search.toLowerCase());
        const matchesFilter =
            activeFilter.type === '' ||
            (activeFilter.type === 'status' && e.status === activeFilter.value) ||
            (activeFilter.type === 'role' && e.role === activeFilter.value);
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl md:text-2xl font-semibold text-gray-800 tracking-tight leading-tight">Employees</h1>
                        <p className="text-xs md:text-xs text-gray-400 font-medium mt-0.5">Manage your internal team and access levels</p>
                    </div>
                    <button 
                        onClick={fetchEmployees} 
                        className="md:hidden p-3 bg-white hover:bg-gray-50 text-gray-500 rounded-xl border border-gray-100 shadow-sm active:scale-95"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchEmployees} className="hidden md:flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-500 text-xs font-bold px-4 py-2.5 rounded-xl border border-gray-100 transition-all">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button onClick={() => router.push('/employees/new')} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg transition-all active:scale-95">
                        <Plus size={14} />
                        Add Employee
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
                <StatCard
                    title="Total" value={stats.total} icon={<UserCog size={18} />} bgColor="bg-blue-500"
                    active={activeFilter.type === ''} onClick={() => setActiveFilter({ type: '', value: '' })}
                />
                <StatCard
                    title="Staff" value={stats.staff} icon={<User size={18} />} bgColor="bg-green-500"
                    active={activeFilter.type === 'role' && activeFilter.value === 'Staff'} onClick={() => setActiveFilter({ type: 'role', value: 'Staff' })}
                />
                <StatCard
                    title="Admins" value={stats.admins} icon={<ShieldCheck size={18} />} bgColor="bg-indigo-600"
                    active={activeFilter.type === 'role' && (activeFilter.value === 'Admin' || activeFilter.value === 'SuperAdmin')} onClick={() => setActiveFilter({ type: 'role', value: 'Admin' })}
                />
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3 flex items-center gap-3">
                <Search size={16} className="text-gray-400 shrink-0" />
                <input
                    type="text"
                    placeholder="Search by name, email or username..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
                />
            </div>

            {/* Grid */}
            <div className="space-y-4">
                <h2 className="text-sm font-semibold text-gray-700 tracking-tight pl-2 uppercase tracking-widest opacity-80 mb-2">Internal Team Directory</h2>

                {loading && employees.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 font-medium animate-pulse uppercase text-xs tracking-[0.3em] bg-white rounded-3xl border border-gray-100 shadow-sm">Loading Staff...</div>
                ) : employees.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-[2rem] border border-gray-100 flex flex-col items-center shadow-sm">
                        <UserCog size={32} className="text-gray-200 mb-4" />
                        <p className="text-[10px] font-medium text-gray-300 uppercase tracking-widest">No staff members hired yet</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="border-b border-gray-50 bg-gray-50/30">
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Member</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Username</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Details</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmployees.map((emp) => (
                                    <tr key={emp.id} className="group hover:bg-slate-50/50 transition-colors border-b last:border-0 border-gray-50">
                                        <td className="px-8 py-6">
                                            <div className="text-[10px] font-bold text-gray-300 tracking-[0.2em] font-mono">
                                                {String(emp.serialId).padStart(2, '0')}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="text-sm text-slate-800 capitalize tracking-tight group-hover:text-indigo-600 transition-colors">
                                                    {emp.name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-[10px] font-bold text-slate-400 lowercase tracking-wide italic">
                                                @{emp.username}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-transparent ${roleColors[emp.role] || 'bg-gray-50 text-gray-400'}`}>
                                                <Briefcase size={10} className="opacity-50" />
                                                {emp.role}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2">
                                                    <Mail size={12} className="text-indigo-400" />
                                                    <span className="text-[10px] font-bold text-slate-400 tracking-tight lowercase">{emp.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone size={12} className="text-indigo-400" />
                                                    <span className="text-[11px] font-bold text-slate-500 font-mono tracking-wider">{emp.phone}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex items-center justify-center gap-1.5 text-slate-400">
                                                <button 
                                                    onClick={() => router.push(`/employees/EMP-${String(emp.serialId).padStart(2, '0')}`)} 
                                                    className="hover:bg-indigo-600 hover:text-white p-2 rounded-lg transition-all shadow-sm border border-slate-50 bg-white"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => router.push(`/employees/edit/EMP-${String(emp.serialId).padStart(2, '0')}`)} 
                                                    className="hover:bg-amber-500 hover:text-white p-2 rounded-lg transition-all shadow-sm border border-slate-50 bg-white"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(emp.id)} 
                                                    className="hover:bg-red-500 hover:text-white p-2 rounded-lg transition-all shadow-sm border border-slate-50 bg-white"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
