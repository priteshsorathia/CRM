"use client";
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function DeleteAssetModal({ isOpen, onClose, onConfirm, assetName }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />
            
            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all border border-gray-100 animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                            <AlertTriangle className="text-rose-500" size={24} />
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-gray-900 leading-tight">
                            Confirm Deletion
                        </h3>
                        <p className="text-gray-500 text-sm font-medium leading-relaxed">
                            Are you sure you want to delete <span className="text-gray-900 font-bold">"{assetName}"</span>? This action is permanent and cannot be undone.
                        </p>
                    </div>

                    <div className="mt-8 flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all active:scale-95"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
