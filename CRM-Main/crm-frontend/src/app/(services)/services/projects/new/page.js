"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { isSvgFile } from '@/utils/fileValidation';
import {
    ChevronLeft,
    Check,
    Info,
    Target,
    Calendar,
    IndianRupee,
    Users,
    Search,
    X,
    Flag,
    Plus,
    Trash2,
    FileText,
    Upload as UploadIcon
} from 'lucide-react';
import { getApiBase } from '@/utils/apiBase';

const inputCls = (err) =>
    `w-full px-4 py-2.5 rounded-xl border ${err ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-800 transition-all`;

const Field = ({ label, required, error, children, info }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
            {label}
            {required && <span className="text-red-500 font-bold">*</span>}
            {info && <Info size={12} className="text-gray-400 cursor-help" title={info} />}
        </label>
        {children}
        {error && <span className="text-xs text-red-500 font-medium flex items-center gap-1 mt-0.5"><Check size={10} className="rotate-45" /> {error}</span>}
    </div>
);

export default function NewProjectPage() {
    const router = useRouter();
    const [clients, setClients] = useState([]);
    const [managers, setManagers] = useState([]);
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
        if (!form.client.trim()) e.client = 'Client is required';
        if (!form.manager.trim()) e.manager = 'Manager is required';
        if (!form.start) e.start = 'Start date is required';
        if (!form.end) e.end = 'End date is required';
        if (!form.budget || isNaN(Number(form.budget))) e.budget = 'Valid budget is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        
        // Block submission if not on the final step
        if (step < 3) {
            nextStep();
            return;
        }

        if (!validate()) return;

        // Mandatory Team Assignment Validation
        if (!form.team || form.team.length === 0) {
            setErrors(prev => ({ ...prev, team: 'Please assign at least one team member to this project' }));
            return;
        }
        
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await fetch(`${getApiBase()}/api/services/projects`, {
                method: 'POST',
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
                    teamMembers: form.team,
                    team: form.team.length,
                    description: form.description,
                    documentation: form.documentation,
                    milestones: form.milestones.filter(m => m.trim())
                })
            });
            const data = await res.json();
            if (data.success) {
                router.push('/services/projects');
            } else {
                alert(data.message || 'Error creating project');
            }
        } catch (error) {
            console.error('Error saving project:', error);
            alert('Failed to connect to server');
        } finally {
            setIsSubmitting(false);
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
            team: f.team.includes(mId) ? f.team.filter(x => x !== mId) : [...f.team, mId]
        }));
    };

    const filteredEmployees = employees.filter((emp) => {
        const q = searchTerm.toLowerCase();
        const name = String(emp.full_name || '').toLowerCase();
        const role = String(emp.role || '').toLowerCase();
        const empId = String(emp.emp_id || '').toLowerCase();
        return name.includes(q) || role.includes(q) || empId.includes(q);
    });
    
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
        toast.success(`${files.length} document(s) processed`);
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
            if (!form.client.trim()) e.client = 'Client is required';
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

    return (
        <div className="max-w-4xl mx-auto pb-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Create New Project</h1>
                        <p className="text-sm text-gray-500">Initialize a new project, assign teams and set budget.</p>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step >= i ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                    ))}
                </div>
            </div>

            <main className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                <form onSubmit={handleSubmit}>
                    {/* Step Content */}
                    <div className="p-8">
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Target size={18} /></div>
                                    <h2 className="font-bold text-gray-900">Basic Information</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <Field label="Project Name" required error={errors.name}>
                                            <input
                                                value={form.name}
                                                onChange={e => set('name', e.target.value)}
                                                className={inputCls(errors.name)}
                                                placeholder="e.g. NextGen Web Portal Development"
                                            />
                                        </Field>
                                    </div>
                                    <Field label="Client Name" required error={errors.client}>
                                        <select
                                            value={form.client}
                                            onChange={e => set('client', e.target.value)}
                                            className={inputCls(errors.client)}
                                        >
                                            <option value="">Select a client</option>
                                            {clients.map((c) => (
                                                <option key={c.id} value={c.company}>
                                                    {c.company}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="Project Manager" required error={errors.manager}>
                                        {managers.length > 0 ? (
                                            <select
                                                value={form.manager}
                                                onChange={e => set('manager', e.target.value)}
                                                className={inputCls(errors.manager)}
                                            >
                                                <option value="">Select a manager</option>
                                                {managers.map((m) => (
                                                    <option key={m.id} value={m.name}>
                                                        {m.name}{m.role ? ` (${m.role})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                value={form.manager}
                                                onChange={e => set('manager', e.target.value)}
                                                className={inputCls(errors.manager)}
                                                placeholder="Select a manager"
                                            />
                                        )}
                                    </Field>
                                    <div className="md:col-span-2">
                                        <Field label="Project Description">
                                            <textarea
                                                rows={4}
                                                value={form.description}
                                                onChange={e => set('description', e.target.value)}
                                                className={`${inputCls(false)} resize-none`}
                                                placeholder="Outline the main goals and scope of the project..."
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
                                                            <div key={idx} className="flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl group transition-all">
                                                                <div className="flex items-center gap-3 overflow-hidden">
                                                                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                                                                        <FileText size={16} />
                                                                    </div>
                                                                    <div className="overflow-hidden">
                                                                        <p className="text-sm font-bold text-gray-900 truncate">{doc.name}</p>
                                                                        <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Securely Attached</p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeDoc(idx)}
                                                                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className={`relative flex items-center justify-center border-2 border-dashed rounded-2xl p-6 transition-all ${isUploading ? 'border-indigo-400 bg-indigo-50/30' : 'border-gray-200 hover:border-indigo-200 bg-gray-50/50'}`}>
                                                    <input
                                                        type="file"
                                                        id="doc-upload"
                                                        className="hidden"
                                                        onChange={handleFileUpload}
                                                        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                                                        multiple
                                                    />
                                                    <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                                        {isUploading ? (
                                                            <div className="flex flex-col items-center gap-2">
                                                                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                                                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Processing Assets...</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center gap-2">
                                                                <div className="w-10 h-10 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                                                                    <Plus size={20} />
                                                                </div>
                                                                <div className="text-center">
                                                                    <p className="text-sm font-bold text-gray-700">Add More Documentation</p>
                                                                    <p className="text-xs text-gray-500 font-medium mt-0.5">PDF, Word, Excel or Images (Max 20MB)</p>
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
                                <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Calendar size={18} /></div>
                                    <h2 className="font-bold text-gray-900">Timeline & Financials</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Field label="Expected Start Date" required error={errors.start}>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input type="date" value={form.start} onChange={e => set('start', e.target.value)} className={`${inputCls(errors.start)} pl-10`} />
                                        </div>
                                    </Field>
                                    <Field label="Project Deadline" required error={errors.end}>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input type="date" value={form.end} onChange={e => set('end', e.target.value)} className={`${inputCls(errors.end)} pl-10`} />
                                        </div>
                                    </Field>
                                    <Field label="Total Budget" required error={errors.budget}>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input type="number" value={form.budget} onChange={e => set('budget', e.target.value)} className={`${inputCls(errors.budget)} pl-10 font-bold`} placeholder="500,000" />
                                        </div>
                                    </Field>
                                    <Field label="Billing Model">
                                        <select
                                            value={form.billingType}
                                            onChange={e => set('billingType', e.target.value)}
                                            className={inputCls(false)}
                                        >
                                            {['Fixed Price', 'Time & Material', 'Monthly Retainer'].map(b => <option key={b}>{b}</option>)}
                                        </select>
                                    </Field>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Flag size={18} /></div>
                                    <h2 className="font-bold text-gray-900">Execution Roadmap</h2>
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
                                                    placeholder="e.g. Design Approved, Backend Ready..."
                                                />
                                            </div>
                                            {form.milestones.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeMilestone(idx)}
                                                    className="p-3 text-gray-400 hover:text-rose-600 transition-all"
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
                                        <Plus size={16} /> Add Milestone
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Users size={18} /></div>
                                    <h2 className="font-bold text-gray-900">Build Your Team</h2>
                                </div>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search employees by name, role, or ID..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {filteredEmployees.map(emp => {
                                            const isSelected = form.team.includes(emp.id);
                                            return (
                                                <div
                                                    key={emp.id}
                                                    onClick={() => toggleMember(emp.id)}
                                                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                                            {String(emp.full_name || '?').charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className={`font-bold text-sm ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>{emp.full_name}</p>
                                                            <p className="text-xs text-gray-500">{emp.role || emp.emp_id}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 text-white rotate-0' : 'bg-gray-100 text-gray-400 rotate-45 group-hover:bg-indigo-100'}`}>
                                                        {isSelected ? <Check size={14} /> : <X size={14} />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {errors.team && (
                                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm animate-in fade-in duration-300">
                                            <Info size={16} />
                                            <span className="font-medium">{errors.team}</span>
                                        </div>
                                    )}

                                    {form.team.length > 0 && (
                                        <div className="pt-4 border-t border-gray-100 italic text-sm text-gray-500">
                                            {form.team.length} employees selected for this project.
                                        </div>
                                    )}
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
                                className="px-6 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-600 hover:bg-white transition-all"
                            >
                                Previous Step
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-600 hover:bg-white transition-all"
                            >
                                Cancel
                            </button>
                        )}

                        <div className="flex items-center gap-3">
                            {step < 4 ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all"
                                >
                                    Continue
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Creating...' : 'Create Project'}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}
