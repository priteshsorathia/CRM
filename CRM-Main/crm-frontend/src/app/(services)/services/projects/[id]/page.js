"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Calendar,
    Users,
    Briefcase,
    IndianRupee,
    Clock,
    TrendingUp,
    Plus,
    X,
    Mail,
    Phone,
    MoreVertical,
    AlertCircle,
    CheckCircle2,
    History,
    FileText,
    ExternalLink,
    Download
} from 'lucide-react';
import { getApiBase } from '@/utils/apiBase';
import PermissionWrapper from '@/components/PermissionWrapper';

const statusStyles = {
    'Active': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Completed': 'bg-green-50 text-green-700 border-green-200',
    'On Hold': 'bg-amber-50 text-amber-700 border-amber-200',
    'Overdue': 'bg-red-50 text-red-700 border-red-200',
};

export default function ProjectDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [project, setProject] = useState(null);
    const [projectTeam, setProjectTeam] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [clients, setClients] = useState([]);
    const [showAddTeamModal, setShowAddTeamModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchProject();
        fetchEmployees();
        fetchClients();
    }, [id]);

    useEffect(() => {
        if (!project?.id) return;
        fetchProjectMembers(project.id);
    }, [project?.id]);

    const mapEmployee = (emp) => ({
        employeeDbId: emp?.id,
        id: emp?.emp_id || String(emp?.id || ''),
        name: emp?.full_name || emp?.name || '',
        designation: emp?.role || 'Staff',
        department: '',
        email: emp?.email || '',
        phone: emp?.phone || ''
    });

    const downloadFile = async (url, fileName) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            window.open(url, '_blank');
        }
    };

    const fetchProject = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await fetch(`${getApiBase()}/api/services/projects`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                let foundProject = data.projects.find(p => p.id.toString() === id.toString() || p.projectId === id);
                if (foundProject) {
                    // format dates specifically for display
                    foundProject.start = new Date(foundProject.start).toLocaleDateString();
                    foundProject.end = new Date(foundProject.end).toLocaleDateString();
                    setProject(foundProject);
                }
            }
        } catch (error) {
            console.error('Error fetching project details:', error);
        }
    };

    const fetchEmployees = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await fetch(`${getApiBase()}/api/hrms/staff`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json().catch(() => ({}));
            if (data.success && Array.isArray(data.data)) {
                setEmployees(data.data.map(mapEmployee).filter(e => e.name));
            } else {
                setEmployees([]);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
            setEmployees([]);
        }
    };

    const fetchClients = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await fetch(`${getApiBase()}/api/services/clients`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json().catch(() => ({}));
            if (data.success && Array.isArray(data.clients)) {
                setClients(data.clients);
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const fetchProjectMembers = async (projectId) => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await fetch(`${getApiBase()}/api/services/projects/${projectId}/members`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json().catch(() => ({}));
            if (data.success && Array.isArray(data.members)) {
                setProjectTeam(data.members.map(mapEmployee));
            } else {
                setProjectTeam([]);
            }
        } catch (e) {
            console.error('Error fetching project members:', e);
            setProjectTeam([]);
        }
    };

    if (!project) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    const filteredEmployees = employees.filter(emp =>
        !projectTeam.find(p => p.employeeDbId === emp.employeeDbId) &&
        (emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.department.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const addTeamMember = async (emp) => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            await fetch(`${getApiBase()}/api/services/projects/${project.id}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ employeeId: emp.employeeDbId })
            });
            await fetchProjectMembers(project.id);
        } catch (e) {
            console.error('Error adding member:', e);
        }
    };

    const removeTeamMember = async (empId) => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            await fetch(`${getApiBase()}/api/services/projects/${project.id}/members/${empId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            await fetchProjectMembers(project.id);
        } catch (e) {
            console.error('Error removing member:', e);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-0 pb-20">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col gap-4">
                <button
                    onClick={() => router.push('/services/projects')}
                    className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors w-fit group"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Back to Projects List</span>
                </button>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{project.name}</h1>
                            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${statusStyles[project.status]}`}>
                                {project.status}
                            </span>
                        </div>
                        <p className="text-gray-500 font-semibold flex items-center gap-2 text-sm italic">
                            <span className="text-indigo-600 uppercase tracking-widest text-[10px] font-bold">{project.id}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span>Client: {project.client}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <PermissionWrapper module="PROJECT" action="UPDATE">
                            <button
                                onClick={() => router.push(`/services/projects/edit/${project.id}`)}
                                className="px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm"
                            >
                                Edit Project
                            </button>
                        </PermissionWrapper>
                        <button
                            onClick={() => router.push(`/services/projects/${project.id}/tasks`)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                        >
                            Manage Tasks
                        </button>
                        <button
                            onClick={() => router.push(`/services/projects/${project.id}/activity`)}
                            className="p-2.5 border border-gray-200 bg-white text-gray-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all shadow-sm"
                            title="Activity Logs"
                        >
                            <History size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Project Duration', val: `${project.start} - ${project.end}`, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50', sub: 'Timeline' },
                    { label: 'Allocated Budget', val: `₹${(project.budget / 1000).toFixed(0)}k`, icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'Target' },
                    { label: 'Workforce Size', val: `${projectTeam.length} Members`, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50', sub: 'Assigned' },
                    { label: 'Completion Progress', val: '72%', icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50', sub: 'Milestones' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4 group hover:border-indigo-100 transition-all">
                        <div className="flex items-center justify-between">
                            <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} shadow-sm border border-white`}>
                                <stat.icon size={18} />
                            </div>
                            <span className="text-xs font-semibold text-gray-500">{stat.label}</span>
                        </div>
                        <div>
                            <p className="text-xl font-bold text-gray-900 mb-0.5">{stat.val}</p>
                            <p className="text-xs font-medium text-gray-400">{stat.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Project Info Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                <Briefcase size={18} className="text-indigo-600" />
                                Project Overview
                            </h3>
                            <PermissionWrapper module="PROJECT" action="UPDATE">
                                <button 
                                    onClick={() => router.push(`/services/projects/edit/${project.id}`)}
                                    className="text-xs font-semibold text-indigo-600 hover:underline"
                                >
                                    Edit Project
                                </button>
                            </PermissionWrapper>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 mb-3 block">Project Manager</h4>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                                        {project.manager.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 leading-tight">{project.manager}</p>
                                        <p className="text-xs text-gray-500 font-medium">Project Lead</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 mb-3 block">Billing Type</h4>
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                        <Clock size={16} className="text-indigo-500" />
                                        {clients.find(c => c.company === project.client)?.billing || 'Not Specified'}
                                    </p>
                                    <p className="text-xs text-gray-500 font-semibold mt-1">
                                        {clients.find(c => c.company === project.client)?.revenue ? `₹${clients.find(c => c.company === project.client).revenue.toLocaleString('en-IN')}` : ''}
                                    </p>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <h4 className="text-xs font-semibold text-gray-500 mb-2 block">Description</h4>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-sm text-gray-700 leading-relaxed font-medium">
                                        {project.description || (
                                            <>
                                                This strategic initiative focuses on <span className="text-indigo-600 font-bold">{project.name}</span> for <span className="text-gray-900 font-bold">{project.client}</span>. The objective is to deliver a high-impact solution
                                                within the specified technical parameters. Regular milestone reviews are scheduled every two weeks to ensure
                                                alignment with organizational objectives and security standards.
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Team Section */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Users size={18} className="text-indigo-600" />
                                <h3 className="text-sm font-bold text-gray-800">Team Members</h3>
                                <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-md">
                                    {projectTeam.length} Active
                                </span>
                            </div>
                            <PermissionWrapper module="PROJECT" action="UPDATE">
                                <button
                                    onClick={() => setShowAddTeamModal(true)}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                                >
                                    <Plus size={16} />
                                    Add Member
                                </button>
                            </PermissionWrapper>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {projectTeam.map((member) => (
                                        <tr key={member.employeeDbId || member.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                                                        {member.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{member.name}</p>
                                                        <p className="text-xs text-gray-500 font-medium">{member.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-gray-900 font-bold text-sm">{member.designation}</p>
                                                <p className="text-xs text-gray-500 font-medium">{member.department}</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {member.email && (
                                                        <a 
                                                            href={`mailto:${member.email}`}
                                                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                                            title={member.email}
                                                        >
                                                            <Mail size={16} />
                                                        </a>
                                                    )}
                                                    {member.phone && (
                                                        <a 
                                                            href={`tel:${member.phone}`}
                                                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                                            title={member.phone}
                                                        >
                                                            <Phone size={16} />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <PermissionWrapper module="PROJECT" action="UPDATE">
                                                    <button
                                                        onClick={() => removeTeamMember(member.employeeDbId)}
                                                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </PermissionWrapper>
                                            </td>
                                        </tr>
                                    ))}
                                    {projectTeam.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-10 text-center text-gray-500 font-medium">
                                                No team members added to this project yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar Stats / Info */}
                <div className="space-y-6">
                    {/* Progress Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
                        <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-4 flex items-center gap-2.5">
                            <TrendingUp size={16} className="text-indigo-600" /> Milestones Roadmap
                        </h3>
                        <div className="space-y-6 px-1">
                            {(!project.milestones || project.milestones.length === 0) ? (
                                <p className="text-xs text-center py-4 text-gray-400 font-medium italic">No milestones defined for this project.</p>
                            ) : (
                                project.milestones.map((m, i) => {
                                    // Map milestones to status based on index for demo/logic
                                    // In a real app, this would come from a 'status' field in the milestone object
                                    const total = project.milestones.length;
                                    const progress = i < Math.floor(total / 2) ? 'Completed' : (i === Math.floor(total / 2) ? 'In Progress' : 'To Do');
                                    
                                    const statusConfig = {
                                        'Completed': { color: 'text-emerald-500', icon: CheckCircle2, bg: 'bg-emerald-50' },
                                        'In Progress': { color: 'text-indigo-500', icon: Clock, bg: 'bg-indigo-50' },
                                        'To Do': { color: 'text-gray-500', icon: AlertCircle, bg: 'bg-gray-50' }
                                    };
                                    
                                    const cfg = statusConfig[progress];
                                    return (
                                        <div key={i} className="flex gap-4 relative group">
                                            <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${cfg.bg} ${cfg.color} shadow-sm border border-white`}>
                                                <cfg.icon size={14} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2">
                                                    <p className="text-sm font-bold text-gray-900 truncate">{m}</p>
                                                </div>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{progress}</p>
                                            </div>
                                            {i < project.milestones.length - 1 && <div className="absolute left-4 top-8 w-px h-6 bg-gray-100 group-hover:bg-indigo-200 transition-colors" />}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Recent Documents */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                        <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-4 flex items-center gap-2.5">
                            <Briefcase size={16} className="text-indigo-600" /> Documents
                        </h3>
                        <div className="space-y-2">
                            {Array.isArray(project.documentation) && project.documentation.length > 0 ? (
                                project.documentation.map((doc, i) => (
                                    <div 
                                        key={i}
                                        onClick={() => downloadFile(`${getApiBase()}${doc.url}`, doc.name)}
                                        className="flex items-center justify-between p-3 rounded-lg border border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50 transition-all group cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="flex-shrink-0 text-indigo-600">
                                                <FileText size={16} />
                                            </div>
                                            <span className="text-sm font-bold text-indigo-900 truncate" title={doc.name}>
                                                {doc.name || `Asset_${i + 1}`}
                                            </span>
                                        </div>
                                        <Download size={14} className="text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                                    </div>
                                ))
                            ) : (project.documentation && typeof project.documentation === 'string') ? (
                                <div 
                                    onClick={() => downloadFile(`${getApiBase()}${project.documentation}`, `Project_Brief_${project.id}`)}
                                    className="flex items-center justify-between p-3 rounded-lg border border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50 transition-all group cursor-pointer"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="flex-shrink-0 text-indigo-600">
                                            <FileText size={16} />
                                        </div>
                                        <span className="text-sm font-bold text-indigo-900 truncate">Project_Brief_{project.id}</span>
                                    </div>
                                    <Download size={14} className="text-indigo-400" />
                                </div>
                            ) : (
                                <p className="text-[10px] text-center py-4 text-gray-400 font-bold uppercase tracking-widest italic border border-dashed border-gray-100 rounded-xl">No documentation available</p>
                            )}
                        </div>
                        <button
                            onClick={() => router.push(`/services/projects/${project.id}/documents`)}
                            className="w-full mt-2 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                            View All Documents
                        </button>
                    </div>
                </div>
            </div>

            {/* Add Team Member Modal */}
            {showAddTeamModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                            <h3 className="text-base font-bold text-gray-900">Add Team Member</h3>
                            <button onClick={() => setShowAddTeamModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-4 relative group">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search by name or department..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                {filteredEmployees.length > 0 ? (
                                    filteredEmployees.map(emp => (
                                        <div
                                            key={emp.employeeDbId || emp.id}
                                            onClick={() => addTeamMember(emp)}
                                            className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-sm">
                                                    {emp.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{emp.name}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{emp.designation}</p>
                                                </div>
                                            </div>
                                            <div className="w-7 h-7 rounded bg-white border border-gray-200 group-hover:bg-indigo-600 group-hover:border-indigo-600 group-hover:text-white text-gray-400 flex items-center justify-center transition-all shadow-sm">
                                                <Plus size={16} />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center text-gray-500 text-sm font-medium">
                                        {searchTerm ? "No personnel found matching search." : "All personnel added."}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setShowAddTeamModal(false)}
                                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Simple Search Icon for the modal
function Search({ size, className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
    );
}
