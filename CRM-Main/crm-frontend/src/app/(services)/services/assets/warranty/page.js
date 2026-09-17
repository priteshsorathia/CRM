"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ShieldCheck, Activity, AlertTriangle } from 'lucide-react';
import apiClient from '@/utils/apiClient';
import WarrantyAlerts from '../WarrantyAlerts';

export default function WarrantyPage() {
    const router = useRouter();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const response = await apiClient.get('/api/assets');
                if (response.data.success) {
                    setAssets(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching assets:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAssets();
    }, []);

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4 sm:px-0 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xl shadow-blue-100/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden group">
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg border-2 border-white/20">
                        <ShieldCheck size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-xl font-black text-gray-900 uppercase leading-none"><span className="mr-2">Warranty</span>Alerts</h1>
                        </div>
                        <p className="text-gray-500 font-semibold text-sm italic">Tracking warranty expirations and license renewals.</p>
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
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-50/50 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Page Content */}
            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    <div className="bg-white p-20 rounded-3xl border border-gray-100 text-center">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Analyzing Warranties...</p>
                    </div>
                ) : (
                    <div className='bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm'>
                        <WarrantyAlerts assets={assets} />
                    </div>
                )}
            </div>
        </div>
    );
}
