"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    CheckCircle2,
    Calendar,
    ArrowUpRight,
    MessageSquare,
    FileText,
    History,
    Settings,
    PlusCircle,
    Trash2,
    UserPlus,
    UserMinus,
    Edit3
} from 'lucide-react';
import { logsApi } from '@/lib/api';
import { getApiBase } from '@/utils/apiBase';

const getIcon = (action) => {
    const act = String(action || '').toUpperCase();
    if (act.includes('CREATE')) return { icon: PlusCircle, bg: 'bg-indigo-50 text-indigo-600' };
    if (act.includes('UPDATE')) return { icon: Edit3, bg: 'bg-blue-50 text-blue-600' };
    if (act.includes('DELETE')) return { icon: Trash2, bg: 'bg-rose-50 text-rose-600' };
    if (act.includes('MEMBER_ADD')) return { icon: UserPlus, bg: 'bg-emerald-50 text-emerald-600' };
    if (act.includes('MEMBER_REMOVE')) return { icon: UserMinus, bg: 'bg-amber-50 text-amber-600' };
    if (act.includes('TIMESHEET')) return { icon: Calendar, bg: 'bg-violet-50 text-violet-600' };
    if (act.includes('TASK')) return { icon: ArrowUpRight, bg: 'bg-sky-50 text-sky-600' };
    return { icon: History, bg: 'bg-gray-50 text-gray-500' };
};

const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMs = now - date;
    const diffInSec = Math.floor(diffInMs / 1000);
    const diffInMin = Math.floor(diffInSec / 60);
    const diffInHrs = Math.floor(diffInMin / 60);
    const diffInDays = Math.floor(diffInHrs / 24);

    if (diffInSec < 60) return 'Just now';
    if (diffInMin < 60) return `${diffInMin}m ago`;
    if (diffInHrs < 24) return `${diffInHrs}h ago`;
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function ProjectActivityPage() {
    const { id } = useParams();
    const router = useRouter();
    const [project, setProject] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                
                // 1. Fetch Project Details to get the name
                const projRes = await fetch(`${getApiBase()}/api/services/projects`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const projData = await projRes.json();
                
                if (projData.success) {
                    const found = projData.projects.find(p => p.id.toString() === id.toString() || p.projectId === id);
                    if (found) {
                        setProject(found);
                        
                        // 2. Fetch Activity Logs using project name as search term
                        // We use module='Services' or 'TASK' potentially, but search by name is most comprehensive
                        const logsRes = await logsApi.getLogs({ 
                            search: found.name,
                            limit: 50 
                        });
                        
                        if (logsRes.success) {
                            setActivities(logsRes.data || []);
                        }
                    } else {
                        setError("Project not found");
                    }
                } else {
                    setError("Failed to fetch project details");
                }
            } catch (err) {
                console.error("Error fetching activity logs:", err);
                setError("An error occurred while loading activity data");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (error || !project) return (
        <div className="max-w-4xl mx-auto mt-10 p-8 text-center bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-500 font-bold">{error || "Project data unavailable"}</p>
            <button onClick={() => router.back()} className="mt-4 text-indigo-600 font-bold hover:underline">Go Back</button>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 mt-4 px-4 sm:px-0">
            {/* Header */}
            <div className="flex flex-col md:items-start justify-between gap-2">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors group mb-2"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-wider">Back to Project</span>
                </button>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Project Activity logs</h1>
                <p className="text-sm font-semibold text-gray-400">
                    Historical timeline for <span className="text-indigo-600 font-black uppercase tracking-widest text-[10px] ml-1">{project.name}</span>
                </p>
            </div>

            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-8 sm:p-12">
                    {activities.length > 0 ? (
                        <div className="relative space-y-10 before:absolute before:inset-0 before:ml-5 before:h-full before:w-px before:bg-gray-100 pb-4">
                            {activities.map((item) => {
                                const { icon: Icon, bg } = getIcon(item.action);
                                return (
                                    <div key={item.id} className="relative flex items-start gap-8 group">
                                        <div className={`relative z-10 w-10 h-10 rounded-xl ${bg} flex items-center justify-center shadow-sm border border-white/50 shrink-0 group-hover:scale-110 transition-transform duration-500`}>
                                            <Icon size={18} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex-1 space-y-2 translate-y-1">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                                <p className="text-[15px] font-bold text-gray-800 leading-tight">
                                                    {item.description}
                                                </p>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                                                    {formatTimeAgo(item.createdAt)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-indigo-600 uppercase">
                                                    {(item.user?.name || item.user?.username || '?').charAt(0)}
                                                </div>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
                                                    Performed by <span className="text-gray-600">{item.user?.name || item.user?.username || 'Unknown User'}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl mx-auto flex items-center justify-center text-gray-300">
                                <History size={32} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-lg font-bold text-gray-900">No activity found</p>
                                <p className="text-sm text-gray-500 font-medium">There are no logs recorded for this project yet.</p>
                            </div>
                        </div>
                    )}
                </div>

                {activities.length >= 50 && (
                    <div className="p-6 bg-slate-50 border-t border-gray-100 text-center">
                        <button className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-all flex items-center gap-2 mx-auto">
                            <Clock size={14} />
                            Show Full History
                        </button>
                    </div>
                )}
            </div>
            
            <div className="flex items-center justify-center gap-2 pt-4 opacity-30">
                <Settings size={12} className="text-gray-400" />
                <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em]">
                    Real-time Audit Trail Connected
                </span>
            </div>
        </div>
    );
}
