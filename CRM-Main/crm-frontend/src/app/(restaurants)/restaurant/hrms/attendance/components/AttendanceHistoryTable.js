'use client';

import { CheckCircle, XCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function AttendanceHistoryTable({
  rows,
  today,
  loading,
  onCheckIn,
  onCheckOut
}) {
  const formatTime = (timeString) => {
    if (!timeString) return '--';
    const [hours, minutes] = String(timeString).split(':');
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="px-3 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-3 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">In</th>
              <th className="px-3 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Out</th>
              <th className="px-3 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
              <th className="px-3 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-3 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">No records found</td>
              </tr>
            ) : rows.map((r, index) => {
              const isTodayRow = r.date === today;
              return (
                <tr key={r.id || `${r.date}-${index}`}>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-sm font-medium text-gray-900">{r.date}</div>
                    {isTodayRow ? (
                      <div className="text-[10px] sm:text-xs text-blue-600 font-semibold">Today</div>
                    ) : null}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {formatTime(r.check_in)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {formatTime(r.check_out)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {r.working_hours || '--'}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-1.5 sm:gap-3">
                      {isTodayRow ? (
                        <>
                          {!r.check_in ? (
                            <button
                              onClick={() => onCheckIn?.(r.emp_id, r.date)}
                              disabled={loading}
                              className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-green-100 text-green-600 hover:bg-green-200 transition-all duration-200 text-xs"
                            >
                              <CheckCircle className="w-3.5 h-3.5 sm:w-4 h-4" />
                              <span className="hidden xs:inline">Punch In</span>
                              <span className="xs:hidden">In</span>
                            </button>
                          ) : !r.check_out ? (
                            <button
                              onClick={() => onCheckOut?.(r.emp_id, r.date)}
                              disabled={loading}
                              className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-all duration-200 text-xs"
                            >
                              <XCircle className="w-3.5 h-3.5 sm:w-4 h-4" />
                              <span className="hidden xs:inline">Punch Out</span>
                              <span className="xs:hidden">Out</span>
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">--</span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">--</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
