"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Edit, RefreshCw, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { hrmsApi } from "@/lib/api";
import { getUserRole, validateToken } from "@/utils/auth";

export default function AttendanceClient({ initialFrom, initialTo, initialSearch }) {
  const router = useRouter();
  const today = useMemo(() => {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }, []);

  const [from, setFrom] = useState(initialFrom || today);
  const [to, setTo] = useState(initialTo || today);
  const [search, setSearch] = useState(initialSearch || "");
  const [statusFilter, setStatusFilter] = useState("total"); // "total", "present", "absent", "onLeave"

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);

  const [role, setRole] = useState("");
  const [roleLoaded, setRoleLoaded] = useState(false);

  const isAdmin = useMemo(() => {
    const raw = String(role || "").trim().toLowerCase();
    const variants = new Set([
      raw,
      raw.replace(/\s+/g, "_"),
      raw.replace(/_/g, " "),
      raw.replace(/[-/]+/g, "_"),
      raw.replace(/[-/]+/g, " "),
    ]);

    for (const v of variants) {
      if (v === "admin" || v === "administrator" || v === "owner" || v === "shop_owner" || v === "shop owner") return true;
      if (v.endsWith("_owner")) return true;
      if (v.includes("owner")) return true;
      if (v.includes("admin")) return true;
    }
    return false;
  }, [role]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const roleFromHelper = getUserRole();
        if (roleFromHelper) {
          if (!cancelled) setRole(roleFromHelper);
          return;
        }

        const v = await validateToken().catch(() => ({ valid: false }));
        const u = v?.user || null;
        const roleValue = u?.role || u?.user_role || u?.user?.role || u?.user?.user_role || "";
        if (!cancelled) setRole(roleValue || "");
      } finally {
        if (!cancelled) setRoleLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadAttendance = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await hrmsApi.getAttendanceRange(from, to);
      if (!res?.success) throw new Error(res?.error || "Failed to load attendance range");
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e?.message || "Failed to load attendance");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const norm = (v) => String(v || "").trim().toLowerCase().replace(/\s+/g, "_");
  const isOnLeave = (r) => ["on_leave", "leave", "onleave"].includes(norm(r.status));
  const isAbsent = (r) => ["absent"].includes(norm(r.status)) && !r.check_in && !r.check_out;
  const isPresent = (r) => {
    const s = norm(r.status);
    if (r.check_in || r.check_out) return true;
    return ["present", "late", "half_day"].includes(s);
  };

  const filteredRows = useMemo(() => {
    let filtered = Array.isArray(rows) ? rows : [];
    
    // 1. Search filter
    const q = String(search || "").trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((r) => {
        const hay = [
          r?.date,
          r?.emp_id,
          r?.full_name,
          r?.role,
          r?.status,
          r?.check_in,
          r?.check_out,
          r?.working_hours,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    // 2. Status card filter
    if (statusFilter === "present") {
      filtered = filtered.filter(isPresent);
    } else if (statusFilter === "absent") {
      filtered = filtered.filter(isAbsent);
    } else if (statusFilter === "onLeave") {
      filtered = filtered.filter(isOnLeave);
    }

    return filtered;
  }, [rows, search, statusFilter]);

  const showDateColumn = useMemo(() => from !== to, [from, to]);
  const showActions = Boolean(isAdmin);
  const colSpan = (showDateColumn ? 8 : 7) + (showActions ? 1 : 0);

  const formatDDMMYYYY = (iso) => {
    const s = String(iso || "").trim();
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return s;
    return `${m[3]}/${m[2]}/${m[1]}`;
  };

  const stats = useMemo(() => {
    // Stats should be calculated based on the date-filtered rows (and search-filtered if we want to follow other pages' pattern)
    // but typically overview stats are for the current set. 
    // Let's filter by search but NOT by statusFilter for the counters themselves.
    const searchFiltered = (Array.isArray(rows) ? rows : []).filter((r) => {
      const q = String(search || "").trim().toLowerCase();
      if (!q) return true;
      const hay = [r?.date, r?.emp_id, r?.full_name, r?.role, r?.status].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });

    const total = searchFiltered.length;
    const present = searchFiltered.filter(isPresent).length;
    const onLeave = searchFiltered.filter(isOnLeave).length;
    const absent = searchFiltered.filter(isAbsent).length;
    return { total, present, absent, onLeave };
  }, [rows, search]);

  const resetFilters = () => {
    setFrom(today);
    setTo(today);
    setSearch("");
    setStatusFilter("total");
    router.replace("/services/hrms/attendance");
  };

  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState({
    status: "present",
    check_in: "",
    check_out: "",
    note: "",
  });

  const toTimeValue = (value) => {
    const s = String(value || "").trim();
    if (!s) return "";
    if (s === "—" || s === "-" || s.toLowerCase() === "null") return "";
    const m = s.match(/(\d{2}:\d{2})/);
    return m ? m[1] : "";
  };

  const openEdit = async (row) => {
    if (!showActions) return;
    setEditError("");
    setEditRow(row);
    setEditOpen(true);

    try {
      const res = await hrmsApi.getAttendanceRecord(row.emp_id, row.date);
      if (res?.success && res.data) {
        setEditForm({
          status: String(res.data.status || row.status || "present"),
          check_in: toTimeValue(res.data.check_in || row.check_in),
          check_out: toTimeValue(res.data.check_out || row.check_out),
          note: String(res.data.note || row.note || ""),
        });
      } else {
        setEditForm({
          status: String(row.status || "present"),
          check_in: toTimeValue(row.check_in),
          check_out: toTimeValue(row.check_out),
          note: String(row.note || ""),
        });
      }
    } catch {
      setEditForm({
        status: String(row.status || "present"),
        check_in: toTimeValue(row.check_in),
        check_out: toTimeValue(row.check_out),
        note: String(row.note || ""),
      });
    }
  };

  const closeEdit = () => {
    if (editSaving) return;
    setEditOpen(false);
    setEditRow(null);
    setEditError("");
  };

  const statusNeedsPunch = (status) => ["present", "late", "half_day"].includes(String(status || "").toLowerCase());

  const saveEdit = async () => {
    if (!editRow) return;

    if (statusNeedsPunch(editForm.status)) {
      if (!editForm.check_in) {
        setEditError("Punch In time is required when status is Present, Late, or Half Day.");
        return;
      }
      if (!editForm.check_out) {
        setEditError("Punch Out time is required when status is Present, Late, or Half Day.");
        return;
      }
    }

    setEditSaving(true);
    setEditError("");
    try {
      const payload = {
        emp_id: editRow.emp_id,
        date: editRow.date,
        status: editForm.status,
        check_in: editForm.check_in || "",
        check_out: editForm.check_out || "",
        note: editForm.note || "",
      };
      const res = await hrmsApi.updateAttendanceRecord(payload);
      if (!res?.success) throw new Error(res?.error || "Failed to update attendance");
      await loadAttendance();
      closeEdit();
    } catch (e) {
      setEditError(e?.message || "Failed to update attendance");
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-black text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">View and manage employee attendance.</p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/services/hrms")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 text-gray-800 font-bold hover:bg-gray-200 transition-all w-full lg:w-auto justify-center"
        >
          ← Back
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <ClipboardCheck size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Employees Attendance</h2>
              <p className="text-sm text-gray-500 font-medium">
                {from === to ? `Date: ${formatDDMMYYYY(from)}` : `From ${formatDDMMYYYY(from)} To ${formatDDMMYYYY(to)}`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={resetFilters}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-60"
            >
              Reset
            </button>

            <button
              onClick={loadAttendance}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-60"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">From</span>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">To</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 bg-white"
              />
            </div>
          </div>

          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, role, status..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: "total", label: "Total", value: stats.total, bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", ring: "ring-slate-400" },
            { key: "present", label: "Present", value: stats.present, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", ring: "ring-emerald-400" },
            { key: "absent", label: "Absent", value: stats.absent, bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", ring: "ring-rose-400" },
            { key: "onLeave", label: "On Leave", value: stats.onLeave, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", ring: "ring-amber-400" },
          ].map((c) => (
            <div 
              key={c.key} 
              onClick={() => setStatusFilter(c.key)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-md ${c.bg} ${c.border} ${statusFilter === c.key ? `ring-2 ${c.ring} scale-102 shadow-sm` : ""}`}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{c.label}</p>
              <p className={`text-xl font-black mt-1 ${c.text}`}>{loading ? "—" : c.value}</p>
            </div>
          ))}
        </div>

        {statusFilter !== "total" && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold w-fit">
            Filter: {statusFilter.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
            <button onClick={() => setStatusFilter("total")} className="hover:text-indigo-900">
              <X size={12} />
            </button>
          </div>
        )}

        {error ? (
          <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm font-semibold">
            {error}
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {showDateColumn ? (
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                ) : null}
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Emp ID</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Check In</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Check Out</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Hours</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                {showActions ? (
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Edit</th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-10 text-center text-gray-400 font-semibold">
                    Loading...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-10 text-center text-gray-400 font-semibold">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                filteredRows.map((r, idx) => {
                  const s = String(r.status || "").toLowerCase();
                  const badge =
                    s === "present"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : s === "on_leave"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200";

                  return (
                    <tr key={`${r.date || ""}-${r.emp_id || ""}-${idx}`} className="hover:bg-gray-50/50">
                      {showDateColumn ? <td className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">{r.date}</td> : null}
                      <td className="px-4 py-3 font-bold text-indigo-600 whitespace-nowrap">{r.emp_id || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-900">{r.full_name || "—"}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">{r.role || "—"}</td>
                      <td className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">{r.check_in || "—"}</td>
                      <td className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">{r.check_out || "—"}</td>
                      <td className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">{r.working_hours || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${badge}`}>
                          {s ? s.replace(/_/g, " ") : "—"}
                        </span>
                      </td>
                      {showActions ? (
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEdit(r)}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-all"
                            title="Edit attendance"
                          >
                            <Edit size={16} />
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-950/50" onClick={closeEdit} />
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-lg font-black text-gray-900 truncate">Edit Attendance</h3>
                <p className="text-sm text-gray-500 font-medium truncate">
                  {editRow?.full_name ? `${editRow.full_name} (${editRow.emp_id})` : editRow?.emp_id} • {editRow?.date}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                className="w-9 h-9 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 inline-flex items-center justify-center"
                aria-label="Close"
                disabled={editSaving}
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {editError ? (
                <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm font-semibold">
                  {editError}
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Punch In
                    {statusNeedsPunch(editForm.status) && <span className="text-red-500 ml-1">*</span>}
                  </div>
                  <input
                    type="time"
                    value={editForm.check_in}
                    onChange={(e) => setEditForm((p) => ({ ...p, check_in: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border text-sm font-semibold text-gray-700 bg-white ${
                      statusNeedsPunch(editForm.status) && !editForm.check_in
                        ? "border-red-300 focus:ring-red-400"
                        : "border-gray-200"
                    }`}
                  />
                  {statusNeedsPunch(editForm.status) && !editForm.check_in && (
                    <p className="text-xs text-red-500 font-medium">Punch In is required for this status.</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Punch Out
                    {statusNeedsPunch(editForm.status) && <span className="text-red-500 ml-1">*</span>}
                  </div>
                  <input
                    type="time"
                    value={editForm.check_out}
                    onChange={(e) => setEditForm((p) => ({ ...p, check_out: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border text-sm font-semibold text-gray-700 bg-white ${
                      statusNeedsPunch(editForm.status) && !editForm.check_out
                        ? "border-red-300 focus:ring-red-400"
                        : "border-gray-200"
                    }`}
                  />
                  {statusNeedsPunch(editForm.status) && !editForm.check_out && (
                    <p className="text-xs text-red-500 font-medium">Punch Out is required for this status.</p>
                  )}
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</div>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 bg-white"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="on_leave">On Leave</option>
                    <option value="late">Late</option>
                    <option value="half_day">Half Day</option>
                  </select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Note</div>
                  <textarea
                    rows={3}
                    value={editForm.note}
                    onChange={(e) => setEditForm((p) => ({ ...p, note: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 bg-white"
                    placeholder="Optional note..."
                  />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeEdit}
                disabled={editSaving}
                className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-800 font-bold text-sm hover:bg-gray-200 transition-all disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={editSaving}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all disabled:opacity-60"
              >
                {editSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
