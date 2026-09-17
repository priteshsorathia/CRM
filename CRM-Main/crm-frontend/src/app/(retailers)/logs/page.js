'use client';

import {
  ClipboardList,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  LayoutGrid,
  Download,
  Eye,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/logs`;

export default function ActivityLogsPage() {

  // State
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    module: 'All Modules',
    status: 'All Statuses',
    search: ''
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // --- Fetch Data ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search
      });

      if (filters.module !== 'All Modules') params.append('module', filters.module);
      if (filters.status !== 'All Statuses') params.append('status', filters.status);

      const response = await fetch(`${API_URL}?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const json = await response.json();

      if (json.success) {
        setLogs(json.data);
        setPagination(prev => ({
          ...prev,
          total: json.pagination.total,
          pages: json.pagination.pages
        }));
      }
    } catch (error) {
      console.error("Failed to load logs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search slightly
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [pagination.page, filters]);

  // --- Handlers ---
  const handleRefresh = () => {
    fetchData();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on filter change
  };

  // Handle View Log Details
  const handleViewDetails = async (logId) => {
    setLoadingDetail(true);
    setShowDetailModal(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error("Authentication required");
        setShowDetailModal(false);
        return;
      }

      const response = await fetch(`${API_URL}/${logId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const json = await response.json();

      if (json.success) {
        setSelectedLog(json.data);
      } else {
        toast.error(json.error || 'Failed to fetch log details');
        setShowDetailModal(false);
      }
    } catch (error) {
      console.error("Failed to fetch log details", error);
      toast.error('Error fetching log details');
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Handle CSV Export
  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const params = new URLSearchParams({
        search: filters.search
      });
      if (filters.module !== 'All Modules') params.append('module', filters.module);
      if (filters.status !== 'All Statuses') params.append('status', filters.status);

      // Fetch Blob
      const response = await fetch(`${API_URL}/export?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success('Log report downloaded successfully');
      } else {
        toast.error('Failed to download report');
      }
    } catch (error) {
      console.error("Export failed", error);
      toast.error('Error exporting logs');
    } finally {
      setExporting(false);
    }
  };

  // --- Summary Calculations (Client Side for now) ---
  const summary = logs.reduce((acc, log) => {
    acc.total += 1;
    if (log.status === 'Success') acc.success += 1;
    else acc.failed += 1;
    return acc;
  }, { total: 0, success: 0, failed: 0 });

  // Calculate unique modules count for the view
  const uniqueModules = [...new Set(logs.map(l => l.module))].length;

  const summaryData = [
    {
      title: "Total Activities",
      value: pagination.total || 0,
      bgColor: "bg-blue-50",
      icon: <ClipboardList className="w-5 h-5 text-blue-600" />
    },
    {
      title: "Successful Actions",
      value: summary.success,
      bgColor: "bg-green-50",
      icon: <CheckCircle className="w-5 h-5 text-green-600" />
    },
    {
      title: "Errors / Warnings",
      value: summary.failed,
      bgColor: "bg-red-50",
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />
    },
    {
      title: "Active Modules",
      value: uniqueModules,
      bgColor: "bg-purple-50",
      icon: <LayoutGrid className="w-5 h-5 text-purple-600" />
    }
  ];

  return (
    <div className="p-4 sm:p-6">

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Activity Logs</h1>
              <p className="text-xs sm:text-sm text-gray-500">Monitor system events and user actions</p>
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <button
              onClick={handleExport}
              disabled={exporting || loading}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-bold text-sm shadow-lg shadow-blue-100 active:scale-95 ${
                (exporting || loading) ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span className="whitespace-nowrap">{exporting ? 'Exporting...' : 'Export Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 sm:mb-6">

        {/* Filters Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="flex flex-col gap-3">
            {/* Search + Filter toggle row */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Search logs..."
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className={`sm:hidden p-2.5 rounded-xl border transition-all ${
                  showMobileFilters ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-700'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>

            {/* Dropdowns (collapsible on mobile) */}
            <div className={`${showMobileFilters ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between`}>
              <div className="flex flex-col sm:flex-row gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Module</label>
                  <select
                    name="module"
                    value={filters.module}
                    onChange={handleFilterChange}
                    className="w-full sm:w-auto px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option>All Modules</option>
                    <option>Auth</option>
                    <option>Invoice</option>
                    <option>Inventory</option>
                    <option>HRMS</option>
                    <option>Settings</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Status</label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="w-full sm:w-auto px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option>All Statuses</option>
                    <option>Success</option>
                    <option>Failed</option>
                  </select>
                </div>
              </div>
              <div className="text-xs sm:text-sm text-gray-500 font-medium">
                Showing {logs.length} entries
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards Row */}
        <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {summaryData.map((data, index) => (
              <div key={index} className={`${data.bgColor} p-3 sm:p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2`}>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-white/60 shadow-sm shrink-0 w-fit">{data.icon}</div>
                  <p className="text-[11px] sm:text-xs font-bold text-gray-600 leading-tight">{data.title}</p>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{data.value}</h3>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="block sm:hidden divide-y divide-gray-100">
          {loading ? (
            <div className="py-10 text-center text-gray-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
              <span className="text-sm">Loading logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              <span className="text-3xl mb-2 block">📋</span>
              <span className="text-sm font-medium">No logs found</span>
            </div>
          ) : logs.map((log) => (
            <div key={log.id} className="p-4 space-y-2.5">
              {/* Action + Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${
                    log.status === 'Success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {log.status === 'Success' ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{log.action}</p>
                    <p className="text-[11px] text-gray-500 line-clamp-1">{log.description}</p>
                  </div>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  log.status === 'Success'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>{log.status}</span>
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">{log.module}</span>
                <span className="text-[11px] text-gray-500 font-medium">{log.user?.username || 'Unknown'}</span>
                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                  <Clock size={11} />
                  {new Date(log.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* View details button */}
              <button
                onClick={() => handleViewDetails(log.id)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 transition-all active:scale-95"
              >
                <Eye size={13} /> View Details
              </button>
            </div>
          ))}
        </div>

        {/* Desktop Logs Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Module</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" /> Loading logs...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                    No logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 p-1.5 rounded-full ${
                          log.status === 'Success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {log.status === 'Success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{log.action}</p>
                          <p className="text-xs text-gray-500">{log.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">{log.user?.username || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{log.ipAddress || 'IP Hidden'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {log.module}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.status === 'Success'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock size={14} />
                        {new Date(log.createdAt).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewDetails(log.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                      >
                        <Eye size={14} /> View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.pages > 1 && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 rounded-b-xl">
            <p className="text-xs sm:text-sm text-gray-500">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium bg-white hover:bg-gray-50 disabled:opacity-50 transition-all"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(p => ({ ...p, page: Math.min(p.pages, p.page + 1) }))}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium bg-white hover:bg-gray-50 disabled:opacity-50 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Log Details</h2>
              <button
                onClick={() => { setShowDetailModal(false); setSelectedLog(null); }}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all active:scale-95"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6">
              {loadingDetail ? (
                <div className="flex justify-center items-center py-10">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading details...</span>
                </div>
              ) : selectedLog ? (
                <div className="space-y-4">
                  {/* Status Badge */}
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      selectedLog.status === 'Success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {selectedLog.status === 'Success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      selectedLog.status === 'Success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {selectedLog.status}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Action</label>
                      <p className="mt-1 text-sm font-bold text-gray-900">{selectedLog.action}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Module</label>
                      <p className="mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                          {selectedLog.module}
                        </span>
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">User</label>
                      <p className="mt-1 text-sm font-bold text-gray-900">
                        {selectedLog.user?.username || 'Unknown'}
                        {selectedLog.user?.name && <span className="text-gray-500 ml-2 font-normal">({selectedLog.user.name})</span>}
                      </p>
                      {selectedLog.user?.email && <p className="text-xs text-gray-500 mt-0.5">{selectedLog.user.email}</p>}
                      {selectedLog.user?.role && <p className="text-xs text-gray-500 mt-0.5">Role: {selectedLog.user.role}</p>}
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date &amp; Time</label>
                      <p className="mt-1 text-sm font-bold text-gray-900">
                        {new Date(selectedLog.createdAt).toLocaleString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 sm:col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">User Agent</label>
                      <p className="mt-1 text-xs text-gray-700 break-all">{selectedLog.userAgent || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</label>
                    <p className="mt-1.5 text-sm text-gray-900 bg-gray-50 p-3 rounded-xl">
                      {selectedLog.description || 'No description available'}
                    </p>
                  </div>

                  {/* Shop Information */}
                  {selectedLog.shop && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Shop</label>
                      <p className="mt-1 text-sm font-bold text-gray-900">{selectedLog.shop.name || 'N/A'}</p>
                    </div>
                  )}

                  {/* Metadata */}
                  {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Additional Information</label>
                      <pre className="mt-1.5 text-xs text-gray-700 bg-gray-50 p-3 rounded-xl overflow-x-auto">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">No log details available</div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-4 sm:p-6 border-t border-gray-100">
              <button
                onClick={() => { setShowDetailModal(false); setSelectedLog(null); }}
                className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-all active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}