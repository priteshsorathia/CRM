"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import BillingOverview from './BillingOverview';
import InvoiceTable from './InvoiceTable';
import RestaurantLoader from '@/components/RestaurantLoader';
import { getApiBase } from '@/utils/apiBase';
import { useRole } from '@/app/(services)/context/RoleContext';

export default function BillingPage() {
    const { can } = useRole();
    const router = useRouter();
    const [invoices, setInvoices] = useState(null);
    const [filters, setFilters] = useState({ client: 'All', from: '', to: '', status: 'totalInvoiced' });

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                const res = await fetch(`${getApiBase()}/api/services/invoices`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setInvoices(data.invoices || []);
                } else {
                    setInvoices([]);
                }
            } catch (error) {
                console.error("Error fetching invoices:", error);
                setInvoices([]);
            }
        };
        fetchInvoices();
    }, []);

    const filteredInvoices = useMemo(() => {
        if (!invoices) return [];
        
        return invoices.filter(inv => {
            // Status Card Filtering
            let matchesStatus = true;
            if (filters.status !== 'All' && filters.status !== 'totalInvoiced') {
                if (filters.status === 'outstanding') {
                    matchesStatus = (Number(inv.amount || 0) - Number(inv.paid || 0)) > 0;
                } else if (filters.status === 'Overdue') {
                    const amount = Number(inv.amount || 0);
                    const paid = Number(inv.paid || 0);
                    const due = inv.dueDate ? new Date(inv.dueDate) : null;
                    matchesStatus = due && due < new Date() && (amount - paid) > 0 && inv.status !== 'Paid';
                } else {
                    matchesStatus = String(inv.status) === filters.status;
                }
            }

            // Other filters
            const clientName = inv.client?.company || inv.clientName || "";
            const matchesClient = filters.client === 'All' || clientName === filters.client;
            
            let matchesDate = true;
            if (filters.from && inv.issuedDate) {
                matchesDate = matchesDate && new Date(inv.issuedDate) >= new Date(filters.from);
            }
            if (filters.to && inv.issuedDate) {
                matchesDate = matchesDate && new Date(inv.issuedDate) <= new Date(filters.to);
            }

            return matchesStatus && matchesClient && matchesDate;
        });
    }, [invoices, filters]);

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this invoice?')) return;
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await fetch(`${getApiBase()}/api/services/invoices/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setInvoices(prev => prev.filter(i => i.id !== id));
            } else {
                alert(data.message || 'Error deleting invoice');
            }
        } catch (error) {
            console.error('Error deleting invoice:', error);
            alert('Failed to connect to server');
        }
    };

    if (!invoices) return <RestaurantLoader />;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xl shadow-indigo-100/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden group">
                <div className="relative z-10">
                    <h1 className="text-2xl font-bold text-gray-900 leading-none">Revenue & Invoicing</h1>
                    <p className="text-sm text-gray-500 mt-2 font-medium">Create invoices, track collections, and manage outstanding balances.</p>
                </div>
                
                {can('BILLING', 'CREATE') && (
                    <button
                        onClick={() => router.push('/services/billing/new')}
                        className="relative z-10 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200/50 transition-all active:scale-95 whitespace-nowrap"
                    >
                        <Plus size={20} strokeWidth={2.5} /> Add Invoice
                    </button>
                )}
                
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-50/50 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-100/50 transition-all duration-700" />
            </div>

            {/* Quick Analytics Overview */}
            <div>
                <BillingOverview 
                    invoices={invoices} 
                    activeFilter={filters.status}
                    onFilterChange={(s) => setFilters({ ...filters, status: s })}
                />
            </div>

            {/* Main Data Registry */}
            <div className="space-y-4">
                <InvoiceTable 
                    invoices={filteredInvoices} 
                    allInvoices={invoices}
                    filters={filters}
                    onFiltersChange={setFilters}
                    onDelete={handleDelete} 
                />
            </div>
        </div>
    );
}
