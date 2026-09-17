'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ClipboardList, ChevronDown, RotateCcw } from 'lucide-react';
import AttendanceTable from './AttendanceTable';
import AttendanceHistoryTable from './AttendanceHistoryTable';
import { getApiBase } from '@/utils/apiBase';
import BackButton from '@/components/BackButton';

const API_URL = `${getApiBase()}/api/hrms`;

const fmt = (d) => new Date(d).toISOString().split('T')[0];

const addDays = (yyyyMmDd, deltaDays) => {
  const d = new Date(`${yyyyMmDd}T00:00:00`);
  d.setDate(d.getDate() + deltaDays);
  return fmt(d);
};

const clampToToday = (yyyyMmDd, today) => {
  if (!yyyyMmDd) return today;
  return yyyyMmDd > today ? today : yyyyMmDd;
};

export default function AttendanceClient({ selectedDate, fromDate, toDate }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [historyRows, setHistoryRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [myUserId, setMyUserId] = useState(null);
  const [myName, setMyName] = useState('');
  const [myOrdersCount, setMyOrdersCount] = useState(0);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const today = new Date().toISOString().split('T')[0];

  // In some setups, staff users are stored under related roles (e.g. sales/cook).
  // Keep this list aligned with the roles that should see range filters.
  const isManagerOrStaff = ['manager', 'staff', 'sales', 'cook', 'chef', 'kitchen'].includes(String(userRole || '').toLowerCase());

  const effectiveFrom = useMemo(() => {
    const base = fromDate || selectedDate || today;
    return clampToToday(String(base), today);
  }, [fromDate, selectedDate, today]);

  const effectiveTo = useMemo(() => {
    const base = toDate || selectedDate || today;
    return clampToToday(String(base), today);
  }, [toDate, selectedDate, today]);

  const isSingleDayRange = Boolean(effectiveFrom && effectiveTo && effectiveFrom === effectiveTo);
  const isToday = Boolean(isSingleDayRange && effectiveTo === today);

  const displayTitle = useMemo(() => {
    if (effectiveFrom === effectiveTo) {
      return `Attendance for ${new Date(effectiveFrom).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
    }
    return `Attendance from ${new Date(effectiveFrom).toLocaleDateString()} to ${new Date(effectiveTo).toLocaleDateString()}`;
  }, [effectiveFrom, effectiveTo]);

  const displaySubtitle = useMemo(() => {
    if (isManagerOrStaff) {
      return `Showing your records`;
    }
    if (selectedEmployee) {
      const emp = employees.find(e => String(e.id) === String(selectedEmployee) || String(e.emp_id) === String(selectedEmployee));
      return `Showing records for employee ${emp ? emp.full_name : selectedEmployee}`;
    }
    return `Showing records for all employees`;
  }, [isManagerOrStaff, selectedEmployee, employees]);

  const activePreset = useMemo(() => {
    if (!effectiveFrom || !effectiveTo) return null;
    if (effectiveFrom === today && effectiveTo === today) return 'today';
    if (effectiveFrom === addDays(today, -6) && effectiveTo === today) return '7d';
    if (effectiveFrom === addDays(today, -29) && effectiveTo === today) return '30d';
    return null;
  }, [effectiveFrom, effectiveTo, today]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const res = await fetch(`${API_URL}/staff`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setEmployees(data.data);
    } catch (e) {
      console.error('Fetch employees error:', e);
    }
  };

  const fetchAttendanceRange = async () => {
    if (!effectiveFrom || !effectiveTo) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token) return;

      let url = `${API_URL}/attendance/range?from=${encodeURIComponent(effectiveFrom)}&to=${encodeURIComponent(effectiveTo)}`;
      if (isManagerOrStaff) {
        url += `&emp_id=self`;
      } else if (selectedEmployee) {
        url += `&emp_id=${selectedEmployee}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json().catch(() => ({}));

      if (data.success) {
        if (isManagerOrStaff) {
          setHistoryRows(Array.isArray(data.data) ? data.data : []);
        } else {
          setAttendance(Array.isArray(data.data) ? data.data : []);
        }
      } else {
        toast.error(data.error || 'Failed to load attendance');
      }
    } catch {
      toast.error('Network error loading attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const userDataStr = localStorage.getItem('userData');
      const userStr = localStorage.getItem('user');
      const u = {
        ...(userDataStr ? JSON.parse(userDataStr) : {}),
        ...(userStr ? JSON.parse(userStr) : {}),
      };

      const role = String(u?.role || u?.user_role || u?.user?.role || '').toLowerCase();
      setUserRole(role);

      const uid = u?.id || u?.user?.id || u?.userId || null;
      setMyUserId(uid ? parseInt(uid, 10) : null);

      const name = u?.full_name || u?.name || u?.username || u?.email || '';
      setMyName(String(name || '').trim());

      const isAdmin =
        role === 'admin' ||
        role === 'administrator' ||
        role === 'shop_owner' ||
        role === 'restaurant_owner' ||
        role === 'owner' ||
        role.endsWith('_owner');
      setCanEdit(isAdmin);
    } catch {
      setCanEdit(false);
    }
  }, []);

  const canSeeMyOrdersCount = ['staff', 'sales', 'waiter', 'waitress', 'server', 'manager'].includes(String(userRole || '').toLowerCase());

  const fetchMyOrdersCount = async () => {
    if (!canSeeMyOrdersCount) return;
    if (isManagerOrStaff && !isSingleDayRange) {
      setMyOrdersCount(0);
      return;
    }
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token) return;

      const API_BASE = getApiBase();
      if (!API_BASE) return;

      const dateForOrders = effectiveTo || today;
      const res = await fetch(`${API_BASE}/api/restaurant/orders?date=${encodeURIComponent(dateForOrders)}`, {
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

      setMyOrdersCount(count);
    } catch {
      // non-blocking
    }
  };

  useEffect(() => {
    fetchMyOrdersCount();
  }, [selectedDate, canSeeMyOrdersCount, myUserId, myName, isManagerOrStaff, isSingleDayRange, effectiveTo, today]);

  const handleCheckIn = async (empId, dateOverride) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const dateToUse = dateOverride || (effectiveTo || today);
      const response = await fetch(`${API_URL}/attendance/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          emp_id: empId,
          date: dateToUse
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Checked in successfully');
        fetchAttendanceRange();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (empId, dateOverride) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const dateToUse = dateOverride || (effectiveTo || today);
      const response = await fetch(`${API_URL}/attendance/check-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          emp_id: empId,
          date: dateToUse
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Checked out successfully');
        fetchAttendanceRange();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Failed to check out');
    } finally {
      setLoading(false);
    }
  };

  const handlePreset = (preset) => {
    const nextTo = today;
    const nextFrom =
      preset === 'today' ? today
        : preset === '7d' ? addDays(today, -6)
          : preset === '30d' ? addDays(today, -29)
            : today;
    router.push(`/restaurant/hrms/attendance?from=${nextFrom}&to=${nextTo}`);
  };

  const handleRangeChange = (nextFrom, nextTo) => {
    if (!nextFrom || !nextTo) return;
    const safeTo = clampToToday(String(nextTo || today), today);
    const safeFrom = clampToToday(String(nextFrom || safeTo), today);
    const finalFrom = safeFrom > safeTo ? safeTo : safeFrom;
    router.push(`/restaurant/hrms/attendance?from=${finalFrom}&to=${safeTo}`);
  };

  const handleReset = () => {
    setSelectedEmployee('');
    router.push('/restaurant/hrms/attendance');
  };

  useEffect(() => {
    if (canEdit) {
      fetchEmployees();
    }
  }, [canEdit]);

  useEffect(() => {
    fetchAttendanceRange();
  }, [effectiveFrom, effectiveTo, selectedEmployee, isManagerOrStaff]);

  useEffect(() => {
    setCurrentPage(1);
  }, [effectiveFrom, effectiveTo, selectedEmployee, isManagerOrStaff]);

  // Pagination logic
  const currentDataset = isManagerOrStaff ? historyRows : attendance;
  const totalPages = Math.ceil(currentDataset.length / itemsPerPage);
  const paginatedData = currentDataset.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header (match reports page) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Attendance
            </h1>
            <p className="text-gray-600 text-sm">
              View and manage employee attendance.
            </p>
          </div>
          <div className="w-full sm:w-auto flex items-center justify-center sm:justify-end">
            <BackButton fallbackUrl="/restaurant/hrms" forceFallback />
          </div>
        </div>

        {/* Filters (match reports page) */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Employee Filter - only for Admin/Owner */}
          {!isManagerOrStaff && (
            <div className="flex flex-col w-full sm:w-48 lg:w-56 shrink-0">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Employee</span>
              <div className="relative">
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none font-semibold text-gray-700 transition-all pr-8 cursor-pointer h-10"
                >
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.emp_id})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 w-full">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {[
                { label: 'Today', key: 'today' },
                { label: '7 Days', key: '7d' },
                { label: '30 Days', key: '30d' },
              ].map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => handlePreset(r.key)}
                  className={`flex-1 sm:flex-initial sm:min-w-[86px] px-3 py-2 rounded-md text-sm font-semibold border transition shadow-sm ${activePreset === r.key
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
              <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:items-center sm:gap-3 sm:w-auto">
                <div className="flex items-center gap-2 px-3 h-10 border border-gray-200 rounded-xl bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">From</span>
                  <input
                    type="date"
                    required
                    value={effectiveFrom || today}
                    max={effectiveTo || today}
                    onChange={(e) => handleRangeChange(e.target.value, effectiveTo || today)}
                    className="min-w-0 flex-1 h-10 text-xs sm:text-sm font-semibold text-gray-700 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 shadow-none appearance-none [-webkit-appearance:none] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 font-semibold"
                  />
                </div>
                <div className="flex items-center gap-2 px-3 h-10 border border-gray-200 rounded-xl bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">To</span>
                  <input
                    type="date"
                    required
                    value={effectiveTo || today}
                    min={effectiveFrom || today}
                    max={today}
                    onChange={(e) => handleRangeChange(effectiveFrom || today, e.target.value)}
                    className="min-w-0 flex-1 h-10 text-xs sm:text-sm font-semibold text-gray-700 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 shadow-none appearance-none [-webkit-appearance:none] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 font-semibold"
                  />
                </div>
              </div>

              {/* Reset Button */}
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-100 shadow-sm shrink-0 gap-2 font-bold text-xs"
                title="Reset Filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="sm:hidden">Reset Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {displayTitle}
              </h2>
              <p className="text-sm text-gray-500">
                {displaySubtitle}
              </p>
            </div>

            {canSeeMyOrdersCount && (!isManagerOrStaff || isSingleDayRange) ? (
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-sm font-semibold text-indigo-700 self-start">
                <ClipboardList className="w-4 h-4" />
                <span>My Orders: {myOrdersCount}</span>
              </div>
            ) : null}
          </div>

          {isManagerOrStaff ? (
            <AttendanceHistoryTable
              rows={paginatedData}
              today={today}
              loading={loading}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
            />
          ) : (
            <AttendanceTable
              attendance={paginatedData}
              isToday={isToday}
              loading={loading}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
              selectedDate={effectiveFrom}
              canEdit={canEdit}
            />
          )}

          {/* Pagination */}
          {!loading && currentDataset.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages <= 1}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, currentDataset.length)}</span> of{' '}
                    <span className="font-medium">{currentDataset.length}</span> records
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      &larr;
                    </button>
                    {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        disabled={totalPages <= 1}
                        aria-current={currentPage === page ? "page" : undefined}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || totalPages <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      &rarr;
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
