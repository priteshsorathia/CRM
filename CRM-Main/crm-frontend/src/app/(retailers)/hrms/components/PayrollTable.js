'use client';

import { Eye, Edit, Calculator } from 'lucide-react';
import StatusBadge from '@/app/(retailers)/hrms/components/StatusBadge';
import ActionButton from '@/app/(retailers)/hrms/components/ActionButton';
import Link from 'next/link';

export default function PayrollTable({ payrollData, onRecalculate, loading, basePath = '/hrms' }) {
  const formatDays = (value) => {
    const num = Number(value) || 0;
    return Number.isInteger(num) ? num : num.toFixed(1);
  };

  if (payrollData.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-2">No payroll records found for this month</div>
        <p className="text-sm text-gray-400">Calculate payroll for employees to see records here</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
      <table className="w-full">
        <thead className="sticky top-0 bg-white z-10">
          <tr className="border-b border-gray-200 bg-white">
            <th className="px-2 sm:px-4 py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Staff</th>
            <th className="px-2 sm:px-4 py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Working Days</th>
            <th className="px-2 sm:px-4 py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Basic</th>
            <th className="px-2 sm:px-4 py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Salary</th>
            <th className="px-2 sm:px-4 py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-2 sm:px-4 py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {payrollData.map((payroll) => (
            <tr key={payroll.id} className="hover:bg-gray-50">
              <td className="px-2 sm:px-4 py-2.5 sm:py-4 whitespace-nowrap">
                <div className="text-xs sm:text-sm font-bold text-gray-900">{payroll.full_name}</div>
                <div className="text-[10px] sm:text-xs text-gray-500">{payroll.emp_id}</div>
              </td>
              <td className="px-2 sm:px-4 py-2.5 sm:py-4 whitespace-nowrap">
                <div className="text-[11px] sm:text-sm text-gray-900">
                  <span className='font-bold'>{formatDays(payroll.paid_days ?? payroll.present_days)}</span><span className="text-gray-400">/{payroll.working_days}</span>
                </div>
              </td>
              <td className="px-2 sm:px-4 py-2.5 sm:py-4 whitespace-nowrap">
                <div className="text-xs sm:text-sm font-bold text-gray-900">₹{payroll.basic_salary.toLocaleString('en-IN')}</div>
              </td>
              <td className="px-2 sm:px-4 py-2.5 sm:py-4 whitespace-nowrap">
                <div className="text-xs sm:text-sm font-bold text-blue-600">₹{payroll.net_salary.toLocaleString('en-IN')}</div>
              </td>
              <td className="px-2 sm:px-4 py-2.5 sm:py-4 whitespace-nowrap">
                <StatusBadge status={payroll.status} paymentDate={payroll.payment_date} />
              </td>
              <td className="px-2 sm:px-4 py-2.5 sm:py-4 whitespace-nowrap">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Edit Button */}
                  <Link
                    href={`${basePath}/payroll/${payroll.id}`}
                    className='inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all duration-200'
                    title='Edit'
                  >
                    <Edit className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
                  </Link>

                  {/* View/Print Button */}
                  <Link
                    href={`${basePath}/payroll/${payroll.id}/preview`}
                    className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded bg-teal-100 text-teal-600 hover:bg-teal-200 transition-all duration-200"
                    title='View Slip'
                  >
                    <Eye className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
                  </Link>

                  {/* Recalculate Button */}
                  <ActionButton
                    onClick={() => onRecalculate(payroll.emp_id)} // Pass emp_id to recalculate
                    className="w-8 h-8 sm:w-9 sm:h-9 bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                    title="Recalculate"
                    disabled={loading}
                  >
                    <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </ActionButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
