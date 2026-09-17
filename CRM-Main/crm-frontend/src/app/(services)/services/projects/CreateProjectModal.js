"use client";
import React, { useState, useEffect } from 'react';
import { getApiBase } from '@/utils/apiBase';

const inputCls = (err) =>
    `w-full px-3.5 py-2.5 rounded-lg border ${err ? 'border-red-400 bg-red-50' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-800`;

const Field = ({ label, required, error, children }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-700">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
        {children}
        {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
    </div>
);

const blank = { name: '', client: '', manager: '', start: '', end: '', budget: '', status: 'Active', description: '', team: [] };

export default function CreateProjectModal({ isOpen, onClose, onSave, editData }) {
    const [form, setForm] = useState(blank);
    const [errors, setErrors] = useState({});
    const [step, setStep] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [employees, setEmployees] = useState([]);
    const [clients, setClients] = useState([]);
    const isEdit = !!editData;

    useEffect(() => {
        if (isOpen) {
            setForm(editData ? { ...blank, ...editData } : blank);
            setErrors({});
            setStep(1);
            setSearchTerm('');
            (async () => {
                try {
                    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                    const [staffRes, clientsRes] = await Promise.all([
                        fetch(`${getApiBase()}/api/hrms/staff`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        }),
                        fetch(`${getApiBase()}/api/services/clients`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        })
                    ]);
                    
                    const staffData = await staffRes.json().catch(() => ({}));
                    const clientsData = await clientsRes.json().catch(() => ({}));

                    if (staffData.success && Array.isArray(staffData.data)) {
                        setEmployees(staffData.data);
                    }
                    if (clientsData.success && Array.isArray(clientsData.clients)) {
                        setClients(clientsData.clients);
                    }
                } catch (e) {
                    console.error('Error fetching modal data:', e);
                }
            })();
        }
    }, [isOpen, editData]);

    if (!isOpen) return null;

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Project name is required';
        if (!form.client.trim()) e.client = 'Client is required';
        if (!form.manager.trim()) e.manager = 'Manager is required';
        if (!form.start) e.start = 'Start date is required';
        if (!form.end) e.end = 'End date is required';
        if (!form.budget || isNaN(Number(form.budget))) e.budget = 'Valid budget is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;
        onSave({
            ...form,
            id: editData?.id || `PRJ-${2000 + Math.floor(Math.random() * 900)}`,
            budget: Number(form.budget),
            team: form.team.length
        });
        onClose();
    };

    const toggleMember = (mId) => {
        setForm(f => ({ ...f, team: f.team.includes(mId) ? f.team.filter(x => x !== mId) : [...f.team, mId] }));
    };

    const steps = ['Basic Info', 'Financials', 'Team'];

    const filteredEmployees = employees.filter(emp =>
        String(emp.full_name || emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(emp.role || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="font-bold text-gray-900 text-lg">{isEdit ? 'Edit Project' : 'Create New Project'}</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Step {step} of 3 — {steps[step - 1]}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"><X size={18} /></button>
                </div>

                {/* Step Indicator */}
                <div className="px-6 pt-4 flex items-center gap-2">
                    {steps.map((s, i) => (
                        <React.Fragment key={s}>
                            <div className={`flex items-center gap-2 ${i < steps.length - 1 ? 'flex-1' : ''}`}>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 flex-shrink-0 ${i + 1 === step ? 'bg-indigo-600 text-white border-indigo-600' : i + 1 < step ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>{i + 1}</div>
                                {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${i + 1 < step ? 'bg-indigo-400' : 'bg-gray-200'}`} />}
                            </div>
                        </React.Fragment>
                    ))}
                </div>
                <div className="px-6 pb-1 flex justify-between mt-1.5">
                    {steps.map((s, i) => <span key={s} className={`text-[10px] font-bold ${i + 1 === step ? 'text-indigo-600' : 'text-gray-400'}`}>{s}</span>)}
                </div>

                {/* Form Content */}
                <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Project Name" required error={errors.name}>
                                <input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls(errors.name)} placeholder="e.g. ERP System Migration" />
                            </Field>
                            <Field label="Client Name" required error={errors.client}>
                                <select 
                                    value={form.client} 
                                    onChange={e => set('client', e.target.value)} 
                                    className={inputCls(errors.client)}
                                >
                                    <option value="">Select a client</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.company}>
                                            {c.company}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Project Manager" required error={errors.manager}>
                                <select value={form.manager} onChange={e => set('manager', e.target.value)} className={inputCls(errors.manager)}>
                                    <option value="">Select manager</option>
                                    {employees.map(m => (
                                        <option key={m.id} value={m.full_name || m.name}>
                                            {m.full_name || m.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Status">
                                <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls(false)}>
                                    {['Active', 'On Hold', 'Completed', 'Overdue'].map(s => <option key={s}>{s}</option>)}
                                </select>
                            </Field>
                            <div className="sm:col-span-2">
                                <Field label="Description">
                                    <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} className={`${inputCls(false)} resize-none`} placeholder="Brief project description..." />
                                </Field>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Financials */}
                    {step === 2 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Start Date" required error={errors.start}>
                                <input type="date" value={form.start} onChange={e => set('start', e.target.value)} className={inputCls(errors.start)} />
                            </Field>
                            <Field label="End Date" required error={errors.end}>
                                <input type="date" value={form.end} onChange={e => set('end', e.target.value)} className={inputCls(errors.end)} />
                            </Field>
                            <Field label="Total Budget (₹)" required error={errors.budget}>
                                <input type="number" value={form.budget} onChange={e => set('budget', e.target.value)} className={inputCls(errors.budget)} placeholder="e.g. 500000" min="0" />
                            </Field>
                            <Field label="Billing Type">
                                <select className={inputCls(false)}>
                                    {['Fixed Price', 'Time & Material', 'Monthly Retainer'].map(b => <option key={b}>{b}</option>)}
                                </select>
                            </Field>
                            <div className="sm:col-span-2 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                <p className="text-xs font-bold text-blue-700 mb-1">Budget Summary</p>
                                <p className="text-2xl font-bold text-blue-900">₹{form.budget ? Number(form.budget).toLocaleString() : '—'}</p>
                                <p className="text-xs text-blue-400 mt-0.5">Estimated project cost</p>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Team */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500 mb-3 font-medium">Select team members from active employees:</p>
                                <div className="relative mb-4">
                                    <input
                                        type="text"
                                        placeholder="Search employees..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-3 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    />
                                </div>
                                {/* Selected tags */}
                                {form.team.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                                        {form.team.map(mId => {
                                            const emp = employees.find(e => e.id === mId);
                                            return (
                                                <span key={mId} className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white text-[11px] font-bold rounded-lg uppercase tracking-wider">
                                                    {emp?.full_name || emp?.name || mId}
                                                    <button onClick={() => toggleMember(mId)} className="hover:text-indigo-200 transition-colors"><XIcon size={12} /></button>
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                    {filteredEmployees.map(emp => {
                                        const selected = form.team.includes(emp.id);
                                        return (
                                            <button
                                                key={emp.id}
                                                type="button"
                                                onClick={() => toggleMember(emp.id)}
                                                className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${selected ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-400' : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'}`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${selected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                                    {String(emp.full_name || emp.name || '?').split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className={`text-sm font-bold truncate ${selected ? 'text-indigo-800' : 'text-gray-700'}`}>{emp.full_name || emp.name}</p>
                                                    <p className="text-[10px] text-gray-500 truncate">{emp.role || ''}</p>
                                                </div>
                                                {selected && <div className="ml-auto bg-indigo-600 rounded-full p-0.5 text-white"><XIcon size={10} className="rotate-45" /></div>}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-3">{form.team.length} member{form.team.length !== 1 ? 's' : ''} assigned</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
                    {step > 1 ? (
                        <button onClick={() => setStep(s => s - 1)} className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">← Back</button>
                    ) : (
                        <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                    )}
                    {step < 3 ? (
                        <button onClick={() => setStep(s => s + 1)} className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-colors">Next →</button>
                    ) : (
                        <button onClick={handleSave} className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-colors">{isEdit ? 'Update Project' : 'Create Project'}</button>
                    )}
                </div>
            </div>
        </div>
    );
}
