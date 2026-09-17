"use client";
import React, { useState, useEffect } from 'react';
import { useRole } from "@/app/(services)/context/RoleContext";
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Save,
    X,
    Calendar,
    Target,
    Users,
    Type,
    AlertCircle
} from 'lucide-react';
import { getApiBase } from '@/utils/apiBase';

const inputCls = (err) =>
    `w-full px-4 py-2.5 rounded-xl border ${err ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-800 transition-all shadow-sm`;

const Label = ({ children }) => <label className="text-sm font-bold text-gray-700 mb-1.5 block uppercase tracking-wider text-[10px]">{children}</label>;

export default function EditTaskPage() {
    const { id } = useParams();
    const router = useRouter();
    const { can, loading: roleLoading } = useRole();
    const [task, setTask] = useState(null);
    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!roleLoading && !can('TASK', 'UPDATE')) {
            router.push('/services/dashboard');
        }
    }, [roleLoading, can, router]);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const [projectsRes, employeesRes] = await Promise.all([
                fetch(`${getApiBase()}/api/services/projects`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${getApiBase()}/api/hrms/staff`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const projectsJson = await projectsRes.json().catch(() => ({}));
            const employeesJson = await employeesRes.json().catch(() => ({}));

            if (projectsJson.success) {
                setProjects(projectsJson.projects || []);
                const allTasks = (projectsJson.projects || []).flatMap(p => p.tasks || []);
                const found = allTasks.find(t => t.id.toString() === id.toString() || t.taskId === id);
                if (found) {
                    setTask({
                        ...found,
                        deadline: found.deadline ? new Date(found.deadline).toISOString().split('T')[0] : ''
                    });
                }
            }

            if (employeesJson.success) setEmployees(Array.isArray(employeesJson.data) ? employeesJson.data : []);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    if (!task) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await fetch(`${getApiBase()}/api/services/projects/tasks/${task.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: task.title,
                    assignee: task.assignee,
                    priority: task.priority,
                    deadline: task.deadline,
                    column: task.column,
                    description: task.description,
                    projectId: task.project || task.projectId
                })
            });
            const data = await res.json();
            if (data.success) {
                router.back(); 
            } else {
                alert(data.message || 'Error updating task');
            }
        } catch (error) {
            console.error('Error updating task:', error);
            alert('Failed to update task');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto pb-12 mt-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all bg-white"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit Task</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{task.id} • {task.title}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50"
                    >
                        <Save size={18} />
                        {isSaving ? 'Updating...' : 'Update Task'}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSave} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Target size={18} /></div>
                        <h3 className="font-bold text-gray-900">Task Details</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <Label>Task Title</Label>
                            <input
                                className={inputCls()}
                                value={task.title}
                                onChange={e => setTask({ ...task, title: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Project</Label>
                                <select
                                    className={inputCls()}
                                    value={task.projectId || task.project}
                                    onChange={e => setTask({ ...task, project: e.target.value })}
                                >
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label>Assignee</Label>
                                <select
                                    className={inputCls()}
                                    value={task.assignee}
                                    onChange={e => setTask({ ...task, assignee: e.target.value })}
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
                                    value={task.priority}
                                    onChange={e => setTask({ ...task, priority: e.target.value })}
                                >
                                    {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label>Status</Label>
                                <select
                                    className={inputCls()}
                                    value={task.column}
                                    onChange={e => setTask({ ...task, column: e.target.value })}
                                >
                                    {['Pending', 'In Progress', 'Completed', 'On Hold'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label>Deadline</Label>
                                <input
                                    type="date"
                                    className={inputCls()}
                                    value={task.deadline}
                                    onChange={e => setTask({ ...task, deadline: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
