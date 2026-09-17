"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Search, ChevronDown, Eye, ChevronLeft, ChevronRight, X, Clock } from "lucide-react";
import { logsApi } from "@/lib/api";

const PAGE_SIZE = 8;

const statusBadge = {
  Success: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Failed: "bg-rose-50 text-rose-700 border-rose-100",
  Warning: "bg-amber-50 text-amber-700 border-amber-100",
};

const statusDot = {
  Success: "bg-emerald-500",
  Failed: "bg-rose-500",
  Warning: "bg-amber-500",
};

const getTodayYmd = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function ActivityLogTable({ onMeta = null, statusFilter = "All", setStatusFilter }) {
  const [activities, setActivities] = useState([]);
  const [modules, setModules] = useState(["All"]);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState(() => getTodayYmd());
  const [dateTo, setDateTo] = useState(() => getTodayYmd());
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  const toViewLog = (log) => {
    const userName = log?.user?.name || log?.user?.username || "Unknown";
    const when = (() => {
      try {
        const d = new Date(log?.createdAt);
        if (Number.isNaN(d.getTime())) return "";
        return d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      } catch {
        return "";
      }
    })();

    const dash = "\u2014";
    return {
      id: String(log?.id ?? ""),
      activity: String(log?.description || log?.action || dash),
      user: String(userName),
      module: String(log?.module || dash),
      status: String(log?.status || "Success"),
      date: when || dash,
      action: String(log?.action || dash),
      details: String(log?.description || dash),
      raw: log,
    };
  };

  const fetchLogs = async (targetPage = page) => {
    setLoading(true);
    setError("");
    try {
      const params = { page: targetPage, limit: PAGE_SIZE };
      if (moduleFilter && moduleFilter !== "All") params.module = moduleFilter;
      if (search && search.trim()) params.search = search.trim();
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (statusFilter && statusFilter !== "All" && statusFilter !== "Total") params.status = statusFilter;

      const res = await logsApi.getLogs(params);
      if (!res?.success) throw new Error(res?.error || "Failed to fetch logs");

      const data = Array.isArray(res?.data) ? res.data : [];
      setActivities(data.map(toViewLog));
      setPages(Number(res?.pagination?.pages) || 1);
      setTotal(Number(res?.pagination?.total) || 0);

      const apiModules = Array.isArray(res?.filters?.modules) ? res.filters.modules : [];
      setModules(["All", ...apiModules]);

      if (typeof onMeta === "function") {
        const staffCount = Array.isArray(res?.filters?.staff) ? res.filters.staff.length : 0;

        const base = {};
        if (moduleFilter && moduleFilter !== "All") base.module = moduleFilter;
        if (search && search.trim()) base.search = search.trim();
        if (dateFrom) base.dateFrom = dateFrom;
        if (dateTo) base.dateTo = dateTo;

        const [successRes, failedRes] = await Promise.all([
          logsApi.getLogs({ ...base, page: 1, limit: 1, status: "Success" }).catch(() => null),
          logsApi.getLogs({ ...base, page: 1, limit: 1, status: "Failed" }).catch(() => null),
        ]);

        onMeta({
          total: Number(res?.pagination?.total) || 0,
          success: Number(successRes?.pagination?.total) || 0,
          failed: Number(failedRes?.pagination?.total) || 0,
          staff: staffCount,
        });
      }
    } catch (e) {
      setActivities([]);
      setPages(1);
      setTotal(0);
      setModules(["All"]);
      setError(e?.message || "Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, moduleFilter, dateFrom, dateTo, statusFilter]);

  const rows = useMemo(() => activities, [activities]);

  const activeFiltersCount = useMemo(() => {
    let n = 0;
    if (search && String(search).trim()) n += 1;
    if (moduleFilter && moduleFilter !== "All") n += 1;
    if (dateFrom) n += 1;
    if (dateTo) n += 1;
    return n;
  }, [search, moduleFilter, dateFrom, dateTo]);

  const resetFilters = () => {
    setSearch("");
    setModuleFilter("All");
    if (setStatusFilter) setStatusFilter("All");
    const today = getTodayYmd();
    setDateFrom(today);
    setDateTo(today);
    setPage(1);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-b from-gray-50/80 to-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-gray-900">System Activity Logs</h3>
            <p className="text-sm text-gray-500 mt-0.5">Audit trail of all administrative and system actions.</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {activeFiltersCount > 0 && (
              <span className="px-3 py-1.5 rounded-full border border-indigo-100 bg-indigo-50 text-[11px] font-bold text-indigo-700">
                {activeFiltersCount} filter{activeFiltersCount === 1 ? "" : "s"} applied
              </span>
            )}
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-2 px-3.5 h-10 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={!search && moduleFilter === "All" && !dateFrom && !dateTo}
              title="Reset filters"
            >
              <X size={16} className="text-gray-400" />
              Reset
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {/* Row 1: Search and Filter */}
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-8 md:col-span-9 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search logs..."
                className="w-full h-10 pl-10 pr-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-gray-700 bg-white"
              />
            </div>

            <div className="col-span-4 md:col-span-3 relative">
              <select
                value={moduleFilter}
                onChange={(e) => {
                  setModuleFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 appearance-none pl-3 pr-8 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white truncate"
              >
                {modules.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>
          </div>

          {/* Row 2: Date Filters */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 px-2.5 h-10 border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-1 shrink-0">
                <Clock size={14} className="text-gray-400" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">From</span>
              </div>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="min-w-0 flex-1 text-[11px] sm:text-sm font-semibold text-gray-700 bg-transparent border-0 outline-none focus:ring-0 cursor-pointer p-0"
              />
            </div>
            <div className="flex items-center gap-2 px-2.5 h-10 border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">To</span>
              </div>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="min-w-0 flex-1 text-[11px] sm:text-sm font-semibold text-gray-700 bg-transparent border-0 outline-none focus:ring-0 cursor-pointer p-0"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[980px]">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Activity</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Module</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date / Time</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400 text-sm font-medium">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-rose-600 text-sm font-semibold">
                  {error}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400 text-sm font-medium">
                  No activity logs found
                </td>
              </tr>
            ) : (
              rows.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{log.activity}</p>
                    <p className="text-[10px] font-mono text-indigo-600 font-bold mt-0.5 uppercase tracking-tighter">{log.id}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">{log.user}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wider border border-gray-100">
                      {log.module}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${statusBadge[log.status] || "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-gray-500 font-medium whitespace-nowrap">{log.date}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded-lg">{log.action}</span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                      title="View details"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs sm:text-sm bg-white">
        <p className="text-gray-500 font-medium">
          Showing <span className="text-gray-900">{rows.length}</span> of {total} logs
        </p>
        <div className="flex gap-1">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center px-3 text-xs font-bold text-gray-700">
            Page {page} of {Math.max(1, pages)}
          </div>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${statusDot[selectedLog.status] || "bg-gray-400"}`} />
                <h3 className="font-bold text-gray-900 text-lg">Activity Details</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Activity ID</p>
                  <p className="text-sm font-bold text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded-lg inline-block">
                    {selectedLog.id}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Module</p>
                  <p className="text-sm font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-lg inline-block uppercase">
                    {selectedLog.module}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Detailed Log Description</p>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-700 leading-relaxed font-semibold">
                  {selectedLog.details}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border border-gray-100 rounded-xl bg-white">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Performed By</p>
                  <p className="text-sm font-bold text-gray-900">{selectedLog.user}</p>
                </div>
                <div className="p-3 border border-gray-100 rounded-xl bg-white">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Timestamp</p>
                  <p className="text-sm font-bold text-gray-900">{selectedLog.date}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-sm transition-all active:scale-95"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
