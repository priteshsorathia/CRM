"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    ShieldCheck,
    FileText,
    Download,
    Eye,
    Upload,
    MoreVertical,
    FilePlus,
    Clock,
    CheckCircle2,
    AlertCircle,
    Search,
    Filter,
    Trash2,
    Pencil
} from 'lucide-react';
import { initialClients } from '../../../data/clientDummyData';

export default function ClientDocumentsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [client, setClient] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const foundClient = initialClients.find(c => c.id === id);
        if (foundClient) setClient(foundClient);
    }, [id]);

    if (!client) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    const documents = [
        { id: 'DOC-001', name: 'Master Service Agreement (MSA)', type: 'Legal', status: 'Signed', date: 'Jan 15, 2024', size: '2.4 MB' },
        { id: 'DOC-002', name: 'Non-Disclosure Agreement (NDA)', type: 'Legal', status: 'Signed', date: 'Jan 12, 2024', size: '1.1 MB' },
        { id: 'DOC-003', name: 'Project Scope Statement - Q1 Expansion', type: 'Scope', status: 'Draft', date: 'Mar 01, 2024', size: '850 KB' },
        { id: 'DOC-004', name: 'Brand Guidelines v2.1', type: 'Creative', status: 'Approved', date: 'Feb 20, 2024', size: '15.2 MB' },
    ];

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Signed':
            case 'Approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Draft': return 'bg-gray-50 text-gray-500 border-gray-100';
            case 'Review': return 'bg-amber-50 text-amber-600 border-amber-100';
            default: return 'bg-gray-50 text-gray-500 border-gray-100';
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
                    <span className="text-sm font-bold uppercase tracking-widest">Back to Profile</span>
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-xl shadow-indigo-100/10 border border-indigo-100">
                            <ShieldCheck size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Documentation Vault</h1>
                                <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-bold uppercase tracking-widest">
                                    Secure
                                </span>
                            </div>
                            <p className="text-gray-500 font-bold flex items-center gap-2">
                                <span className="text-indigo-600 uppercase tracking-widest text-[10px]">{client.company}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span className="text-sm tracking-wide">Legal & Contractual Repository</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push(`/services/clients/${client.id}/documents/new`)}
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                        >
                            <Upload size={18} /> Upload Document
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search documents..."
                            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2.5 rounded-xl border border-gray-100 text-gray-500 hover:bg-gray-50">
                            <Filter size={18} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase tracking-widest text-[10px]">Document Name</th>
                                <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase tracking-widest text-[10px]">Category</th>
                                <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase tracking-widest text-[10px]">Status</th>
                                <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase tracking-widest text-[10px]">Uploaded</th>
                                <th className="px-6 py-4 text-right font-bold text-gray-400 uppercase tracking-widest text-[10px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {documents.map((doc) => (
                                <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-indigo-600 transition-colors">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 line-clamp-1">{doc.name}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{doc.size} • {doc.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-xs font-bold text-gray-600">{doc.type}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(doc.status)}`}>
                                            {doc.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-900">{doc.date}</span>
                                            <span className="text-[10px] text-gray-400">by Admin</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => alert('Viewing document in browser...')}
                                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="View Document"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    alert('Downloading document...');
                                                    const a = document.createElement('a');
                                                    a.href = '#';
                                                    a.download = doc.name;
                                                    a.click();
                                                }}
                                                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Download"
                                            >
                                                <Download size={16} />
                                            </button>
                                            <button
                                                onClick={() => router.push(`/services/clients/${client.id}/documents/edit/${doc.id}`)}
                                                className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all" title="Edit Metadata"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => router.push(`/services/clients/${client.id}/documents/delete/${doc.id}`)}
                                                className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Purge Document"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Info Box */}
                <div className="p-6 bg-gray-50/50 flex items-start gap-4">
                    <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                        <ShieldCheck className="text-emerald-500" size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-1">Security Standards</h4>
                        <p className="text-xs text-gray-500 leading-relaxed max-w-2xl">
                            All documents stored in the vault are encrypted using AES-256 standards. Access is logged and restricted to authorized personnel only.
                            Master Service Agreements (MSA) and Non-Disclosure Agreements (NDA) are strictly proprietary.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
