"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Save,
    X,
    Calendar,
    IndianRupee,
    Briefcase,
    Target,
    Flag,
    Plus,
    Trash2
} from 'lucide-react';

import { getApiBase } from '@/utils/apiBase';

const inputCls = (err) =>
    `w-full px-4 py-2.5 rounded-xl border ${err ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-800 transition-all shadow-sm`;

const Label = ({ children }) => <label className="text-sm font-bold text-gray-700 mb-1.5 block uppercase tracking-wider text-[10px]">{children}</label>;

export default function EditProjectPage() {
    const { id } = useParams();
    const router = useRouter();
    const [form, setForm] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState([]);
    const [managers, setManagers] = useState([]);
    const [employees, setEmployees] = useState([]);

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchProject();
    }, [id]);

    useEffect(() => {
        if (!form?.id) return;
        fetchMembers(form.id);
    }, [form?.id]);

    useEffect(() => {
        const fetchMeta = async () => {
            try {
                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                if (!token) return;

                const [clientsRes, managersRes, employeesRes] = await Promise.all([
                    fetch(`${getApiBase()}/api/services/clients`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`${getApiBase()}/api/services/projects/meta/managers`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`${getApiBase()}/api/hrms/staff`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                const clientsJson = await clientsRes.json().catch(() => null);
                const managersJson = await managersRes.json().catch(() => null);
                const employeesJson = await employeesRes.json().catch(() => null);

                if (clientsJson?.success) setClients(Array.isArray(clientsJson.clients) ? clientsJson.clients : []);
                if (managersJson?.success) setManagers(Array.isArray(managersJson.managers) ? managersJson.managers : []);
                if (employeesJson?.success) setEmployees(Array.isArray(employeesJson.data) ? employeesJson.data : []);
            } catch (error) {
                console.error('Error fetching project form meta:', error);
            }
        };

        fetchMeta();
    }, []);

    const fetchProject = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await fetch(`${getApiBase()}/api/services/projects`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                let fetchedProj = data.projects.find(p => p.id.toString() === id.toString() || p.projectId === id);
                if (fetchedProj) {
                    const teamSize = Number(fetchedProj.team || 0);
                    setForm({
                        ...fetchedProj,
                        start: fetchedProj.start ? new Date(fetchedProj.start).toISOString().split('T')[0] : '',
                        end: fetchedProj.end ? new Date(fetchedProj.end).toISOString().split('T')[0] : '',
                        description: fetchedProj.description || '',
                        milestones: Array.isArray(fetchedProj.milestones) ? (fetchedProj.milestones.length > 0 ? fetchedProj.milestones : ['']) : (fetchedProj.milestones ? [fetchedProj.milestones] : ['']),
                        teamSize,
                        team: []
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching project:', error);
        }
    };

    const fetchMembers = async (projectId) => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await fetch(`${getApiBase()}/api/services/projects/${projectId}/members`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json().catch(() => ({}));
            if (data.success && Array.isArray(data.members)) {
                setForm(f => ({
                    ...f,
                    team: data.members.map(m => m.id).filter(Boolean),
                    teamSize: data.members.length
                }));
            }
        } catch (e) {
            console.error('Error fetching project members:', e);
        }
    };

    if (!form) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await fetch(`${getApiBase()}/api/services/projects/${form.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: form.name,
                    client: form.client,
                    manager: form.manager,
                    start: form.start,
                    end: form.end,
                    budget: form.budget,
                    status: form.status,
                    description: form.description,
                    milestones: form.milestones.filter(m => typeof m === 'string' && m.trim()),
                    teamMembers: Array.isArray(form.team) ? form.team : [],
                    team: (Array.isArray(form.team) && form.team.length > 0)
                        ? form.team.length
                        : Number(form.teamSize || 1),
                })
            });
            const data = await res.json();
            if (data.success) {
                router.push(`/services/projects/${form.id}`);
            } else {
                alert(data.message || 'Error updating project');
            }
        } catch (error) {
            console.error('Error updating project:', error);
            alert('Failed to connect to server');
        } finally {
            setIsSaving(false);
        }
    };

    const addMilestone = () => setForm(f => ({ ...f, milestones: [...(f.milestones || []), ''] }));
    const removeMilestone = (idx) => setForm(f => ({ ...f, milestones: f.milestones.filter((_, i) => i !== idx) }));
    const setMilestone = (idx, val) => setForm(f => {
        const next = [...f.milestones];
        next[idx] = val;
        return { ...f, milestones: next };
    });

    const toggleMember = (mId) => {
        setForm(f => ({
            ...f,
            team: Array.isArray(f.team) && f.team.includes(mId)
                ? f.team.filter(x => x !== mId)
                : [...(f.team || []), mId]
        }));
    };

    const filteredEmployees = employees.filter((emp) => {
        const q = searchTerm.toLowerCase();
        const name = String(emp.full_name || '').toLowerCase();
        const role = String(emp.role || '').toLowerCase();
        const empId = String(emp.emp_id || '').toLowerCase();
        return name.includes(q) || role.includes(q) || empId.includes(q);
    });

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20 mt-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all bg-white flex-shrink-0"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Edit Project</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] truncate">{form.projectId} • {form.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                    <button
                        onClick={() => router.back()}
                        className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors border border-gray-200 rounded-xl bg-white"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50"
                    >
                        <Save size={16} />
                        {isSaving ? 'Updating...' : 'Update Project'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 sm:px-0">
                {/* Left Column: Form */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-50 mb-2">
                            <Briefcase className="text-indigo-600" size={20} />
                            <h3 className="font-bold text-gray-900">Primary Details</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <Label>Project Name</Label>
                                <input
                                    className={inputCls()}
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Client</Label>
                                <select
                                    className={inputCls()}
                                    value={form.client}
                                    onChange={e => setForm({ ...form, client: e.target.value })}
                                >
                                    <option value="">Select a client</option>
                                    {clients.map((c) => (
                                        <option key={c.id} value={c.company}>
                                            {c.company}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label>Status</Label>
                                <select
                                    className={inputCls()}
                                    value={form.status}
                                    onChange={e => setForm({ ...form, status: e.target.value })}
                                >
                                    {['Active', 'On Hold', 'Completed', 'Overdue'].map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <Label>Project Manager</Label>
                                <select
                                    className={inputCls()}
                                    value={form.manager}
                                    onChange={e => setForm({ ...form, manager: e.target.value })}
                                >
                                    <option value="">Select a manager</option>
                                    {managers.length > 0 ? managers.map((m) => (
                                        <option key={m.id} value={m.name}>
                                            {m.name}{m.role ? ` (${m.role})` : ''}
                                        </option>
                                    )) : (
                                        <option value={form.manager}>{form.manager}</option>
                                    )}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <Label>Project Overview (Executive Summary)</Label>
                                <textarea
                                    className={`${inputCls()} resize-none`}
                                    rows={4}
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    placeholder="Strategic overview..."
                                />
                            </div>
                        </div>
                    </section>

                    <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-50 mb-2">
                            <Target className="text-emerald-600" size={20} />
                            <h3 className="font-bold text-gray-900">Scope & Financials</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="relative">
                                <Label>Start Date</Label>
                                <Calendar className="absolute left-4 top-10 text-gray-400" size={16} />
                                <input
                                    type="date"
                                    className={`${inputCls()} pl-11`}
                                    value={form.start}
                                    onChange={e => setForm({ ...form, start: e.target.value })}
                                />
                            </div>
                            <div className="relative">
                                <Label>End Date</Label>
                                <Calendar className="absolute left-4 top-10 text-gray-400" size={16} />
                                <input
                                    type="date"
                                    className={`${inputCls()} pl-11`}
                                    value={form.end}
                                    onChange={e => setForm({ ...form, end: e.target.value })}
                                />
                            </div>
                            <div className="relative md:col-span-2">
                                <Label>Budget (₹)</Label>
                                <IndianRupee className="absolute left-4 top-10 text-gray-400" size={16} />
                                <input
                                    type="number"
                                    className={`${inputCls()} pl-11`}
                                    value={form.budget}
                                    onChange={e => setForm({ ...form, budget: e.target.value })}
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column: Sidebar */}
                <div className="space-y-6">
                    {/* Team Section */}
                    <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-widest">Manage Team</h3>
                            <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                                {form.team.length} Assigned
                            </span>
                        </div>

                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search employees..."
                                className="w-full pl-4 pr-10 py-2 rounded-xl border border-gray-100 bg-gray-50 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {filteredEmployees.map(emp => {
                                const isAssigned = Array.isArray(form.team) && form.team.includes(emp.id);
                                return (
                                    <div
                                        key={emp.id || emp.emp_id}
                                        onClick={() => toggleMember(emp.id)}
                                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${isAssigned ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'}`}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${isAssigned ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                {String(emp.full_name || emp.name || '?').charAt(0)}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className={`text-sm font-bold truncate ${isAssigned ? 'text-indigo-900' : 'text-gray-900'}`}>{emp.full_name || emp.name}</p>
                                                <p className="text-[10px] text-gray-400 truncate uppercase font-bold tracking-wider">{emp.role || emp.emp_id}</p>
                                            </div>
                                        </div>
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${isAssigned ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-300 rotate-45 group-hover:bg-indigo-100 group-hover:text-indigo-600 group-hover:rotate-0'}`}>
                                            {isAssigned ? <X size={14} className="rotate-45" /> : <Plus size={14} />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Roadmap Section */}
                    <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-center gap-3 pb-2 border-b border-gray-50">
                            <Flag className="text-amber-600" size={18} />
                            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-widest">Execution Roadmap</h3>
                        </div>
                        <div className="space-y-3">
                            {Array.isArray(form.milestones) && form.milestones.map((m, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-800">
                                            {idx + 1}
                                        </div>
                                        <input
                                            value={m}
                                            onChange={(e) => setMilestone(idx, e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold"
                                            placeholder="Milestone title..."
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeMilestone(idx)}
                                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addMilestone}
                                className="w-full py-2 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 font-bold text-[10px] uppercase tracking-widest hover:border-indigo-100 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={14} /> Add Milestone
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
