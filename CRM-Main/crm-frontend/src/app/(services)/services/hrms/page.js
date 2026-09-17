"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Calculator, Calendar, ClipboardCheck, FileText, RefreshCw, UserPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { hrmsApi } from "@/lib/api";
import { getUserRole, validateToken } from "@/utils/auth";
import { useRole } from "@/app/(services)/context/RoleContext";
import SummaryCard from "@/app/(retailers)/hrms/components/SummaryCard";
import PayrollTable from "@/app/(retailers)/hrms/components/PayrollTable";
import PayrollCalculator from "@/app/(retailers)/hrms/components/PayrollCalculator";
import ExportReportsCard from "@/app/(retailers)/hrms/components/ExportReportsCard";

export default function HrmsPage() {
  const router = useRouter();
  const { can } = useRole();
  const [role, setRole] = useState("");
  const [roleLoaded, setRoleLoaded] = useState(false);

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

  const [payrollMonth, setPayrollMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [payrollData, setPayrollData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        let roleValue = merged.role || merged.user_role || merged?.user?.role || merged?.user?.user_role || "";
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

  const loadPayroll = async () => {
    if (!isOwner) return;
    setLoading(true);
    setError("");
    try {
      const [payrollRes, staffRes] = await Promise.all([
        hrmsApi.getPayrolls(payrollMonth),
        hrmsApi.getEmployees(),
      ]);

      if (!payrollRes?.success) throw new Error(payrollRes?.error || "Failed to load payrolls");
      if (!staffRes?.success) throw new Error(staffRes?.error || "Failed to load employees");

      setPayrollData(Array.isArray(payrollRes.data) ? payrollRes.data : []);
      setEmployees(Array.isArray(staffRes.data) ? staffRes.data : []);
    } catch (e) {
      setError(e?.message || "Failed to load payroll data");
      setPayrollData([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!roleLoaded) return;
    if (!isOwner) return;
    loadPayroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleLoaded, isOwner, payrollMonth]);

  const payrollSummary = useMemo(() => {
    return (Array.isArray(payrollData) ? payrollData : []).reduce(
      (acc, payroll) => {
        acc.totalPayroll += payroll?.net_salary || 0;
        acc.totalEmployees += 1;
        if (String(payroll?.status || "").toLowerCase() === "paid") {
          acc.paidAmount += payroll?.net_salary || 0;
        } else {
          acc.pendingAmount += payroll?.net_salary || 0;
        }
        return acc;
      },
      { totalPayroll: 0, paidAmount: 0, pendingAmount: 0, totalEmployees: 0 },
    );
  }, [payrollData]);

  const payrollSummaryCards = useMemo(() => {
    return [
      {
        title: "Total Payroll",
        value: `₹${(payrollSummary.totalPayroll || 0).toLocaleString("en-IN")}`,
        bgColor: "bg-blue-50",
        icon: <FileText className="w-4 h-4 text-blue-600" />,
      },
      {
        title: "Total Employees",
        value: String(payrollSummary.totalEmployees || 0),
        bgColor: "bg-slate-50",
        icon: <Users className="w-4 h-4 text-slate-700" />,
      },
      {
        title: "Total Paid",
        value: `₹${(payrollSummary.paidAmount || 0).toLocaleString("en-IN")}`,
        bgColor: "bg-emerald-50",
        icon: <FileText className="w-4 h-4 text-emerald-600" />,
      },
      {
        title: "Pending",
        value: `₹${(payrollSummary.pendingAmount || 0).toLocaleString("en-IN")}`,
        bgColor: "bg-amber-50",
        icon: <FileText className="w-4 h-4 text-amber-600" />,
      },
    ];
  }, [payrollSummary]);

  const employeesRemaining = useMemo(() => {
    const calculated = new Set((Array.isArray(payrollData) ? payrollData : []).map((p) => String(p?.emp_id || "")));
    return (Array.isArray(employees) ? employees : []).filter((e) => {
      const id = String(e?.emp_id || "");
      return id && !calculated.has(id);
    });
  }, [employees, payrollData]);

  const handleRecalculatePayroll = async (empId) => {
    try {
      setLoading(true);
      const res = await hrmsApi.calculatePayroll(empId, payrollMonth);
      if (!res?.success) throw new Error(res?.error || "Recalculation failed");
      await loadPayroll();
    } catch (e) {
      setError(e?.message || "Failed to recalculate payroll");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 shrink-0">
            <Calculator size={22} />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">HRMS Dashboard</h1>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex items-center gap-2 sm:gap-3 w-full lg:w-auto">
          {can('EMPLOYEE', 'READ') && (
            <button
              type="button"
              onClick={() => router.push("/services/hrms/staff")}
              className="flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 active:scale-95 whitespace-nowrap shadow-sm"
            >
              <Users size={16} className="shrink-0" />
              Manage Staff
            </button>
          )}

          {can('EMPLOYEE', 'CREATE') && (
            <button
              type="button"
              onClick={() => router.push("/services/hrms/staff?tab=Onboarding")}
              className="flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100 active:scale-95 whitespace-nowrap"
            >
              <UserPlus size={16} className="shrink-0" />
              Add Staff
            </button>
          )}

          <button
            type="button"
            onClick={() => router.push("/services/hrms/attendance")}
            className="flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100 active:scale-95 whitespace-nowrap"
          >
            <ClipboardCheck size={16} className="shrink-0" />
            Attendance
          </button>
          
          {(can('LEAVE_MANAGEMENT', 'READ') || can('LEAVE_MANAGEMENT', 'CREATE') || can('LEAVE_MANAGEMENT', 'UPDATE') || can('LEAVE_MANAGEMENT', 'DELETE')) && (
            <button
              type="button"
              onClick={() => router.push("/services/hrms/leave-management")}
              className="flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-100 active:scale-95 whitespace-nowrap"
            >
              <Calendar size={16} className="shrink-0" />
              Leaves
            </button>
          )}
        </div>
      </div>

      {!roleLoaded ? (
        <div className="flex items-center justify-center min-h-[240px] bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : !isOwner ? (
        <div className="bg-white p-10 md:p-14 rounded-2xl border border-gray-200 shadow-sm text-center flex flex-col items-center gap-6">
          <div className="p-5 bg-slate-50 text-slate-700 rounded-2xl shadow-sm border border-slate-200">
            <Calculator size={40} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Payroll</h2>
            <p className="text-sm text-gray-500 font-medium mt-2">Payroll is available for owners/admins only.</p>
          </div>
        </div>
      ) : (
        <>
          {error ? (
            <div className="px-5 py-3 bg-rose-50 border border-rose-100 text-rose-700 text-sm font-semibold rounded-2xl">
              {error}
            </div>
          ) : null}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Payroll for{" "}
                  {new Date(`${payrollMonth}-01`).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
                <div className="w-full sm:w-auto flex items-center gap-2">
                  <input
                    type="month"
                    value={payrollMonth}
                    onChange={(e) => setPayrollMonth(e.target.value)}
                    min="2020-01"
                    max={new Date().toISOString().slice(0, 7)}
                    className="w-full sm:w-auto form-input rounded-md border-gray-300 text-sm"
                  />
                  <button
                    onClick={loadPayroll}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-60"
                  >
                    <RefreshCw size={14} />
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {payrollSummaryCards.map((data, index) => (
                  <SummaryCard
                    key={`services-payroll-summary-${index}`}
                    title={data.title}
                    value={data.value}
                    bgColor={data.bgColor}
                    icon={data.icon}
                  />
                ))}
              </div>
            </div>

            <div className="p-0 sm:p-6 pb-4 sm:pb-6">
              <PayrollTable
                payrollData={Array.isArray(payrollData) ? payrollData : []}
                onRecalculate={handleRecalculatePayroll}
                loading={loading}
                basePath="/services/hrms"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PayrollCalculator
              employees={employeesRemaining}
              currentMonth={payrollMonth}
              onCalculate={loadPayroll}
              loading={loading}
            />
            <ExportReportsCard
              currentMonth={payrollMonth}
              payrollData={Array.isArray(payrollData) ? payrollData : []}
              summary={payrollSummary}
            />
          </div>
        </>
      )}
    </div>
  );
}
