"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, FileText, Activity } from 'lucide-react';
import AssetLogs from '../AssetLogs';
import DepreciationChart from '../DepreciationChart';
import PermissionWrapper from '@/components/PermissionWrapper';

export default function ReportsPage() {
    const router = useRouter();

    return (
        <PermissionWrapper 
            module="REPORTS" 
            action="READ" 
            fallback={
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-xl">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6 border-2 border-red-100">
                        <Activity size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Access Restricted</h2>
                    <p className="text-gray-500 max-w-sm font-semibold italic">You don't have permission to view asset reports and logs. Please contact your administrator if you believe this is an error.</p>
                </div>
            }
        >
            <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4 sm:px-0 animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Header Section */}
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xl shadow-emerald-100/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden group">
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg border-2 border-white/20">
                            <FileText size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-xl font-black text-gray-900 uppercase leading-none">Logs & Reports</h1>
                            </div>
                            <p className="text-gray-500 font-semibold text-sm italic">Comprehensive activity tracking and asset valuation reports.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 relative z-10">
                        <button
                            onClick={() => router.push('/services/assets')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-100 transition-all border border-gray-200 group"
                        >
                            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Back
                        </button>
                    </div>

                    {/* Decorative background blur */}
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-50/50 rounded-full blur-3xl pointer-events-none" />
                </div>

                {/* Page Content */}
                <div className="grid grid-cols-1 gap-8">
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                        <DepreciationChart />
                    </div>
                    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden p-6">
                        <AssetLogs />
                    </div>
                </div>
            </div>
        </PermissionWrapper>
    );
}
