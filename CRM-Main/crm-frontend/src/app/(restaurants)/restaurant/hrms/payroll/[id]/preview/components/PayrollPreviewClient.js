'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Printer } from 'lucide-react';
import BackButton from '@/components/BackButton';
import { getApiBase } from '@/utils/apiBase';

const API_URL = `${getApiBase()}/api/hrms`;

export default function PayrollPreviewClient({ id, printMode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payroll, setPayroll] = useState(null);
  const [shop, setShop] = useState(null);

  useEffect(() => {
    if (!id) {
      router.push('/restaurant/hrms/payroll');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');

        if (!token) {
          toast.error("Please login to view payroll");
          router.push('/login');
          return;
        }

        const response = await fetch(`${API_URL}/payroll/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (data.success) {
          setPayroll(data.data);
          setShop(data.data.shop_details);

          // Handle Auto-Print
          if (printMode) {
            setTimeout(() => {
              window.print();
            }, 800);
          }
        } else {
          toast.error(data.error || "Failed to load payroll");
          router.push('/restaurant/hrms/payroll');
        }
      } catch (error) {
        console.error('Error fetching payroll data:', error);
        toast.error('Failed to load payroll data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, printMode, router]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  // Helper for status color
  const getStatusColor = (status) => {
    if (status === 'paid') return 'text-green-600 font-bold';
    if (status === 'pending') return 'text-orange-500 font-bold';
    return 'text-red-600 font-bold';
  };

  return (
    <>
      {/* CSS to hide everything except the slip during print */}
      <style jsx global>{`
        @media print {
          @page { margin: 0; size: auto; }
          body { background: white; }
          
          /* 1. Hide Standard Layout Elements */
          nav, header, footer, aside, .btn, .no-print, .sidebar-container {
            display: none !important;
          }

          /* 2. Specific fix to remove the footer seen in your image */
          /* This targets divs containing links like Privacy Policy or Dashboard at the bottom */
          div[class*="text-center"][class*="text-gray-500"], 
          a[href*="privacy"], 
          a[href*="terms"],
          a[href*="dashboard"] {
             display: none !important;
          }

          /* 3. Reset Layout margins so slip takes full page */
          .main-content, .p-4, .sm\\:p-6, .md\\:ml-\\[250px\\], .md\\:ml-\\[70px\\] {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            transform: none !important;
          }

          /* 4. Ensure Slip is visible */
          .payroll-slip {
            width: 100%;
            max-width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 20px !important;
            margin: 0 !important;
            display: block !important;
          }
        }
      `}</style>

      <div className="p-3 sm:p-6 bg-gray-50 min-h-screen">

        {/* Action Buttons (Hidden in Print) */}
        {!printMode && (
          <div className="max-w-[800px] mx-auto mb-4 sm:mb-6 flex flex-col xs:flex-row justify-between items-center gap-3 no-print">
            <a
              href={`/restaurant/hrms/payroll/${id}/preview?print=1`}
              target="_blank"
              className="w-full xs:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-md"
            >
              <Printer className="h-4 w-4" /> Print slip
            </a>
            <button
              onClick={() => router.push('/restaurant/hrms')}
              className="w-full xs:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-all active:scale-95 shadow-sm border border-gray-200"
            >
              Back
            </button>
          </div>
        )}

        {/* Steps Guide (Hidden in Print) */}
        {!printMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800 no-print max-w-[800px] mx-auto shadow-sm">
            <h4 className="font-bold mb-1.5 flex items-center gap-2">
              <span>Steps to view and print this slip:</span>
            </h4>
            <ol className="list-decimal pl-5 space-y-1 text-xs sm:text-sm">
              <li>Review all the details on the payroll slip below.</li>
              <li>Click the <strong>Print slip</strong> button above to open the browser print window.</li>
              <li>Select your printer, or choose "Save as PDF" to save it to your device.</li>
            </ol>
          </div>
        )}

        {payroll && shop && (
          <div className="payroll-slip bg-white mx-auto max-w-[800px] border border-gray-200 p-4 sm:p-8 shadow-sm text-gray-800 font-sans rounded-xl">

            {/* Title Section */}
            <div className="text-center py-4 border-t-2 border-b-2 border-gray-900 mb-6 bg-gray-50/50">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 m-0 tracking-tight uppercase">PAYROLL SLIP</h2>
              <h3 className="text-sm sm:text-lg font-bold text-blue-600 m-0 mt-1">
                {new Date(payroll.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
            </div>

            {/* Header Section (Shop Info) */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="text-left">
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 m-0">{shop.name}</h1>
                  <p className="text-xs sm:text-sm m-0 mt-1.5 text-gray-600 font-medium leading-relaxed whitespace-pre-line">{shop.address}</p>
                  <p className="text-xs sm:text-sm m-0 mt-1 text-gray-500 font-semibold">
                    Phone: <span className="text-gray-900">{shop.phone}</span> | Email: <span className="text-gray-900">{shop.email}</span>
                  </p>
                </div>
              </div>
              {shop.gst && (
                <div className="text-left mt-2">
                  <p className="text-xs sm:text-sm m-0 font-bold bg-gray-100 inline-block px-2 py-0.5 rounded">GSTIN: {shop.gst}</p>
                </div>
              )}
            </div>

            {/* Employee Details Table */}
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse text-[11px] sm:text-sm min-w-[500px]">
                <thead>
                  <tr>
                    <th colSpan="4" className="border border-gray-200 p-2.5 bg-gray-900 text-center font-bold text-white uppercase tracking-widest">Employee Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 p-2.5 font-bold bg-gray-50 w-[20%] text-gray-600">Employee ID</td>
                    <td className="border border-gray-200 p-2.5 w-[30%] font-semibold">{payroll.emp_id}</td>
                    <td className="border border-gray-200 p-2.5 font-bold bg-gray-50 w-[20%] text-gray-600">Payroll ID</td>
                    <td className="border border-gray-200 p-2.5 w-[30%] font-semibold">{payroll.payroll_id}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-2.5 font-bold bg-gray-50 text-gray-600">Name</td>
                    <td className="border border-gray-200 p-2.5 font-bold text-gray-900">{payroll.full_name}</td>
                    <td className="border border-gray-200 p-2.5 font-bold bg-gray-50 text-gray-600">Designation</td>
                    <td className="border border-gray-200 p-2.5 capitalize font-semibold">{payroll.role}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-2.5 font-bold bg-gray-50 text-gray-600">Month</td>
                    <td className="border border-gray-200 p-2.5 font-semibold">{new Date(payroll.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</td>
                    <td className="border border-gray-200 p-2.5 font-bold bg-gray-50 text-gray-600">Paid Date</td>
                    <td className="border border-gray-200 p-2.5 font-semibold text-green-600">
                      {payroll.payment_date ? new Date(payroll.payment_date).toLocaleDateString('en-GB') : 'Not Paid'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Attendance Details Table */}
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse text-[11px] sm:text-sm min-w-[500px]">
                <thead>
                  <tr>
                    <th colSpan="4" className="border border-gray-200 p-2.5 bg-gray-900 text-center font-bold text-white uppercase tracking-widest">Attendance Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 p-2.5 font-bold bg-gray-50 w-[20%] text-gray-600">Working Days</td>
                    <td className="border border-gray-200 p-2.5 w-[30%] font-semibold">{payroll.working_days}</td>
                    <td className="border border-gray-200 p-2.5 font-bold bg-gray-50 w-[20%] text-gray-600">Present Days</td>
                    <td className="border border-gray-200 p-2.5 w-[30%] font-semibold text-blue-600">{payroll.paid_days ?? payroll.present_days}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-2.5 font-bold bg-gray-50 text-gray-600">Absent Days</td>
                    <td className="border border-gray-200 p-2.5 font-semibold text-red-600">{payroll.working_days - (payroll.paid_days ?? payroll.present_days)}</td>
                    <td className="border border-gray-200 p-2.5 font-bold bg-gray-50 text-gray-600">Status</td>
                    <td className={`border border-gray-200 p-2.5 text-[10px] sm:text-xs tracking-wider uppercase ${getStatusColor(payroll.status)}`}>
                      {payroll.status}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Salary Breakdown Table */}
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse text-[11px] sm:text-sm min-w-[500px]">
                <thead>
                  <tr>
                    <th colSpan="2" className="border border-gray-200 p-2.5 bg-gray-900 text-center font-bold text-white uppercase tracking-widest">Salary Breakdown</th>
                    <th className="border border-gray-200 p-2.5 bg-gray-900 text-center font-bold text-white uppercase tracking-widest">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="2" className="border border-gray-200 p-2.5 font-bold bg-gray-50 text-gray-600">Basic Earnings</td>
                    <td className="border border-gray-200 p-2.5 text-right font-semibold">₹{(parseFloat(payroll.basic_salary) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td colSpan="2" className="border border-gray-200 p-2.5 font-bold bg-gray-50 text-gray-600">Bonus / Allowances</td>
                    <td className="border border-gray-200 p-2.5 text-right font-semibold text-blue-600">+ ₹{(parseFloat(payroll.allowances) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td colSpan="2" className="border border-gray-200 p-2.5 font-bold bg-gray-50 text-gray-600">Expenses / Deductions</td>
                    <td className="border border-gray-200 p-2.5 text-right font-semibold text-red-600">- ₹{(parseFloat(payroll.deductions) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr className="bg-blue-50/50">
                    <td colSpan="2" className="border border-gray-200 p-3 text-sm sm:text-base font-black text-gray-900 uppercase">Total Net Payable</td>
                    <td className="border border-gray-200 p-3 text-right text-base sm:text-lg font-black text-blue-700">₹{(parseFloat(payroll.net_salary) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment Details */}
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse text-[11px] sm:text-sm min-w-[500px]">
                <thead>
                  <tr>
                    <th className="border border-gray-200 p-2.5 bg-gray-900 text-center font-bold text-white uppercase tracking-widest">Payment Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 p-3 bg-gray-50/30">
                      <div className="grid grid-cols-2 gap-4">
                        <p className="m-0 text-gray-500 font-bold uppercase tracking-tighter">Mode</p>
                        <p className="m-0 font-black text-gray-900">{payroll.payment_method ? payroll.payment_method.charAt(0).toUpperCase() + payroll.payment_method.slice(1) : '-'}</p>
                        <p className="m-0 text-gray-500 font-bold uppercase tracking-tighter">Bank ID</p>
                        <p className="m-0 font-bold text-gray-900 truncate">{payroll.bank_account || '-'}</p>
                        <p className="m-0 text-gray-500 font-bold uppercase tracking-tighter">Tax ID/PAN</p>
                        <p className="m-0 font-bold text-gray-900">{payroll.pan_number || '-'}</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Notes Section */}
            {payroll.notes && (
              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse text-[11px] sm:text-sm min-w-[500px]">
                  <thead>
                    <tr>
                      <th className="border border-gray-200 p-2.5 bg-gray-900 text-center font-bold text-white uppercase tracking-widest">Office Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-200 p-3 bg-yellow-50/50 italic text-gray-700 leading-relaxed font-medium">{payroll.notes}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 mt-8">
              <p className="m-0 mb-1">This is a computer generated payslip and does not require signature</p>
              <p className="m-0">Generated on: {new Date().toLocaleString('en-GB')}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
