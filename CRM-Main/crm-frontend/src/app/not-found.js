"use client"
import React from 'react';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#f9faff] flex items-center justify-center p-4 font-sans">
      {/* Main Card Container */}
      <div className="max-w-5xl w-full bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100/40 flex flex-col md:flex-row items-center p-8 md:p-14 gap-8 md:gap-0 relative overflow-hidden">
        
        {/* Left Side: Text Content */}
        <div className="flex-1 z-10">
          <h1 className="text-[140px] font-bold text-[#4477ff] leading-none mb-2 tracking-tighter">
            404
          </h1>
          <h2 className="text-[42px] font-bold text-[#1e266d] mb-5 tracking-tight">
            Page Not Found
          </h2>
          
          {/* Accent Line */}
          <div className="w-10 h-[4px] bg-[#4477ff] mb-8 rounded-full"></div>
          
          <p className="text-[#6b7280] text-[18px] mb-12 max-w-[360px] leading-relaxed font-medium">
            Oops! The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>

          <div className="flex flex-row flex-wrap gap-4">
            {/* Go to Home Button (Filled) */}
            <button 
              onClick={() => window.location.href = '/'}
              className="bg-[#4477ff] hover:bg-[#3461db] text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-blue-200 text-sm whitespace-nowrap"
            >
              <Home className="w-4 h-4 stroke-[2.5px]" />
              Go to Home
            </button>
            
            {/* Go Back Button (Outlined) */}
            <button 
              onClick={() => window.history.back()}
              className="border-2 border-[#4477ff] text-[#4477ff] hover:bg-blue-50 px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all text-sm whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5px]" />
              Go Back
            </button>
          </div>
        </div>

        {/* Right Side: img */}
        <div className="flex-1 w-full flex justify-center items-center">
          <div className="relative w-full max-w-[700px]">
            <img 
              src="/404-PageNotFound.png" 
              alt="404 Page Not Found" 
              className="w-full h-auto object-contain scale-110"
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default NotFound;