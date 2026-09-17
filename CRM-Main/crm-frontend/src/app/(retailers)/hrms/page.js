'use client';

import { toast } from 'sonner';
import { 
  FileText, 
  UserPlus, 
  CalendarCheck, 
  Badge,
  Calculator,
  Users,
} from 'lucide-react';

import SummaryCard from '@/app/(retailers)/hrms/components/SummaryCard';
import PayrollTable from '@/app/(retailers)/hrms/components/PayrollTable';
import PayrollCalculator from '@/app/(retailers)/hrms/components/PayrollCalculator';
import ExportReportsCard from '@/app/(retailers)/hrms/components/ExportReportsCard';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/hrms`;

export default function HRMSPage() {
  
  // State
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [payrollData, setPayrollData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Fetch Data ---
  const fetchData = async () => {
    setLoading(true);
    try {
        const token = localStorage.getItem('authToken');
        if(!token) return;

        const headers = { 'Authorization': `Bearer ${token}` };

        // 1. Fetch Payrolls for Month
        const payrollRes = await fetch(`${API_URL}/payroll/list?month=${currentMonth}`, { headers });
        const payrollJson = await payrollRes.json();

        // 2. Fetch All Employees (for dropdown)
        const staffRes = await fetch(`${API_URL}/staff`, { headers });
        const staffJson = await staffRes.json();

        if (payrollJson.success) setPayrollData(payrollJson.data);
        if (staffJson.success) setEmployees(staffJson.data);

    } catch (error) {
        toast.error("Failed to load HRMS data");
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

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
    setCurrentMonth(e.target.value);
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
      if(data.success) {
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

  // Filter employees who already have payroll generated
  const getAvailableEmployees = () => {
    const calculatedEmpIds = payrollData.map(p => p.emp_id);
    return employees.filter(emp => !calculatedEmpIds.includes(emp.emp_id));
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
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">HR Management</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Manage payroll and staff</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-2 lg:flex lg:flex-row gap-2 sm:gap-3 w-full lg:w-auto mt-2 lg:mt-0">
            <Link href="/hrms/staff/add" className="col-span-2 lg:col-span-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg shadow-blue-100 font-bold text-[13px] sm:text-sm active:scale-95">
              <UserPlus className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Add New Employee</span>
            </Link>
            <Link href="/hrms/attendance" className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-lg shadow-emerald-100 font-bold text-[13px] sm:text-sm active:scale-95">
              <CalendarCheck className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Attendance</span>
            </Link>
            <Link href="/hrms/staff" className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all shadow-lg shadow-purple-100 font-bold text-[13px] sm:text-sm active:scale-95">
              <Badge className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Staff</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Payroll Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 sm:mb-6">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
              Payroll for {new Date(currentMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="w-full sm:w-auto">
              <input
                type="month"
                value={currentMonth}
                onChange={handleMonthChange}
                min="2020-01"
                max={new Date().toISOString().slice(0, 7)}
                className="w-full sm:w-auto form-input rounded-xl border-gray-200 text-sm px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
            </div>
          </div>
        </div>

       <div className="p-4 sm:p-6 border-b border-gray-100">
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
        <div className="p-0 sm:p-6 overflow-x-auto">
          <PayrollTable 
            payrollData={payrollData}
            onRecalculate={handleRecalculate}
            loading={loading}
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
    </div>
  );
}