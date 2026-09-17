"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import Link from 'next/link';

const UserDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const dropdownRef = useRef(null);
  const router = useRouter();

  // Load user data on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUserData(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
  }, []);

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsOpen(false);
    router.push('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = userData?.name || "User";

  // Initials for avatar
  const initials = displayName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 cursor-pointer group px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-all select-none"
      >
        <div className="w-9 h-9 rounded-full bg-indigo-50 overflow-hidden flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-gray-100">
           <span className="text-[10px] font-bold text-indigo-500">{initials}</span>
        </div>
        <div className="flex items-center gap-1">
          <p className="text-xs font-black text-gray-700 tracking-tight">{displayName}</p>
          <ChevronDown className={`w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} strokeWidth={3} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
          <div className="px-4 py-3 border-b border-gray-50 mb-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account</p>
            <p className="text-xs font-black text-gray-800">{displayName}</p>
            <p className="text-[10px] font-medium text-gray-400 truncate">{userData?.email}</p>
          </div>
          
          <Link 
            href="/profile" 
            className="flex items-center space-x-3 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <User size={16} />
            <span>My Profile</span>
          </Link>
          
          <Link 
            href="/settings" 
            className="flex items-center space-x-3 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <Settings size={16} />
            <span>Settings</span>
          </Link>
          
          <div className="h-px bg-gray-50 my-1 mx-2" />
          
          <button 
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors text-left"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
