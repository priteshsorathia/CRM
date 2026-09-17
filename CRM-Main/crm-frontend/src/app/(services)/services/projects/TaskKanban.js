"use client";
import React, { useState } from 'react';
import { MessageSquare, Paperclip, Calendar, GripVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';


const COLUMNS = ['Pending', 'In Progress', 'Completed', 'On Hold'];

const colStyle = {
    'Pending': { header: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-400', count: 'bg-gray-200 text-gray-700' },
    'In Progress': { header: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500', count: 'bg-indigo-100 text-indigo-700' },
    'Completed': { header: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500', count: 'bg-green-100 text-green-700' },
    'On Hold': { header: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', count: 'bg-amber-100 text-amber-700' },
};

const priorityStyle = {
    'Critical': 'bg-red-50 text-red-700 border border-red-200',
    'High': 'bg-orange-50 text-orange-700 border border-orange-200',
    'Medium': 'bg-amber-50 text-amber-700 border border-amber-200',
    'Low': 'bg-gray-100 text-gray-600 border border-gray-200',
};

function TaskCard({ task, onMove }) {
    const router = useRouter();
    return (
        <div
            onClick={() => router.push(`/services/projects/tasks/${task.id}`)}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-all group cursor-pointer"
        >
            {/* Priority + Project */}
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-50">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${priorityStyle[task.priority] || ''}`}>{task.priority} Priority</span>
                <GripVertical size={13} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
            </div>

            {/* Title */}
            <p className="font-bold text-gray-900 text-sm leading-snug mb-1 group-hover:text-indigo-600 transition-colors">{task.title}</p>
            <p className="text-xs text-gray-400 font-medium truncate mb-3">{task.project}</p>

            {/* Deadline */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                <Calendar size={11} className="text-gray-400" />
                <span>{task.deadline}</span>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                        {(task.assignee || 'Unassigned').split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-xs text-gray-500 font-bold truncate max-w-[80px]">{(task.assignee || 'Unassigned').split(' ')[0]}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    {task.comments > 0 && (
                        <span className="flex items-center gap-0.5"><MessageSquare size={11} />{task.comments}</span>
                    )}
                    {task.attachments > 0 && (
                        <span className="flex items-center gap-0.5"><Paperclip size={11} />{task.attachments}</span>
                    )}
                </div>
            </div>

            {/* Move Status (Silent Action) */}
            <div className="mt-3 flex gap-1 flex-wrap invisible group-hover:visible animate-in fade-in duration-200">
                {COLUMNS.filter(c => c !== task.column).map(col => (
                    <button
                        key={col}
                        onClick={(e) => { e.stopPropagation(); onMove(task.id, col); }}
                        className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 transition-all"
                    >
                        {col}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function TaskKanban({ projects = [] }) {
    const defaultTasks = projects.flatMap(p => p.tasks || []);
    const [localTasks, setLocalTasks] = useState([]);

    React.useEffect(() => {
        setLocalTasks(defaultTasks);
    }, [projects]);

    const router = useRouter();

    const moveTask = async (taskId, toCol) => {
        // Optimistic UI update
        setLocalTasks(prev => prev.map(t => t.id === taskId ? { ...t, column: toCol } : t));
        
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const { getApiBase } = require('@/utils/apiBase');
            await fetch(`${getApiBase()}/api/services/projects/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ column: toCol })
            });
        } catch (error) {
            console.error('Failed to move task:', error);
            // Revert on failure (optional, skipping for brevity)
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h3 className="font-bold text-gray-900">Kanban Board</h3>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-0.5">{localTasks.length} Active Tasks</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative hidden md:block">
                        <input
                            type="text"
                            placeholder="Find task..."
                            className="pl-3 pr-8 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <button
                        onClick={() => router.push('/services/projects/tasks/new')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all"
                    >
                        + New Task
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {COLUMNS.map(col => {
                    const colTasks = localTasks.filter(t => t.column === col);
                    const style = colStyle[col];
                    return (
                        <div key={col} className="flex flex-col min-h-[500px] bg-gray-50/50 p-3 rounded-2xl border border-gray-200/50">
                            {/* Column Header */}
                            <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border mb-4 shadow-sm ${style.header}`}>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2.5 h-2.5 rounded-full ${style.dot} shadow-sm animate-pulse`} />
                                    <span className="font-bold text-xs uppercase tracking-widest">{col}</span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border bg-white/50 ${style.count}`}>{colTasks.length}</span>
                            </div>

                            {/* Tasks Container */}
                            <div className="flex flex-col gap-4 flex-1">
                                {colTasks.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl opacity-40">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Empty</p>
                                    </div>
                                ) : colTasks.map(task => (
                                    <TaskCard key={task.id} task={task} onMove={moveTask} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
