"use client";

import { useEffect, useMemo, useState } from 'react';
import { Calculator, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { getApiBase } from '@/utils/apiBase';

const API_URL = `${getApiBase()}/api/hrms`;

export default function PayrollCalculator({ employees, currentMonth, onCalculate, loading: parentLoading }) {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [touched, setTouched] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const employeesRemaining = useMemo(() => (Array.isArray(employees) ? employees : []), [employees]);
  const noEmployeesRemaining = employeesRemaining.length === 0;

  useEffect(() => {
    if (noEmployeesRemaining) {
      setSelectedEmployee('');
      setTouched(false);
      return;
    }

    // If list updates and selected employee is no longer available, clear it.
    if (selectedEmployee && !employeesRemaining.some((e) => String(e.emp_id) === String(selectedEmployee))) {
      setSelectedEmployee('');
      setTouched(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noEmployeesRemaining, employeesRemaining]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (noEmployeesRemaining) {
      toast.info('All employees have been calculated for this month');
      return;
    }
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      setTouched(true);
      return;
    }

    setCalculating(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/payroll/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          emp_id: selectedEmployee,
          month: currentMonth // "YYYY-MM"
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Payroll calculated successfully');
        onCalculate(); // Refresh the parent list
        setSelectedEmployee('');
        setTouched(false);
      } else {
        toast.error(data.error || 'Failed to calculate');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setCalculating(false);
    }
  };

  const handleBlur = () => {
    setTouched(true);
  };

  const isError = touched && !selectedEmployee;
  const isLoading = calculating || parentLoading;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 h-full flex flex-col">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
          <div className='w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0'>
            <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          </div>
          Calculate Payroll
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 mt-2">
          Calculate payroll for {new Date(currentMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
        <div className="flex-1">
          {noEmployeesRemaining ? (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700 text-center">
                All employees have been calculated for this month
              </p>
            </div>
          ) : (
            <>
              <label htmlFor="employee-select" className="block text-sm font-semibold text-gray-700 mb-2">
                Select Employee <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="employee-select"
                  value={selectedEmployee}
                  onChange={(e) => {
                    setSelectedEmployee(e.target.value);
                    setTouched(true);
                    setIsOpen(false);
                  }}
                  onFocus={() => setIsOpen(true)}
                  onBlur={() => {
                    setIsOpen(false);
                    setTouched(true);
                  }}
                  className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none bg-none ${
                    isError ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                >
                  <option value="">-- Select Employee --</option>
                  {employeesRemaining.map((emp) => (
                    <option key={emp.emp_id} value={emp.emp_id}>
                      {emp.full_name}
                    </option>
                  ))}
                </select>
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </span>
              </div>

              {isError && (
                <p className="mt-1 text-sm text-red-600">Please select an employee to calculate payroll</p>
              )}

              <p className="text-xs text-gray-500 mt-2">
                {employeesRemaining.length} employee(s) remaining for calculation
              </p>
            </>
          )}
        </div>

        <div className="pt-4 mt-auto">
          <button
            type="submit"
            disabled={isLoading || noEmployeesRemaining}
            className={`
              w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold
              transition-all duration-200 active:scale-95
              ${isLoading || noEmployeesRemaining
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
              }
            `}
          >
            <Calculator className="w-4 h-4" />
            {isLoading ? 'Calculating...' : 'Run Calculator'}
          </button>
        </div>
      </form>
    </div>
  );
}
