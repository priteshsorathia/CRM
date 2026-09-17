'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CalendarCheck, ChevronDown, RotateCcw } from 'lucide-react';
import DateSelector from './DateSelector';
import AttendanceTable from './AttendanceTable';
import BackButton from '@/components/BackButton';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/hrms`;

export default function AttendanceClient({ selectedDate: initialDate }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(initialDate || today);
  const [endDate, setEndDate] = useState(initialDate || today);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const displayTitle = startDate === endDate
    ? `Attendance for ${new Date(startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
    : `Attendance from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/staff`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setEmployees(data.data);
    } catch (e) {
      console.error('Fetch employees error:', e);
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      let url = `${API_URL}/attendance/range?from=${startDate}&to=${endDate}`;
      if (selectedEmployee) {
        url += `&emp_id=${selectedEmployee}`;
      }

      const response = await fetch(url, {
        headers: { 
            'Authorization': `Bearer ${token}` 
        }
      });
      const data = await response.json();

      if (data.success) {
        setAttendance(data.data);
        setCurrentPage(1); // Reset page on new fetch
      } else {
        toast.error(data.error || 'Failed to load attendance');
      }
    } catch (error) {
      toast.error('Network error loading attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [startDate, endDate, selectedEmployee]);

  const handleRangeChange = (from, to) => {
    if (!from || !to) return;
    setStartDate(from);
    setEndDate(to);
  };

  const resetFilters = () => {
    setSelectedEmployee('');
    setStartDate(today);
    setEndDate(today);
  };

  // Pagination Logic
  const totalPages = Math.ceil(attendance.length / itemsPerPage);
  const paginatedAttendance = attendance.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCheckIn = async (empId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/attendance/check-in`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
            emp_id: empId, 
            date: today 
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Checked in successfully');
        fetchAttendance(); 
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (empId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/attendance/check-out`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
            emp_id: empId, 
            date: today 
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Checked out successfully');
        fetchAttendance(); 
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Failed to check out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Filters Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:flex-nowrap">
          {/* Title Section - More compact */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">Attendance</h1>
              <p className="text-[10px] text-gray-400">Manage records</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5 xl:gap-3 w-full lg:w-auto">
            {/* Employee Filter */}
            <div className="flex flex-col w-full sm:w-48 xl:w-56">
              <label className="text-[9px] text-gray-400 mb-1 ml-1 uppercase font-bold tracking-wider">Employee</label>
              <div className="relative">
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-medium text-gray-700 transition-all pr-8 cursor-pointer"
                >
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.emp_id})
                    </option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Date Range Selector */}
            <DateSelector
              selectedDate={startDate}
              endDate={endDate}
              onRangeChange={handleRangeChange}
              maxDate={today}
            />

            {/* Action Buttons Group */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {/* Reset Button */}
              {/* <button
                type="button"
                onClick={resetFilters}
                className="flex-1 sm:flex-none h-[38px] px-3 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-100 shadow-sm gap-1.5 font-bold text-xs"
                title="Reset Filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="sm:hidden">Reset</span>
              </button> */}

              {/* Back Button (At the end) */}
              <BackButton
                forceFallback={true}
                fallbackUrl="/hrms"
                className="flex-1 sm:flex-none h-[38px] px-3 rounded-lg font-bold text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all border border-gray-200 shadow-sm flex items-center justify-center gap-1"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-800">
                {displayTitle}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                {selectedEmployee ? `Showing records for employee ID ${selectedEmployee}` : 'Showing records for all employees'}
              </p>
            </div>
            {attendance.length > 0 && (
              <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100">
                {attendance.length} Records Found
              </span>
            )}
          </div>

          <AttendanceTable
            attendance={paginatedAttendance}
            isToday={startDate === today && endDate === today}
            loading={loading}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            selectedDate={startDate}
          />

          {/* Pagination UI */}
          {attendance.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                Showing <span className="text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-gray-900">{Math.min(currentPage * itemsPerPage, attendance.length)}</span> of <span className="text-gray-900">{attendance.length}</span> records
              </p>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center text-sm font-bold border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 bg-white shadow-sm"
                >
                  &lt;
                </button>
                
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages || 1 }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((page, index, array) => {
                      const showEllipsis = index > 0 && page - array[index - 1] > 1;
                      return (
                        <div key={page} className="flex items-center gap-1.5">
                          {showEllipsis && <span className="text-gray-400">...</span>}
                          <button
                            onClick={() => setCurrentPage(page)}
                            disabled={totalPages <= 1}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all shadow-sm ${
                              currentPage === page 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'text-gray-600 bg-white hover:bg-gray-50 border border-gray-200'
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      );
                    })}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages <= 1}
                  className="w-10 h-10 flex items-center justify-center text-sm font-bold border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 bg-white shadow-sm"
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}