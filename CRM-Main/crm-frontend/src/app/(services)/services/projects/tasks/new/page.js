"use client";
import React, { useState } from 'react';
import { useRole } from "@/app/(services)/context/RoleContext";
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Check,
    Target,
    Calendar,
    Users,
    Search,
    Type,
    AlertCircle,
    FileText
} from 'lucide-react';
import { getApiBase } from '@/utils/apiBase';

const inputCls = (err) =>
    `w-full px-4 py-2.5 rounded-xl border ${err ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-800 transition-all`;

const Label = ({ children }) => <label className="text-sm font-bold text-gray-700 mb-1.5 block uppercase tracking-wider text-[10px]">{children}</label>;

export default function NewTaskPage() {
    const router = useRouter();
    const { can, userRole, loading: roleLoading } = useRole();
    const [form, setForm] = useState({
        title: '',
        project: '',
        assignee: '',
        priority: 'Medium',
        deadline: '',
        description: '',
        type: 'Development'
    });
    const [errors, setErrors] = useState({});

    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    React.useEffect(() => {
        if (!roleLoading && !can('TASK', 'CREATE')) {
            router.push('/services/dashboard');
        }
    }, [roleLoading, can, router]);

    React.useEffect(() => {
        const fetchMeta = async () => {
            try {
                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                const [projectsRes, employeesRes] = await Promise.all([
                    fetch(`${getApiBase()}/api/services/projects`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${getApiBase()}/api/hrms/staff`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                const projectsJson = await projectsRes.json().catch(() => ({}));
                const employeesJson = await employeesRes.json().catch(() => ({}));

                if (projectsJson.success) setProjects(projectsJson.projects || []);
                if (employeesJson.success) setEmployees(Array.isArray(employeesJson.data) ? employeesJson.data : []);
            } catch (err) {
                console.error("Failed to fetch projects for task creation:", err);
            }
        };
        fetchMeta();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validation logic
        if (!form.title) { setErrors({ title: 'Task title is required' }); return; }
        if (!form.project) { setErrors({ project: 'Project selection is required' }); return; }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            
            // Assume you are associating tasks using the selected project's UUID/id 
            // The form.project holds the string projectId, which is what we need for the url
            const res = await fetch(`${getApiBase()}/api/services/projects/${form.project}/tasks`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    projectId: form.project, // must match backend field mapping
                    title: form.title,
                    assignee: form.assignee,
                    priority: form.priority,
                    deadline: form.deadline,
                    column: 'Pending',
                    description: form.description
                })
            });

            const data = await res.json();
            if (data.success) {
                router.push(`/services/projects/${form.project}/tasks`);
            } else {
                alert(data.message || 'Error creating task');
            }
        } catch (error) {
            console.error('Error creating task:', error);
            alert('Failed to connect to server');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto pb-12 mt-4 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all bg-white"
                >
                    <ChevronLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create New Task</h1>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Assign work to your team</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-8 space-y-6">
                    <div className="flex items-center gap-3 pb-2 border-b border-gray-50">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Target size={18} /></div>
                        <h2 className="font-bold text-gray-900">Task Essentials</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <Label>Task Title</Label>
                            <div className="relative">
                                <Type className="absolute left-4 top-3 text-gray-400" size={16} />
                                <input
                                    className={`${inputCls(errors.title)} pl-11`}
                                    placeholder="e.g. Implement User Authentication"
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                />
                                {errors.title && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase">{errors.title}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Project</Label>
                                <select
                                    className={inputCls(errors.project)}
                                    value={form.project}
                                    onChange={e => setForm({ ...form, project: e.target.value })}
                                >
                                    <option value="">Select Project</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label>Assignee</Label>
                                <select
                                    className={inputCls()}
                                    value={form.assignee}
                                    onChange={e => setForm({ ...form, assignee: e.target.value })}
                                >
                                    <option value="">Unassigned</option>
                                    {employees.map(e => (
                                        <option key={e.id} value={e.full_name || e.name}>
                                            {e.full_name || e.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label>Priority</Label>
                                <select
                                    className={inputCls()}
                                    value={form.priority}
                                    onChange={e => setForm({ ...form, priority: e.target.value })}
                                >
                                    {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label>Type</Label>
                                <select
                                    className={inputCls()}
                                    value={form.type}
                                    onChange={e => setForm({ ...form, type: e.target.value })}
                                >
                                    {['Development', 'Design', 'QA', 'Management', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label>Deadline</Label>
                                <input
                                    type="date"
                                    className={inputCls()}
                                    value={form.deadline}
                                    onChange={e => setForm({ ...form, deadline: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Description</Label>
                            <textarea
                                rows={4}
                                className={`${inputCls()} resize-none`}
                                placeholder="Describe the task requirements..."
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-8 py-2.5 bg-white border border-gray-200 text-gray-500 rounded-xl text-sm font-bold hover:bg-gray-50 hover:text-gray-700 transition-all shadow-sm active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50"
                    >
                        {isSubmitting ? 'Creating...' : 'Create Task'}
                    </button>
                </div>
            </form>
        </div>
    );
}
