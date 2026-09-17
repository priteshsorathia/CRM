"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, 
  Users, 
  FileText, 
  Calendar as CalendarIcon,
  Wallet,
  Edit,
  Phone,
  Filter
} from "lucide-react";
import Pagination from "@/components/ui/Pagination";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchError, setSearchError] = useState("");

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ✅ DB SETTING: Wait for fetch
  const [hideNonTaxable, setHideNonTaxable] = useState(false);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

  // Search input validation & debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search === "") {
        setSearchError("");
        setDebouncedSearch("");
        return;
      }
      
      const trimmed = search.trim();
      if (trimmed === "") {
        setSearchError("Please enter a valid search term.");
        setDebouncedSearch("");
        return;
      }

      setSearchError("");
      setDebouncedSearch(trimmed);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedMonth]);

  // ✅ 1. Fetch DB Settings
  useEffect(() => {
    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoices/shop-details`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data && data.settings) {
                setHideNonTaxable(data.settings.hide_non_taxable || false);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSettingsLoaded(true);
        }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    // ✅ Wait for settings
    if (!isSettingsLoaded) return;

    const fetchClients = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}`;

        // ✅ Pass excludeNonTaxable and month to backend
        const response = await fetch(`${API_BASE}/api/invoices/unpaid-clients?excludeNonTaxable=${hideNonTaxable}&month=${selectedMonth}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setClients(data.clients || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [selectedMonth, hideNonTaxable, isSettingsLoaded]);

  // ✅ Filter & SORT Logic (Latest First)
  const filteredClients = clients
    .filter(c => {
      const query = debouncedSearch.toLowerCase();
      if (!query) return true;
      return c.customer_name.toLowerCase().includes(query) || 
             (c.customer_phone && c.customer_phone.includes(query));
    })
    .sort((a, b) => (b.latest_invoice_id || 0) - (a.latest_invoice_id || 0)); // Sort by latest ID Descending

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);

  // Summary Calculations
  const totalOutstanding = clients.reduce((acc, curr) => acc + curr.total_due, 0);
  const totalInvoicesCount = clients.reduce((acc, curr) => acc + curr.total_invoices, 0);
  const totalClients = clients.length;
  const avgDue = totalClients > 0 ? totalOutstanding / totalClients : 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="p-4 sm:p-6">
      
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Client Ledger
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage customer accounts, track outstanding payments, and view invoice history.
          </p>
        </div>
      </div>

      {/* --- SUMMARY CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        
        {/* Card 1: Total Outstanding */}
        <div className="bg-blue-50 rounded-lg p-4 sm:p-5 shadow-sm border border-blue-100 flex flex-row items-center gap-3 transition-all hover:shadow-md">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600 shrink-0">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex flex-col">
                <p className="text-sm font-medium text-gray-500">Total Outstanding</p>
                <h3 className="text-lg sm:text-2xl font-semibold text-gray-900 leading-tight">{formatCurrency(totalOutstanding)}</h3>
            </div>
        </div>

        {/* Card 2: Total Invoices */}
        <div className="bg-green-50 rounded-lg p-4 sm:p-5 shadow-sm border border-green-100 flex flex-row items-center gap-3 transition-all hover:shadow-md">
            <div className="p-2 rounded-lg bg-green-100 text-green-600 shrink-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex flex-col">
                <p className="text-sm font-medium text-gray-500">Invoices</p>
                <h3 className="text-lg sm:text-2xl font-semibold text-gray-900 leading-tight">{totalInvoicesCount}</h3>
            </div>
        </div>

        {/* Card 3: Avg Due */}
        <div className="bg-yellow-50 rounded-lg p-4 sm:p-5 shadow-sm border border-yellow-100 flex flex-row items-center gap-3 transition-all hover:shadow-md">
            <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600 shrink-0">
                <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex flex-col">
                <p className="text-sm font-medium text-gray-500">Avg. Due</p>
                <h3 className="text-lg sm:text-2xl font-semibold text-gray-900 leading-tight">{formatCurrency(avgDue)}</h3>
            </div>
        </div>

        {/* Card 4: Total Clients */}
        <div className="bg-purple-50 rounded-lg p-4 sm:p-5 shadow-sm border border-purple-100 flex flex-row items-center gap-3 transition-all hover:shadow-md">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600 shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex flex-col">
                <p className="text-sm font-medium text-gray-500">Total Clients</p>
                <h3 className="text-lg sm:text-2xl font-semibold text-gray-900 leading-tight">{totalClients}</h3>
            </div>
        </div>
      </div>

      {/* --- TABLE SECTION --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white">
            
            {/* Search Bar */}
            <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder="Search client by name or phone" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all ${
                        searchError ? 'border-red-400 focus:border-red-500 bg-red-50/10' : 'border-gray-200 focus:border-blue-400'
                    }`}
                />
                {searchError && (
                    <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{searchError}</p>
                )}
            </div>

            {/* Calendar Filter */}
            <div className="relative">
                <div className="flex items-center gap-2 bg-white border border-gray-200 hover:border-blue-400 rounded-lg px-4 py-2 cursor-pointer transition-colors shadow-sm">
                    <CalendarIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700 text-sm font-medium">
                        {selectedMonth ? new Date(selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' }) : "Select Month"}
                    </span>
                    <Filter className="w-3 h-3 text-gray-400 ml-2" />
                </div>
                {/* Invisible Input Overlay */}
                <input 
                    type="month" 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    onClick={(e) => e.target.showPicker && e.target.showPicker()} 
                />
            </div>
        </div>

        {/* Mobile View: Client Cards */}
        <div className="block sm:hidden divide-y divide-gray-50">
            {loading ? (
                <div className="p-10 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-xs font-bold uppercase tracking-widest">Fetching Clients...</p>
                </div>
            ) : filteredClients.length === 0 ? (
                <div className="p-10 text-center text-gray-500">
                    <p className="text-sm">No clients found matching your search.</p>
                </div>
            ) : (
                paginatedClients.map((client, index) => (
                    <div key={index} className="p-4 active:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-100">
                                    {client.customer_name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                                </div>
                                <div className="max-w-[150px]">
                                    <p className="font-bold text-gray-900 truncate leading-tight">{client.customer_name}</p>
                                    <div className="flex items-center gap-1 text-[10px] mt-0.5">
                                        <Phone className="w-2.5 h-2.5 text-gray-400" />
                                        <span className="text-black font-semibold">{client.customer_phone || '-'}</span>
                                    </div>
                                </div>
                            </div>
                            <Link href={`/clients/view/${encodeURIComponent(client.customer_name)}`}>
                                <button className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 active:scale-95 transition-all">
                                    <Edit className="w-4 h-4" />
                                </button>
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                                <p className="text-[9px] font-bold text-gray-400 uppercase">Invoices</p>
                                <p className="text-sm font-black text-gray-700">{client.total_invoices}</p>
                            </div>
                            <div className="bg-red-50 p-2 rounded-xl border border-red-100">
                                <p className="text-[9px] font-bold text-red-400 uppercase">Total Due</p>
                                <p className="text-sm font-black text-red-600">{formatCurrency(client.total_due)}</p>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-gray-100 text-xs uppercase text-gray-400 font-semibold tracking-wider">
                        <th className="p-5">CLIENT NAME</th>
                        <th className="p-5">PHONE / CONTACT</th>
                        <th className="p-5">INVOICES</th>
                        <th className="p-5">TOTAL DUE</th>
                   
                        <th className="p-5 text-right">ACTIONS</th>
                    </tr>
                </thead>
                <tbody className="text-sm text-gray-700">
                    {loading ? (
                        <tr>
                            <td colSpan="6" className="p-10 text-center text-gray-500">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                Loading data...
                            </td>
                        </tr>
                    ) : filteredClients.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="p-10 text-center text-gray-500">
                                No clients found.
                            </td>
                        </tr>
                    ) : (
                        paginatedClients.map((client, index) => (
                            <tr key={index} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                                <td className="p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                                            {client.customer_name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{client.customer_name}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-5 font-medium text-black">
                                    <div className="flex items-center gap-2">
                                        {client.customer_phone ? (
                                            <>
                                                <Phone className="w-3 h-3 text-gray-400" />
                                                {client.customer_phone}
                                            </>
                                        ) : (
                                            <span>-</span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-5 font-semibold text-gray-700">
                                    {client.total_invoices}
                                </td>
                                <td className="p-5 font-bold text-red-600">
                                    {formatCurrency(client.total_due)}
                                </td>
                           
                                <td className="p-5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link href={`/clients/view/${encodeURIComponent(client.customer_name)}`}>
                                            <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Manage Payment">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
        
        {/* Footer / Pagination */}
        {!loading && filteredClients.length > 0 && (
             <div className="p-4 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500 flex flex-col sm:flex-row justify-between items-center gap-4">
                 <span>
                     Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredClients.length} total records)
                 </span>
                 <Pagination
                     currentPage={currentPage}
                     totalPages={totalPages}
                     onPageChange={setCurrentPage}
                     itemsPerPage={itemsPerPage}
                     onItemsPerPageChange={(val) => {
                         setItemsPerPage(val);
                         setCurrentPage(1);
                     }}
                 />
             </div>
        )}
      </div>
    </div>
  );
}