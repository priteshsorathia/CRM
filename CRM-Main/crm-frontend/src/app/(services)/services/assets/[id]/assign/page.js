"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    UserPlus,
    Monitor,
    ShieldCheck,
    Search,
    User,
    Building2,
    Calendar,
    Save,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import apiClient from '@/utils/apiClient';
import { toast } from 'sonner';

export default function AssignAssetPage() {
    const { id: assetId } = useParams();
    const router = useRouter();
    const [asset, setAsset] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchingEmployees, setFetchingEmployees] = useState(true);
    const [showWarning, setShowWarning] = useState(true);

    useEffect(() => {
        const fetchAsset = async () => {
            try {
                const response = await apiClient.get(`/api/assets/${assetId}`);
                if (response.data.success) {
                    setAsset(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching asset:', error);
                toast.error('Failed to load asset');
            }
        };

        const fetchEmployees = async () => {
            try {
                setFetchingEmployees(true);
                const response = await apiClient.get('/api/hrms/staff');
                if (response.data.success) {
                    setEmployees(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching employees:', error);
                toast.error('Failed to load employee directory');
            } finally {
                setFetchingEmployees(false);
            }
        };

        if (assetId) {
            fetchAsset();
            fetchEmployees();
        }
    }, [assetId]);

    const filteredEmployees = employees.filter(e =>
        e.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.emp_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAssign = async () => {
        if (!selectedEmp) return;
        setLoading(true);
        try {
            const response = await apiClient.put(`/api/assets/${assetId}`, {
                status: 'Assigned',
                assignedTo: selectedEmp.full_name
            });
            if (response.data.success) {
                toast.success(`Asset assigned to ${selectedEmp.full_name}`);
                router.push(`/services/assets/${assetId}`);
            }
        } catch (error) {
            console.error('Error assigning asset:', error);
            toast.error(error.response?.data?.error || 'Failed to assign asset');
        } finally {
            setLoading(false);
        }
    };

    if (!asset) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4 sm:px-0">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 transition-colors w-fit group"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Back to Asset</span>
                </button>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                            <Monitor size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Assign {asset.name}</h1>
                            <p className="text-xs font-semibold text-gray-500 mt-0.5 uppercase tracking-widest">Asset ID: <span className="text-indigo-600">{assetId}</span></p>
                        </div>
                    </div>

                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border w-fit ${asset.status === 'Assigned' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                        {asset.status === 'Assigned' ? <User size={14} /> : <ShieldCheck size={14} />}
                        <span className="text-[10px] font-bold uppercase tracking-wider">Status: {asset.status}</span>
                    </div>
                </div>
            </div>

            {/* Reassignment Warning Modal (Popup Type) */}
            {asset.status === 'Assigned' && showWarning && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 text-center space-y-6">
                            <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 mx-auto shadow-inner border border-amber-100">
                                <AlertCircle size={40} />
                            </div>
                            
                            <div className="space-y-2">
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Reassignment Alert</h2>
                                <p className="text-sm text-slate-500 font-medium">
                                    This asset is currently assigned to <span className="font-bold text-amber-600 underline underline-offset-4 decoration-amber-200">{asset.assignedTo}</span>.
                                </p>
                            </div>

                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Important Note</p>
                                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                                    Proceeding will automatically trigger a "Force Return" action and document this transfer in the audit logs.
                                </p>
                            </div>

                            <div className="flex flex-row gap-3 pt-2">
                                <button 
                                    onClick={() => router.back()}
                                    className="flex-1 py-3.5 bg-slate-50 text-slate-400 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-95 border border-slate-100"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => setShowWarning(false)}
                                    className="flex-[1.5] py-3.5 bg-[#4F46E5] text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-[#3730a3] transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={16} />
                                    Continue
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Employee Selection */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><UserPlus size={18} /></div>
                                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Personnel Allocation</h3>
                            </div>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search employees by name or department..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {fetchingEmployees ? (
                                <div className="col-span-2 py-20 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                                    <p className="text-xs font-bold text-gray-400 mt-4 uppercase tracking-widest">Loading Employee Directory...</p>
                                </div>
                            ) : filteredEmployees.length > 0 ? (
                                filteredEmployees.map(emp => (
                                    <button
                                        key={emp.id}
                                        onClick={() => setSelectedEmp(emp)}
                                        className={`p-4 rounded-xl border transition-all text-left flex items-center gap-4 group ${selectedEmp?.id === emp.id
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                            : 'bg-white border-gray-100 hover:border-indigo-200 hover:bg-gray-50/50'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${selectedEmp?.id === emp.id ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
                                            }`}>
                                            {emp.full_name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-bold text-sm truncate ${selectedEmp?.id === emp.id ? 'text-white' : 'text-gray-900'}`}>{emp.full_name}</p>
                                            <p className={`text-[10px] font-semibold uppercase tracking-wider ${selectedEmp?.id === emp.id ? 'text-indigo-100/80' : 'text-gray-400'}`}>{emp.role || 'Staff'}</p>
                                        </div>
                                        {selectedEmp?.id === emp.id && (
                                            <CheckCircle2 size={16} className="text-white" />
                                        )}
                                    </button>
                                ))
                            ) : (
                                <div className="col-span-2 py-20 text-center">
                                    <div className="p-4 bg-gray-50 rounded-2xl inline-block mb-4">
                                        <Search size={32} className="text-gray-300" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No employees found</p>
                                    <p className="text-[10px] font-semibold text-gray-300 mt-1">Try searching with a different name or role</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Assignment Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between min-h-[460px] relative overflow-hidden">
                        <div className="space-y-6 relative z-10">
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-3 border-b border-gray-100 pb-4">
                                <ShieldCheck size={18} className="text-indigo-600" /> Assignment Summary
                            </h3>

                            {selectedEmp ? (
                                <div className="space-y-5">
                                    <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-white border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg shadow-sm">
                                            {selectedEmp.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900 leading-none mb-1">{selectedEmp.full_name}</p>
                                            <p className="text-[10px] font-semibold text-indigo-500 tracking-wider uppercase">{selectedEmp.emp_id}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 px-1">
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                            <span>Allocation Date</span>
                                            <span className="text-gray-900">{new Date().toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                            <span>Initial condition</span>
                                            <span className="text-emerald-600">Perfect</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-40 flex flex-col items-center justify-center text-center opacity-40 border-2 border-dashed border-gray-200 rounded-xl">
                                    <User size={32} className="mb-2 text-gray-300" />
                                    <p className="text-xs font-semibold text-gray-400">Select Personnel to <br /> continue assignment</p>
                                </div>
                            )}
                        </div>

                        <div className="pt-6 relative z-10 space-y-4">
                            <button
                                onClick={handleAssign}
                                disabled={!selectedEmp || loading}
                                className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-3 transition-all ${selectedEmp && !loading
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                    }`}
                            >
                                {loading ? 'Authorizing...' : <><Save size={16} /> Confirm Assignment</>}
                            </button>
                            <p className="text-[10px] font-semibold text-gray-400 text-center uppercase tracking-widest">
                                Transaction ID: TRN-{(Math.random() * 10000).toFixed(0)}
                            </p>
                        </div>
                    </div>

                    <div className="bg-amber-50/50 p-5 rounded-xl border border-amber-100 flex items-start gap-4">
                        <div className="p-2 bg-white text-amber-600 rounded-lg shadow-sm"><AlertCircle size={18} /></div>
                        <div>
                            <h4 className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-1">Policy Note</h4>
                            <p className="text-xs text-amber-900/70 font-medium leading-relaxed">
                                Assignment transfers physical responsibility to the selected staff member.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


