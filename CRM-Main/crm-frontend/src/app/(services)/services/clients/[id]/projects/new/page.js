"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { isSvgFile } from '@/utils/fileValidation';
import {
    ChevronLeft,
    Check,
    Info,
    Target,
    Calendar,
    DollarSign,
    Users,
    Search,
    X,
    Building2,
    Flag,
    Trash2,
    Plus,
    FileText,
    Upload
} from 'lucide-react';
import { initialClients } from '../../../../data/clientDummyData';
import { getApiBase } from '@/utils/apiBase';

const inputCls = (err) =>
    `w-full px-4 py-2.5 rounded-xl border ${err ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-800 transition-all font-semibold`;

const Field = ({ label, required, error, children, info }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
            {label}
            {required && <span className="text-rose-500">*</span>}
            {info && <Info size={12} className="text-gray-300 cursor-help" title={info} />}
        </label>
        {children}
        {error && <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1 mt-0.5"><Check size={10} className="rotate-45" /> {error}</span>}
    </div>
);

export default function NewClientProjectPage() {
    const { id: clientId } = useParams();
    const router = useRouter();
    const [client, setClient] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [form, setForm] = useState({
        name: '',
        client: '',
        manager: '',
        start: '',
        end: '',
        budget: '',
        status: 'Active',
        description: '',
        billingType: 'Fixed Price',
        milestones: [''],
        team: [],
        documentation: []
    });
    const [errors, setErrors] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showError, setShowError] = useState(false);

    useEffect(() => {
        const fetchClient = async () => {
            try {
                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                const res = await fetch(`${getApiBase()}/api/services/clients`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success && data.clients) {
                    const found = data.clients.find(c => c.id.toString() === clientId.toString() || c.clientId === clientId);
                    if (found) {
                        setClient(found);
                        setForm(f => ({ ...f, client: found.company }));
                    }
                }
            } catch (e) {
                console.error('Error fetching client:', e);
            }
        };
        fetchClient();
    }, [clientId]);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                const res = await fetch(`${getApiBase()}/api/hrms/staff`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json().catch(() => ({}));
                if (data.success) {
                    const list = Array.isArray(data.data) ? data.data : (Array.isArray(data.employees) ? data.employees : []);
                    setEmployees(list);
                } else {
                    console.error('Failed to fetch employees:', data.message || data.error);
                }
            } catch (e) {
                console.error('Error fetching employees:', e);
            }
        };
        fetchEmployees();
    }, []);

    const set = (k, v) => {
        setForm(f => ({ ...f, [k]: v }));
        if (errors[k]) setErrors(prev => {
            const next = { ...prev };
            delete next[k];
            return next;
        });
    };

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Project name is required';
        if (!form.manager.trim()) e.manager = 'Manager is required';
        if (!form.start) e.start = 'Start date is required';
        if (!form.end) e.end = 'End date is required';
        if (!form.budget || isNaN(Number(form.budget))) e.budget = 'Valid budget is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.team.length === 0) {
            setShowError(true);
            setTimeout(() => setShowError(false), 5000);
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await fetch(`${getApiBase()}/api/services/projects`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: form.name,
                    client: form.client,
                    manager: form.manager,
                    start: form.start,
                    end: form.end,
                    budget: parseFloat(form.budget),
                    status: form.status,
                    description: form.description,
                    billingType: form.billingType,
                    documentation: form.documentation,
                    milestones: form.milestones.filter(m => m.trim()),
                    teamMembers: form.team
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Project launched successfully!");
                router.push(`/services/clients/${clientId}`);
            } else {
                throw new Error(data.message || "Failed to create project");
            }
        } catch (error) {
            console.error('Error creating project:', error);
            toast.error(error.message || "Something went wrong while launching the project");
        } finally {
            setLoading(false);
        }
    };

    const addMilestone = () => setForm(f => ({ ...f, milestones: [...f.milestones, ''] }));
    const removeMilestone = (idx) => setForm(f => ({ ...f, milestones: f.milestones.filter((_, i) => i !== idx) }));
    const setMilestone = (idx, val) => setForm(f => {
        const next = [...f.milestones];
        next[idx] = val;
        return { ...f, milestones: next };
    });

    const toggleMember = (mId) => {
        setForm(f => ({
            ...f,
            team: f.team.includes(mId) ? f.team.filter(x => x !== mId) : [...f.team, mId]
        }));
    };

    const filteredEmployees = employees.filter(emp =>
        String(emp.full_name || emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(emp.role || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const validFiles = [];
        for (const file of files) {
            if (isSvgFile(file)) {
                e.target.value = "";
                return;
            }
            validFiles.push(file);
        }

        setIsUploading(true);
        const newDocs = [...(form.documentation || [])];

        for (const file of validFiles) {
            const formData = new FormData();
            formData.append('document', file);

            try {
                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                const res = await fetch(`${getApiBase()}/api/upload/projects/upload-doc`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                const data = await res.json();
                if (data.success) {
                    newDocs.push({
                        name: file.name,
                        url: data.data.fileUrl,
                        type: file.type,
                        size: file.size
                    });
                }
            } catch (error) {
                console.error('Error uploading file:', error);
                toast.error(`Failed to upload ${file.name}`);
            }
        }

        set('documentation', newDocs);
        setIsUploading(false);
        toast.success(`${files.length} document(s) uploaded`);
    };

    const removeDoc = (idx) => {
        const next = [...form.documentation];
        next.splice(idx, 1);
        set('documentation', next);
    };

    const nextStep = () => {
        const e = {};
        if (step === 1) {
            if (!form.name.trim()) e.name = 'Project name is required';
            if (!form.manager.trim()) e.manager = 'Manager is required';
        } else if (step === 2) {
            if (!form.start) e.start = 'Start date is required';
            if (!form.end) e.end = 'End date is required';
            if (!form.budget || isNaN(Number(form.budget))) e.budget = 'Valid budget is required';
        }

        if (Object.keys(e).length > 0) {
            setErrors(e);
            return;
        }

        setStep(Math.min(4, step + 1));
        setErrors({});
    };

    if (!client) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 relative">
            {/* Custom Notification */}
            {showError && (
                <div className="fixed top-8 right-8 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-red-50 border border-red-100 px-6 py-4 rounded-2xl shadow-xl shadow-red-100/20 flex items-center gap-4">
                        <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white shrink-0">
                            <Info size={14} className="rotate-180" />
                        </div>
                        <p className="text-sm font-bold text-red-600 tracking-tight">
                            Selecting at least one team member is mandatory
                        </p>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col gap-4 mb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors w-fit group"
                >
                    <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-widest">Back to Profile</span>
                </button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Launch Project</h1>
                        <p className="text-sm font-bold text-gray-500 mt-1">
                            New enterprise project for <span className="text-indigo-600">{client.company}</span>
                        </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`h-1.5 w-10 rounded-full transition-all duration-500 ${step >= i ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                        ))}
                    </div>
                </div>
            </div>

            <main className="bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-indigo-100/10 overflow-hidden">
                <form onSubmit={handleSubmit}>
                    {/* Step Content */}
                    <div className="p-8">
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center gap-3 pb-6 border-b border-gray-50">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm"><Target size={24} /></div>
                                    <div>
                                        <h2 className="text-lg font-black text-gray-900">Project Blueprint</h2>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">Core Identity & Scope</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <Field label="Project name" required error={errors.name}>
                                            <input
                                                value={form.name}
                                                onChange={e => set('name', e.target.value)}
                                                className={inputCls(errors.name)}
                                                placeholder="e.g. Cloud Transformation v2.0"
                                            />
                                        </Field>
                                    </div>
                                    <Field label="Parent client">
                                        <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100 text-sm font-bold text-gray-400 cursor-not-allowed">
                                            <Building2 size={16} />
                                            {client.company}
                                        </div>
                                    </Field>
                                    <Field label="Assigned Manager" required error={errors.manager}>
                                        <select
                                            value={form.manager}
                                            onChange={e => set('manager', e.target.value)}
                                            className={inputCls(errors.manager)}
                                        >
                                            <option value="">Choose a lead</option>
                                            {employees.map(e => {
                                                const name = e.full_name || e.name || 'Staff';
                                                return (
                                                    <option key={e.id} value={name}>
                                                        {name}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </Field>
                                    <div className="md:col-span-2">
                                        <Field label="Executive Summary">
                                            <textarea
                                                rows={4}
                                                value={form.description}
                                                onChange={e => set('description', e.target.value)}
                                                className={`${inputCls(false)} resize-none`}
                                                placeholder="Brief overview of project objectives..."
                                            />
                                        </Field>
                                    </div>
                                    <div className="md:col-span-2">
                                        <Field label="Project Documentation / Briefs">
                                            <div className="space-y-4">
                                                {/* File List */}
                                                {form.documentation && form.documentation.length > 0 && (
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {form.documentation.map((doc, idx) => (
                                                            <div key={idx} className="flex items-center justify-between p-3 bg-indigo-50/20 border border-indigo-100 rounded-2xl group transition-all">
                                                                <div className="flex items-center gap-3 overflow-hidden">
                                                                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-100">
                                                                        <FileText size={18} />
                                                                    </div>
                                                                    <div className="overflow-hidden">
                                                                        <p className="text-sm font-black text-gray-900 truncate">{doc.name}</p>
                                                                        <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mt-0.5">Ready for Launch</p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeDoc(idx)}
                                                                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className={`relative flex items-center justify-center border-2 border-dashed rounded-[24px] p-8 transition-all ${isUploading ? 'border-indigo-400 bg-indigo-50/20' : 'border-gray-100 hover:border-indigo-200 bg-gray-50/30'}`}>
                                                    <input
                                                        type="file"
                                                        id="doc-upload"
                                                        className="hidden"
                                                        onChange={handleFileUpload}
                                                        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                                                        multiple
                                                    />
                                                    <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center gap-3">
                                                        {isUploading ? (
                                                            <div className="flex flex-col items-center gap-3">
                                                                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[2px]">Uploading Assets...</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center gap-3">
                                                                <div className="w-14 h-14 rounded-2xl bg-white text-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-100/50 border border-gray-50 group-hover:scale-110 transition-transform">
                                                                    <Plus size={28} />
                                                                </div>
                                                                <div className="text-center">
                                                                    <p className="text-sm font-black text-gray-900 tracking-tight">Add More Assets</p>
                                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">PDF, Word, Excel (Max 20MB)</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </label>
                                                </div>
                                            </div>
                                        </Field>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center gap-3 pb-6 border-b border-gray-50">
                                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm"><Calendar size={24} /></div>
                                    <div>
                                        <h2 className="text-lg font-black text-gray-900">Milestones & Finance</h2>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">Timeline & Budgetary Oversight</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Field label="Execution Start" required error={errors.start}>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input type="date" value={form.start} onChange={e => set('start', e.target.value)} className={`${inputCls(errors.start)} pl-10`} />
                                        </div>
                                    </Field>
                                    <Field label="Hard Deadline" required error={errors.end}>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input type="date" value={form.end} onChange={e => set('end', e.target.value)} className={`${inputCls(errors.end)} pl-10`} />
                                        </div>
                                    </Field>
                                    <Field label="Allocated Budget" required error={errors.budget}>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                            <input type="number" value={form.budget} onChange={e => set('budget', e.target.value)} className={`${inputCls(errors.budget)} pl-8 font-black`} placeholder="500,000" />
                                        </div>
                                    </Field>
                                    <Field label="Revenue Model">
                                        <select
                                            value={form.billingType}
                                            onChange={e => set('billingType', e.target.value)}
                                            className={inputCls(false)}
                                        >
                                            {['Fixed Price', 'Time & Material', 'Monthly Retainer', 'Zero Cost'].map(b => <option key={b}>{b}</option>)}
                                        </select>
                                    </Field>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center gap-3 pb-6 border-b border-gray-50">
                                    <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shadow-sm"><Flag size={24} /></div>
                                    <div>
                                        <h2 className="text-lg font-black text-gray-900">Execution Roadmap</h2>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">Define Key Project Milestones</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {form.milestones.map((m, idx) => (
                                        <div key={idx} className="flex gap-3 animate-in zoom-in-95 duration-200">
                                            <div className="flex-1 relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-800">
                                                    {idx + 1}
                                                </div>
                                                <input
                                                    value={m}
                                                    onChange={(e) => setMilestone(idx, e.target.value)}
                                                    className={`${inputCls(false)} pl-12`}
                                                    placeholder="e.g. Phase 1: Requirements Gathering"
                                                />
                                            </div>
                                            {form.milestones.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeMilestone(idx)}
                                                    className="p-3 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addMilestone}
                                        className="w-full py-3 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 font-bold text-xs uppercase tracking-widest hover:border-indigo-100 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus size={16} /> Add Another Milestone
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center gap-3 pb-6 border-b border-gray-50">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm"><Users size={24} /></div>
                                    <div>
                                        <h2 className="text-lg font-black text-gray-900">Resource Allocation</h2>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">Assign Specialists to the Squad</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Find talent by name or skill..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50/50 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                        {filteredEmployees.map(emp => {
                                            const isSelected = form.team.includes(emp.id);
                                            const empName = emp.full_name || emp.name || 'Staff';
                                            return (
                                                <div
                                                    key={emp.id}
                                                    onClick={() => toggleMember(emp.id)}
                                                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${isSelected ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' : 'border-gray-50 bg-gray-50/30 hover:border-indigo-100 hover:bg-white'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${isSelected ? 'bg-indigo-600 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>
                                                            {empName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className={`font-black text-sm ${isSelected ? 'text-indigo-950' : 'text-gray-900'}`}>{empName}</p>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{emp.designation || 'Specialist'}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-300 rotate-45 group-hover:bg-indigo-100 group-hover:text-indigo-600 group-hover:rotate-0'}`}>
                                                        {isSelected ? <Check size={14} /> : <X size={14} />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        {step > 1 ? (
                            <button
                                type="button"
                                onClick={() => setStep(step - 1)}
                                className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm flex items-center gap-2"
                            >
                                <ChevronLeft size={14} /> Back
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-3 bg-white border border-gray-200 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"
                            >
                                Cancel
                            </button>
                        )}

                        <div className="flex items-center gap-3">
                            {step < 4 ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="px-10 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center gap-2"
                                >
                                    Continue Phase
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-10 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all flex items-center gap-2"
                                >
                                    {loading ? 'Initializing...' : 'Confirm Launch'}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </main>
            </div>
        </div>
    );
}
