"use client";
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useParams, useRouter } from 'next/navigation';
import { getApiBase } from '@/utils/apiBase';
import {
    ChevronLeft,
    Building2,
    User,
    Mail,
    Phone,
    ShieldCheck,
    CreditCard,
    Calendar,
    Briefcase,
    TrendingUp,
    Timer,
    Plus,
    Download,
    FileText,
    ExternalLink,
    Trash2
} from 'lucide-react';
import PermissionWrapper from '@/components/PermissionWrapper';

export default function ClientDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [client, setClient] = useState(null);
    const [clientProjects, setClientProjects] = useState([]);
    const [clientInvoices, setClientInvoices] = useState([]);
    const [invoicePage, setInvoicePage] = useState(1);
    const [isSharing, setIsSharing] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                const headers = { 'Authorization': `Bearer ${token}` };

                // Fetch clients to find this specific one
                const clientsRes = await fetch(`${getApiBase()}/api/services/clients`, { headers });
                const clientsData = await clientsRes.json();
                let foundClient = null;
                if (clientsData.success && clientsData.clients) {
                    foundClient = clientsData.clients.find(c => c.id.toString() === id.toString() || c.clientId === id);
                    if (foundClient) {
                        // Format dates correctly for display
                        foundClient.contractStart = foundClient.contractStart ? new Date(foundClient.contractStart).toLocaleDateString() : 'N/A';
                        foundClient.contractEnd = foundClient.contractEnd ? new Date(foundClient.contractEnd).toLocaleDateString() : 'N/A';
                        setClient(foundClient);
                    }
                }

                // If we found the client, fetch projects and filter
                if (foundClient) {
                    const [projRes, billRes] = await Promise.all([
                        fetch(`${getApiBase()}/api/services/projects`, { headers }),
                        fetch(`${getApiBase()}/api/services/invoices`, { headers })
                    ]);

                    const projData = await projRes.json();
                    if (projData.success && projData.projects) {
                        const activeProj = projData.projects.filter(p => p.client === foundClient.company);
                        setClientProjects(activeProj);
                    }

                    const billData = await billRes.json();
                    if (billData.success && billData.invoices) {
                        const recents = billData.invoices.filter(inv => 
                            inv.clientId?.toString() === foundClient.id?.toString()
                        );
                        setClientInvoices(recents);
                    }
                }
            } catch (error) {
                console.error("Error fetching client details:", error);
            }
        };
        fetchDetails();
    }, [id]);

    const handleShareProfile = async () => {
        if (!client) return;
        try {
            setIsSharing(true);
            const doc = new jsPDF();
            
            // Add header
            doc.setFontSize(22);
            doc.setTextColor(79, 70, 229);
            doc.text("CLIENT PROFILE", 105, 20, { align: 'center' });
            
            doc.setDrawColor(226, 232, 240);
            doc.line(20, 25, 190, 25);
            
            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 190, 32, { align: 'right' });

            autoTable(doc, {
                startY: 40,
                head: [['Field', 'Details']],
                body: [
                    ['Client ID', client.clientId || client.id],
                    ['Company Name', client.company],
                    ['Contact Person', client.contact],
                    ['Email Address', client.email],
                    ['Phone Number', client.phone],
                    ['GST Number', client.gst || 'N/A'],
                    ['Billing Cycle', client.billing],
                    ['Status', client.status],
                    ['Contract Period', `${client.contractStart} to ${client.contractEnd}`],
                    ['Annual Revenue', `₹${client.revenue || 0}`]
                ],
                theme: 'grid',
                headStyles: { fillColor: [79, 70, 229] },
                styles: { fontSize: 10, cellPadding: 5 }
            });

            if (client.notes) {
                const finalY = doc.lastAutoTable.finalY + 15;
                doc.setFontSize(14);
                doc.setTextColor(30, 41, 59);
                doc.text("Relationship Notes", 14, finalY);
                doc.setFontSize(10);
                doc.setTextColor(71, 85, 105);
                const splitNotes = doc.splitTextToSize(client.notes, 182);
                doc.text(splitNotes, 14, finalY + 8);
            }

            const pdfBlob = doc.output('blob');
            const formData = new FormData();
            formData.append('pdf', pdfBlob, `${client.company}_Profile.pdf`);
            formData.append('email', client.email);

            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const apiBase = getApiBase();
            
            const response = await fetch(`${apiBase}/api/services/clients/${id}/share`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const result = await response.json();
            if (result.success) {
                toast.success("Profile shared successfully via email!");
            } else {
                throw new Error(result.message || "Failed to send email");
            }
        } catch (error) {
            console.error("Error sharing profile:", error);
            toast.error(error.message || "Error sending email. Please check SMTP settings.");
        } finally {
            setIsSharing(false);
        }
    };

    if (!client) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Active': return 'bg-green-50 text-green-700 border-green-200';
            case 'Expiring': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'Inactive': return 'bg-gray-100 text-gray-400 border-gray-200';
            default: return 'bg-gray-50 text-gray-500 border-gray-100';
        }
    };

    const timerIcons = {
        'Monthly': Timer,
        'Quarterly': Calendar,
        'Yearly': Briefcase
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4 sm:px-0">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col gap-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors w-fit group"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Clients</span>
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{client.company}</h1>
                                <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${getStatusStyle(client.status)}`}>
                                    {client.status}
                                </span>
                            </div>
                            <p className="text-gray-500 font-medium flex items-center gap-2 text-sm">
                                <span className="text-indigo-600">{client.id}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span>Client Profile</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <PermissionWrapper module="CLIENTS" action="UPDATE">
                            <button
                                onClick={() => router.push(`/services/clients/edit/${client.id}`)}
                                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm"
                            >
                                Edit Client
                            </button>
                        </PermissionWrapper>
                        <PermissionWrapper module="PROJECT" action="CREATE">
                            <button
                                onClick={() => router.push(`/services/clients/${client.id}/projects/new`)}
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2"
                            >
                                <Plus size={18} /> New Project
                            </button>
                        </PermissionWrapper>
                    </div>
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-xs font-semibold text-gray-500 ml-2 mr-2">Quick Actions</span>
                <button
                    onClick={() => {
                        const blob = new Blob(['Company,ID,Contact,Email\n' + client.company + ',' + client.id + ',' + client.contact + ',' + client.email], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.setAttribute('hidden', '');
                        a.setAttribute('href', url);
                        a.setAttribute('download', `${client.company}_data.csv`);
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-xl text-xs font-medium hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100"
                >
                    <Download size={16} /> Export CSV
                </button>
                <button
                    onClick={handleShareProfile}
                    disabled={isSharing}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${isSharing ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-gray-50 text-gray-700 border-transparent hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100'}`}
                >
                    <Mail size={16} className={isSharing ? "animate-pulse" : ""} />
                    {isSharing ? "Sending..." : "Share Profile"}
                </button>
                <PermissionWrapper module="CLIENTS" action="DELETE">
                    <button
                        onClick={() => router.push(`/services/clients/${client.id}/delete`)}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-rose-600 rounded-xl text-xs font-medium hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
                    >
                        <Trash2 size={16} /> Delete Client
                    </button>
                </PermissionWrapper>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Revenue', value: `₹${(client.revenue / 100000).toFixed(1)}L`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Active Projects', value: clientProjects.length, icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Billing Period', value: client.billing, icon: timerIcons[client.billing] || Timer, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Reliability', value: '98%', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} shadow-sm border border-white`}>
                            <stat.icon size={18} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-500 mb-0.5">{stat.label}</p>
                            <p className="text-xl font-bold text-gray-900 truncate">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Active Projects Table */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                <Briefcase className="text-indigo-600" size={18} />
                                Active Projects
                            </h3>
                            <button
                                onClick={() => router.push(`/services/clients/${client.id}/projects`)}
                                className="text-indigo-600 text-xs font-semibold hover:underline"
                            >
                                View All
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider text-xs">Project Name</th>
                                        <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider text-xs">Manager</th>
                                        <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                                        <th className="px-6 py-3 text-right font-semibold text-gray-500 uppercase tracking-wider text-xs">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {clientProjects.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-10 text-center text-gray-500 font-medium">No projects recorded for this client.</td>
                                        </tr>
                                    ) : clientProjects.map(proj => (
                                        <tr key={proj.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-gray-900">{proj.name}</p>
                                                <p className="text-xs font-medium text-gray-500 mt-0.5">{proj.id}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-700">
                                                        {proj.manager.charAt(0)}
                                                    </div>
                                                    <span className="font-semibold text-gray-700 text-sm">{proj.manager}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${proj.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                    {proj.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => router.push(`/services/projects/${proj.id}`)}
                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                >
                                                    <ExternalLink size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Contact Details & Financial Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2.5 border-b border-gray-100 pb-4">
                                <User size={16} className="text-indigo-600" /> Primary Contact
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-lg">
                                        {client.contact.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-gray-900 leading-tight">{client.contact}</p>
                                        <p className="text-xs font-semibold text-gray-500 mt-0.5">Key Contact</p>
                                    </div>
                                </div>
                                <div className="space-y-2.5 pt-2">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group cursor-pointer hover:bg-gray-100 transition-colors">
                                        <Mail size={16} className="text-gray-400 group-hover:text-indigo-600" />
                                        <span className="text-sm font-medium text-gray-700">{client.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group cursor-pointer hover:bg-gray-100 transition-colors">
                                        <Phone size={16} className="text-gray-400 group-hover:text-indigo-600" />
                                        <span className="text-sm font-medium text-gray-700">{client.phone}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2.5 border-b border-gray-100 pb-4">
                                <CreditCard size={16} className="text-emerald-600" /> Billing Details
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3.5 bg-emerald-50 rounded-lg border border-emerald-100">
                                    <div>
                                        <p className="text-xs font-semibold text-emerald-700">GST Number</p>
                                        <p className="text-sm font-mono font-bold text-gray-900 mt-0.5">{client.gst}</p>
                                    </div>
                                    <div className="p-2 bg-white text-emerald-600 rounded-md shadow-sm border border-emerald-100"><ShieldCheck size={18} /></div>
                                </div>
                                <div className="space-y-3 px-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-semibold text-gray-500">Billing Cycle</span>
                                        <span className="text-sm font-bold text-gray-900">{client.billing}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-semibold text-gray-500">Base Rate</span>
                                        <span className="text-sm font-bold text-gray-900">Standard</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Relationship Notes Section */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2.5 border-b border-gray-100 pb-4">
                            <FileText size={16} className="text-indigo-600" /> Relationship Notes
                        </h3>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {client.notes || "No additional notes recorded for this client relationship."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">

                    {/* Contract Timeline */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
                        <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-4 flex items-center gap-2.5">
                            <Calendar size={16} className="text-indigo-600" /> Contract Period
                        </h3>
                        <div className="space-y-6 px-1">
                            <div className="relative">
                                <div className="absolute left-2.5 top-2 bottom-2 w-px bg-gray-200" />
                                <div className="space-y-6">
                                    <div className="relative flex gap-4 items-start pl-8">
                                        <div className="absolute left-0 w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center top-0 border border-emerald-200">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 mb-0.5">Start Date</p>
                                            <p className="text-sm font-bold text-gray-900">{client.contractStart}</p>
                                        </div>
                                    </div>
                                    <div className="relative flex gap-4 items-start pl-8">
                                        <div className="absolute left-0 w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center top-0 border border-indigo-200">
                                            <div className="w-2 h-2 rounded-full bg-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 mb-0.5">End Date</p>
                                            <p className="text-sm font-bold text-gray-900">{client.contractEnd}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Recent Invoices Card */}
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-gray-900 tracking-tight">Recent Invoices</h3>
                        </div>
                        <div className="space-y-2.5">
                            {clientInvoices.length > 0 ? (
                                <>
                                    {clientInvoices.slice((invoicePage - 1) * 5, invoicePage * 5).map((inv, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors group cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                                                    <FileText size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-900">{inv.invoiceId}</p>
                                                    <p className="text-xs text-gray-500 font-medium">{new Date(inv.issuedDate).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-gray-900">₹{inv.amount.toLocaleString()}</p>
                                                <p className={`text-[10px] font-bold uppercase tracking-wider ${inv.status === 'Paid' ? 'text-emerald-600' : inv.status === 'Overdue' ? 'text-rose-600' : 'text-amber-600'}`}>
                                                    {inv.status}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {clientInvoices.length > 5 && (
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                                            <button
                                                disabled={invoicePage === 1}
                                                onClick={() => setInvoicePage(p => p - 1)}
                                                className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-indigo-600 disabled:opacity-30 disabled:pointer-events-none transition-colors border border-gray-100 rounded-lg"
                                            >
                                                Previous
                                            </button>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                Page {invoicePage} of {Math.ceil(clientInvoices.length / 5)}
                                            </span>
                                            <button
                                                disabled={invoicePage >= Math.ceil(clientInvoices.length / 5)}
                                                onClick={() => setInvoicePage(p => p + 1)}
                                                className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-indigo-600 disabled:opacity-30 disabled:pointer-events-none transition-colors border border-gray-100 rounded-lg"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <p className="text-xs font-bold text-gray-400">No invoices found for this client</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const timerIcons = {
    'Hourly': Timer,
    'Monthly': Calendar,
    'Fixed': Briefcase,
    'Milestone': TrendingUp
};
