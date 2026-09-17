'use client';
import React from 'react';
import { RefreshCcw, Home } from 'lucide-react';

const BadGateway = () => {
  return (
    <div className="min-h-screen bg-[#f9faff] flex items-center justify-center p-4 font-sans">
      {/* Main Card */}
      <div className="max-w-5xl w-full bg-white rounded-[2rem] shadow-2xl shadow-blue-100/50 flex flex-col md:flex-row items-center p-8 md:p-20 gap-16 relative overflow-hidden">
        
        {/* Left Content Side */}
        <div className="flex-1 z-10">
          <h1 className="text-[120px] font-bold text-[#507bfc] leading-none mb-2 tracking-tight">
            502
          </h1>
          <h2 className="text-4xl font-extrabold text-[#1e266d] mb-4">
            Bad Gateway
          </h2>
          
          {/* Decorative small line */}
          <div className="w-8 h-[3px] bg-[#507bfc] mb-8 rounded-full"></div>
          
          <p className="text-[#6b7280] text-xl mb-12 max-w-sm leading-relaxed font-medium">
            Oops! Something went wrong on our end. <br />
            Please try again later.
          </p>

          <div className="flex flex-row gap-4">
            {/* Try Again Button */}
            <button 
              onClick={() => window.location.reload()}
              className="bg-[#507bfc] hover:bg-[#3f66e2] text-white px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-blue-200 whitespace-nowrap text-sm"
            >
              <RefreshCcw className="w-4 h-4 stroke-[3]" />
              Try Again
            </button>
            
            {/* Go Home Button */}
            <button 
              onClick={() => window.location.href = '/'}
              className="border-2 border-[#e5e7eb] hover:border-[#507bfc] hover:text-[#507bfc] text-[#6b7280] px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap text-sm"
            >
              <Home className="w-4 h-4 stroke-[3]" />
              Go to Home
            </button>
          </div>
        </div>

        {/* Right Side img */}
        <div className="flex-1 w-full flex justify-center items-center">
          <img 
            src="/502-BadGateway.png" 
            alt="502 Bad Gateway" 
            className="w-full max-w-[600px] scale-110 h-auto object-contain"
          />
        </div>

      </div>
    </div>
  );
};

export default BadGateway;