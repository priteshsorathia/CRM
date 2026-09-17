"use client";
import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import apiClient from '@/utils/apiClient';
import { toast } from 'sonner';

export default function AssetAssignmentModal({ isOpen, onClose, asset, onAssign }) {
    const [employee, setEmployee] = useState('');
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [returnDate, setReturnDate] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [acknowledged, setAcknowledged] = useState(false);

    if (!isOpen || !asset) return null;

    // Warning Pop-up Content (Inside Modal)
    if (asset.status === 'Assigned' && !acknowledged) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/40 animate-in fade-in transition-all">
                <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="p-10 text-center space-y-8">
                        <div className="w-24 h-24 bg-amber-50 rounded-[2rem] flex items-center justify-center text-amber-500 mx-auto shadow-inner border border-amber-100 rotate-3 hover:rotate-0 transition-transform duration-500">
                            <AlertCircle size={48} />
                        </div>
                        
                        <div className="space-y-3">
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Reassignment Alert</h2>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed px-4">
                                This asset is currently assigned to <br />
                                <span className="text-amber-600 font-bold decoration-amber-200 underline underline-offset-4">{asset.assignedTo}</span>.
                            </p>
                        </div>

                        <div className="p-6 bg-slate-50/80 rounded-3xl border border-slate-100 text-left">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Audit Impact</p>
                            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                                Proceeding will force-return this asset and register a new allocation for the next personnel.
                            </p>
                        </div>

                        <div className="flex flex-row gap-3">
                            <button 
                                onClick={onClose}
                                className="flex-1 py-3.5 bg-white text-slate-400 rounded-2xl font-bold text-xs uppercase tracking-widest hover:text-slate-600 border border-slate-100 transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => setAcknowledged(true)}
                                className="flex-[1.5] py-3.5 bg-[#4F46E5] text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-[#3730a3] transition-all active:scale-95"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const employees = ['John Matthews', 'Sarah Jenkins', 'Emily Chen', 'Ravi Kumar', 'Priya Sharma', 'DevOps Team', 'Design Studio'];

    const handleSubmit = async () => {
        if (!employee) { setError('Please select an employee'); return; }
        
        setLoading(true);
        try {
            const response = await apiClient.put(`/api/assets/${asset.id}`, {
                status: 'Assigned',
                assignedTo: employee
            });
            
            if (response.data.success) {
                toast.success(`Asset assigned to ${employee}`);
                onAssign(asset.id, employee, issueDate, returnDate, notes);
                onClose();
                setAcknowledged(false);
                setEmployee(''); setReturnDate(''); setNotes(''); setError('');
            }
        } catch (error) {
            console.error('Error assigning asset:', error);
            toast.error('Failed to assign asset');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/40">
            <div className="bg-white rounded-[2rem] shadow-xl w-full max-w-md border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-slate-50/50">
                    <div>
                        <h2 className="font-bold text-gray-900 text-lg">Assign Asset</h2>
                        <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest mt-0.5">{asset.assetId || asset.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"><X size={18} /></button>
                </div>

                <div className="px-8 py-7 space-y-6">
                    <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Personnel Allocation <span className="text-red-500">*</span></label>
                        <select value={employee} onChange={e => { setEmployee(e.target.value); setError(''); }} className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-400 bg-red-50' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-[13px] font-bold bg-white text-slate-800 transition-all`}>
                            <option value="">Select personnel...</option>
                            {employees.map(e => <option key={e}>{e}</option>)}
                        </select>
                        {error && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-2">{error}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Issue Date</label>
                            <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-[13px] font-bold" />
                        </div>
                        <div>
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Expected Return</label>
                            <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-[13px] font-bold" />
                        </div>
                    </div>

                    <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Notes</label>
                        <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-[13px] font-bold resize-none placeholder:text-slate-300" placeholder="Allocation details..." />
                    </div>
                </div>

                <div className="px-8 py-6 border-t border-gray-100 flex justify-end gap-3 bg-slate-50/30">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-widest hover:bg-white hover:text-slate-600 transition-all">Cancel</button>
                    <button onClick={handleSubmit} className="px-6 py-2.5 rounded-xl bg-[#4F46E5] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#3730a3] shadow-lg shadow-indigo-100 transition-all active:scale-95">Assign Asset</button>
                </div>
            </div>
        </div>
    );
}
