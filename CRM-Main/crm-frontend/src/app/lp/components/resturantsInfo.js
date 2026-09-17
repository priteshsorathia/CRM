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
  UtensilsCrossed,
  TableProperties,
  Flame,
  MousePointer2,
  ChefHat,
  Receipt,
  Users2,
  BarChart,
  History,
  Settings,
  ShieldCheck,
  Zap,
  Clock3,
  Search,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Monitor,
  Pizza,
  Coffee,
  IceCream,
  CircleDot,
  UserCheck,
  Lock,
  Target,
  BadgeCheck,
  Calculator
} from 'lucide-react';

export default function RestaurantsInfo() {
  const router = useRouter();

  const tableOfContents = [
    "Today's Performance Summary", "Table Master & Live Status", "Take Order & Menu Control", 
    "Running Orders Hub", "Menu Management & Availability", "Restaurant Billing Ops", 
    "HRMS & Staff Attendance", "Reports & Billing Insights", "System Activity Monitoring", 
    "Global Configuration", "Role-Based Access Control"
  ];

  return (
    <section className="pt-10 pb-10 bg-white font-sans selection:bg-[#5f6dff] selection:text-white">
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
            <span className="px-3 py-1 bg-[#5f6dff]/10 rounded-full">Restaurant POS</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-semibold text-[#1a1c21] leading-[1.1] mb-8 tracking-tight">
            CRM Restaurant Module: Mastering <span className="text-[#5f6dff]">Kitchen & Service</span> Velocity
          </h1>

          <hr className="border-[#5f6dff]" />
        </div>

        {/* --- INTRODUCTION --- */}
        <div className="prose prose-lg max-w-none text-[#5b6676] leading-relaxed mb-20">
          <p className="text-xl font-medium text-[#1a1c21] mb-6">
            Seamless coordination between the front-of-house and the kitchen is the pulse of every successful restaurant. 
            CRM Restaurant Module provides an <span className="text-[#5f6dff] font-bold">End-to-End Operating System</span> 
            designed for real-time table management, precision ordering, and deep fiscal analytics.
          </p>
          <p className="mb-6">
            From role-based kitchen workflows to complex dine-in billing and staff attendance, this module centralizes 
            every critical touchpoint. It ensures your service remains fluid, your kitchen stays synced, and your 
            profitability is always visible.
          </p>
          
          <div className="bg-[#f8faff] rounded-[2rem] p-8 my-12 border border-[#5f6dff]/10 shadow-sm">
             <h4 className="text-sm font-black text-[#5f6dff] uppercase tracking-widest mb-6 px-1">Inside the Restaurant Guide:</h4>
             <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-2 m-0 p-0 list-none font-bold text-[#1a1c21]">
                {tableOfContents.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 hover:text-[#5f6dff] cursor-pointer py-1 transition-colors">
                    <ChevronRight className="w-4 h-4 text-[#5f6dff]" /> {item}
                  </li>
                ))}
             </ul>
          </div>
        </div>

        {/* --- BLOG CHAPTER 01: DASHBOARD --- */}
        <div className="mb-24">
          <h2 className="text-3xl font-black text-[#1a1c21] mb-6">01. Real-Time Performance Command</h2>
          <p className="text-[#5b6676] text-lg mb-10 leading-relaxed font-normal">
            The Restaurant Dashboard is an auto-refreshing command center that provides instant operational 
            visibility during your busiest dining sessions.
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10 text-center">
             {[
               { v: 'Total Orders', l: 'Today\'s Vol' },
               { v: 'Total Sales', l: 'Today\'s Revenue' },
               { v: 'Active Tables', l: 'Real-time Occupancy' },
               { v: 'Preparing', l: 'Kitchen Load' }
             ].map(stat => (
               <div key={stat.l} className="p-6 bg-white border border-gray-100 rounded-3xl group hover:border-[#5f6dff]/30 transition-all">
                  <div className="text-2xl font-black text-[#5f6dff] mb-1 group-hover:scale-110 transition-transform">{stat.v}</div>
                  <div className="text-[10px] font-black text-[#5b6676] uppercase tracking-widest leading-none">{stat.l}</div>
               </div>
             ))}
          </div>

          <div className="p-10 bg-[#f8faff] rounded-[3rem] border border-[#5f6dff]/10">
             <h4 className="text-xl font-bold text-[#1a1c21] mb-8">Fast Access Pipeline</h4>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {['New Order', 'Billing', 'Tables Master', 'Running Orders', 'Kitchen KDS', 'Staff HRMS'].map(act => (
                  <div key={act} className="px-6 py-4 bg-white rounded-2xl border border-gray-100 flex items-center justify-between group cursor-pointer hover:border-[#5f6dff]/40 transition-all">
                     <span className="text-sm font-bold text-[#1a1c21]">{act}</span>
                     <Zap className="w-4 h-4 text-[#5f6dff] opacity-40 group-hover:opacity-100" />
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* --- BLOG CHAPTER 02: TABLE MASTER --- */}
        <div className="mb-24">
           <h2 className="text-3xl font-black text-[#1a1c21] mb-6">02. Table Master: Live Status Control</h2>
           <p className="text-[#5b6676] text-lg mb-10 leading-relaxed font-normal">
             Master your floor plan with color-coded live tracking. The Table Master module ensures 
             smooth dine-in operations and instant visibility of table utilization.
           </p>
           
           {/* <figure className="mb-12">
            <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl shadow-[#5f6dff]/20">
              <Image src="/restaurant_table_ui_1776172808647.png" alt="Table Management Floor Plan" fill className="object-cover" />
            </div>
            <figcaption className="text-center text-xs font-bold text-[#5b6676] mt-4 uppercase tracking-widest">Fig 2.1: Live Table Status & Capacity Mapping</figcaption>
          </figure> */}

           <div className="grid sm:grid-cols-2 gap-8 mb-10">
              <div className="space-y-4">
                 <h4 className="font-bold text-[#1a1c21] text-lg mb-4">Color-Coded Logic</h4>
                 {[
                   { s: 'Available', c: 'bg-green-500', d: 'Ready for new guest arrival.' },
                   { s: 'Occupied', c: 'bg-red-500', d: 'Serving active order context.' },
                   { s: 'Reserved', c: 'bg-orange-500', d: 'Booked via reservation hub.' },
                   { s: 'Unavailable', c: 'bg-gray-400', d: 'Disabled for maintenance.' }
                 ].map(status => (
                   <div key={status.s} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                      <div className={`w-3 h-3 rounded-full ${status.c} animate-pulse`} />
                      <div>
                        <div className="text-xs font-black text-[#1a1c21] uppercase tracking-wider">{status.s}</div>
                        <div className="text-[10px] text-[#5b6676] font-medium">{status.d}</div>
                      </div>
                   </div>
                 ))}
              </div>
              <div className="p-8 bg-white border-2 border-gray-100 rounded-[2.5rem] flex flex-col justify-center">
                 <ul className="space-y-4 text-xl font-bold text-[#5b6676]">
                    <li className="flex items-center gap-2"><div className="w-6 h-6 rounded bg-[#5f6dff]/10 text-[#5f6dff] flex items-center justify-center text-[8px] tracking-tighter">ID</div> Unique Table Number</li>
                    <li className="flex items-center gap-2"><div className="w-6 h-6 rounded bg-[#5f6dff]/10 text-[#5f6dff] flex items-center justify-center text-[8px] tracking-tighter">CAP</div> Seating Capacity Control</li>
                    <li className="flex items-center gap-2"><div className="w-6 h-6 rounded bg-[#5f6dff]/10 text-[#5f6dff] flex items-center justify-center text-[8px] tracking-tighter">LOC</div> Section / Area Assignment</li>
                 </ul>
              </div>
           </div>
        </div>

        {/* --- BLOG CHAPTER 03: TAKE ORDER --- */}
        <div className="mb-24">
           <h2 className="text-3xl font-black text-[#1a1c21] mb-6">03. High-Velocity Order Processing</h2>
           <p className="text-[#5b6676] text-lg mb-10 leading-relaxed font-normal">
             Designed for speed and precision, the Take Order module enables staff to process 
             Dine-In and Takeaway orders with zero friction.
           </p>
           
           <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="p-6 border border-gray-100 rounded-[2rem] bg-gray-50/50">
                 <h4 className="text-[10px] font-black text-[#5f6dff] uppercase mb-4 tracking-widest">Order Modes</h4>
                 <div className="flex flex-col gap-2">
                    <div className="px-4 py-3 bg-white rounded-xl text-xs font-bold text-[#1a1c21] border border-gray-200">Table Integrated</div>
                    <div className="px-4 py-3 bg-white rounded-xl text-xs font-bold text-[#1a1c21] border border-gray-200">Express Takeaway</div>
                 </div>
              </div>
              <div className="md:col-span-2 p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm">
                 <h4 className="text-xs font-black text-[#1a1c21] uppercase mb-6 tracking-widest">Intelligent Menu Navigation</h4>
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { l: 'Desserts', i: IceCream },
                      { l: 'Main Course', i: UtensilsCrossed },
                      { l: 'Starters', i: Flame },
                      { l: 'Beverages', i: Coffee }
                    ].map(cat => (
                      <div key={cat.l} className="p-4 bg-[#f8faff] rounded-2xl flex flex-col items-center gap-2 text-center group cursor-pointer hover:bg-[#5f6dff] hover:text-white transition-all">
                         <cat.i className="w-5 h-5 text-[#5f6dff] group-hover:text-white" />
                         <span className="text-[10px] font-black uppercase tracking-tighter leading-tight">{cat.l}</span>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           <div className="p-10 bg-[#f8faff] rounded-[3rem] border border-[#5f6dff]/10 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 text-[#5f6dff]">
                 <Calculator className="w-48 h-48" />
              </div>
              <h4 className="font-black text-[#1a1c21] uppercase text-xs mb-10 tracking-widest relative z-10">Fiscal Computing Engine</h4>
              <div className="grid sm:grid-cols-3 gap-10 relative z-10">
                 <div className="flex flex-col justify-center">
                    <div className="text-4xl font-black text-[#5f6dff] mb-2 leading-none">GST 18%</div>
                    <p className="text-[10px] font-black text-[#5b6676] uppercase tracking-widest">National Compliance Layer</p>
                 </div>
                 <div className="sm:col-span-2 space-y-6">
                    <p className="text-sm font-bold text-[#1a1c21] leading-relaxed italic border-l-2 border-[#5f6dff] pl-6 py-1">
                      "Real-time orchestration: [Subtotal + GST = Final Total]. Every line item adjustment triggers 
                      an instant re-calculation across the entire order context."
                    </p>
                    <div className="flex flex-wrap gap-2">
                       <span className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase text-[#5b6676]">Live Computation</span>
                       <span className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase text-[#5b6676]">Instant State Sync</span>
                       <span className="px-4 py-2 bg-[#5f6dff]/5 border border-[#5f6dff]/10 rounded-xl text-[10px] font-black uppercase text-[#5f6dff]">Decimal Precision</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* --- BLOG CHAPTER 04: RUNNING ORDERS --- */}
        <div className="mb-24">
           <h2 className="text-3xl font-black text-[#1a1c21] mb-6">04. KDS & Running Order Hub</h2>
           <p className="text-[#5b6676] text-lg mb-10 leading-relaxed font-normal">
             Coordinate front-of-house staff and kitchen teams with a real-time status tracker. 
             Every order follows a rigid four-stage lifecycle.
           </p>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {[
                { s: 'Pending', c: 'bg-orange-100 text-orange-600' },
                { s: 'Preparing', c: 'bg-blue-100 text-blue-600' },
                { s: 'Ready', c: 'bg-green-100 text-green-600' },
                { s: 'Completed', c: 'bg-gray-100 text-gray-500' }
              ].map(status => (
                <div key={status.s} className={`p-5 rounded-3xl text-center font-black uppercase text-[10px] ${status.c}`}>
                   {status.s}
                </div>
              ))}
           </div>

           <div className="p-8 border-2 border-gray-100 rounded-[2.5rem] bg-white">
              <h4 className="font-bold text-[#1a1c21] mb-6">Kitchen View Operations</h4>
              <ul className="grid sm:grid-cols-2 gap-4 list-none m-0 p-0 font-bold text-sm text-[#5b6676]">
                 <li className="flex items-center gap-3"><Monitor className="w-5 h-5 text-[#5f6dff]/40" /> Live Kitchen KDS Display</li>
                 <li className="flex items-center gap-3"><Clock3 className="w-5 h-5 text-[#5f6dff]/40" /> Order Time Aging Hub</li>
                 <li className="flex items-center gap-3"><Users2 className="w-5 h-5 text-[#5f6dff]/40" /> Staff Attribution Logic</li>
                 <li className="flex items-center gap-3"><History className="w-5 h-5 text-[#5f6dff]/40" /> Full Audit Trail per Card</li>
              </ul>
           </div>
        </div>

        {/* --- BLOG CHAPTER 05: MENU MANAGEMENT --- */}
        <div className="mb-24">
           <h2 className="text-3xl font-black text-[#1a1c21] mb-6">05. Menu Orchestration & Control</h2>
           <p className="text-[#5b6676] text-lg mb-10 leading-relaxed font-normal">
             Administrators can configure food items, pricing, and availability with ease. 
             Seasonal items and out-of-stock variations can be toggled instantly.
           </p>
           <div className="grid sm:grid-cols-2 gap-8">
              <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                 <h4 className="font-bold text-[#1a1c21] mb-4">Availability Toggles</h4>
                 <p className="text-xs text-[#5b6676] leading-relaxed mb-8 font-medium italic">
                    "Instantly hide items from the Take Order screen during out-of-stock situations 
                    or temporary kitchen restrictions."
                 </p>
                 <div className="flex gap-2">
                   <div className="w-10 h-5 bg-[#5f6dff] rounded-full flex items-center px-1"><div className="w-3 h-3 bg-white rounded-full ml-auto" /></div>
                   <span className="text-[10px] font-black uppercase text-[#1a1c21]">Global Logic Active</span>
                 </div>
              </div>
              <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                 <h4 className="font-bold text-[#1a1c21] mb-5">Soft-Delete Trash</h4>
                 <div className="p-4 bg-white rounded-2xl border border-gray-100 flex items-center gap-4">
                    <History className="w-6 h-6 text-[#5f6dff]/50" />
                    <div>
                       <p className="text-[10px] font-black text-[#1a1c21] uppercase">Recycle Hub</p>
                       <p className="text-[10px] text-[#5b6676]">Restore deleted menu items anytime.</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* --- BLOG CHAPTER 06: BILLING --- */}
        <div className="mb-24">
           <h2 className="text-3xl font-black text-[#1a1c21] mb-6">06. Restaurant Billing Ecosystem</h2>
           <p className="text-[#5b6676] text-lg mb-10 leading-relaxed font-normal">
             CRM manages the complete billing lifecycle from dine-in orders to manual bill creation, 
             ensuring date-based financial integrity.
           </p>
           <div className="p-10 border-2 border-gray-100 rounded-[3rem] bg-white">
              <div className="flex items-center gap-4 pb-8 border-b border-gray-100 mb-8">
                 <Receipt className="w-8 h-8 text-[#5f6dff]" />
                 <h4 className="text-2xl font-black text-[#1a1c21]">Invoice Management</h4>
              </div>
              <div className="grid sm:grid-cols-2 gap-x-12 gap-y-6 text-sm font-bold text-[#5b6676]">
                 <div className="flex justify-between border-b pb-2"><span>Paid Indicators</span> <CheckCircle2 className="w-4 h-4 text-[#5f6dff]" /></div>
                 <div className="flex justify-between border-b pb-2"><span>Unpaid Tracking</span> <CheckCircle2 className="w-4 h-4 text-[#5f6dff]" /></div>
                 <div className="flex justify-between border-b pb-2"><span>Bill Numbering</span> <CheckCircle2 className="w-4 h-4 text-[#5f6dff]" /></div>
                 <div className="flex justify-between border-b pb-2"><span>Thermal Output</span> <CheckCircle2 className="w-4 h-4 text-[#5f6dff]" /></div>
              </div>
              <p className="mt-8 text-xs text-[#5b6676] italic font-medium leading-relaxed">
                "When a bill is finalized, the table status automatically becomes 'Available,' 
                ensuring smooth dine-in turnover and accurate inventory reporting."
              </p>
           </div>
        </div>

        {/* --- BLOG CHAPTER 07: HRMS --- */}
        <div className="mb-24">
           <h2 className="text-3xl font-black text-[#1a1c21] mb-6">07. HRMS & Workforce Orchestration</h2>
           <p className="text-[#5b6676] text-lg mb-10 leading-relaxed font-normal">
             Monitor restaurant staff attendance and payroll in real-time. Calculate working hours 
             and punch-in thresholds for a payroll-ready restaurant workforce.
           </p>
           <div className="grid sm:grid-cols-3 gap-6">
              {[
                { t: 'Attendance', v: '9:00 AM Sync', d: 'Daily Clock-in / Out' },
                { t: 'Staff Roles', v: 'Chef, Staff, Waiter', d: 'Departmental Breakdown' },
                { v: 'CRM Manager', l: 'Today: Present', d: 'Live Status Records' }
              ].map((h, i) => (
                <div key={i} className="p-6 bg-[#f8faff] rounded-3xl border border-[#5f6dff]/10">
                   {h.t && <div className="text-[10px] font-black text-[#5f6dff] uppercase mb-4 tracking-widest">{h.t}</div>}
                   <div className="text-sm font-black text-[#1a1c21] mb-1">{h.v || h.l}</div>
                   <div className="text-[10px] font-bold text-[#5b6676]">{h.d}</div>
                </div>
              ))}
           </div>
        </div>

        {/* --- BLOG CHAPTER 08: RBAC & SECURITY --- */}
        <div className="pb-10 border-b border-gray-100">
           <h2 className="text-3xl font-black text-[#1a1c21] mb-12">08. Security: The RBAC Permissions Layer</h2>
           <div className="space-y-10">
              <div className="p-10 bg-[#fcfdff] border border-gray-100 rounded-[3.5rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-[#5f6dff]">
                   <ShieldCheck className="w-64 h-64" />
                </div>
                <div className="relative z-10 grid md:grid-cols-2 gap-12">
                   {[
                     { r: 'Owner', a: 'Unrestricted Access', d: 'Full control over billing, staff, activity logs and system configuration.' },
                     { r: 'Manager', a: 'Operational Access', d: 'Strictly restaurant operations and billing execution without admin control.' },
                     { r: 'Waiter', a: 'Service Access', d: 'Limited to table master and take order. No billing or admin authority.' },
                     { r: 'Cook', a: 'Kitchen Access', d: 'Strictly kitchen workflow and order preparation management.' }
                   ].map(role => (
                     <div key={role.r} className="group">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-[#5f6dff] mb-4">
                           <UserCheck className="w-5 h-5" />
                        </div>
                        <h4 className="text-lg font-black text-[#1a1c21] group-hover:text-[#5f6dff] transition-colors">{role.r}</h4>
                        <p className="text-[10px] font-black uppercase text-[#5f6dff] mb-2">{role.a}</p>
                        <p className="text-xs text-[#5b6676] leading-relaxed font-medium">{role.d}</p>
                     </div>
                   ))}
                </div>
              </div>
           </div>
        </div>
      </div>
    </section>
  );
}
