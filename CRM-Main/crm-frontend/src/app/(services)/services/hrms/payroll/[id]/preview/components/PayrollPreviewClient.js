"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Printer } from "lucide-react";
import { getApiBase } from "@/utils/apiBase";

const API_URL = `${getApiBase()}/api/hrms`;

export default function PayrollPreviewClient({ id, printMode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payroll, setPayroll] = useState(null);
  const [shop, setShop] = useState(null);

  useEffect(() => {
    if (!id) {
      router.replace("/services/hrms?tab=Payroll");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("authToken") || localStorage.getItem("token");
        if (!token) {
          toast.error("Please login to view payroll");
          router.replace("/auth/login");
          return;
        }

        const response = await fetch(`${API_URL}/payroll/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json().catch(() => ({}));

        if (data?.success) {
          setPayroll(data.data);
          setShop(data.data?.shop_details || null);

          if (printMode) {
            setTimeout(() => window.print(), 800);
          }
        } else {
          toast.error(data?.error || "Failed to load payroll");
          router.replace("/services/hrms?tab=Payroll");
        }
      } catch (error) {
        console.error("Error fetching payroll data:", error);
        toast.error("Failed to load payroll data");
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    if (status === "paid") return "text-green-600 font-bold";
    if (status === "pending") return "text-orange-500 font-bold";
    return "text-red-600 font-bold";
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
            size: auto;
          }
          body {
            background: white;
          }

          nav,
          header,
          footer,
          aside,
          .btn,
          .no-print,
          .sidebar-container {
            display: none !important;
          }

          div[class*="text-center"][class*="text-gray-500"],
          a[href*="privacy"],
          a[href*="terms"],
          a[href*="dashboard"] {
            display: none !important;
          }

          .main-content,
          .p-4,
          .sm\\:p-6,
          .md\\:ml-\\[250px\\],
          .md\\:ml-\\[70px\\] {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            transform: none !important;
          }

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
        {!printMode ? (
          <div className="mb-4 sm:mb-6 flex flex-col xs:flex-row justify-between items-center gap-3 no-print">
            <a
              href={`/services/hrms/payroll/${id}/preview?print=1`}
              target="_blank"
              className="w-full xs:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-md"
            >
              <Printer className="h-4 w-4" /> Print slip
            </a>
            <button
              type="button"
              onClick={() => router.push("/services/hrms?tab=Payroll")}
              className="w-full xs:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
            >
              Back
            </button>
          </div>
        ) : null}

        {payroll && shop ? (
          <div className="payroll-slip bg-white mx-auto max-w-[800px] border border-gray-200 p-4 sm:p-8 shadow-sm text-gray-800 font-sans rounded-xl">
            <div className="text-center py-4 border-t-2 border-b-2 border-gray-900 mb-6 bg-gray-50/50">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 m-0 tracking-tight uppercase">PAYROLL SLIP</h2>
              <h3 className="text-sm sm:text-lg font-bold text-blue-600 m-0 mt-1">
                {new Date(payroll.month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </h3>
            </div>

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
              {shop.gst ? (
                <div className="text-left mt-2">
                  <p className="text-xs sm:text-sm m-0 font-bold bg-gray-100 inline-block px-2 py-0.5 rounded">GSTIN: {shop.gst}</p>
                </div>
              ) : null}
            </div>

            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse text-[11px] sm:text-sm min-w-[500px]">
                <thead>
                  <tr>
                    <th colSpan="4" className="border border-gray-200 p-2.5 bg-gray-900 text-center font-bold text-white uppercase tracking-widest">
                      Employee Details
                    </th>
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
                    <td className="border border-gray-200 p-2.5 font-semibold">
                      {new Date(payroll.month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </td>
                    <td className="border border-gray-200 p-2.5 font-bold bg-gray-50 text-gray-600">Paid Date</td>
                    <td className="border border-gray-200 p-2.5 font-semibold text-green-600">
                      {payroll.payment_date ? new Date(payroll.payment_date).toLocaleDateString("en-GB") : "Not Paid"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse text-[11px] sm:text-sm min-w-[500px]">
                <thead>
                  <tr>
                    <th colSpan="4" className="border border-gray-200 p-2.5 bg-gray-900 text-center font-bold text-white uppercase tracking-widest">
                      Attendance Summary
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 p-2.5 font-bold bg-gray-50 text-gray-600">Working Days</td>
                    <td className="border border-gray-200 p-2.5 font-semibold">{payroll.working_days}</td>
                    <td className="border border-gray-200 p-2.5 font-bold bg-gray-50 text-gray-600">Present Days</td>
                    <td className="border border-gray-200 p-2.5 font-semibold">{payroll.present_days}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-2.5 font-bold bg-gray-50 text-gray-600">Paid Days</td>
                    <td className="border border-gray-200 p-2.5 font-semibold">{payroll.paid_days ?? payroll.present_days}</td>
                    <td className="border border-gray-200 p-2.5 font-bold bg-gray-50 text-gray-600">Absent Days</td>
                    <td className="border border-gray-200 p-2.5 font-semibold">{payroll.absent_days}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse text-[11px] sm:text-sm min-w-[500px]">
                <thead>
                  <tr>
                    <th colSpan="4" className="border border-gray-200 p-2.5 bg-gray-900 text-center font-bold text-white uppercase tracking-widest">
                      Salary Breakdown
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 p-2.5 font-bold bg-gray-50 text-gray-600">Basic Salary</td>
                    <td className="border border-gray-200 p-2.5 font-semibold">₹ {Number(payroll.basic_salary || 0).toLocaleString("en-IN")}</td>
                    <td className="border border-gray-200 p-2.5 font-bold bg-gray-50 text-gray-600">Gross Salary</td>
                    <td className="border border-gray-200 p-2.5 font-semibold">₹ {Number(payroll.gross_salary || 0).toLocaleString("en-IN")}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-2.5 font-bold bg-gray-50 text-gray-600">Deductions</td>
                    <td className="border border-gray-200 p-2.5 font-semibold text-red-600">₹ {Number(payroll.deductions || 0).toLocaleString("en-IN")}</td>
                    <td className="border border-gray-200 p-2.5 font-bold bg-gray-50 text-gray-600">Net Salary</td>
                    <td className="border border-gray-200 p-2.5 font-bold text-blue-600">₹ {Number(payroll.net_salary || 0).toLocaleString("en-IN")}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t border-gray-200 pt-4">
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</div>
                <div className={`text-sm sm:text-base ${getStatusColor(payroll.status)}`}>{String(payroll.status || "").toUpperCase()}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Generated On</div>
                <div className="text-sm font-semibold text-gray-800">
                  {payroll.created_at ? new Date(payroll.created_at).toLocaleDateString("en-GB") : "—"}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500 font-semibold">Payroll not found</div>
        )}
      </div>
    </>
  );
}

