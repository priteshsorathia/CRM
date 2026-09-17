"use client";
import React from 'react';

export default function SelectInput({ label, name, value, onChange, options, error, required = false }) {
  return (
    <div className="flex flex-col mb-4">
      <label className="text-sm font-semibold text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`px-4 py-2 bg-slate-50 border rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer ${
          error ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-indigo-400'
        }`}
      >
        <option value="" disabled>Select {label}</option>
        {options.map(opt => (
          <option key={opt.value || opt} value={opt.value || opt}>
            {opt.label || opt}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-500 mt-1 font-medium">{error}</span>}
    </div>
  );
}
