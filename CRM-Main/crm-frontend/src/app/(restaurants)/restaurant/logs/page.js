"use client";

import {
  ClipboardList,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  LayoutGrid,
  Download,
  Eye,
  Calendar,
  X,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import RestaurantLoader from "@/components/RestaurantLoader";
import { getApiBase } from "@/utils/apiBase";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatDateInput(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatRole(role) {
  if (!role) return "N/A";
  return role
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function removeUnderscores(str) {
  if (!str) return "";
  return str.replace(/_/g, " ");
}

export default function RestaurantActivityLogsPage() {
  const API_URL = useMemo(() => {
    const base = getApiBase();
    return base ? `${base}/api/logs` : "";
  }, []);

  const [userRole, setUserRole] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [availableModules, setAvailableModules] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 1,
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [filters, setFilters] = useState({
    module: "All Modules",
    status: "All Statuses",
    search: "",
  });

  const [preset, setPreset] = useState("today");
  const [startDate, setStartDate] = useState(() => {
    return formatDateInput(new Date());
  });
  const [endDate, setEndDate] = useState(() => formatDateInput(new Date()));

  useEffect(() => {
    try {
      const userDataStr = localStorage.getItem("userData");
      const userStr = localStorage.getItem("user");
      const user = {
        ...(userDataStr ? JSON.parse(userDataStr) : {}),
        ...(userStr ? JSON.parse(userStr) : {}),
      };
      setUserRole(user.role || user.user_role || null);
    } catch {
      setUserRole(null);
    }
  }, []);

  useEffect(() => {
    if (showDetailModal) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          setShowDetailModal(false);
          setSelectedLog(null);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [showDetailModal]);

  const canExportReport = useMemo(() => {
    const raw = (userRole || "").toString().trim().toLowerCase();
    if (!raw) return false;

    const variants = new Set([
      raw,
      raw.replace(/\s+/g, "_"),
      raw.replace(/_/g, " "),
      raw.replace(/[-/]+/g, "_"),
      raw.replace(/[-/]+/g, " "),
    ]);

    const allowed = [
      "owner",
      "shop_owner",
      "restaurant_owner",
      "admin",
      "administrator",
    ];

    return allowed.some((r) => variants.has(r)) || raw.endsWith("_owner") || raw.endsWith(" owner");
  }, [userRole]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!API_URL) {
        throw new Error("API base URL is not configured (NEXT_PUBLIC_API_URL).");
      }

      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      if (!token) return;

      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        search: filters.search || "",
        dateFrom: startDate || "",
        dateTo: endDate || "",
      });

      if (filters.module !== "All Modules") params.append("module", filters.module);
      if (filters.status !== "All Statuses") params.append("status", filters.status);

      const response = await fetch(`${API_URL}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await response.json().catch(() => ({}));
      if (json.success) {
        setLogs(json.data || []);
        setAvailableModules(json.filters?.modules || []);
        setPagination((prev) => ({
          ...prev,
          total: json.pagination?.total ?? 0,
          pages: json.pagination?.pages ?? 1,
        }));
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error("Failed to load logs", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pagination.page,
    pagination.limit,
    filters.module,
    filters.status,
    filters.search,
    startDate,
    endDate,
  ]);

  const handleRefresh = () => {
    fetchData();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const cleanedValue = name === "search" ? value.replace(/\./g, '') : value;
    setFilters((prev) => ({ ...prev, [name]: cleanedValue }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleViewDetails = async (logId) => {
    setLoadingDetail(true);
    setShowDetailModal(true);
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required");
        setShowDetailModal(false);
        return;
      }

      const response = await fetch(`${API_URL}/${logId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await response.json().catch(() => ({}));
      if (json.success) {
        setSelectedLog(json.data);
      } else {
        toast.error(json.error || "Failed to fetch log details");
        setShowDetailModal(false);
      }
    } catch (error) {
      console.error("Failed to fetch log details", error);
      toast.error("Error fetching log details");
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleExport = async () => {
    if (!canExportReport) {
      toast.error("You don't have permission to export reports.");
      return;
    }

    setExporting(true);
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const params = new URLSearchParams({ search: filters.search || "" });
      if (filters.module !== "All Modules") params.append("module", filters.module);
      if (filters.status !== "All Statuses") params.append("status", filters.status);
      if (startDate) params.append("dateFrom", startDate);
      if (endDate) params.append("dateTo", endDate);

      const response = await fetch(`${API_URL}/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `activity_logs_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Log report downloaded successfully");
      } else {
        toast.error("Failed to download report");
      }
    } catch (error) {
      console.error("Export failed", error);
      toast.error("Error exporting logs");
    } finally {
      setExporting(false);
    }
  };

  const summary = (logs || []).reduce(
    (acc, log) => {
      acc.total += 1;
      if (log.status === "Success") acc.success += 1;
      else acc.failed += 1;
      return acc;
    },
    { total: 0, success: 0, failed: 0 }
  );

  const summaryData = [
    {
      title: "Total Activities",
      value: pagination.total || 0,
      bgColor: "bg-blue-50",
      icon: <ClipboardList className="w-5 h-5 text-blue-600" />,
    },
    {
      title: "Successful Actions",
      value: summary.success,
      bgColor: "bg-green-50",
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
    },
    {
      title: "Errors / Warnings",
      value: summary.failed,
      bgColor: "bg-red-50",
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
    },
    {
      title: "Active Modules",
      value: availableModules.length,
      bgColor: "bg-purple-50",
      icon: <LayoutGrid className="w-5 h-5 text-purple-600" />,
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Activity Logs</h1>
              <p className="text-xs sm:text-sm text-gray-500">Monitor restaurant events and staff actions</p>
            </div>
          </div>

          <div className="flex flex-row gap-2 sm:gap-3">
            {canExportReport && (
              <button
                onClick={handleExport}
                disabled={exporting || loading}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm text-sm ${exporting || loading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
              >
                {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span className="xs:inline">{exporting ? "Exporting..." : "Export"}</span>
                <span className="hidden sm:inline">Report</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm mb-4 sm:mb-6">
        <div className="p-3 sm:p-6 border-b border-gray-200 bg-gray-50/50">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {summaryData.map((data, index) => (
              <div
                key={index}
                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-sm font-medium text-gray-500 mb-0.5 sm:mb-1 truncate">{data.title}</p>
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-900">{data.value}</h3>
                </div>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 ${data.bgColor} rounded-lg flex items-center justify-center shrink-0 ml-2`}>
                  {data.icon}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Search logs"
                    className="w-full pl-10 pr-4 h-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                  <div className="relative">
                    <select
                      name="module"
                      value={filters.module}
                      onChange={handleFilterChange}
                      className="w-full sm:w-52 pl-3 pr-8 h-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option>All Modules</option>
                      {availableModules.map((m) => (
                        <option key={m} value={m}>
                          {removeUnderscores(m)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <select
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                      className="w-full sm:w-44 pl-3 pr-8 h-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option>All Statuses</option>
                      <option>Success</option>
                      <option>Failed</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-500 lg:text-right">
                Showing {logs.length} entries
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide no-scrollbar">
                {[
                  { label: "Today", days: 1, key: "today" },
                  { label: "7 Days", days: 7, key: "7d" },
                  { label: "30 Days", days: 30, key: "30d" },
                ].map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setDate(start.getDate() - (r.days - 1));
                      setStartDate(formatDateInput(start));
                      setEndDate(formatDateInput(end));
                      setPreset(r.key);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    className={`min-w-[78px] px-3 h-10 rounded-lg text-sm font-semibold border transition shadow-sm shrink-0 ${preset === r.key
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                    From
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
                    <input
                      type="date"
                      value={startDate}
                      max={endDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setPreset(null);
                        setPagination((prev) => ({ ...prev, page: 1 }));
                      }}
                      className="w-full pl-9 pr-2 h-10 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                    To
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setPreset(null);
                        setPagination((prev) => ({ ...prev, page: 1 }));
                      }}
                      className="w-full pl-9 pr-2 h-10 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 sm:px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-4 sm:px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 sm:px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Module
                </th>
                <th className="px-4 sm:px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 sm:px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10">
                    <RestaurantLoader variant="container" message="Loading logs..." />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 sm:px-6 py-10 text-center text-gray-500">
                    No logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 p-1.5 rounded-full shrink-0 ${log.status === "Success"
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                            }`}
                        >
                          {log.status === "Success" ? (
                            <CheckCircle size={14} />
                          ) : (
                            <AlertTriangle size={14} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">{removeUnderscores(log.action)}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{log.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium line-clamp-1">
                        {log.user?.username || "Unknown"}
                      </div>
                      <div className="text-xs text-gray-500">{log.ipAddress || "IP Hidden"}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-800">
                        {removeUnderscores(log.module)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${log.status === "Success"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                      >
                        {removeUnderscores(log.status)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-gray-500 whitespace-nowrap">
                        <Clock size={14} />
                        {new Date(log.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right sm:text-left">
                      <button
                        onClick={() => handleViewDetails(log.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all active:scale-95"
                      >
                        <Eye size={12} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.pages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page <= 1 || loading}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              onClick={() =>
                setPagination((p) => ({ ...p, page: Math.min(p.pages, p.page + 1) }))
              }
              disabled={pagination.page >= pagination.pages || loading}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {showDetailModal && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl ${selectedLog?.status === "Success"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                    }`}
                >
                  {selectedLog?.status === "Success" ? (
                    <CheckCircle size={20} />
                  ) : (
                    <AlertTriangle size={20} />
                  )}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">Log Details</h3>
                  <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">Full activity information</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedLog(null);
                }}
                className="p-2 hover:bg-white rounded-xl transition-all active:scale-95 shadow-sm"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto no-scrollbar">
              {loadingDetail ? (
                <div className="py-10">
                  <RestaurantLoader variant="container" message="Loading details..." />
                </div>
              ) : selectedLog ? (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${selectedLog.status === "Success"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                        }`}
                    >
                      {removeUnderscores(selectedLog.status)}
                    </span>
                    <span className="text-xs font-bold text-gray-400">
                      {new Date(selectedLog.createdAt).toLocaleString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                        Action
                      </label>
                      <p className="text-sm font-bold text-gray-900 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">{removeUnderscores(selectedLog.action)}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                        Module
                      </label>
                      <div>
                        <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {removeUnderscores(selectedLog.module)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                        User / Source
                      </label>
                      <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-black">
                            {(selectedLog.user?.username || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {selectedLog.user?.username || "Unknown"}
                            </p>
                            {selectedLog.ipAddress && (
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">IP: {selectedLog.ipAddress}</p>
                            )}
                          </div>
                        </div>
                        {selectedLog.user?.email && (
                          <p className="text-xs font-medium text-gray-500 mt-1">{selectedLog.user.email}</p>
                        )}
                        {selectedLog.user?.role && (
                          <div className="pt-1">
                            <span className="text-[9px] font-black uppercase bg-gray-200 text-gray-600 px-2 py-0.5 rounded-md">
                              Role: {formatRole(selectedLog.user.role)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                        User Agent
                      </label>
                      <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                        <p className="text-xs font-medium text-gray-600 leading-relaxed italic">
                          {selectedLog.userAgent || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                      Description
                    </label>
                    <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                      <p className="text-sm font-medium text-gray-700 leading-relaxed">
                        {selectedLog.description || "No description available"}
                      </p>
                    </div>
                  </div>

                  {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                        System Metadata
                      </label>
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-gray-100 to-gray-50 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                        <pre className="relative text-[10px] sm:text-xs font-mono text-gray-700 bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto shadow-inner leading-relaxed">
                          {JSON.stringify(selectedLog.metadata, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-400 font-bold italic">No log details available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
