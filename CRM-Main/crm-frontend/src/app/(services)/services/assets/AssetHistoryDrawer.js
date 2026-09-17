"use client";
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import apiClient from '@/utils/apiClient';

const actionStyle = {
    'Assigned': 'bg-blue-50 text-blue-700 border border-blue-200',
    'Available': 'bg-green-50 text-green-700 border border-green-200',
    'Returned': 'bg-green-50 text-green-700 border border-green-200',
    'Maintenance': 'bg-amber-50 text-amber-700 border border-amber-200',
    'Asset Created': 'bg-indigo-50 text-indigo-700 border border-indigo-200',
};

export default function AssetHistoryDrawer({ isOpen, onClose, assetId }) {
    const [history, setHistory] = useState([]);
    const [asset, setAsset] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && assetId) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    const [historyRes, assetRes] = await Promise.all([
                        apiClient.get(`/api/assets/${assetId}/history`),
                        apiClient.get(`/api/assets/${assetId}`)
                    ]);

                    if (historyRes.data.success) {
                        setHistory(historyRes.data.data.map(log => {
                            const date = new Date(log.date);
                            const day = String(date.getDate()).padStart(2, '0');
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const year = date.getFullYear();
                            return {
                                action: log.action,
                                date: `${day}-${month}-${year}`,
                                person: log.user,
                                notes: log.description
                            };
                        }));
                    }

                    if (assetRes.data.success) {
                        setAsset(assetRes.data.data);
                    }
                } catch (error) {
                    console.error('Error fetching drawer data:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [isOpen, assetId]);

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-gray-950/30 z-40" onClick={onClose} />
            <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white z-50 shadow-2xl border-l border-gray-200 flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="font-bold text-gray-900 text-lg">Assignment History</h2>
                        <p className="text-sm text-indigo-600 font-semibold mt-0.5">
                            {asset ? `${asset.assetId} — ${asset.name}` : assetId}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"><X size={18} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                <span className="text-2xl">📋</span>
                            </div>
                            <p className="text-sm font-medium">No history available for this asset.</p>
                        </div>
                    ) : (
                        <div className="relative pl-6 border-l-2 border-gray-100 ml-3 space-y-6">
                            {history.map((record, idx) => (
                                <div key={idx} className="relative">
                                    <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-white border-2 border-indigo-400 shadow-sm" />
                                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-indigo-600 uppercase tracking-widest text-[10px] font-bold">{asset.assetId}</span>
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${actionStyle[record.action] || 'bg-gray-100 text-gray-600'}`}>{record.action}</span>
                                            <span className="text-xs text-gray-400 font-medium">{record.date}</span>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-800">{record.person}</p>
                                        {record.notes && <p className="text-xs text-gray-500 mt-1.5 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">{record.notes}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
