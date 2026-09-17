'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Printer } from 'lucide-react';
import BackButton from '@/components/BackButton';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/hrms`;

export default function PayrollPreviewClient({ id, printMode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payroll, setPayroll] = useState(null);
  const [shop, setShop] = useState(null);

  useEffect(() => {
    if (!id) {
      router.push('/hrms/payroll');
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
            router.push('/hrms/payroll');
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

      <div className="p-4 sm:p-6">
        
        {/* Action Buttons (Hidden in Print) */}
        {!printMode && (
          <div className="mb-6 flex justify-between items-center no-print">
            <a
              href={`/hrms/payroll/${id}/preview?print=1`}
              target="_blank"
              className="btn btn-primary flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Printer className="h-4 w-4" /> Print Payroll
            </a>
            <BackButton />
          </div>
        )}

       {payroll && shop && (
          <div className="payroll-slip bg-white mx-auto max-w-[800px] border border-gray-300 p-6 shadow-sm text-gray-800 font-sans">
            
            {/* Title Section */}
            <div className="text-center py-3 border-t-2 border-b-2 border-gray-800 mb-5">
              <h2 className="text-2xl font-bold text-gray-800 m-0">PAYROLL SLIP</h2>
              <h3 className="text-lg text-gray-600 m-0 mt-1">
                {new Date(payroll.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
            </div>

            {/* Header Section (Shop Info) */}
            <div className="mb-5">
              <div className="flex justify-between items-start">
                <div className="text-left">
                    <h1 className="text-2xl font-bold m-0">{shop.name}</h1>
                    <p className="text-sm m-0 mt-1 whitespace-pre-line">{shop.address}</p>
                    <p className="text-sm m-0 mt-1">
                      Phone: {shop.phone} | Email: {shop.email}
                    </p>
                </div>
              </div>
              {shop.gst && (
                <div className="text-left mt-1">
                  <p className="text-sm m-0">GSTIN: {shop.gst}</p>
                </div>
              )}
            </div>

            {/* Employee Details Table */}
            <table className="w-full border-collapse mb-4 text-sm">
              <thead>
                <tr>
                  <th colSpan="4" className="border border-gray-300 p-2 bg-gray-100 text-center font-bold text-gray-800">Employee Details</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 font-bold w-[25%]">Employee ID</td>
                  <td className="border border-gray-300 p-2 w-[25%]">{payroll.emp_id}</td>
                  <td className="border border-gray-300 p-2 font-bold w-[25%]">Payroll ID</td>
                  <td className="border border-gray-300 p-2 w-[25%]">{payroll.payroll_id}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-bold">Employee Name</td>
                  <td className="border border-gray-300 p-2">{payroll.full_name}</td>
                  <td className="border border-gray-300 p-2 font-bold">Designation</td>
                  <td className="border border-gray-300 p-2 capitalize">{payroll.role}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-bold">Month</td>
                  <td className="border border-gray-300 p-2">{new Date(payroll.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</td>
                  <td className="border border-gray-300 p-2 font-bold">Payment Date</td>
                  <td className="border border-gray-300 p-2">
                    {payroll.payment_date ? new Date(payroll.payment_date).toLocaleDateString('en-GB') : 'Not Paid'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Attendance Details Table */}
            <table className="w-full border-collapse mb-4 text-sm">
              <thead>
                <tr>
                  <th colSpan="4" className="border border-gray-300 p-2 bg-gray-100 text-center font-bold text-gray-800">Attendance Details</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 font-bold w-[25%]">Working Days</td>
                  <td className="border border-gray-300 p-2 w-[25%]">{payroll.working_days}</td>
                  <td className="border border-gray-300 p-2 font-bold w-[25%]">Present Days</td>
                  <td className="border border-gray-300 p-2 w-[25%]">{payroll.paid_days ?? payroll.present_days}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-bold">Absent Days</td>
                  <td className="border border-gray-300 p-2">{payroll.working_days - (payroll.paid_days ?? payroll.present_days)}</td>
                  <td className="border border-gray-300 p-2 font-bold">Status</td>
                  <td className={`border border-gray-300 p-2 capitalize ${getStatusColor(payroll.status)}`}>
                    {payroll.status}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Salary Breakdown Table */}
            <table className="w-full border-collapse mb-4 text-sm">
              <thead>
                <tr>
                  <th colSpan="2" className="border border-gray-300 p-2 bg-gray-100 text-center font-bold text-gray-800">Salary Breakdown</th>
                  <th className="border border-gray-300 p-2 bg-gray-100 text-center font-bold text-gray-800">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="2" className="border border-gray-300 p-2 font-bold">Basic Salary</td>
                  <td className="border border-gray-300 p-2 text-right">₹{payroll.basic_salary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                {payroll.allowances > 0 && (
                  <tr>
                    <td colSpan="2" className="border border-gray-300 p-2 font-bold">Allowances</td>
                    <td className="border border-gray-300 p-2 text-right">₹{payroll.allowances.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                )}
                {payroll.deductions > 0 && (
                  <tr>
                    <td colSpan="2" className="border border-gray-300 p-2 font-bold">Deductions</td>
                    <td className="border border-gray-300 p-2 text-right">- ₹{payroll.deductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                )}
                <tr className="bg-gray-50">
                  <td colSpan="2" className="border border-gray-300 p-2 font-bold text-gray-900">NET SALARY</td>
                  <td className="border border-gray-300 p-2 text-right font-bold text-gray-900">₹{payroll.net_salary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>

            {/* Payment Details */}
            <table className="w-full border-collapse mb-4 text-sm">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-2 bg-gray-100 text-center font-bold text-gray-800">Payment Details</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2">
                    <p className="m-0 mb-1"><strong>Payment Mode:</strong> {payroll.payment_method ? payroll.payment_method.charAt(0).toUpperCase() + payroll.payment_method.slice(1) : 'Not Specified'}</p>
                    <p className="m-0 mb-1"><strong>Bank Account:</strong> {payroll.bank_account || 'Not Specified'}</p>
                    <p className="m-0"><strong>PAN Number:</strong> {payroll.pan_number || 'Not Specified'}</p>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Notes Section */}
            {payroll.notes && (
              <table className="w-full border-collapse mb-4 text-sm">
                <thead>
                  <tr>
                    <th className="border border-gray-300 p-2 bg-gray-100 text-center font-bold text-gray-800">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-2 whitespace-pre-line">{payroll.notes}</td>
                  </tr>
                </tbody>
              </table>
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
