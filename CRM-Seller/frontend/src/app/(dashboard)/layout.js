"use client";
import React, { useRef, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from "../../components/Sidebar";
import UserDropdown from "../../components/UserDropdown";
import api from '../../lib/axios'; // Use our shared API client
import { Menu } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const mainRef = useRef(null);
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Secure Initial Authorization Guard
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      // Redirect anyone WITHOUT a session to login immediately
      router.push('/login');
    } else {
      // User has local session, allow rendering children
      setIsAuthorized(true);
    }

    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [pathname, router]);

  // Visual Guard while authorizing
  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Securing Environment...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
        <header className="flex items-center justify-between px-4 lg:px-8 py-2 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40 transition-all">
          <div className="flex items-center space-x-4">
             <button 
               onClick={() => setIsSidebarOpen(true)}
               className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
             >
               <Menu size={24} />
             </button>
             <h1 className="text-xl font-semibold text-slate-800 tracking-tight capitalize hidden lg:block">CRM Seller</h1>
          </div>
          <div className="flex items-center space-x-6">
            <UserDropdown />
          </div>
        </header>
        <div className="px-4 lg:px-10 py-8 bg-[#f8fafc] min-h-[calc(100vh-68px)]">
          {children}
        </div>
      </main>
    </div>
  );
}
