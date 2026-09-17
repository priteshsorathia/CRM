"use client";
import React, { useState, useEffect } from 'react';
import { useRole } from "@/app/(services)/context/RoleContext";
import { toast } from 'sonner';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Calendar,
    Tag,
    Clock
} from 'lucide-react';

const priorityColors = {
    'Critical': 'bg-red-50 text-red-700 border-red-100',
    'High': 'bg-orange-50 text-orange-700 border-orange-100',
    'Medium': 'bg-amber-50 text-amber-700 border-amber-100',
    'Low': 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

const columnStyles = {
    'Pending': 'bg-gray-100 text-gray-700',
    'In Progress': 'bg-indigo-600 text-white',
    'Completed': 'bg-green-100 text-green-700',
    'On Hold': 'bg-rose-100 text-rose-700',
};

export default function TaskDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { can, loading: roleLoading } = useRole();
    const [task, setTask] = useState(null);

    useEffect(() => {
        if (!roleLoading && !can('TASK', 'READ')) {
            router.push('/services/dashboard');
        }
    }, [roleLoading, can, router]);

    useEffect(() => {
        const fetchTask = async () => {
            try {
                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                const { getApiBase } = require('@/utils/apiBase');
                const res = await fetch(`${getApiBase()}/api/services/projects`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    const allTasks = data.projects.flatMap(p => p.tasks?.map(t => ({...t, projectName: p.name})) || []);
                    const foundTask = allTasks.find(t => t.id.toString() === id.toString() || t.taskId === id);
                    if (foundTask) {
                        setTask({
                            ...foundTask,
                            priority: foundTask.priority || 'Medium',
                            column: foundTask.column || 'Pending',
                            assignee: foundTask.assignee || 'Unassigned',
                            deadline: foundTask.deadline ? new Date(foundTask.deadline).toLocaleDateString() : 'No date',
                            project: foundTask.projectName || 'Unknown'
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching task details:', error);
            }
        };

        fetchTask();
    }, [id]);

    if (!task) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4">
            {/* Header */}
            <div className="flex items-center justify-between pt-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-all font-semibold"
                >
                    <ChevronLeft size={20} />
                    Back
                </button>
                {can('TASK', 'UPDATE') && (
                    <button
                        onClick={() => router.push(`/services/projects/tasks/edit/${task.id}`)}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all active:scale-95"
                    >
                        Edit Task
                    </button>
                )}
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Info Bar */}
                <div className="p-8 border-b border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${priorityColors[task.priority]}`}>
                            {task.priority} Priority
                        </span>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${columnStyles[task.column]}`}>
                            {task.column}
                        </span>
                    </div>
                    
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-4">
                        {task.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-2 text-gray-400 font-semibold text-xs uppercase tracking-wider">
                            <Tag size={16} />
                            Project: <span className="text-indigo-600">{task.project}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 font-semibold text-xs uppercase tracking-wider">
                            <Clock size={16} />
                            Task ID: <span className="text-gray-900">{task.taskId}</span>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Assigned To</label>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-lg font-bold">
                                    {task.assignee.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{task.assignee}</p>
                                    <p className="text-xs text-gray-400 font-medium">Team Member</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Deadline</label>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-rose-500">
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{task.deadline}</p>
                                    <p className="text-xs text-gray-400 font-medium">Completion Date</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</h3>
                        <div className="p-6 rounded-2xl bg-gray-50/50 border border-gray-100 min-h-[100px]">
                            <p className="text-gray-700 leading-relaxed font-medium">
                                {task.description || "No description provided."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
