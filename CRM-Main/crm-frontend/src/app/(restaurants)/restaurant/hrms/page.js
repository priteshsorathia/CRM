'use client';
import { toast } from 'sonner';
import {
  FileText,
  UserPlus,
  CalendarCheck,
  Badge,
  Calculator,
  Users,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { FaUsersCog } from 'react-icons/fa';

import SummaryCard from '@/app/(retailers)/hrms/components/SummaryCard';
import PayrollTable from '@/app/(retailers)/hrms/components/PayrollTable';
import PayrollCalculator from '@/app/(retailers)/hrms/components/PayrollCalculator';
import ExportReportsCard from '@/app/(retailers)/hrms/components/ExportReportsCard';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getApiBase } from '@/utils/apiBase';

const API_URL = `${getApiBase()}/api/hrms`;

export default function HRMSPage() {
  // State
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [monthError, setMonthError] = useState("");
  const [payrollData, setPayrollData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [myEmpId, setMyEmpId] = useState(null);
  const [myName, setMyName] = useState('');
  const [myAttendance, setMyAttendance] = useState(null);
  const [myUserId, setMyUserId] = useState(null);
  const [myOrdersTodayCount, setMyOrdersTodayCount] = useState(0);

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const normalizedRole = String(userRole || '').toLowerCase();
  const isAdmin =
    normalizedRole === 'admin' ||
    normalizedRole === 'shop_owner' ||
    normalizedRole === 'restaurant_owner' ||
    normalizedRole.endsWith('_owner');
  const isRestricted = ['staff', 'sales', 'waiter', 'waitress', 'server', 'manager', 'chef', 'cook', 'kitchen'].includes(normalizedRole);
  const canSeeOrdersTakenToday = ['staff', 'sales', 'waiter', 'waitress', 'server', 'manager'].includes(normalizedRole);
  const headerTitle = isAdmin ? 'HRMS Dashboard' : (myName || 'My Attendance');

  useEffect(() => {
    const rawUser = localStorage.getItem('userData') || localStorage.getItem('user');
    if (!rawUser) return;
    try {
      const u = JSON.parse(rawUser);
      const role = String(u.role || u.user_role || u.user?.role || '').toLowerCase();
      setUserRole(role);
      const uid = u.id || u.user?.id || u.userId || null;
      setMyUserId(uid ? parseInt(uid, 10) : null);

      const empId =
        u.employeeId ||
        u.employee_id ||
        u.emp_id ||
        u.employee?.id ||
        u.user?.employeeId ||
        null;
      setMyEmpId(empId);

      const name = u.name || u.full_name || u.employee?.full_name || 'My Profile';
      setMyName(name);
    } catch {
      // non-blocking
    }
  }, []);

  const getValidMonthForFetch = (monthStr) => {
    if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    const parts = monthStr.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    if (month < 1 || month > 12 || year < 2000 || year > 2100) {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    return monthStr;
  };

  // --- Fetch Data ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const headers = { 'Authorization': `Bearer ${token}` };

      if (isAdmin) {
        const queryMonth = getValidMonthForFetch(currentMonth);
        // 1. Fetch Payrolls for Month
        const payrollRes = await fetch(`${API_URL}/payroll/list?month=${queryMonth}`, { headers });
        const payrollJson = await payrollRes.json();

        // 2. Fetch All Employees (for dropdown)
        const staffRes = await fetch(`${API_URL}/staff`, { headers });
        const staffJson = await staffRes.json();

        if (payrollJson.success) setPayrollData(payrollJson.data);
        if (staffJson.success) setEmployees(staffJson.data);
      }

    } catch (error) {
      toast.error("Failed to load HRMS data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentMonth, isAdmin]);

  const fetchMyAttendance = async () => {
    if (!isRestricted) return;
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      const res = await fetch(`${API_URL}/attendance?date=${today}${myEmpId ? `&emp_id=${myEmpId}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!json.success) return;

      const record = (json.data || [])[0] || null;
      setMyAttendance(record);
      if (record?.user_name) setMyName(record.user_name);
      else if (record?.full_name) setMyName(record.full_name);
    } catch {
      // non-blocking
    }
  };

  useEffect(() => {
    fetchMyAttendance();
  }, [isRestricted, today, myEmpId]);

  const fetchMyOrdersCount = async () => {
    if (!canSeeOrdersTakenToday) return;
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token) return;

      const API_BASE = getApiBase();
      if (!API_BASE) return;

      const res = await fetch(`${API_BASE}/api/restaurant/orders?date=today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;

      const json = await res.json().catch(() => ({}));
      const orders = Array.isArray(json?.orders) ? json.orders : [];

      const myId = Number.isFinite(Number(myUserId)) ? Number(myUserId) : null;
      const myNameNorm = String(myName || '').trim().toLowerCase();

      const count = orders.filter((o) => {
        const oid = o?.taken_by_id != null ? Number(o.taken_by_id) : null;
        if (myId != null && oid != null && myId === oid) return true;
        const name = String(o?.taken_by_name || '').trim().toLowerCase();
        return Boolean(name && myNameNorm && name === myNameNorm);
      }).length;

      setMyOrdersTodayCount(count);
    } catch {
      // non-blocking
    }
  };

  useEffect(() => {
    fetchMyOrdersCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSeeOrdersTakenToday, myUserId, myName]);

  // --- Summary Calculations ---
  const summary = payrollData.reduce((acc, payroll) => {
    acc.totalPayroll += (payroll.net_salary || 0);
    acc.totalEmployees += 1;

    if (payroll.status === 'paid') {
      acc.paidAmount += (payroll.net_salary || 0);
    } else {
      acc.pendingAmount += (payroll.net_salary || 0);
    }

    return acc;
  }, {
    totalPayroll: 0,
    paidAmount: 0,
    pendingAmount: 0,
    totalEmployees: 0
  });

  // --- Handlers ---

  const handleMonthChange = (e) => {
    const val = e.target.value.replace(/\s/g, ''); // strip spaces
    setCurrentMonth(val);
    if (!val) {
      setMonthError("");
    } else if (!/^\d{4}-\d{2}$/.test(val)) {
      setMonthError("Please enter a valid month (YYYY-MM)");
    } else {
      const parts = val.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      if (month < 1 || month > 12 || year < 2000 || year > 2100) {
        setMonthError("Please enter a valid month (YYYY-MM)");
      } else {
        setMonthError("");
      }
    }
  };

  // Called when "Calculate Payroll" is clicked
  const handleCalculatePayroll = async () => {
    await fetchData();
  };

  // Recalculate specific employee (Calls same API as create)
  const handleRecalculate = async (empId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/payroll/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          emp_id: empId,
          month: currentMonth
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Payroll recalculated successfully');
        fetchData(); // Refresh list
      } else {
        toast.error(data.error || "Recalculation failed");
      }
    } catch (error) {
      toast.error('Failed to recalculate payroll');
    } finally {
      setLoading(false);
    }
  };

  const handleMyCheckIn = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/attendance/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ emp_id: myEmpId, date: today })
      });
      const json = await res.json();
      if (!json.success) toast.error(json.error || 'Failed to punch in');
      else toast.success('Punch in successful');
      fetchMyAttendance();
    } catch {
      toast.error('Failed to punch in');
    } finally {
      setLoading(false);
    }
  };

  const handleMyCheckOut = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/attendance/check-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ emp_id: myEmpId, date: today })
      });
      const json = await res.json();
      if (!json.success) toast.error(json.error || 'Failed to punch out');
      else toast.success('Punch out successful');
      fetchMyAttendance();
    } catch {
      toast.error('Failed to punch out');
    } finally {
      setLoading(false);
    }
  };

  // Filter employees who are fully processed (status is paid)
  const getAvailableEmployees = () => {
    const calculatedPaidEmpIds = payrollData.filter(p => p.status === 'paid').map(p => p.emp_id);
    return employees.filter(emp => !calculatedPaidEmpIds.includes(emp.emp_id));
  };

  const summaryData = [
    {
      title: "Total Payroll",
      value: `₹${summary.totalPayroll.toLocaleString('en-IN')}`,
      bgColor: "bg-blue-50",
      icon: <Calculator className="w-5 h-5 text-blue-600" />
    },
    {
      title: "Paid Amount",
      value: `₹${summary.paidAmount.toLocaleString('en-IN')}`,
      bgColor: "bg-green-50",
      icon: <FileText className="w-5 h-5 text-green-600" />
    },
    {
      title: "Pending Amount",
      value: `₹${summary.pendingAmount.toLocaleString('en-IN')}`,
      bgColor: "bg-yellow-50",
      icon: <CalendarCheck className="w-5 h-5 text-yellow-600" />
    },
    {
      title: "Employees",
      value: summary.totalEmployees,
      bgColor: "bg-purple-50",
      icon: <Users className="w-5 h-5 text-purple-600" />
    }
  ];

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaUsersCog className="w-5 h-5 text-blue-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{headerTitle}</h1>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3">
            {isAdmin && (
              <Link href="/restaurant/hrms/staff/add" className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm text-[10px] xs:text-xs sm:text-sm">
                <UserPlus className="w-3.5 h-3.5 sm:w-4 h-4" />
                <span>Add Staff</span>
              </Link>
            )}
            <Link href="/restaurant/hrms/attendance" className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-sm text-[10px] xs:text-xs sm:text-sm">
              <CalendarCheck className="w-3.5 h-3.5 sm:w-4 h-4" />
              <span>{isRestricted ? 'Check Attendance' : 'Attendance'}</span>
            </Link>
            {isAdmin && (
              <Link href="/restaurant/hrms/staff" className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-sm text-[10px] xs:text-xs sm:text-sm">
                <Badge className="w-3.5 h-3.5 sm:w-4 h-4" />
                <span>Manage Staff</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Restricted view (Staff/Manager) */}
      {isRestricted && (
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900">My Attendance</h2>
          <p className="text-xs sm:text-sm text-gray-500">{myName || 'My Profile'}</p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Punch In</div>
              <div className="mt-1 text-lg font-bold text-slate-800">{myAttendance?.check_in || '--'}</div>
              {!myAttendance?.check_in && (
                <button
                  onClick={handleMyCheckIn}
                  disabled={loading}
                  className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" /> Punch In
                </button>
              )}
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Punch Out</div>
              <div className="mt-1 text-lg font-bold text-slate-800">{myAttendance?.check_out || '--'}</div>
              {myAttendance?.check_in && !myAttendance?.check_out && (
                <button
                  onClick={handleMyCheckOut}
                  disabled={loading}
                  className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" /> Punch Out
                </button>
              )}
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Status</div>
              <div className="mt-2 inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-200 text-slate-700">
                {myAttendance?.status || 'Not Punched'}
              </div>
            </div>

            {canSeeOrdersTakenToday ? (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 sm:col-span-3">
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Orders Taken Today</div>
                <div className="mt-1 text-lg font-bold text-slate-800">{myOrdersTodayCount}</div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Payroll Section (Admins only) */}
      {isAdmin && (
        <>
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Payroll for {(() => {
                    if (!currentMonth || !/^\d{4}-\d{2}$/.test(currentMonth)) {
                      return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    }
                    const parts = currentMonth.split('-');
                    const year = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10);
                    if (month < 1 || month > 12) {
                      return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    }
                    return new Date(year, month - 1, 2).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                  })()}
                </h2>
                <div className="w-full sm:w-auto">
                  <input
                    type="text"
                    value={currentMonth}
                    onChange={handleMonthChange}
                    placeholder="E.g. 2026-01"
                    className={`w-full sm:w-48 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      monthError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                    }`}
                  />
                  {monthError && (
                    <p className="text-xs text-red-600 mt-1">{monthError}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {summaryData.map((data, index) => (
                  <SummaryCard
                    key={`hrms-summary-${index}`}
                    title={data.title}
                    value={data.value}
                    bgColor={data.bgColor}
                    icon={data.icon}
                  />
                ))}
              </div>
            </div>

            {/* Payroll Table */}
            <div className="p-0 sm:p-6 pb-4 sm:pb-6">
              <PayrollTable
                payrollData={payrollData}
                onRecalculate={handleRecalculate}
                loading={loading}
                basePath="/restaurant/hrms"
              />
            </div>
          </div>

          {/* Calculator and Report Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payroll Calculator */}
            <PayrollCalculator
              employees={getAvailableEmployees()}
              currentMonth={currentMonth}
              onCalculate={handleCalculatePayroll}
              loading={loading}
            />

            {/* Export Card */}
            {/* Pass data props so client-side export works */}
            <ExportReportsCard
              currentMonth={currentMonth}
              payrollData={payrollData}
              summary={summary}
            />
          </div>
        </>
      )}
    </div>
  );
}
