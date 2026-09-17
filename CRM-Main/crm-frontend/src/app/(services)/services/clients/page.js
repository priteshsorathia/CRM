"use client";
import React, { useState, useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ClientOverview from './ClientOverview';
import ClientTable from './ClientTable';
import RestaurantLoader from '@/components/RestaurantLoader';
import { useRole } from '@/app/(services)/context/RoleContext';
import { getApiBase } from '@/utils/apiBase';

export default function ClientsPage() {
    const { can } = useRole();
    const router = useRouter();
    const [clients, setClients] = useState(null);
    const [totalCollected, setTotalCollected] = useState(0);
    const [filters, setFilters] = useState({ billing: 'All', from: '', to: '', status: 'total' });

    React.useEffect(() => {
        const fetchClients = async () => {
            try {
                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                const res = await fetch(`${getApiBase()}/api/services/clients`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setClients(data.clients);
                    setTotalCollected(data.totalCollected || 0);
                } else {
                    setClients([]);
                    setTotalCollected(0);
                }
            } catch (error) {
                console.error("Error fetching clients:", error);
                setClients([]);
                setTotalCollected(0);
            }
        };
        fetchClients();
    }, []);

    const filteredClients = useMemo(() => {
        if (!clients) return [];
        
        return clients.filter(c => {
            // Status Card Filtering
            let matchesStatus = true;
            if (filters.status === 'active') {
                matchesStatus = c.status === 'Active';
            } else if (filters.status === 'expiryCount') {
                const today = new Date();
                if (!c.contractEnd) matchesStatus = false;
                else {
                    const diff = Math.ceil((new Date(c.contractEnd) - today) / (1000 * 60 * 60 * 24));
                    matchesStatus = diff > 0 && diff <= 30;
                }
            } else if (filters.status === 'inactive') {
                matchesStatus = c.status === 'Inactive';
            }

            // Status Column Dropdown Filtering
            let matchesColStatus = true;
            if (filters.colStatus && filters.colStatus !== 'All') {
                matchesColStatus = c.status === filters.colStatus;
            }

            // Other filters
            const matchesBilling = filters.billing === 'All' || c.billing === filters.billing;
            
            let matchesDate = true;
            if (filters.from && c.contractStart) {
                matchesDate = matchesDate && new Date(c.contractStart) >= new Date(filters.from);
            }
            if (filters.to && c.contractStart) {
                matchesDate = matchesDate && new Date(c.contractStart) <= new Date(filters.to);
            }

            return matchesStatus && matchesColStatus && matchesBilling && matchesDate;
        });
    }, [clients, filters]);

    const handleEdit = (client) => {
        router.push(`/services/clients/edit/${client.id}`);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this client?')) return;
        
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await fetch(`${getApiBase()}/api/services/clients/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setClients(prev => prev.filter(c => c.id !== id));
            } else {
                alert(data.message || 'Error deleting client');
            }
        } catch (error) {
            console.error('Error deleting client:', error);
            alert('Failed to connect to server');
        }
    };

    if (!clients) return <RestaurantLoader />;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between gap-4 bg-white/50 p-1 sm:p-0 rounded-2xl">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 truncate">Client Management</h1>
                    <p className="hidden md:block text-sm text-gray-500 mt-1">Manage client contracts, billing types and relationships.</p>
                </div>
                {can('CLIENTS', 'CREATE') && (
                    <button
                        onClick={() => router.push('/services/clients/new')}
                        className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 whitespace-nowrap shrink-0"
                    >
                        <Plus size={16} className="sm:w-[18px]" /> 
                        <span>Add Client</span>
                    </button>
                )}
            </div>

            {/* Overview */}
            <ClientOverview 
                clients={clients} 
                totalCollected={totalCollected}
                activeFilter={filters.status}
                onFilterChange={(s) => setFilters({ ...filters, status: s })}
            />

            {/* Table Section */}
            <div className="flex flex-col gap-4">
                <ClientTable
                    clients={filteredClients}
                    allClients={clients}
                    filters={filters}
                    onFiltersChange={setFilters}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>
        </div>
    );
}
