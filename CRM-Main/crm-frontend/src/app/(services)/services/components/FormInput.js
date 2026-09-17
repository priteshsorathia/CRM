"use client";
import React from 'react';

export default function FormInput({ label, name, type = "text", value, onChange, placeholder, error, required = false }) {
    return (
        <div className="flex flex-col mb-4">
            <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center">
                {label} {required && <span className="text-rose-500 ml-1">*</span>}
            </label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full px-4 py-2.5 rounded-xl border ${error ? 'border-rose-300 bg-rose-50 focus:ring-rose-500' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50 focus:border-indigo-400 focus:ring-indigo-400'} focus:outline-none focus:ring-1 transition-all text-sm text-gray-800 placeholder-gray-400`}
            />
            {error && <span className="text-xs text-rose-500 mt-1.5 font-medium">{error}</span>}
        </div>
    );
}
