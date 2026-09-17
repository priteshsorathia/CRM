"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import api from "../lib/axios";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileSearch,
  User,
  Ticket,
  PhoneCall,
  ShoppingBag,
  Star,
  UserCog,
  Settings,
  LogOut,
  X,
} from "lucide-react";

const Sidebar = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const [stats, setStats] = React.useState({ supportTickets: 0, callbackRequests: 0, pendingReviews: 0 });

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/sidebar-stats');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (error) {
        console.error("Sidebar stats fetch error:", error);
      }
    };
    fetchStats();
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close sidebar on path change for mobile
  React.useEffect(() => {
    if (isOpen && onClose) {
      onClose();
    }
  }, [pathname]);

  const sections = [
    {
      title: "OVERVIEW",
      items: [
        { icon: <LayoutDashboard size={20} />, label: "Dashboard", href: "/" },
        { icon: <UserPlus size={20} />, label: "Leads", href: "/leads" },
        { icon: <FileSearch size={20} />, label: "OnBoarding", href: "/onboarding" },
        { icon: <Users size={20} />, label: "Users", href: "/users" },
      ],
    },
    {
      title: "OPERATIONS",
      items: [
        { icon: <Ticket size={20} />, label: "Support Tickets", href: "/support-tickets"},
        { icon: <PhoneCall size={20} />, label: "Call Request", href: "/callback-requests"},
        { icon: <ShoppingBag size={20} />, label: "Shops", href: "/shops" },
        { icon: <Star size={20} />, label: "Reviews", href: "/reviews" },
        { icon: <UserCog size={20} />, label: "Employees", href: "/employees" },
      ],
    },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[45] lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0e1628] text-white flex flex-col h-full shadow-2xl transition-transform duration-300 ease-in-out font-sans overflow-hidden border-r border-[#1e293b]/50 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } lg:relative lg:translate-x-0`}>
        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>

        {/* Header Section */}
        <div className="pt-6 pb-6 px-6 flex flex-col items-center border-b border-[#1e293b]/30">
          <div className="w-20 h-20 rounded-full flex items-center justify-center p-0.5 overflow-hidden mb-2 bg-white">
            <img src="/shop-logo.png" alt="CRM Logo" className="w-full h-full object-contain" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold tracking-[0.1em] text-white uppercase mb-1">CRM</h2>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">SELLER DASHBOARD</p>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {sections.flatMap(section => section.items).map((item, idx) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={idx}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                  ? "bg-[#4f46e5] text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)]"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
              >
                <div className="flex items-center space-x-4">
                  <span className={`${isActive ? "text-white" : "text-[#9ca3af] group-hover:text-white"} transition-colors`}>
                    {item.icon}
                  </span>
                  <span className={`text-sm font-semibold tracking-wide ${isActive ? "text-white" : "text-[#d1d5db] group-hover:text-white"}`}>
                    {item.label}
                  </span>
                </div>
                {item.badge && (
                  <span className={`relative flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black text-white ${isActive ? "bg-white/20" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Settings Button */}
          <div className="pt-1">
            <Link
              href="/settings"
              className={`flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 group ${pathname === "/settings" ? "bg-[#4f46e5] text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)]" : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
            >
              <span className={`${pathname === "/settings" ? "text-white" : "text-[#9ca3af] group-hover:text-white"}`}>
                <Settings size={20} />
              </span>
              <span className={`text-sm font-semibold tracking-wide ${pathname === "/settings" ? "text-white" : "text-[#d1d5db] group-hover:text-white"}`}>Settings</span>
            </Link>
          </div>
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-[#1e293b]/30">
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
            className="flex items-center space-x-4 px-4 py-3 w-full rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 group"
            suppressHydrationWarning
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold uppercase tracking-widest">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
