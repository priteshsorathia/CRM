"use client";
import { toast } from "sonner";
import { FiSearch, FiPlus, FiDownload, FiFilter, FiRefreshCw, FiCalendar } from "react-icons/fi";
import DatePicker from "react-flatpickr";
import "flatpickr/dist/themes/light.css";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Eye, Printer, Trash2, FolderOpen } from "lucide-react";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import Pagination from "@/components/ui/Pagination";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit, setLimit] = useState(10);
  const [draftCount, setDraftCount] = useState(0);

  // Deletion states
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

  // Staff List
  const [staffList, setStaffList] = useState([]);

  // Report Download State
  const [isDownloading, setIsDownloading] = useState(false);
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7)); // Default current month YYYY-MM


  const [searchQuery, setSearchQuery] = useState("");
  const [filterErrors, setFilterErrors] = useState({
    search: "",
    date: "",
  });

  const [filters, setFilters] = useState({
    search: "",
    sortBy: "newest",
    dateFrom: "",
    dateTo: "",
    userId: "",
  });

  // DB SETTING
  const [hideNonTaxable, setHideNonTaxable] = useState(false);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

  // Validate search query (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchQuery.trim();
      if (searchQuery === "") {
        setFilterErrors(prev => ({ ...prev, search: "" }));
        setFilters(prev => ({ ...prev, search: "" }));
        return;
      }
      
      if (trimmed === "") {
        setFilterErrors(prev => ({ ...prev, search: "Please enter a valid search term." }));
        return;
      }

      if (trimmed.length > 50) {
        setFilterErrors(prev => ({ ...prev, search: "Search query is too long (maximum 50 characters)." }));
        return;
      }

      const xssPattern = /<[^>]*>|javascript:/i;
      const sqlPattern = /\b(union|select|insert|update|delete|drop|alter|where|from|or|and)\b/i;
      if (xssPattern.test(trimmed) || sqlPattern.test(trimmed)) {
        setFilterErrors(prev => ({ ...prev, search: "Please enter a valid search term." }));
        return;
      }

      const specialCharsOnly = /^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/;
      if (specialCharsOnly.test(trimmed)) {
        setFilterErrors(prev => ({ ...prev, search: "Please enter a valid search term." }));
        return;
      }

      setFilterErrors(prev => ({ ...prev, search: "" }));
      setFilters(prev => ({ ...prev, search: trimmed }));
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Validate dates
  useEffect(() => {
    const from = filters.dateFrom;
    const to = filters.dateTo;
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    if (from && new Date(from) > now) {
      setFilterErrors(prev => ({ ...prev, date: "Please select a valid date range (future dates not allowed)." }));
      return;
    }
    if (to && new Date(to) > now) {
      setFilterErrors(prev => ({ ...prev, date: "Please select a valid date range (future dates not allowed)." }));
      return;
    }

    if (from && to && new Date(from) > new Date(to)) {
      setFilterErrors(prev => ({ ...prev, date: "Please select a valid date range." }));
      return;
    }

    setFilterErrors(prev => ({ ...prev, date: "" }));
  }, [filters.dateFrom, filters.dateTo]);

  const hasActiveFilters = useMemo(() => {
    return searchQuery.trim() !== "" || !!filters.dateFrom || !!filters.dateTo || filters.userId !== "";
  }, [searchQuery, filters.dateFrom, filters.dateTo, filters.userId]);

  // 1. Fetch DB Settings AND Staff List
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem('authToken');

        // 1. Fetch Settings
        const settingsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoices/shop-details`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const settingsData = await settingsRes.json();
        if (settingsData && settingsData.settings) {
          setHideNonTaxable(settingsData.settings.hide_non_taxable || false);
        }

        // 2. Fetch Staff List
        const usersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoices/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const usersData = await usersRes.json();
        if (usersData.success) {
          setStaffList(usersData.data);
        }

      } catch (e) {
        console.error("Initial fetch error:", e);
      } finally {
        setIsSettingsLoaded(true);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch draft count for View Drafts button
  useEffect(() => {
    const fetchDraftCount = async () => {
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}`;
        const response = await fetch(`${API_BASE}/api/draft-invoices/get-all-draft?page=1&limit=1`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setDraftCount(data.totalCount || data.total || 0);
        }
      } catch (e) {
        console.error("Error fetching draft count:", e);
      }
    };
    fetchDraftCount();
  }, []);

  // Fetch invoices from backend
  useEffect(() => {
    if (!isSettingsLoaded) return;

    if (filterErrors.search || filterErrors.date) {
      setLoading(false);
      return;
    }

    const fetchInvoices = async () => {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}`;

        const queryParams = new URLSearchParams({
          page: currentPage,
          limit: limit,
          search: filters.search,
          sortBy: filters.sortBy,
          userId: filters.userId,
          excludeNonTaxable: hideNonTaxable,
          ...(filters.dateFrom && { dateFrom: new Date(filters.dateFrom).toISOString() }),
          ...(filters.dateTo && { dateTo: new Date(filters.dateTo).toISOString() })
        });

        const response = await fetch(`${API_BASE}/api/invoices?${queryParams.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setInvoices(data.invoices || []);
          setTotalCount(data.totalCount || 0);
          setTotalPages(data.totalPages || 1);
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch invoices');
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
        setError('Failed to load invoices. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();

  }, [filters.search, filters.sortBy, filters.dateFrom, filters.dateTo, filters.userId, hideNonTaxable, isSettingsLoaded, currentPage, filterErrors.search, filterErrors.date, limit]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.sortBy, filters.dateFrom, filters.dateTo, filters.userId, limit]);

  const handleDeleteClick = (invoiceId) => {
    setInvoiceToDelete(invoiceId);
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!invoiceToDelete) return;
    const invoiceId = invoiceToDelete;
    setShowConfirmDelete(false);
    setInvoiceToDelete(null);

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}`;

      const response = await fetch(`${API_BASE}/api/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
        toast.error('Invoice deleted successfully');
      } else {
        throw new Error('Failed to delete invoice');
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    }
  };

  const printInvoice = (invoiceId) => {
    window.open(`/invoices/${invoiceId}?print=true`, '_self');
  };

  const downloadInvoice = async (invoiceId) => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}`;

      const response = await fetch(`${API_BASE}/api/invoices/${invoiceId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice-${invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to download invoice PDF');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Error downloading invoice');
    }
  };

  const dateFromOptions = useMemo(() => {
    return {
      dateFormat: "d-m-Y",
      enableTime: false,
      allowInput: false,
      maxDate: new Date()
    };
  }, []);

  const dateToOptions = useMemo(() => {
    const options = {
      dateFormat: "d-m-Y",
      enableTime: false,
      allowInput: false,
      maxDate: new Date()
    };
    if (filters.dateFrom) {
      options.minDate = filters.dateFrom;
    }
    return options;
  }, [filters.dateFrom]);

  const handleDateFromChange = (date) => {
    const dateFrom = date[0] || "";
    setFilters((prev) => {
      const nextFilters = { ...prev, dateFrom };
      if (dateFrom && prev.dateTo && new Date(dateFrom) > new Date(prev.dateTo)) {
        nextFilters.dateTo = "";
      }
      return nextFilters;
    });
  };

  const resetFilters = () => {
    setSearchQuery("");
    setFilterErrors({ search: "", date: "" });
    setFilters({
      search: "",
      sortBy: "newest",
      dateFrom: "",
      dateTo: "",
      userId: "",
    });
  };


  // ✅ GENERATE REPORT FUNCTION
  const generateReport = async () => {
    if (!reportMonth) {
      toast.error("Please select a month for the report.");
      return;
    }
    setIsDownloading(true);
    try {
      const token = localStorage.getItem('authToken');
      const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}`;

      const response = await fetch(`${API_BASE}/api/invoices/report?month=${reportMonth}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice_report_${reportMonth}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const err = await response.text();
        if (response.status === 404) {
          toast.error(`No invoices found for ${reportMonth}`);
        } else {
          toast.error(`Failed to generate report: ${err}`);
        }
      }
    } catch (error) {
      console.error("Report error:", error);
      toast.error("Error downloading report");
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading && invoices.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading invoices...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Invoices</h1>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-4 sm:mb-6 border border-gray-100">
        <div className="grid grid-cols-1 gap-2 sm:gap-3 mb-3 sm:mb-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search invoices by customer name, phone, or invoice no"
              className={`w-full pl-3 sm:pl-4 pr-8 sm:pr-10 py-1.5 sm:py-2.5 border rounded-lg text-xs sm:text-sm outline-none transition-all ${
                filterErrors.search ? 'border-red-400 focus:border-red-500 bg-red-50/10' : 'border-gray-300 focus:border-blue-500'
              }`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base" />
          </div>
          {filterErrors.search && (
            <p className="text-red-500 text-xs mt-0.5 ml-1 font-medium">{filterErrors.search}</p>
          )}

          {/* Filters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {/* Date From */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Date From
              </label>
              <DatePicker
                options={dateFromOptions}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg text-xs sm:text-sm border-gray-300 focus:border-blue-500 outline-none"
                value={filters.dateFrom}
                onChange={handleDateFromChange}
                placeholder="dd-mm-yyyy"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Date To
              </label>
              <DatePicker
                options={dateToOptions}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg text-xs sm:text-sm border-gray-300 focus:border-blue-500 outline-none"
                value={filters.dateTo}
                onChange={([date]) => setFilters({ ...filters, dateTo: date || "" })}
                placeholder="dd-mm-yyyy"
              />
            </div>

            {/* Staff */}
            <div className="col-span-1 sm:col-span-1 lg:col-span-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Staff
              </label>
              <select
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg text-xs sm:text-sm border-gray-300 focus:border-blue-500 outline-none"
                value={filters.userId}
                onChange={(e) =>
                  setFilters({ ...filters, userId: e.target.value })
                }
              >
                <option value="">All Staff</option>
                {staffList.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg text-xs sm:text-sm border-gray-300 focus:border-blue-500 outline-none"
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters({ ...filters, sortBy: e.target.value })
                }
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name_asc">Name A → Z</option>
                <option value="name_desc">Name Z → A</option>
                <option value="amount_high">Highest Total</option>
                <option value="amount_low">Lowest Total</option>
              </select>
            </div>
          </div>
          {filterErrors.date && (
            <p className="text-red-500 text-xs mt-0.5 ml-1 font-medium">{filterErrors.date}</p>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex justify-end items-center gap-2">
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-xs sm:text-sm flex items-center justify-center font-medium"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Info and Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Link href="/invoices/add" className="w-full sm:w-auto">
            <button className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm">
              <FiPlus className="text-sm" />
              <span>New Invoice</span>
            </button>
          </Link>

          {/* ✅ Draft Invoices Button */}
          <Link href="/invoices/drafts" className="w-full sm:w-auto">
            <button className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2 text-sm">
              <FolderOpen className="w-4 h-4" />
              <span>View Drafts {draftCount > 0 ? `(${draftCount})` : ""}</span>
            </button>
          </Link>

          {/* ✅ Report Controls Group */}
          <div className="col-span-2 sm:col-span-1 flex items-center bg-white border rounded-lg overflow-hidden shadow-sm h-[38px] sm:h-auto">
            <div className="relative flex-1 border-r border-gray-200 px-2 bg-gray-50 h-full flex items-center">
              <FiCalendar className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
              <input
                type="month"
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
                className="pl-8 py-2 text-sm bg-transparent border-none focus:ring-0 text-gray-700 w-full cursor-pointer outline-none"
                title="Select Report Month"
              />
            </div>
            <button
              onClick={generateReport}
              disabled={isDownloading || invoices.length === 0}
              className={`px-4 sm:px-3 py-2 h-full bg-green-600 text-white hover:bg-green-700 transition flex items-center justify-center gap-2 text-sm whitespace-nowrap ${isDownloading || invoices.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isDownloading ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiDownload className="w-4 h-4" />}
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left mt-2 sm:mt-0 px-1 sm:px-0">
          Showing {(currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, totalCount)} of {totalCount} records
          {/* <p className="text-[10px] sm:text-xs mt-1">
            <span className="text-red-500">*</span> indicates a non-taxable
            invoice
          </p> */}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Invoice No.
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Date
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Phone
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Staff
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice, index) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-2 sm:px-3 py-2 sm:py-4 whitespace-nowrap">
                    {(currentPage - 1) * limit + index + 1}
                  </td>
                  <td className="px-2 sm:px-3 py-2 sm:py-4 whitespace-nowrap font-medium">
                    {invoice.invoice_number}
                    {Number(invoice.tax_percentage) === 0 && (
                      <span className="text-red-500 ml-1" title="Non-taxable Invoice">*</span>
                    )}
                  </td>
                  <td className="px-2 sm:px-3 py-2 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                    {new Date(invoice.invoice_date).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-2 sm:px-3 py-2 sm:py-4 whitespace-nowrap truncate max-w-[100px] sm:max-w-[150px]">
                    {invoice.customer_name}
                  </td>
                  <td className="px-2 sm:px-3 py-2 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                    {invoice.customer_phone}
                  </td>
                  <td className="px-2 sm:px-3 py-2 sm:py-4 whitespace-nowrap hidden md:table-cell">
                    {invoice.user?.name || "—"}
                  </td>
                  <td className="px-2 sm:px-3 py-2 sm:py-4 whitespace-nowrap">
                    ₹{invoice.total.toFixed(2)}
                  </td>
                  <td className="px-2 sm:px-3 py-2 sm:py-4 whitespace-nowrap flex gap-2 sm:gap-3">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="inline-flex items-center justify-center w-9 h-9 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all duration-200"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/invoices/edit/${invoice.id}`}
                      className="inline-flex items-center justify-center w-9 h-9 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => downloadInvoice(invoice.id)}
                      className="inline-flex items-center justify-center w-9 h-9 rounded bg-green-100 text-green-600 hover:bg-green-200 transition-all duration-200"
                      title="Download"
                    >
                      <FiDownload className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => printInvoice(invoice.id)}
                      className="inline-flex items-center justify-center w-9 h-9 rounded bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-all duration-200"
                      title="Print"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(invoice.id)}
                      className="inline-flex items-center justify-center w-9 h-9 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-all duration-200"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {invoices.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center flex flex-col items-center justify-center border border-gray-100 mt-4">
          <div className="text-gray-300 text-6xl mb-4">📄</div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            {hasActiveFilters ? "No Invoices Found" : "No Invoices Found"}
          </h3>
          <p className="text-gray-500 mb-6 max-w-md">
            {hasActiveFilters 
              ? "Invoices matching your filters are not available. Try resetting or adjusting your search parameters." 
              : "Create your first invoice to get started."}
          </p>
          {!hasActiveFilters && (
            <Link href="/invoices/add">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Create First Invoice
              </button>
            </Link>
          )}
        </div>
      )}

      {/* Pagination */}
      {invoices.length > 0 && (
        <div className="mt-4 sm:mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={limit}
            onItemsPerPageChange={(newLimit) => {
              setLimit(newLimit);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      <ConfirmationDialog
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Invoice"
        description="Are you sure you want to delete this invoice? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />

    </div>
  );
}