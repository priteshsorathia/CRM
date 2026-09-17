'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Edit } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function AttendanceTable({
  attendance,
  isToday,
  selectedDate,
  onCheckIn,
  onCheckOut,
  loading
}) {
  const router = useRouter();
  
  const formatTime = (timeString) => {
    if (!timeString) return '--';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleEditClick = (emp_id, date) => {
    router.push(`/hrms/attendance/edit?emp_id=${emp_id}&date=${date}`);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      {/* ── Mobile Card View (hidden on sm+) ── */}
      <div className="block sm:hidden space-y-3">
        {attendance.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            <span className="text-3xl mb-2 block">📋</span>
            <span className="text-sm font-medium">No employees found</span>
          </div>
        ) : attendance.map((record) => (
          <div key={`${record.emp_id}-${record.date}`} className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
            {/* Name + Status + Date */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900 text-sm">{record.full_name}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">ID: {record.emp_id} | Date: {record.date}</div>
              </div>
              <StatusBadge status={record.status} />
            </div>

            {/* Time row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Check In</div>
                <div className="text-sm font-bold text-gray-700">{formatTime(record.check_in)}</div>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Check Out</div>
                <div className="text-sm font-bold text-gray-700">{formatTime(record.check_out)}</div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {record.date === today && (
                <>
                  {!record.check_in ? (
                    <button
                      onClick={() => onCheckIn(record.emp_id)}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-100 text-emerald-700 font-bold text-xs hover:bg-emerald-200 transition-all active:scale-95"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Punch In
                    </button>
                  ) : !record.check_out ? (
                    <button
                      onClick={() => onCheckOut(record.emp_id)}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-100 text-red-700 font-bold text-xs hover:bg-red-200 transition-all active:scale-95"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Punch Out
                    </button>
                  ) : null}
                </>
              )}
              <button
                onClick={() => handleEditClick(record.emp_id, record.date)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-100 text-blue-700 font-bold text-xs hover:bg-blue-200 transition-all active:scale-95"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop Table View (hidden on mobile) ── */}
      <div className="hidden sm:block rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">No employees found</td>
                </tr>
              ) : attendance.map((record) => (
                <tr key={`${record.emp_id}-${record.date}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {record.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{record.full_name}</div>
                    <div className="text-xs text-gray-500">{record.emp_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTime(record.check_in)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTime(record.check_out)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={record.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-3">
                      <div className="min-w-[110px] flex justify-start">
                        {record.date === today && (
                          <>
                            {!record.check_in ? (
                              <button
                                onClick={() => onCheckIn(record.emp_id)}
                                disabled={loading}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-green-100 text-green-600 hover:bg-green-200 transition-all duration-200 text-xs font-bold"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Punch In</span>
                              </button>
                            ) : !record.check_out ? (
                              <button
                                onClick={() => onCheckOut(record.emp_id)}
                                disabled={loading}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-all duration-200 text-xs font-bold"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Punch Out</span>
                              </button>
                            ) : null}
                          </>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleEditClick(record.emp_id, record.date)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all border border-blue-100 shadow-sm shrink-0"
                        title="Edit Record"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}