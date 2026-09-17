"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    FileText,
    Download,
    Eye,
    Upload,
    MoreVertical,
    Search,
    Filter,
    Briefcase,
    ShieldCheck,
    Clock,
    Plus,
    Trash2,
    Loader2
} from 'lucide-react';
import { getApiBase } from '@/utils/apiBase';
import { toast } from 'sonner';
import { isSvgFile } from '@/utils/fileValidation';
export default function ProjectDocumentsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [project, setProject] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                const { getApiBase } = require('@/utils/apiBase');
                const res = await fetch(`${getApiBase()}/api/services/projects`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    const foundProject = data.projects.find(p => p.id.toString() === id.toString() || p.projectId === id);
                    if (foundProject) setProject(foundProject);
                }
            } catch (error) {
                console.error("Error fetching project:", error);
            }
        };
        fetchProject();
    }, [id]);

    if (!project) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );



    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const handleDeleteDoc = async (docIndex) => {
        if (!window.confirm("Are you sure you want to delete this document?")) return;

        try {
            const updatedDocs = [...project.documentation];
            updatedDocs.splice(docIndex, 1);

            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await fetch(`${getApiBase()}/api/services/projects/${project.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ documentation: updatedDocs })
            });

            const data = await res.json();
            if (data.success) {
                setProject({ ...project, documentation: updatedDocs });
                toast.success("Document deleted successfully");
            } else {
                toast.error(data.message || "Failed to delete document");
            }
        } catch (error) {
            console.error("Error deleting document:", error);
            toast.error("An error occurred while deleting the document");
        }
    };

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
        const newDocs = [...(project.documentation || [])];

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
                        type: file.type || 'Document',
                        size: file.size,
                        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                        owner: 'Current User'
                    });
                }
            } catch (error) {
                console.error('Error uploading file:', error);
                toast.error(`Failed to upload ${file.name}`);
            }
        }

        // Update Project in DB
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        const updateRes = await fetch(`${getApiBase()}/api/services/projects/${project.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ documentation: newDocs })
        });
        const updateData = await updateRes.json();
        
        if (updateData.success) {
            setProject({ ...project, documentation: newDocs });
            toast.success("Assets uploaded and saved successfully");
        }

        setIsUploading(false);
    };

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

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved':
            case 'Final': return 'bg-green-50 text-green-700 border-green-200';
            case 'In Review': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'Draft': return 'bg-gray-100 text-gray-500 border-gray-200';
            default: return 'bg-blue-50 text-blue-700 border-blue-200';
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors w-fit group"
                >
                    <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-widest">Back to Project</span>
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                            <Briefcase size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Project Assets</h1>
                                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-200">
                                    Project Scope
                                </span>
                            </div>
                            <p className="text-gray-500 font-bold flex items-center gap-2">
                                <span className="text-indigo-600 uppercase tracking-widest text-[10px]">{project.id}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span className="text-sm tracking-wide">{project.name} • {project.client}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="file"
                            id="bulk-upload"
                            className="hidden"
                            multiple
                            onChange={handleFileUpload}
                        />
                        <label 
                            htmlFor="bulk-upload"
                            className={`px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                            {isUploading ? 'Uploading...' : 'Upload New Asset'}
                        </label>
                    </div>
                </div>
            </div>

            {/* Documents Table Container */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search project assets..."
                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50/80">
                            <tr>
                                <th className="px-6 py-4 text-left font-black text-gray-400 uppercase tracking-widest text-[10px]">Asset Name</th>
                                <th className="px-6 py-4 text-left font-black text-gray-400 uppercase tracking-widest text-[10px]">Category</th>
                                <th className="px-6 py-4 text-right font-black text-gray-400 uppercase tracking-widest text-[10px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {(Array.isArray(project.documentation) ? project.documentation : []).filter(doc => (doc.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map((doc, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all">
                                                <FileText size={24} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{doc.name}</p>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                                                    <span>{typeof doc.size === 'number' ? formatSize(doc.size) : (doc.size || 'N/A')}</span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                    <span>{doc.date ? `Uploaded ${doc.date}` : 'Recently Added'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                            {doc.type || 'General'}
                                        </span>
                                    </td>

                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => downloadFile(`${getApiBase()}${doc.url}`, doc.name)}
                                                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" 
                                                title="Download"
                                            >
                                                <Download size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteDoc(idx)}
                                                className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" 
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(!project.documentation || project.documentation.length === 0) && (
                                <tr key="empty">
                                    <td colSpan={3} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-40">
                                            <FileText size={48} className="text-gray-400" />
                                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No Assets Found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
