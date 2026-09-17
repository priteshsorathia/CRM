"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/utils/apiClient';
import { toast } from 'sonner';
import { Plus, LayoutGrid, ShieldCheck, FileText, LayoutDashboard } from 'lucide-react';
import AssetOverview from './AssetOverview';
import AssetTable from './AssetTable';
import AddAssetModal from './AddAssetModal';
import AssetAssignmentModal from './AssetAssignmentModal';
import AssetHistoryDrawer from './AssetHistoryDrawer';
import WarrantyAlerts from './WarrantyAlerts';
import AssetLogs from './AssetLogs';
import DepreciationChart from './DepreciationChart';
import DeleteAssetModal from './DeleteAssetModal';



import PermissionWrapper from '@/components/PermissionWrapper';

export default function AssetsPage() {
    const router = useRouter();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ category: 'All', from: '', to: '', status: 'All' });
    const tableRef = useRef(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [historyId, setHistoryId] = useState(null);

    useEffect(() => {
        fetchAssets();
    }, []);

    const handleFilterChange = (status) => {
        setFilters(prev => ({ ...prev, status }));
        if (tableRef.current) {
            tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/api/assets');
            if (response.data.success) {
                setAssets(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching assets:', error);
            toast.error('Failed to load assets');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = (asset) => setAssets(prev => [asset, ...prev]);

    const handleAssign = (asset) => { setSelectedAsset(asset); setShowAssignModal(true); };
    const handleAssignConfirm = (id, employee) =>
        setAssets(prev => prev.map(a => a.id === id ? { ...a, status: 'Assigned', assignedTo: employee } : a));

    const handleReturn = async (id) => {
        try {
            const response = await apiClient.put(`/api/assets/${id}`, { status: 'Available', assignedTo: null });
            if (response.data.success) {
                toast.success('Asset returned to inventory');
                setAssets(prev => prev.map(a => a.id === id ? { ...a, status: 'Available', assignedTo: null } : a));
            }
        } catch (error) {
            console.error('Error returning asset:', error);
            toast.error('Failed to return asset');
        }
    };

    const handleMaintenance = async (id) => {
        try {
            const response = await apiClient.put(`/api/assets/${id}`, { status: 'Maintenance' });
            if (response.data.success) {
                toast.success('Asset moved to maintenance');
                setAssets(prev => prev.map(a => a.id === id ? { ...a, status: 'Maintenance' } : a));
            }
        } catch (error) {
            console.error('Error moving asset to maintenance:', error);
            toast.error('Failed to update asset status');
        }
    };

    const handleViewHistory = (id) => { setHistoryId(id); setShowHistory(true); };

    const handleDeleteAsset = (asset) => {
        setSelectedAsset(asset);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!selectedAsset) return;
        try {
            const response = await apiClient.delete(`/api/assets/${selectedAsset.id}`);
            if (response.data.success) {
                toast.success('Asset deleted successfully');
                setAssets(prev => prev.filter(a => a.id !== selectedAsset.id));
                setShowDeleteModal(false);
                setSelectedAsset(null);
            }
        } catch (error) {
            console.error('Error deleting asset:', error);
            toast.error(error.response?.data?.error || 'Failed to delete asset');
        }
    };

    return (
        <div className="space-y-6">
            {/* Premium Header Card */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-xl shadow-indigo-100/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden group">
                {/* Left Side: Title and Module Branding */}
                <div className="flex items-center gap-4 relative z-10 shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner ">
                        <LayoutDashboard size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 uppercase leading-none"><span className="mr-2">Assets</span>Dashboard</h1>
                    </div>
                </div>

                {/* Right Side: Action Buttons - Responsive Layout */}
                <div className="grid grid-cols-2 sm:flex items-center gap-3 relative z-10 w-full sm:w-auto">
                    {/* Warranty Alerts - Solid Blue */}
                    <PermissionWrapper module="ASSETS" action="READ">
                        <button
                            onClick={() => router.push('/services/assets/warranty')}
                            className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200/50 hover:bg-blue-700 hover:shadow-blue-300/50 transition-all whitespace-nowrap active:scale-95"
                        >
                            <ShieldCheck size={18} strokeWidth={2.5} />
                            Warranty
                        </button>
                    </PermissionWrapper>

                    {/* Logs & Reports - Solid Green */}
                    <PermissionWrapper module="REPORTS" action="READ">
                        <button
                            onClick={() => router.push('/services/assets/reports')}
                            className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200/50 hover:bg-emerald-700 hover:shadow-emerald-300/50 transition-all whitespace-nowrap active:scale-95"
                        >
                            <FileText size={18} strokeWidth={2.5} />
                            Reports
                        </button>
                    </PermissionWrapper>

                    {/* Register Asset - Solid Purple */}
                    <PermissionWrapper module="ASSETS" action="CREATE">
                        <button
                            onClick={() => router.push('/services/assets/new')}
                            className="col-span-2 sm:col-auto flex items-center justify-center gap-2 px-5 py-3 bg-violet-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-200/50 hover:bg-violet-700 hover:shadow-violet-300/50 transition-all whitespace-nowrap active:scale-95"
                        >
                            <Plus size={18} strokeWidth={2.5} />
                            Register
                        </button>
                    </PermissionWrapper>
                </div>


                {/* Subtle Background Elements */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-50/50 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-100/50 transition-all duration-700" />
            </div>

            {/* Dashboard Content */}
            <div className="space-y-6">
                <AssetOverview assets={assets} onFilterChange={handleFilterChange} activeFilter={filters.status} />
                <AssetTable
                    assets={assets}
                    onAssign={handleAssign}
                    onReturn={handleReturn}
                    onMaintenance={handleMaintenance}
                    onViewHistory={handleViewHistory}
                    onDelete={handleDeleteAsset}
                    filters={filters}
                    onFiltersChange={setFilters}
                    tableRef={tableRef}
                />
            </div>

            {/* Modals & Drawers */}
            <AddAssetModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAdd} />
            <AssetAssignmentModal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} asset={selectedAsset} onAssign={handleAssignConfirm} />
            <DeleteAssetModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={confirmDelete} assetName={selectedAsset?.name} />
            <AssetHistoryDrawer isOpen={showHistory} onClose={() => setShowHistory(false)} assetId={historyId} />
        </div>
    );
}
