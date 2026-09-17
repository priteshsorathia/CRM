"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Search,
    Download,
    Filter,
    FileText,
    TrendingUp,
    TrendingDown,
    Clock,
    CheckCircle2,
    Plus,
    CreditCard,
    ArrowUpRight,
    ArrowDownLeft,
    Trash2
} from 'lucide-react';
import { initialClients } from '../../../data/clientDummyData';

const mockInvoices = [
    { id: 'INV-9001', date: 'Mar 01, 2024', due: 'Mar 15, 2024', amount: 85000, status: 'Paid', method: 'Bank Transfer' },
    { id: 'INV-9002', date: 'Feb 01, 2024', due: 'Feb 15, 2024', amount: 42000, status: 'Paid', method: 'Razorpay' },
    { id: 'INV-9003', date: 'Jan 01, 2024', due: 'Jan 15, 2024', amount: 125000, status: 'Overdue', method: 'Wire' },
    { id: 'INV-9004', date: 'Dec 01, 2023', due: 'Dec 15, 2023', amount: 65000, status: 'Paid', method: 'Bank Transfer' },
    { id: 'INV-9005', date: 'Nov 01, 2023', due: 'Nov 15, 2023', amount: 98000, status: 'Paid', method: 'UPI' },
];

export default function ClientInvoicesPage() {
    const { id } = useParams();
    const router = useRouter();
    const [client, setClient] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const foundClient = initialClients.find(c => c.id === id);
        if (foundClient) setClient(foundClient);
    }, [id]);

    if (!client) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    const totalPaid = mockInvoices.filter(i => i.status === 'Paid').reduce((acc, i) => acc + i.amount, 0);
    const totalPending = mockInvoices.filter(i => i.status !== 'Paid').reduce((acc, i) => acc + i.amount, 0);

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
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Billing & Invoices</h1>
                    <p className="text-sm font-bold text-gray-500">
                        Financial ledger for <span className="text-indigo-600">{client.company}</span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            alert('Exporting Invoice Ledger to CSV...');
                            const csvContent = "Invoice,Date,Due,Amount,Status\n" + mockInvoices.map(i => `${i.id},${i.date},${i.due},${i.amount},${i.status}`).join("\n");
                            const blob = new Blob([csvContent], { type: 'text/csv' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `Invoices_${client.company}.csv`;
                            a.click();
                        }}
                        className="px-4 py-2 text-xs font-black text-gray-500 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                    >
                        Export CSV
                    </button>
                    <button
                        onClick={() => router.push(`/services/clients/${client.id}/invoices/new`)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all font-bold"
                    >
                        <Plus size={18} />
                        Generate Invoice
                    </button>
                </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[80px] -mr-16 -mt-16 opacity-40" />
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <ArrowDownLeft size={20} />
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total Collected</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900">₹{(totalPaid / 100000).toFixed(2)}L</p>
                    <p className="text-xs font-bold text-gray-400 mt-1">Across {mockInvoices.length} transactions</p>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-[80px] -mr-16 -mt-16 opacity-40" />
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                            <Clock size={20} />
                        </div>
                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Pending Amount</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900">₹{(totalPending / 1000).toFixed(1)}K</p>
                    <p className="text-xs font-bold text-rose-500 mt-1">1 Overdue Invoice</p>
                </div>

                <div className="bg-indigo-900 p-6 rounded-[32px] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-[80px] -mr-16 -mt-16" />
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white/10 rounded-2xl text-white">
                            <CreditCard size={20} />
                        </div>
                        <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Billing Cycle</span>
                    </div>
                    <p className="text-3xl font-black">{client.billing}</p>
                    <p className="text-xs font-bold text-indigo-300 mt-1">Next: Apr 01, 2024</p>
                </div>
            </div>

            {/* Invoices List */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden mt-8">
                <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by Invoice ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors">
                        <Filter size={18} /> Filter by Year
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left font-black text-gray-400 uppercase tracking-widest text-[10px]">Invoice</th>
                                <th className="px-6 py-4 text-left font-black text-gray-400 uppercase tracking-widest text-[10px]">Date / Due</th>
                                <th className="px-6 py-4 text-left font-black text-gray-400 uppercase tracking-widest text-[10px]">Amount</th>
                                <th className="px-6 py-4 text-left font-black text-gray-400 uppercase tracking-widest text-[10px]">Method</th>
                                <th className="px-6 py-4 text-left font-black text-gray-400 uppercase tracking-widest text-[10px]">Status</th>
                                <th className="px-6 py-4 text-right font-black text-gray-400 uppercase tracking-widest text-[10px]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {mockInvoices.filter(i => i.id.toLowerCase().includes(searchTerm.toLowerCase())).map(inv => (
                                <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-indigo-600 transition-all border border-gray-100">
                                                <FileText size={18} />
                                            </div>
                                            <span className="font-black text-gray-900">{inv.id}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="space-y-0.5">
                                            <p className="font-bold text-gray-700">{inv.date}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Due: {inv.due}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="font-black text-gray-900">₹{inv.amount.toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{inv.method}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => { alert('Downloading PDF Invoice...'); }}
                                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                title="Download PDF"
                                            >
                                                <Download size={16} />
                                            </button>
                                            <button
                                                onClick={() => router.push(`/services/clients/${client.id}/invoices/edit/${inv.id}`)}
                                                className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                                title="Edit Record"
                                            >
                                                <Plus size={16} className="rotate-45" /> {/* Using Plus rotated as a pencil-ish icon or just Plus for Edit if Pencil is better but I'll use it if imported */}
                                            </button>
                                            <button
                                                onClick={() => router.push(`/services/clients/${client.id}/invoices/delete/${inv.id}`)}
                                                className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                title="Void Invoice"
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
            </div>
        </div>
    );
}
