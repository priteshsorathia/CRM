"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Search,
    Briefcase,
    ExternalLink,
    Filter,
    Plus,
    LayoutGrid,
    List,
    Clock,
    CheckCircle2
} from 'lucide-react';
import { initialClients } from '../../../data/clientDummyData';
import { initialProjects } from '../../../data/projectDummyData';

export default function ClientProjectsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [client, setClient] = useState(null);
    const [projects, setProjects] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [view, setView] = useState('list');

    useEffect(() => {
        const foundClient = initialClients.find(c => c.id === id);
        if (foundClient) {
            setClient(foundClient);
            const clientProjs = initialProjects.filter(p => p.client === foundClient.company);
            setProjects(clientProjs);
        }
    }, [id]);

    if (!client) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <span className="text-[10px] font-black uppercase tracking-widest">Back to Profile</span>
                    </button>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Project Portfolio</h1>
                    <p className="text-sm font-bold text-gray-500">
                        {client.company} • <span className="text-indigo-600">{projects.length} Total Projects</span>
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
                    <button
                        onClick={() => router.push(`/services/clients/${id}/projects/new`)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all font-bold"
                    >
                        <Plus size={18} />
                        Launch Project
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search projects by name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors">
                    <Filter size={16} />
                    Filters
                </button>
            </div>

            {/* Projects Display */}
            {view === 'list' ? (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left font-black text-gray-400 uppercase tracking-widest text-[10px]">Project Details</th>
                                <th className="px-6 py-4 text-left font-black text-gray-400 uppercase tracking-widest text-[10px]">Manager</th>
                                <th className="px-6 py-4 text-left font-black text-gray-400 uppercase tracking-widest text-[10px]">Timeline</th>
                                <th className="px-6 py-4 text-left font-black text-gray-400 uppercase tracking-widest text-[10px]">Status</th>
                                <th className="px-6 py-4 text-right font-black text-gray-400 uppercase tracking-widest text-[10px]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredProjects.length === 0 ? (
                                <tr><td colSpan={5} className="py-20 text-center text-gray-400 italic font-bold uppercase tracking-widest">No matching projects</td></tr>
                            ) : filteredProjects.map(proj => (
                                <tr key={proj.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                {proj.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-gray-900 leading-none mb-1">{proj.name}</p>
                                                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{proj.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="font-bold text-gray-700">{proj.manager}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-gray-500 font-bold">
                                            <Clock size={14} />
                                            {proj.start}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${proj.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                            {proj.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button
                                            onClick={() => router.push(`/services/projects/${proj.id}`)}
                                            className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                        >
                                            <ExternalLink size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map(proj => (
                        <div
                            key={proj.id}
                            onClick={() => router.push(`/services/projects/${proj.id}`)}
                            className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all cursor-pointer group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-[64px] transition-all group-hover:bg-indigo-600 -mr-12 -mt-12 group-hover:mr-0 group-hover:mt-0 opacity-20 group-hover:opacity-10" />
                            <div className="flex items-center justify-between mb-6">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${proj.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                    {proj.status}
                                </span>
                                <ExternalLink size={16} className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">{proj.name}</h3>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-6">{proj.id}</p>

                            <div className="space-y-4 pt-6 border-t border-gray-50 mt-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lead</span>
                                    <span className="text-xs font-black text-gray-700">{proj.manager}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Start Date</span>
                                    <span className="text-xs font-black text-gray-900">{proj.start}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
