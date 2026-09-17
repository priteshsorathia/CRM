'use client';

import BackButton from '@/components/BackButton';
import { CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function EditPayrollForm({ payroll, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    basic_salary: payroll.basic_salary,
    allowances: payroll.allowances,
    deductions: payroll.deductions,
    net_salary: payroll.net_salary,
    status: payroll.status,
    notes: payroll.notes || ''
  });

  // Automatically recalculate net salary when components change
  useEffect(() => {
    const basic = parseFloat(formData.basic_salary) || 0;
    const allow = parseFloat(formData.allowances) || 0;
    const deduct = parseFloat(formData.deductions) || 0;
    const workingDays = parseFloat(payroll.working_days) || 0;
    const presentDays = parseFloat(payroll.paid_days ?? payroll.present_days) || 0;
    const perDay = workingDays > 0 ? (basic / workingDays) : 0;
    const earnedBasic = Math.round(perDay * presentDays);
    const net = earnedBasic + allow - deduct;

    if (net !== formData.net_salary) {
        setFormData(prev => ({ ...prev, net_salary: net }));
    }
  }, [formData.basic_salary, formData.allowances, formData.deductions, payroll.working_days, payroll.present_days, payroll.paid_days]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="form-group">
            <label className="block text-sm font-medium mb-1">Net Salary (₹)</label>
            <input
              type="number"
              step="0.01"
              name="net_salary"
              value={formData.net_salary}
              className="form-control w-full bg-gray-100 cursor-not-allowed"
              readOnly
              required
            />
          </div>
          <div className="form-group">
            <label className="block text-sm font-medium mb-1">Basic Salary (₹)</label>
            <input
              type="number"
              step="0.01"
              name="basic_salary"
              value={formData.basic_salary}
              // Ideally basic salary comes from contract, but editable here if needed
              // set readOnly={true} if you don't want it editable
              className="form-control w-full bg-gray-100 cursor-not-allowed"
              readOnly
              required
            />
          </div>
          <div className="form-group">
            <label className="block text-sm font-medium mb-1">Allowances (₹)</label>
            <input
              type="number"
              step="0.01"
              name="allowances"
              value={formData.allowances}
              onChange={handleChange}
              className="form-control w-full"
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="form-group">
            <label className="block text-sm font-medium mb-1">Deductions (₹)</label>
            <input
              type="number"
              step="0.01"
              name="deductions"
              value={formData.deductions}
              onChange={handleChange}
              className="form-control w-full"
            />
          </div>
          <div className="form-group">
            <label className="block text-sm font-medium mb-1">Status</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleChange({ target: { name: 'status', value: 'pending' } })}
                className={`px-3 py-2 border rounded-md text-sm ${
                  formData.status === 'pending'
                    ? 'bg-yellow-500 text-white border-yellow-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => handleChange({ target: { name: 'status', value: 'paid' } })}
                className={`px-3 py-2 border rounded-md text-sm ${
                  formData.status === 'paid'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Paid
              </button>
              <button
                type="button"
                onClick={() => handleChange({ target: { name: 'status', value: 'cancelled' } })}
                className={`px-3 py-2 border rounded-md text-sm ${
                  formData.status === 'cancelled'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Cancelled
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="form-group">
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="3"
          className="form-control w-full"
        ></textarea>
      </div>
      <div className="px-6 py-4 bg-gray-50">
        <div className='flex gap-3'>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
          >
            <CheckCircle className='w-4 h-4' />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        <BackButton />
       </div>
      </div>
    </form>
  );
}
