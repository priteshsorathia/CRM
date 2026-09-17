'use client';

import Link from 'next/link';
import { CheckCircle, XCircle, Edit } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function AttendanceTable({
  attendance,
  isToday,
  selectedDate,
  onCheckIn,
  onCheckOut,
  loading,
  canEdit = false
}) {
  const today = new Date().toISOString().split('T')[0];

  const formatTime = (timeString) => {
    if (!timeString) return '--';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toEditHref = (emp_id, date) => {
    const d = String(date || selectedDate || today);
    return `/restaurant/hrms/attendance/edit?emp_id=${encodeURIComponent(String(emp_id || ''))}&date=${encodeURIComponent(d)}`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="px-3 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-3 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-3 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">In</th>
              <th className="px-3 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Out</th>
              <th className="px-3 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-3 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {attendance.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">No employees found</td>
              </tr>
            ) : attendance.map((record, index) => {
              const recordDate = record.date || selectedDate || today;
              const isRowToday = recordDate === today;

              return (
                <tr key={record.id || `${record.emp_id}-${recordDate}-${index}`}>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 font-medium">
                    {recordDate}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-sm font-medium text-gray-900">{record.full_name}</div>
                    <div className="text-[10px] sm:text-xs text-gray-500">{record.emp_id}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {formatTime(record.check_in)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {formatTime(record.check_out)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <StatusBadge status={record.status} />
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-1.5 sm:gap-3">
                      {/* Punch In/Out Buttons */}
                      {isRowToday && (
                        <>
                          {!record.check_in ? (
                            <button
                              onClick={() => onCheckIn(record.emp_id, recordDate)}
                              disabled={loading}
                              className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-green-100 text-green-600 hover:bg-green-200 transition-all duration-200 text-xs"
                            >
                              <CheckCircle className="w-3.5 h-3.5 sm:w-4 h-4" />
                              <span className="hidden xs:inline">Punch In</span>
                              <span className="xs:hidden">In</span>
                            </button>
                          ) : !record.check_out ? (
                            <button
                              onClick={() => onCheckOut(record.emp_id, recordDate)}
                              disabled={loading}
                              className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-all duration-200 text-xs"
                            >
                              <XCircle className="w-3.5 h-3.5 sm:w-4 h-4" />
                              <span className="hidden xs:inline">Punch Out</span>
                              <span className="xs:hidden">Out</span>
                            </button>
                          ) : null}
                        </>
                      )}

                      {/* Edit Button (Admin/Owner only) */}
                      {canEdit && (
                        <Link
                          href={toEditHref(record.emp_id, recordDate)}
                          className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all duration-200 text-xs"
                        >
                          <Edit className="w-3.5 h-3.5 sm:w-4 h-4" />
                          <span>Edit</span>
                        </Link>
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
