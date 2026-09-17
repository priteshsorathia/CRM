"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle2, RefreshCw, Search, XCircle, Pencil, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { hrmsApi } from "@/lib/api";
import { getUserRole, validateToken } from "@/utils/auth";
import { useRole } from "@/app/(services)/context/RoleContext";

export default function LeaveManagementClient() {
  const router = useRouter();
  const { can } = useRole();
  const [role, setRole] = useState("");
  const [roleLoaded, setRoleLoaded] = useState(false);

  // Derive permissions from RBAC
  const canCreate = can('LEAVE_MANAGEMENT', 'CREATE');
  const canUpdate = can('LEAVE_MANAGEMENT', 'UPDATE');
  const canDelete = can('LEAVE_MANAGEMENT', 'DELETE');

  const isOwner = useMemo(() => {
    const raw = String(role || "").trim().toLowerCase();
    const variants = new Set([
      raw,
      raw.replace(/\s+/g, "_"),
      raw.replace(/_/g, " "),
      raw.replace(/[-/]+/g, "_"),
      raw.replace(/[-/]+/g, " "),
    ]);

    for (const v of variants) {
      if (v === "owner" || v === "shop_owner" || v === "shop owner" || v === "admin") return true;
      if (v.endsWith("_owner")) return true;
      if (v.includes("owner")) return true;
      if (v.includes("admin")) return true;
    }

    return false;
  }, [role]);

  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState("");
  const [leaveStatus, setLeaveStatus] = useState("all"); 
  const [leaveSearch, setLeaveSearch] = useState("");
  const [leaveRows, setLeaveRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Edit State
  const [editingLeave, setEditingLeave] = useState(null);
  const [editForm, setEditForm] = useState({
    type: "",
    from_date: "",
    to_date: "",
    reason: "",
    status: "",
    decisionNote: ""
  });
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    const safeParse = (value) => {
      try {
        if (!value || typeof value !== "string") return null;
        return JSON.parse(value);
      } catch {
        return null;
      }
    };

    let cancelled = false;

    (async () => {
      try {
        const roleFromHelper = getUserRole();
        if (roleFromHelper) {
          if (!cancelled) setRole(roleFromHelper);
          return;
        }

        const userData = safeParse(localStorage.getItem("userData"));
        const user = safeParse(localStorage.getItem("user"));
        const merged = { ...(userData || {}), ...(user || {}) };

        let roleValue = merged.role || merged.user_role || merged?.user?.role || merged?.user?.user_role;
        if (!roleValue) {
          const v = await validateToken().catch(() => ({ valid: false }));
          const u = v?.user || null;
          roleValue = u?.role || u?.user_role || u?.user?.role || u?.user?.user_role || "";
        }

        if (!cancelled) setRole(roleValue || "");
      } finally {
        if (!cancelled) setRoleLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadLeaves = async (targetPage = page) => {
    setLeaveLoading(true);
    setLeaveError("");
    try {
      const params = { page: targetPage, limit: 10 };
      if (leaveStatus && leaveStatus !== "all") params.status = leaveStatus;
      if (leaveSearch && leaveSearch.trim()) params.search = leaveSearch.trim();
      
      const res = await hrmsApi.getLeaveRequests(params);
      if (!res?.success) throw new Error(res?.error || "Failed to load leave requests");
      setLeaveRows(Array.isArray(res.data) ? res.data : []);
      setPages(Number(res?.pagination?.pages) || 1);
      setTotal(Number(res?.pagination?.total) || 0);
    } catch (e) {
      setLeaveError(e?.message || "Failed to load leave requests");
      setLeaveRows([]);
      setPages(1);
      setTotal(0);
    } finally {
      setLeaveLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadLeaves(1);
  }, [leaveStatus, leaveSearch]);

  useEffect(() => {
    if (page > 1 || (total > 0 && page === 1)) {
       loadLeaves(page);
    }
  }, [page]);

  const formatISODate = (v) => {
    try {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return String(v || "");
      return d.toISOString().split("T")[0];
    } catch {
      return String(v || "");
    }
  };

  const filteredLeaveRows = leaveRows;

  const decideLeave = async (id, status) => {
    const note =
      status === "rejected"
        ? window.prompt("Reject reason (optional):", "") || ""
        : window.prompt("Approval note (optional):", "") || "";

    try {
      const res = await hrmsApi.updateLeaveRequestStatus(id, status, note);
      if (!res?.success) throw new Error(res?.error || "Failed to update leave request");
      await loadLeaves();
    } catch (e) {
      window.alert(e?.message || "Failed to update leave request");
    }
  };

  const handleEditClick = (leave) => {
    setEditingLeave(leave);
    setEditForm({
      type: leave.type || "",
      from_date: formatISODate(leave.from_date),
      to_date: formatISODate(leave.to_date),
      reason: leave.reason || "",
      status: leave.status || "pending",
      decisionNote: leave.decisionNote || ""
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingLeave) return;
    setEditSaving(true);
    try {
      const res = await hrmsApi.updateLeaveRequest(editingLeave.id, editForm);
      if (!res?.success) throw new Error(res?.error || "Failed to update leave request");
      setEditingLeave(null);
      await loadLeaves();
    } catch (e) {
      window.alert(e?.message || "Failed to update leave request");
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-black text-gray-900">Leave Management</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            {isOwner ? "Review and approve/reject employee leave requests." : "Apply for leave and track approval status."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/services/hrms")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 text-gray-800 font-bold hover:bg-gray-200 transition-all w-full lg:w-auto justify-center"
        >
          ← Back
        </button>
      </div>

      {!roleLoaded ? (
        <div className="flex items-center justify-center min-h-[240px] bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700">
                <Calendar size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{isOwner ? "Leave Requests" : "My Leave Requests"}</h2>
                <p className="text-sm text-gray-500 font-medium">{isOwner ? "Review and approve/reject employee leave requests." : "Apply for leave and track approval status."}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={leaveStatus}
                onChange={(e) => setLeaveStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 bg-white"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  value={leaveSearch}
                  onChange={(e) => setLeaveSearch(e.target.value)}
                  placeholder="Search..."
                  className="pl-10 pr-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 bg-white w-[260px] max-w-full"
                />
              </div>

              <button
                onClick={loadLeaves}
                disabled={leaveLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-60"
              >
                <RefreshCw size={14} />
                Refresh
              </button>

              {canCreate && !isOwner && (
                <button
                  onClick={() => window.location.assign("/services/hrms/staff/apply-leave")}
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-amber-700 transition-all"
                >
                  Apply Leave
                </button>
              )}
            </div>
          </div>

          {leaveError ? (
            <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm font-semibold">
              {leaveError}
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {isOwner && <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Employee</th>}
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">From</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">To</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Days</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  {!isOwner && <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Note</th>}
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {leaveLoading ? (
                  <tr>
                    <td colSpan={isOwner ? 8 : 8} className="px-4 py-10 text-center text-gray-400 font-semibold">
                      Loading...
                    </td>
                  </tr>
                ) : filteredLeaveRows.length === 0 ? (
                  <tr>
                    <td colSpan={isOwner ? 8 : 8} className="px-4 py-10 text-center text-gray-400 font-semibold">
                      No leave requests found
                    </td>
                  </tr>
                ) : (
                  filteredLeaveRows.map((r) => {
                    const s = String(r.status || "").toLowerCase();
                    const badge =
                      s === "approved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : s === "rejected"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200";

                    return (
                      <tr key={r.id} className="hover:bg-gray-50/50">
                        {isOwner && (
                          <td className="px-4 py-3">
                            <div className="font-bold text-gray-900">{r?.employee?.full_name || "—"}</div>
                            <div className="text-xs font-semibold text-gray-500">
                              {r?.employee?.emp_id ? `${r.employee.emp_id}` : "—"}
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">{r.type || "—"}</td>
                        <td className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">{formatISODate(r.from_date)}</td>
                        <td className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">{formatISODate(r.to_date)}</td>
                        <td className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">{r.days ?? "—"}</td>
                        <td className="px-4 py-3 text-gray-700 font-medium max-w-[240px] truncate" title={r.reason || ""}>
                          {r.reason || "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${badge}`}>
                            {s || "—"}
                          </span>
                        </td>
                        {!isOwner && (
                          <td className="px-4 py-3 text-gray-700 font-medium max-w-[200px] truncate" title={r.decisionNote || ""}>
                            {r.decisionNote || "—"}
                          </td>
                        )}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                           {(isOwner ? canUpdate : (canUpdate && s === "pending")) && (
                              <button
                                onClick={() => handleEditClick(r)}
                                className="p-2 rounded-xl text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                                title="Edit leave request"
                              >
                                <Pencil size={18} />
                              </button>
                            )}
                            {isOwner && canUpdate && s === "pending" && (
                              <>
                                <button
                                  onClick={() => decideLeave(r.id, "approved")}
                                  className="p-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                                  title="Approve"
                                >
                                  <CheckCircle2 size={18} />
                                </button>
                                <button
                                  onClick={() => decideLeave(r.id, "rejected")}
                                  className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                  title="Reject"
                                >
                                  <XCircle size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs sm:text-sm bg-gray-50/30">
            <p className="text-gray-500 font-bold">
              Showing <span className="text-gray-900">{filteredLeaveRows.length}</span> of {total} requests
            </p>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1 || leaveLoading}
                onClick={() => setPage(prv => prv - 1)}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="px-3 text-xs font-bold text-gray-700">
                Page {page} of {Math.max(1, pages)}
              </div>
              <button
                disabled={page >= pages || leaveLoading}
                onClick={() => setPage(nxt => nxt + 1)}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-950/50" onClick={() => setEditingLeave(null)} />
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-gray-900">Edit Leave Request</h3>
                <p className="text-sm text-gray-500 font-medium">
                  {isOwner ? `Editing request for ${editingLeave.employee?.full_name}` : "Update your leave request details"}
                </p>
              </div>
              <button
                onClick={() => setEditingLeave(null)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Leave Type</label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 bg-white"
                    required
                  >
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Earned Leave">Earned Leave</option>
                    <option value="Maternity Leave">Maternity Leave</option>
                    <option value="Paternity Leave">Paternity Leave</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                    disabled={!isOwner}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">From Date</label>
                  <input
                    type="date"
                    value={editForm.from_date}
                    onChange={(e) => setEditForm(p => ({ ...p, from_date: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 bg-white"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">To Date</label>
                  <input
                    type="date"
                    value={editForm.to_date}
                    onChange={(e) => setEditForm(p => ({ ...p, to_date: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 bg-white"
                    required
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Reason</label>
                  <textarea
                    value={editForm.reason}
                    onChange={(e) => setEditForm(p => ({ ...p, reason: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 bg-white"
                    rows={2}
                    placeholder="Briefly explain the reason for leave..."
                  />
                </div>
                {isOwner && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Decision Note</label>
                    <textarea
                      value={editForm.decisionNote}
                      onChange={(e) => setEditForm(p => ({ ...p, decisionNote: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 bg-white"
                      rows={2}
                      placeholder="Add a note about the approval/rejection..."
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLeave(null)}
                  disabled={editSaving}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-800 font-bold text-sm hover:bg-gray-200 transition-all disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all disabled:opacity-60 shadow-md shadow-indigo-100"
                >
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
