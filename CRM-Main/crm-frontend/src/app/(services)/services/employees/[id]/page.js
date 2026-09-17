"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Pencil, Trash2, Mail, Phone, BadgeIndianRupee, Calendar } from "lucide-react";
import { hrmsApi } from "@/lib/api";

const titleStatus = (value) => {
  const s = String(value || "").trim();
  if (!s) return "-";
  if (s.toLowerCase() === "on_leave") return "On Leave";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const statusPill = (value) => {
  const s = String(value || "").toLowerCase();
  if (s === "active") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (s === "probation") return "bg-blue-50 text-blue-700 border-blue-100";
  if (s === "on_leave" || s === "on leave") return "bg-amber-50 text-amber-700 border-amber-100";
  if (s === "resigned") return "bg-rose-50 text-rose-700 border-rose-100";
  return "bg-gray-50 text-gray-700 border-gray-100";
};

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const empId = useMemo(() => String(id || ""), [id]);
  const router = useRouter();
  const backToList = () => router.push("/services/hrms/staff");

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await hrmsApi.getEmployee(empId);
        if (!mounted) return;
        if (res?.success) setEmployee(res.data);
        else setError(res?.error || "Employee not found");
      } catch (e) {
        if (mounted) setError(e?.message || "Failed to load employee");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [empId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 sm:px-0 space-y-4">
        <button
          onClick={backToList}
          className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors w-fit group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-semibold uppercase tracking-wider">Back</span>
        </button>
        <div className="px-5 py-3 bg-rose-50 border border-rose-100 text-rose-700 text-sm font-semibold rounded-2xl">
          {error}
        </div>
      </div>
    );
  }

  if (!employee) return null;

  const initial = String(employee.full_name || "?").trim().charAt(0).toUpperCase();
  const joinDate = employee.join_date ? new Date(employee.join_date).toISOString().split("T")[0] : "-";

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4 sm:px-0 pb-20">
      <div className="flex flex-col gap-4">
        <button
          onClick={backToList}
          className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors w-fit group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-semibold uppercase tracking-wider">Back to Directory</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold">
              {initial}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{employee.full_name}</h1>
                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${statusPill(employee.status)}`}>
                  {titleStatus(employee.status)}
                </span>
              </div>
              <p className="text-gray-500 font-semibold flex items-center gap-2 text-sm">
                <span className="text-indigo-600 uppercase tracking-widest text-[10px] font-bold">{employee.role || "—"}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{employee.emp_id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/services/hrms/staff/${employee.emp_id}/edit`)}
              className="px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
            >
              <Pencil size={16} /> Edit
            </button>
            <button
              onClick={() => router.push(`/services/hrms/staff/${employee.emp_id}/delete`)}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-all shadow-sm flex items-center gap-2"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-700 font-bold mb-2">
            <Mail size={16} className="text-indigo-600" />
            Email
          </div>
          <p className="text-sm text-gray-700 font-semibold">{employee.email || "-"}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-700 font-bold mb-2">
            <Phone size={16} className="text-indigo-600" />
            Phone
          </div>
          <p className="text-sm text-gray-700 font-semibold">{employee.phone || "-"}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-700 font-bold mb-2">
            <BadgeIndianRupee size={16} className="text-indigo-600" />
            Salary
          </div>
          <p className="text-sm text-gray-700 font-semibold">₹{Number(employee.salary || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-700 font-bold mb-2">
            <Calendar size={16} className="text-indigo-600" />
            Join date
          </div>
          <p className="text-sm text-gray-700 font-semibold">{joinDate}</p>
        </div>
      </div>
    </div>
  );
}
