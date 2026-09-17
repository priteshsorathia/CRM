"use client";
import React, { useState, useEffect } from 'react';
import { useRole } from "@/app/(services)/context/RoleContext";
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Search,
    Filter,
    Plus,
    LayoutGrid,
    List,
    MoreHorizontal,
    Clock,
    CheckCircle2,
    PlayCircle,
    AlertCircle,
    Eye,
    Edit2,
    Trash2,
} from 'lucide-react';
import { getApiBase } from '@/utils/apiBase';
import { toast } from 'sonner';


export default function ProjectTasksPage() {
    const { id } = useParams();
    const router = useRouter();
    const { can } = useRole();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [view, setView] = useState('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchProjectData();
    }, [id]);

    const fetchProjectData = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await fetch(`${getApiBase()}/api/services/projects`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                const foundProject = data.projects.find(p => p.id.toString() === id.toString() || p.projectId === id);
                if (foundProject) {
                    setProject(foundProject);
                    
                    // Format tasks for display
                    const formattedTasks = (foundProject.tasks || []).map(t => ({
                        ...t,
                        deadline: t.deadline ? new Date(t.deadline).toLocaleDateString() : 'No date',
                        assignee: t.assignee || 'Unassigned',
                        title: t.title || 'Untitled Task',
                    }));
                    setTasks(formattedTasks);
                }
            }
        } catch (error) {
            console.error('Error fetching project tasks:', error);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await fetch(`${getApiBase()}/api/services/projects/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Task deleted successfully');
                fetchProjectData();
            } else {
                toast.error(data.message || 'Failed to delete task');
            }
        } catch (error) {
            console.error('Error deleting task:', error);
            toast.error('Failed to connect to server');
        }
    };

    if (!project) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    const filteredTasks = tasks.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.assignee.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || t.column === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Completed': return 'bg-green-50 text-green-700 border-green-100';
            case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'On Hold': return 'bg-amber-50 text-amber-700 border-amber-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors group mb-2"
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-bold uppercase tracking-wider">Back to Project</span>
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Tasks</h1>
                    <p className="text-sm font-medium text-gray-500">
                        {project.name} • <span className="text-indigo-600">{tasks.length} Total Tasks</span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => setView('list')}
                            className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <List size={18} />
                        </button>
                        <button
                            onClick={() => setView('grid')}
                            className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>
                    {can('TASK', 'CREATE') && (
                        <button
                            onClick={() => router.push('/services/projects/tasks/new')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                        >
                            <Plus size={18} />
                            New Task
                        </button>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search tasks, assignees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="relative">
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${statusFilter !== 'All' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Filter size={16} />
                        {statusFilter === 'All' ? 'Filters' : statusFilter}
                    </button>

                    {showFilters && (
                        <>
                            <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setShowFilters(false)}
                            />
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-20">
                                <div className="px-4 py-2 border-b border-gray-50">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filter by Status</p>
                                </div>
                                {['All', 'Pending', 'In Progress', 'Completed', 'On Hold'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => {
                                            setStatusFilter(status);
                                            setShowFilters(false);
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors hover:bg-gray-50 ${statusFilter === status ? 'text-indigo-600' : 'text-gray-600'}`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Task List/Grid */}
            {view === 'list' ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-widest text-[10px]">Task Name</th>
                                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-widest text-[10px]">Assignee</th>
                                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-widest text-[10px]">Deadline</th>
                                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-widest text-[10px]">Status</th>
                                <th className="px-6 py-4 text-right font-bold text-gray-500 uppercase tracking-widest text-[10px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <p className="text-gray-400 font-medium">No tasks found in this project.</p>
                                    </td>
                                </tr>
                            ) : filteredTasks.map(task => (
                                <tr key={task.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            {can('TASK', 'READ') ? (
                                                <span onClick={() => router.push(`/services/projects/tasks/${task.id}`)} className="font-bold text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors uppercase">{task.title}</span>
                                            ) : (
                                                <span className="font-bold text-gray-900 uppercase">{task.title}</span>
                                            )}
                                            <span className="text-xs text-gray-400 font-medium">{task.id}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-bold">
                                                {task.assignee.charAt(0)}
                                            </div>
                                            <span className="font-semibold text-gray-700">{task.assignee}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 font-medium">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-gray-400" />
                                            {task.deadline}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(task.column)}`}>
                                            {task.column}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {can('TASK', 'READ') && (
                                                <button
                                                    onClick={() => router.push(`/services/projects/tasks/${task.id}`)}
                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                    title="View Task"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            )}
                                            {can('TASK', 'UPDATE') && (
                                                <button
                                                    onClick={() => router.push(`/services/projects/tasks/edit/${task.id}`)}
                                                    className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                                    title="Edit Task"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            )}
                                            {can('TASK', 'DELETE') && (
                                                <button
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                    title="Delete Task"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTasks.map(task => (
                        <div
                            key={task.id}
                            onClick={() => router.push(`/services/projects/tasks/${task.id}`)}
                            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(task.column)}`}>
                                    {task.column}
                                </span>
                                <div className="flex items-center gap-1">
                                    {can('TASK', 'UPDATE') && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); router.push(`/services/projects/tasks/edit/${task.id}`); }}
                                            className="p-1.5 text-gray-300 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                    )}
                                    {can('TASK', 'DELETE') && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                                            className="p-1.5 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <h3 onClick={() => can('TASK', 'READ') && router.push(`/services/projects/tasks/${task.id}`)} className={`font-bold text-gray-900 mb-2 transition-colors uppercase ${can('TASK', 'READ') ? 'group-hover:text-indigo-600' : ''}`}>{task.title}</h3>
                            <div className="space-y-3 pt-4 border-t border-gray-50">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-400 font-bold uppercase tracking-widest">Assignee</span>
                                    <span className="text-gray-700 font-bold">{task.assignee}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-400 font-bold uppercase tracking-widest">Due Date</span>
                                    <span className="text-rose-500 font-bold">{task.deadline}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
