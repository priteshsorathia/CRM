"use client";

import React from "react";

/**
 * AuthLoader Component
 * Renders a full-page overlay spinner with a circular ring, central CRM logo, and loading messages.
 * 
 * @param {Object} props
 * @param {string} props.title - Main title, defaults to "CRM"
 * @param {string} props.message - Subtitle / Status message, defaults to "SECURE ACCESS IN PROGRESS"
 */
export default function AuthLoader({ 
  title = "CRM", 
  message = "SECURE ACCESS IN PROGRESS" 
}) {
  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center transition-all duration-300">
      <div className="flex flex-col items-center">
        {/* Circular Spinner Ring */}
        <div className="relative w-36 h-36 flex items-center justify-center mb-6">
          {/* Outer Track */}
          <div className="absolute w-28 h-28 rounded-full border-[3px] border-slate-100"></div>
          {/* Rotating segment */}
          <div className="absolute w-28 h-28 rounded-full border-[3px] border-transparent border-t-slate-800 border-l-slate-800 animate-spin"></div>
          
          {/* Logo Container */}
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center p-3 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-100">
            <img 
              src="/shop-logo.png" 
              alt="CRM" 
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl lg:text-2xl font-extrabold tracking-wider text-slate-800 uppercase">
          {title}
        </h2>

        {/* Subtext */}
        <p className="text-[10px] sm:text-xs font-bold tracking-[0.25em] text-slate-400 mt-2 uppercase">
          {message}
        </p>
      </div>
    </div>
  );
}
