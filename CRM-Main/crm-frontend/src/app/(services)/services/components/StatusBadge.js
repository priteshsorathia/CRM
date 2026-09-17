"use client";
import React from 'react';

export default function StatusBadge({ status }) {
  const getStyle = (s) => {
    switch((s || '').toLowerCase()) {
      case 'available': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'assigned': return 'bg-indigo-50 text-indigo-600 border border-indigo-100';
      case 'maintenance': return 'bg-amber-50 text-amber-600 border border-amber-100';
      case 'retired': return 'bg-red-50 text-red-600 border border-red-100';
      case 'new': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'good': return 'bg-blue-50 text-blue-600 border border-blue-100';
      case 'damaged': return 'bg-red-50 text-red-600 border border-red-100';
      case 'excellent': return 'bg-purple-50 text-purple-600 border border-purple-100';
      default: return 'bg-gray-50 text-gray-600 border border-gray-100';
    }
  };

  return (
    <span className={`px-2.5 py-1 uppercase tracking-widest text-[10px] font-bold rounded-lg ${getStyle(status)}`}>
      {status || 'N/A'}
    </span>
  );
}
