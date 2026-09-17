"use client";

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  User,
  ArrowLeft,
  Share2,
  Bookmark,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  LayoutDashboard,
  Bell,
  History,
  ShieldCheck,
  FolderKanban,
  Users2,
  Users,
  HardDrive,
  Receipt,
  Wallet,
  Calculator,
  BarChart,
  Settings,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Lock,
  FileSearch,
  Zap,
  Box,
  BadgeCheck,
  Target,
  Search
} from 'lucide-react';

export default function ServiceInfo() {
  const router = useRouter();

  const tableOfContents = [
    "Dashboard & Analytics", "Communication Hub", "Audit & Compliance", "Role Management",
    "Project Operations", "Client Lifecycle", "HRMS & Workforce", "Asset Infrastructure",
    "Billing & Invoicing", "Expense Claims", "Unified Accounting", "Business Intelligence",
    "System Configuration"
  ];

  return (
    <section className="pt-10 pb-20 bg-white font-sans selection:bg-[#5f6dff] selection:text-white">
      <div className="mx-auto max-w-[850px] px-4 sm:px-6">
        
        {/* --- BACK BUTTON --- */}
        <button 
          onClick={() => router.back()}
          className="group flex items-center gap-2 text-[#5b6676] hover:text-[#5f6dff] transition-all duration-300 mb-10 font-bold text-sm tracking-tight"
        >
          <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center group-hover:border-[#5f6dff]/30 group-hover:bg-[#5f6dff]/5 transition-all duration-300">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-300" />
          </div>
          Back to Overview
        </button>

        {/* --- BLOG META & HEADER --- */}
        <div className="mb-16">
          <div className="flex items-center gap-3 text-[#5f6dff] font-bold text-xs uppercase tracking-widest mb-6">
            <span className="px-3 py-1 bg-[#5f6dff]/10 rounded-full">Product Guide</span>
            <span className="px-3 py-1 bg-[#5f6dff]/10 rounded-full">Engineering</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-semibold text-[#1a1c21] leading-[1.1] mb-8 tracking-tight">
            Mastering Modern Business: A Deep Dive into the CRM <span className="text-[#5f6dff]">Services Architecture</span>
          </h1>
          <hr className="border-[#5f6dff]" />
        </div>

        {/* --- INTRODUCTION --- */}
        <div className="prose prose-lg max-w-none text-[#5b6676] leading-relaxed mb-20">
          <p className="text-xl font-medium text-[#1a1c21] mb-6">
            In today's hyper-competitive landscape, data silos are the silent killers of enterprise growth. 
            CRM Services was engineered to solve one fundamental problem: <span className="text-[#5f6dff] font-bold">Unification.</span>
          </p>
          <p className="mb-6">
            As an all-in-one ERP and Business Intelligence platform, CRM centralizes every critical business 
            function—from high-level project management to granular asset tracking and automated payroll. 
            This document explores the technical infrastructure and logic that powers thousands of growing businesses.
          </p>
          
          <div className="bg-[#f8faff] rounded-[2rem] p-8 my-12 border border-[#5f6dff]/10">
             <h4 className="text-sm font-black text-[#5f6dff] uppercase tracking-widest mb-6 px-1">Inside this Guide:</h4>
             <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-2 m-0 p-0 list-none">
                {tableOfContents.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm font-bold text-[#1a1c21] hover:text-[#5f6dff] cursor-pointer py-1">
                    <ChevronRight className="w-4 h-4 text-[#5f6dff]" /> {item}
                  </li>
                ))}
             </ul>
          </div>
        </div>

        {/* --- BLOG CHAPTER 01 --- */}
        <div className="mb-24">
          <h2 className="text-3xl font-black text-[#1a1c21] mb-6">01. Dashboard: The Central Command Center</h2>
          <p className="text-[#5b6676] text-lg mb-10 leading-relaxed">
            The Services Dashboard transforms raw operational noise into a distilled visual summary. 
            It serves as the first point of truth for management, providing an immediate diagnostic of 
            business health across nine distinct domains.
          </p>
          
          <figure className="mb-12">
                      <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl shadow-[#5f6dff]/20">
                        <Image src="/og-image.png" alt="Dashboard" fill className="object-cover" />
                      </div>
          </figure>

          <div className="grid sm:grid-cols-2 gap-4 mb-10">
             {[
               { t: 'Active Projects', d: 'Real-time count of projects in "Ongoing" phase.' },
               { t: 'Total Clients', d: 'Aggregate onboarded clients in the CRM.' },
               { t: 'Staff Count', d: 'Active staff managed through the HRMS module.' },
               { t: 'Net Profit', d: 'Live (Revenue minus Expenses) calculation.' }
             ].map(item => (
               <div key={item.t} className="p-6 bg-white border border-gray-100 rounded-3xl group hover:border-[#5f6dff]/30 transition-all">
                  <h4 className="text-[10px] font-black text-[#5f6dff] uppercase mb-2">Metric Diagnostic</h4>
                  <div className="font-bold text-[#1a1c21] mb-1">{item.t}</div>
                  <div className="text-sm text-[#5b6676]">{item.d}</div>
               </div>
             ))}
          </div>
          <p className="text-[#5b6676] leading-relaxed italic border-l-4 border-[#5f6dff] pl-6 py-2">
            "The Quick Actions grid allows management to trigger core business workflows instantly without 
            navigating through sub-menus, significantly improving operational speed during peak hours."
          </p>
        </div>

        {/* --- BLOG CHAPTER 02 --- */}
        <div className="mb-24">
           <h2 className="text-3xl font-black text-[#1a1c21] mb-6">02. Communication & Accountability</h2>
           <p className="text-[#5b6676] text-lg mb-10 leading-relaxed">
             Transparency is maintained through two primary subsystems: Intelligent Notifications and 
             Master Activity Logs. Every event is timestamped, categorized, and auditable.
           </p>
           
           <div className="bg-[#f8faff] rounded-[2.5rem] p-10 mb-8">
              <h3 className="text-xl font-bold text-[#1a1c21] mb-6 flex items-center gap-2">
                 <Bell className="w-5 h-5 text-[#5f6dff]" /> Notification Domains
              </h3>
              <div className="grid sm:grid-cols-2 gap-6">
                 <div>
                    <h4 className="text-xs font-black text-[#5f6dff] uppercase mb-3">Categories</h4>
                    <div className="space-y-2">
                       {['Assets: Maintenance & Returns', 'HR: Onboarding & Leave', 'Projects: Tasks & Milestones', 'Billing: Invoices & Payments'].map(c => (
                         <div key={c} className="text-sm font-bold text-[#1a1c21]">{c}</div>
                       ))}
                    </div>
                 </div>
                 <div className="p-4 bg-white rounded-2xl border border-gray-100 space-y-2">
                    <h4 className="text-xs font-black text-[#5f6dff] uppercase mb-3">Controls</h4>
                    {['Mark All Read', 'Dismiss Alerts', 'Bulk Clear history', 'Auto-Read linking'].map(m => (
                      <div key={m} className="text-[13px] font-bold text-[#5b6676] flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#22c55e]" /> {m}
                      </div>
                    ))}
                 </div>
              </div>
           </div>
           <p className="text-[#5b6676] italic text-sm">
             Activity logs are retained for 365 days, ensuring regulatory compliance and a 
             permanent record of system-wide actions.
           </p>
        </div>

        {/* --- BLOG CHAPTER 03 --- */}
        <div className="mb-24">
           <h2 className="text-3xl font-black text-[#1a1c21] mb-6">03. The Power of Role-Based Control (RBAC)</h2>
           <p className="text-[#5b6676] text-lg mb-10 leading-relaxed">
             The Role Management Module is the heartbeat of platform security. By utilizing a 
             standardized Matrix, administrators can define the exact 'CRUD' permissions for 
             every role, from Junior Staff to Global Admin.
           </p>
           <div className="flex gap-4 mb-10 overflow-x-auto pb-4 no-scrollbar">
              {['Create', 'Read', 'Update', 'Delete'].map(p => (
                <div key={p} className="flex-shrink-0 px-8 py-5 bg-[#fcfdff] border-2 border-gray-50 rounded-2xl text-center">
                   <div className="w-10 h-10 rounded-xl bg-[#5f6dff] mx-auto flex items-center justify-center text-white mb-3 shadow-lg shadow-[#5f6dff]/20">
                      <ShieldCheck className="w-5 h-5" />
                   </div>
                   <div className="font-black text-[#1a1c21] uppercase text-xs tracking-widest">{p}</div>
                </div>
              ))}
           </div>
           <p className="text-[#5b6676] leading-relaxed mb-6">
             RBAC enforcement happens at both the UI and API levels. Unauthorized buttons are 
             automatically hidden, and attempts to access restricted modules trigger a 
             standardized "Access Denied" protocol.
           </p>
        </div>

        {/* --- BLOG CHAPTER 04 --- */}
        <div className="mb-24">
           <h2 className="text-3xl font-black text-[#1a1c21] mb-6">04. Operations: Projects & Assets</h2>
           <p className="text-[#5b6676] text-lg mb-10 leading-relaxed">
             CRM provides essential tools for task-level tracking and infrastructure management. 
             This integrates inventory control with real-time lifecycle monitoring.
           </p>

           <div className="grid md:grid-cols-2 gap-8">
              <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem]">
                 <h4 className="font-bold text-[#1a1c21] mb-4">Project Statuses</h4>
                 <div className="flex flex-wrap gap-2">
                   {['Active', 'Completed', 'On Hold', 'Overdue'].map(s => (
                     <span key={s} className="px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold text-[#5b6676] border border-gray-100">{s}</span>
                   ))}
                 </div>
              </div>
              <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem]">
                 <h4 className="font-bold text-[#1a1c21] mb-4">Critical Asset Risks</h4>
                 <div className="space-y-3">
                   {['Warranty Expiry Alerts', 'License Renewal Reminders', 'Maintenance Logging'].map(tag => (
                     <div key={tag} className="flex items-center gap-2 text-xs font-bold text-red-500">
                        <Target className="w-4 h-4" /> {tag}
                     </div>
                   ))}
                 </div>
              </div>
           </div>
        </div>

        {/* --- BLOG CHAPTER 05 --- */}
        <div className="mb-24">
           <h2 className="text-3xl font-black text-[#1a1c21] mb-6">05. Fiscal Integrity & Revenue Operations</h2>
           <p className="text-[#5b6676] text-lg mb-10 leading-relaxed">
             Mastering cash flow requires deep integration between Billing, Expenses, and Payroll. 
             CRM provides a unified Accounting module that syncs these streams into a clear 
             profit-and-loss landscape.
           </p>
           
          <div className="relative rounded-3xl bg-gradient-to-br from-white to-gray-50/80 border border-gray-200/80 shadow-lg hover:shadow-xl transition-all duration-300 p-8 flex flex-col md:flex-row gap-8 items-center overflow-hidden">
  {/* Decorative accent */}
  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -z-0 opacity-60"></div>
  
  {/* Left section */}
  <div className="md:w-1/3 relative z-10">
    <div className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-2">
      Net Profit
    </div>
    <p className="text-gray-500 font-semibold uppercase text-[11px] tracking-wider flex items-center gap-2">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
      Live Auto-Calculation
    </p>
  </div>

  {/* Right section - metrics */}
  <div className="md:w-2/3 grid grid-cols-2 gap-6 relative z-10">
    <div className="space-y-1">
      <div className="text-gray-800 font-bold text-base md:text-lg">Total Revenue</div>
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
        Collected Invoices
      </div>
    </div>
    <div className="space-y-1">
      <div className="text-gray-800 font-bold text-base md:text-lg">Total Expenses</div>
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
        Approved & Payroll
      </div>
    </div>
  </div>
</div>

           <div className="mt-10 grid sm:grid-cols-2 gap-6">
              <div className="p-8 border border-gray-100 rounded-[2.5rem] bg-gray-50">
                 <h4 className="font-bold text-[#1a1c21] mb-4">Invoice Lifecycle</h4>
                 <div className="space-y-2">
                   {['Draft (Preparation)', 'Sent (Issued)', 'Paid (Settled)', 'Overdue (Past due)'].map(i => (
                     <div key={i} className="text-sm font-semibold text-[#5b6676] flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#5f6dff]" /> {i}
                     </div>
                   ))}
                 </div>
              </div>
              <div className="p-8 border border-gray-100 rounded-[2.5rem] bg-gray-50">
                 <h4 className="font-bold text-[#1a1c21] mb-4">Expense Approval</h4>
                 <div className="space-y-2">
                   {['Pending (Awaiting review)', 'Approved (Verified)', 'Reimbursed (Settled)'].map(e => (
                     <div key={e} className="text-sm font-semibold text-[#5b6676] flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#5f6dff]" /> {e}
                     </div>
                   ))}
                 </div>
              </div>
           </div>
        </div>

        {/* --- BLOG CHAPTER 06 --- */}
        <div className="mb-10">
           <h2 className="text-3xl font-black text-[#1a1c21] mb-6">06. Intelligence & Configuration</h2>
           <p className="text-[#5b6676] text-lg mb-10 leading-relaxed">
             Turning raw data into "Business Intelligence" is the ultimate goal. Through advanced 
             filtering and visual analytics, management can gauge workforce efficiency and project velocity.
           </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
  {[
    { l: 'Net Profit Margin', d: 'Profitability %' },
    { l: 'Billable Utilization', d: 'Resource Efficiency' },
    { l: 'Project Velocity', d: 'Speed of execution' }
  ].map((k, idx) => (
    <div 
      key={k.l} 
      className="group relative p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden"
    >
      {/* Subtle gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 to-indigo-50/0 group-hover:from-indigo-50/40 transition-all duration-500"></div>
      
      <div className="relative z-10">
        {/* Metric value placeholder – replace with real data */}
        <div className="text-3xl font-extrabold text-gray-800 mb-2 tracking-tight">
          {idx === 0 ? '—' : idx === 1 ? '—' : '—'}
        </div>
        
        {/* Title */}
        <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">
          {k.l}
        </div>
        
        {/* Description */}
        <p className="text-xs text-gray-500 font-medium leading-relaxed">
          {k.d}
        </p>
        
        {/* Optional: subtle bottom accent line on hover */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-400/0 via-indigo-400/0 to-indigo-400/0 group-hover:via-indigo-400/40 transition-all duration-500"></div>
      </div>
    </div>
  ))}
</div>

           <div className="bg-gray-50 p-10 rounded-[2.5rem] border border-gray-100">
              <h3 className="text-xl font-bold text-[#1a1c21] mb-6">System Configuration</h3>
              <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                 {[
                   { t: 'Branding', d: 'Logos & Footer UI' },
                   { t: 'Billing Prefixes', d: 'Invoice sequences' },
                   { t: 'Security', d: 'Credential governance' },
                   { t: 'Profile', d: 'User preferences' }
                 ].map(s => (
                   <div key={s.t}>
                      <h4 className="text-sm font-bold text-[#1a1c21] mb-1">{s.t}</h4>
                      <p className="text-xs text-[#5b6676]">{s.d}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </section>
  );
}
