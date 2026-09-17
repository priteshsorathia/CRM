'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/hrms`;

function formatTime(date) {
  if (!date) return '—';
  if (typeof date === 'string') return date;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export default function PunchInClient() {
  const [fromDate, setFromDate] = useState(todayISO());
  const [toDate, setToDate] = useState(todayISO());
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [todayRecord, setTodayRecord] = useState({ checkIn: null, checkOut: null });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const res = await fetch(`${API_URL}/attendance/range?from=${fromDate}&to=${toDate}&emp_id=self`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        
        if (result.success && result.data) {
          setRecords(result.data);
          setCurrentPage(1); // Reset page on fetch
          const today = todayISO();
          const foundToday = result.data.find(r => r.date === today);
          if (foundToday) {
            setTodayRecord({
              checkIn: foundToday.check_in,
              checkOut: foundToday.check_out,
              status: foundToday.status,
              note: foundToday.note
            });
          } else {
             setTodayRecord({ checkIn: null, checkOut: null });
          }
        }
      } catch (e) {
        console.error("Fetch error:", e);
        toast.error("Failed to load attendance records");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [fromDate, toDate]);

  const refreshData = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    const res = await fetch(`${API_URL}/attendance/range?from=${fromDate}&to=${toDate}&emp_id=self`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();
    if (result.success && result.data) {
      setRecords(result.data);
      const today = todayISO();
      const foundToday = result.data.find(r => r.date === today);
      if (foundToday) {
        setTodayRecord({
          checkIn: foundToday.check_in,
          checkOut: foundToday.check_out,
          status: foundToday.status,
          note: foundToday.note
        });
      }
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(records.length / itemsPerPage);
  const paginatedRecords = records.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePunchIn = async () => {
    if (loading) return;
    if (todayRecord.checkIn) return toast.error('Already checked in for today');

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return toast.error('Not authenticated');

      const res = await fetch(`${API_URL}/attendance/punch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ emp_id: 'self', type: 'in', date: todayISO() }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Checked in successfully');
        await refreshData();
      } else {
        toast.error(data.error || 'Failed to check in');
      }
    } catch (e) {
      toast.error('Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  const handlePunchOut = async () => {
    if (loading) return;
    if (!todayRecord.checkIn) return toast.error('Please check in first');
    if (todayRecord.checkOut) return toast.error('Already checked out for today');

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return toast.error('Not authenticated');

      const res = await fetch(`${API_URL}/attendance/punch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ emp_id: 'self', type: 'out', date: todayISO() }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Checked out successfully');
        await refreshData();
      } else {
        toast.error(data.error || 'Failed to check out');
      }
    } catch (e) {
      toast.error('Failed to check out');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (String(status).toLowerCase()) {
      case 'present': return 'bg-green-100 text-green-700';
      case 'incomplete': return 'bg-yellow-100 text-yellow-700';
      case 'absent': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="p-2 sm:p-6">
      <div className="bg-white rounded-xl shadow max-w-5xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-semibold">My Attendance</h1>
            <p className="text-sm text-gray-500">
              Track your attendance history and mark daily status.
            </p>
          </div>

          {/* Range Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="flex flex-col w-full sm:w-40">
                <label className="text-[10px] text-gray-400 mb-1 ml-1 uppercase font-bold">From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full"
                />
              </div>
              <div className="flex flex-col w-full sm:w-40">
                <label className="text-[10px] text-gray-400 mb-1 ml-1 uppercase font-bold">To</label>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions - Only for Today */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <button
            onClick={handlePunchIn}
            disabled={loading || !!todayRecord.checkIn}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg disabled:opacity-50 font-medium transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            Punch In {todayRecord.checkIn ? `(${todayRecord.check_in || todayRecord.checkIn})` : ''}
          </button>

          <button
            onClick={handlePunchOut}
            disabled={loading || !todayRecord.checkIn || !!todayRecord.checkOut}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg disabled:opacity-50 font-medium transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            Punch Out {todayRecord.checkOut ? `(${todayRecord.check_out || todayRecord.checkOut})` : ''}
          </button>
          
          <div className="w-full sm:flex-1 flex items-center justify-center sm:justify-end mt-2 sm:mt-0">
             <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(todayRecord.status || 'Not Marked')}`}>
                Today: {todayRecord.status || 'Not Marked'}
             </span>
          </div>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-sm font-medium text-gray-600 border-b">Date</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600 border-b">Check In</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600 border-b">Check Out</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600 border-b">Working Hours</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600 border-b">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && records.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                    Loading attendance data...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500 italic">
                    No records found for the selected range.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm">{r.date}</td>
                    <td className="px-4 py-3 text-sm">{r.check_in || '—'}</td>
                    <td className="px-4 py-3 text-sm">{r.check_out || '—'}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{r.working_hours || '—'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination UI */}
        {records.length > itemsPerPage && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500 font-medium">
              Showing <span className="font-bold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, records.length)}</span> of <span className="font-bold text-gray-900">{records.length}</span> records
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center text-sm font-bold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Previous Page"
              >
                &lt;
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${currentPage === page ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-200'}`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 flex items-center justify-center text-sm font-bold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Next Page"
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
