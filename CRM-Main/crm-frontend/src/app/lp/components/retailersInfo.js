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
  Receipt,
  Users,
  Box,
  Users2,
  History,
  Settings,
  LineChart,
  TrendingUp,
  TableProperties,
  Wallet,
  Calculator,
  Sticker,
  Cpu,
  Server,
  Database,
  Search,
  Zap,
  Flame,
  MousePointer2,
  Lock,
  Target,
  Scale,
  CreditCard,
  Percent,
  Printer,
  Download,
  Eye,
  Filter,
  Plus,
  BadgeCheck,
  Clock3,
  Key,
  QrCode,
  FileSpreadsheet,
  FileText,
  PieChart
} from 'lucide-react';

export default function RetailersInfo() {
  const router = useRouter();

  const tableOfContents = [
    "Omnichannel Dashboard", "Advanced Invoicing Engine", "Client Relationship & Ledger", 
    "Intelligent Inventory", "HRMS & Workforce Ops", "Operational Activity Logs", "Global Configuration"
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
            <span className="px-3 py-1 bg-[#5f6dff]/10 rounded-full">Retail Strategy</span>
            <span className="px-3 py-1 bg-[#5f6dff]/10 rounded-full">Automated POS</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-semibold text-[#1a1c21] leading-[1.1] mb-8 tracking-tight">
            CRM POS Software: The Ultimate <span className="text-[#5f6dff]">Retailer Lifecycle</span> Guide
          </h1>
          <hr className="border-[#5f6dff]" />
        </div>

        {/* --- INTRODUCTION --- */}
        <div className="prose prose-lg max-w-none text-[#5b6676] leading-relaxed mb-20">
          <p className="text-xl font-medium text-[#1a1c21] mb-6">
            High-velocity retail requires more than just a cash register. It requires a <span className="text-[#5f6dff] font-bold">Synchronized Ecosystem</span> 
            that masters inventory precision, client debt tracking, and automated workforce management.
          </p>
          <p className="mb-6">
            CRM POS Software is a comprehensive architecture designed for modern retailers. It seamlessly integrates 
            real-time sales analytics with deep accounting and HR operations, providing a single source of truth for 
            your scaling shop or enterprise.
          </p>
          
          <div className="bg-[#f8faff] rounded-[2rem] p-8 my-12 border border-[#5f6dff]/10 shadow-sm">
             <h4 className="text-sm font-black text-[#5f6dff] uppercase tracking-widest mb-6 px-1">Inside this Guide:</h4>
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
          <h2 className="text-3xl font-black text-[#1a1c21] mb-6">01. Dashboard: Business Intelligence Hub</h2>
          <p className="text-[#5b6676] text-lg mb-10 leading-relaxed">
            The Dashboard serves as the central command center, transforming raw data into actionable insights for 
            immediate business diagnostics.
          </p>

          <figure className="mb-12">
            <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl shadow-[#5f6dff]/20">
              <Image src="/og-image.png" alt="Dashboard" fill className="object-cover" />
            </div>
          </figure>
          
          <div className="grid sm:grid-cols-2 gap-4 mb-10">
             {[
               { t: 'Revenue Intelligence', d: 'Real-time tracking of Total, Today\'s, Weekly, and Monthly revenue streams.', i: TrendingUp },
               { t: 'Temporal Analysis', d: 'Switch perspectives between Daily, Monthly, and custom Overall date ranges.', i: Calendar },
               { t: 'Product Heatmap', d: 'Identify high-velocity items by Qty sold and total Revenue contribution.', i: PieChart },
               { t: 'Invoice Feed', d: 'Live chronological stream of recent sales with instant action protocols.', i: History }
             ].map(item => (
               <div key={item.t} className="p-7 bg-[#fcfdff] border border-gray-100 rounded-3xl hover:border-[#5f6dff]/30 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-[#5f6dff] mb-4 group-hover:scale-110 transition-transform">
                     <item.i className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-[#1a1c21] mb-1">{item.t}</div>
                  <div className="text-sm text-[#5b6676] font-medium leading-relaxed">{item.d}</div>
               </div>
             ))}
          </div>
          <div className="bg-[#f8faff] rounded-[2.5rem] p-8 border border-[#5f6dff]/10">
             <div className="flex items-center gap-4 mb-6">
                <LineChart className="w-6 h-6 text-[#5f6dff]" />
                <h4 className="font-bold text-[#1a1c21]">Week Revenue Visualizer</h4>
             </div>
             <p className="text-sm text-[#5b6676] italic">
               "Utilizes a high-fidelity line chart to represent weekly trends, allowing administrators 
               to visualize cyclical footfall and sales velocity at a glance."
             </p>
          </div>
        </div>

        {/* --- BLOG CHAPTER 02: INVOICING --- */}
        <div className="mb-24">
           <h2 className="text-3xl font-black text-[#1a1c21] mb-6">02. Advanced Invoicing & Sales Engine</h2>
           <p className="text-[#5b6676] text-lg mb-10 leading-relaxed">
             Beyond simple billing, our Invoicing Engine provides professional management of the entire 
             sales transaction lifecycle, from search to thermal output.
           </p>
           
           <div className="space-y-12">
              <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm">
                 <h3 className="text-xl font-bold text-[#1a1c21] mb-6 flex items-center gap-3">
                    <Search className="w-5 h-5 text-[#5f6dff]" /> Search & Granular Filtering
                 </h3>
                 <div className="grid md:grid-cols-4 gap-4">
                    {['Date Range', 'Staff Member', 'Total Amount', 'Newest/Oldest'].map(f => (
                      <div key={f} className="px-4 py-3 bg-gray-50 rounded-xl text-[10px] font-black uppercase text-[#5b6676] border border-gray-100/50 flex items-center gap-2">
                        <Filter className="w-3 h-3" /> {f}
                      </div>
                    ))}
                 </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                 <div className="p-8 bg-[#f8faff] rounded-[3rem] border border-[#5f6dff]/10">
                    <h4 className="font-black text-[#5f6dff] uppercase text-xs mb-6 tracking-widest">Billing Logic</h4>
                    <ul className="space-y-4 m-0 font-bold text-sm text-[#1a1c21]">
                       <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#5f6dff]" /> Customer CRM & GST Auto-fill</li>
                       <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#5f6dff]" /> Multi-item Catalog Search</li>
                       <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#5f6dff]" /> Dynamic Unit & Price Adjustment</li>
                       <li className="flex items-center gap-3 font-black text-[#5f6dff]"><Scale className="w-4 h-4" /> Weight-to-Amount Auto-Calc</li>
                    </ul>
                 </div>
                 <div className="p-8 bg-white border border-gray-100 rounded-[3rem]">
                    <h4 className="font-black text-[#1a1c21] uppercase text-xs mb-6 tracking-widest">Financial Matrix</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-gray-50 rounded-2xl">
                          <div className="text-[10px] font-black text-[#5b6676] uppercase mb-1">Tax Engine</div>
                          <div className="text-sm font-bold text-[#1a1c21]">18% GST (Auto)</div>
                       </div>
                       <div className="p-4 bg-gray-50 rounded-2xl">
                          <div className="text-[10px] font-black text-[#5b6676] uppercase mb-1">Discounting</div>
                          <div className="text-sm font-bold text-[#1a1c21]">Flat / % Support</div>
                       </div>
                       <div className="col-span-2 p-4 bg-[#5f6dff]/5 rounded-2xl border border-[#5f6dff]/10 text-center">
                          <div className="text-[10px] font-black text-[#5f6dff] uppercase mb-1">Tenure / EMI</div>
                          <div className="text-xs font-bold text-[#1a1c21]">3M, 6M, 9M, 12M Durations</div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-[#fcfdff] border border-gray-100 rounded-[3rem] p-10 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-10 opacity-[0.03] text-[#5f6dff]">
                    <Printer className="w-64 h-64" />
                 </div>
                 <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center">
                    <div className="md:w-1/3">
                       <h4 className="text-xs font-black text-[#5f6dff] uppercase tracking-widest mb-6 px-1">Output Protocols</h4>
                       <div className="space-y-4">
                          <div className="flex items-center gap-3 text-sm font-bold text-[#1a1c21] bg-white p-3 rounded-2xl border border-gray-100 shadow-sm"><Printer className="w-4 h-4 text-[#5f6dff]" /> A4 Layout (Pro)</div>
                          <div className="flex items-center gap-3 text-sm font-bold text-[#1a1c21] bg-white p-3 rounded-2xl border border-gray-100 shadow-sm"><Printer className="w-4 h-4 text-[#5f6dff]" /> 80mm Thermal (POS)</div>
                       </div>
                    </div>
                    <div className="md:w-2/3 border-l border-gray-100 pl-0 md:pl-10">
                       <p className="text-sm font-bold text-[#5b6676] mb-8 italic leading-relaxed">
                         "Professional precision: Automated PDF generation with integrated 
                         business branding, itemized tax breakdowns, and enterprise-ready net totals."
                       </p>
                       <div className="flex flex-wrap gap-4">
                          <button className="px-8 py-3 bg-[#1a1c21] text-white rounded-xl text-xs font-black uppercase hover:bg-[#5f6dff] transition-colors flex items-center gap-2">
                             <Printer className="w-3.5 h-3.5" /> Print Invoice
                          </button>
                          <button className="px-8 py-3 border-2 border-gray-100 text-[#1a1c21] rounded-xl text-xs font-black uppercase hover:border-[#5f6dff]/30 hover:bg-[#5f6dff]/5 transition-all flex items-center gap-2">
                             <Download className="w-3.5 h-3.5 text-[#5f6dff]" /> Download PDF
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* --- BLOG CHAPTER 03: CLIENTS --- */}
        <div className="mb-24">
           <h2 className="text-3xl font-black text-[#1a1c21] mb-6">03. Client Relationship & Debt Matrix</h2>
           <p className="text-[#5b6676] text-lg mb-10 leading-relaxed">
             Track every client lifecycle with precision ledgers, outstanding balance alerts, 
             and integrated payment recording.
           </p>
           
           <div className="grid md:grid-cols-2 gap-6 mb-10">
              <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                 <h4 className="text-xs font-black text-[#1a1c21] uppercase mb-6 tracking-widest">Ledger Metrics</h4>
                 <div className="space-y-4">
                    {[
                      { l: 'Total Outstanding', v: 'Overall Debt' },
                      { l: 'Total Invoices', v: 'Billing Count' },
                      { l: 'Avg. Due Amount', v: 'Risk Profiling' }
                    ].map(m => (
                      <div key={m.l} className="flex justify-between items-center py-2 border-b border-gray-200">
                         <span className="text-sm font-bold text-[#5b6676]">{m.l}</span>
                         <span className="text-xs font-black text-[#1a1c21]">{m.v}</span>
                      </div>
                    ))}
                 </div>
              </div>
              <div className="p-8 bg-[#5f6dff] rounded-[2.5rem] text-white flex flex-col justify-center">
                 <h4 className="text-xs font-black text-white/50 uppercase mb-4 tracking-widest">EMI Integrated Tracker</h4>
                 <ul className="space-y-3 m-0 text-[11px] font-bold">
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3" /> Principal vs Interest Logic</li>
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3" /> Monthly Installment Computation</li>
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3" /> Remaining Outstanding Sync</li>
                 </ul>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                 <CreditCard className="w-6 h-6 text-[#5f6dff]" />
                 <h4 className="font-bold text-[#1a1c21]">Rapid Payment Recording</h4>
              </div>
              <p className="text-sm text-[#5b6676] mb-8">Record payments directly into the client profile with mode selection (Cash, UPI, Bank) and internal reference notes.</p>
              <div className="grid grid-cols-3 gap-3">
                 {['Invoiced', 'Paid', 'Pending'].map(s => (
                   <div key={s} className="px-4 py-2 bg-gray-50 rounded-xl text-[10px] font-black text-center text-[#1a1c21] uppercase tracking-tighter">{s} Status</div>
                 ))}
              </div>
           </div>
        </div>

        {/* --- BLOG CHAPTER 04: INVENTORY --- */}
        <div className="mb-24">
           <h2 className="text-3xl font-black text-[#1a1c21] mb-6">04. Inventory & Stock Intelligence</h2>
           <p className="text-[#5b6676] text-lg mb-10 leading-relaxed font-normal">
             Master your product lifecycle with real-time stock logging, item profit tracking, 
             and categorical organization.
           </p>

           <div className="grid md:grid-cols-3 gap-6 mb-10">
              {[
                { l: 'Profit Analysis', d: 'Price vs Cost vs Margin per item context.', i: TrendingUp },
                { l: 'Stock IN/OUT', d: 'Granular logs for every stock movement.', i: History },
                { l: 'Categorization', d: 'Manage deep parent/child item categories.', i: Box }
              ].map(tech => (
                <div key={tech.l} className="p-6 bg-[#fcfdff] border border-gray-100 rounded-2xl group transition-all">
                   <div className="w-10 h-10 rounded-xl bg-[#5f6dff]/5 flex items-center justify-center text-[#5f6dff] mb-4">
                      <tech.i className="w-5 h-5" />
                   </div>
                   <h5 className="font-bold text-[#1a1c21] mb-2">{tech.l}</h5>
                   <p className="text-[11px] text-[#5b6676] font-medium leading-relaxed">{tech.d}</p>
                </div>
              ))}
           </div>

           <div className="p-10 border border-gray-100 rounded-[3rem] bg-gray-50">
              <h4 className="font-black text-[#1a1c21] uppercase text-xs mb-8 tracking-widest text-center">Stock Audit Controls</h4>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                 {['Stock Search', 'Date Filtering', 'Item Filter', 'Type: IN/OUT'].map(ctrl => (
                   <div key={ctrl} className="p-4 bg-white rounded-2xl border border-gray-100 text-[10px] font-black text-[#5b6676] uppercase text-center">{ctrl}</div>
                 ))}
              </div>
           </div>
        </div>

        {/* --- BLOG CHAPTER 05: HRMS --- */}
        <div className="mb-24">
           <h2 className="text-3xl font-black text-[#1a1c21] mb-6">05. Integrated HRMS & Workforce</h2>
           <p className="text-[#5b6676] text-lg mb-10 leading-relaxed font-normal">
             Streamline workforce administration from onboarding to automated payroll 
             generation within the same platform.
           </p>
           
           <div className="grid md:grid-cols-2 gap-10 mb-12">
              <div className="space-y-6">
                 <div className="p-6 bg-white border border-gray-100 rounded-[2rem] flex items-center gap-4">
                    <Users2 className="w-8 h-8 text-[#5f6dff]" />
                    <div>
                       <h4 className="font-bold text-[#1a1c21]">Administration</h4>
                       <p className="text-xs text-[#5b6676]">Add, manage, and track attendance cycles for the entire staff.</p>
                    </div>
                 </div>
                 <div className="p-6 border border-gray-100 rounded-[2rem] bg-gray-50">
                    <h4 className="text-xs font-black text-[#1a1c21] mb-4 uppercase tracking-widest">Payroll Metrics</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div><div className="text-xs font-bold text-[#5b6676]">Total Payroll</div><div className="text-lg font-black text-[#1a1c21]">₹0.00</div></div>
                       <div><div className="text-xs font-bold text-[#5b6676]">Staff Count</div><div className="text-lg font-black text-[#1a1c21]">Active</div></div>
                    </div>
                 </div>
              </div>
              <div className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col justify-start">
  {/* Title with modern accent bar */}
  <div className="relative mb-6">
    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Automation Engine</h4>
    <div className="w-12 h-0.5 bg-gradient-to-r from-indigo-500 to-indigo-300 rounded-full"></div>
  </div>
  
  {/* Description - clean and modern */}
  <p className="text-sm text-gray-600 leading-relaxed mb-8">
    Net Salary is auto-calculated based on basic salary structure multiplied by days worked within the cycle.
  </p>
  
  {/* Modern badge pills */}
  <div className="flex flex-wrap gap-3">
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-full text-xs font-medium text-gray-700 transition-colors duration-200 border border-gray-200">
      <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
      <span>CSV / Excel</span>
    </div>
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-full text-xs font-medium text-gray-700 transition-colors duration-200 border border-gray-200">
      <FileText className="w-3.5 h-3.5 text-indigo-500" />
      <span>PDF Reports</span>
    </div>
  </div>
</div>
           </div>
        </div>

        {/* --- BLOG CHAPTER 06: ACTIVITY LOGS --- */}
        {/* <div className="mb-24">
           <h2 className="text-3xl font-black text-[#1a1c21] mb-6">06. System Observability & Activity Logs</h2>
           <p className="text-[#5b6676] text-lg mb-10 leading-relaxed font-normal">
              Maintain absolute transparency with a centralized logging system that records 
              every user action and system-level event.
           </p>

           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
              {[
                { l: 'Total Activities', v: '83 Logs', c: 'text-[#1a1c21]' },
                { l: 'Success Rate', v: '100%', c: 'text-[#22c55e]' },
                { l: 'Anomalies', v: 'Zero', c: 'text-[#5b6676]' },
                { l: 'Modules', v: 'Active', c: 'text-[#5f6dff]' }
              ].map(stat => (
                <div key={stat.l} className="p-6 bg-white border border-gray-100 rounded-3xl text-center">
                   <div className={`text-xl font-black mb-1 ${stat.c}`}>{stat.v}</div>
                   <div className="text-[10px] font-black text-[#5b6676] uppercase tracking-widest">{stat.l}</div>
                </div>
              ))}
           </div>

           <div className="p-8 bg-[#fcfdff] border border-gray-100 rounded-3xl">
              <div className="flex justify-between items-center mb-6">
                 <h4 className="text-xs font-black text-[#1a1c21] uppercase tracking-widest">Filtering Matrix</h4>
                 <div className="px-4 py-2 bg-[#5f6dff] text-white text-[10px] font-black rounded-lg cursor-pointer">Export Report</div>
              </div>
              <div className="flex flex-wrap gap-4">
                 <span className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-bold text-[#5b6676]">All Modules</span>
                 <span className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-bold text-[#5b6676]">Status: Success</span>
                 <span className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-bold text-[#5b6676]">Temporal: Dec 2026</span>
              </div>
           </div>
        </div> */}

        {/* --- BLOG CHAPTER 07: GLOBAL SETTINGS --- */}
        <div className="mb-10">
  {/* Section header with modern accent line */}
  <div className="flex items-center gap-4 mb-12">
    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
      06. Global Governance & Configuration
    </h2>
  </div>

  <div className="grid md:grid-cols-2 gap-8">
    {/* Left card: Administration Layers */}
    <div className="group relative rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/80 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 to-indigo-50/0 group-hover:from-indigo-50/40 transition-all duration-500"></div>
      
      <div className="relative p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Settings className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-gray-800 text-lg">Administration Layers</h4>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: BadgeCheck, label: "Admin Auth" },
            { icon: BadgeCheck, label: "Company Identity" },
            { icon: BadgeCheck, label: "Invoice Schema" },
            { icon: BadgeCheck, label: "Key Security" }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2.5 text-sm font-medium text-gray-600 bg-gray-50/80 rounded-xl px-3 py-2.5 hover:bg-indigo-50 transition-colors duration-200">
              <item.icon className="w-4 h-4 text-indigo-500" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Right card: Integrated Payments Interface */}
    <div className="group relative rounded-2xl bg-gradient-to-br from-white to-gray-50/80 border border-gray-200/80 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all duration-500"></div>
      
      <div className="relative p-8">
        <div className="flex items-start justify-between mb-5">
          <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600 shadow-sm">
            <QrCode className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
            Active
          </span>
        </div>

        <h4 className="font-bold text-gray-800 text-xl mb-2 tracking-tight">
          Integrated Payments Interface
        </h4>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          Update your UPI ID to automatically generate and display payment QR codes on invoices, 
          facilitating rapid digital collections directly at point of sale.
        </p>

        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 transition-all hover:bg-indigo-100 cursor-default">
            Governance Ready
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
      </div>
    </section>
  );
}
