import { formatDate } from "@/utils/dateFormatter";
import Link from "next/link";
import { Eye } from "lucide-react";

export default function RecentInvoicesTable({ invoices = [] }) {
  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow p-3 sm:p-4 mt-4 sm:mt-6">
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold">Recent Invoices</h3>
        <Link
          href="/invoices"
          className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
          <thead>
            <tr>
              <th className="px-2 sm:px-4 py-2 text-left font-medium text-gray-500">
                Invoice #
              </th>
              <th className="px-2 sm:px-4 py-2 text-left font-medium text-gray-500">
                Customer
              </th>
              <th className="px-2 sm:px-4 py-2 text-left font-medium text-gray-500">
                Amount
              </th>
              <th className="px-2 sm:px-4 py-2 text-left font-medium text-gray-500">
                Date
              </th>
              <th className="px-2 sm:px-4 py-2 text-left font-medium text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!invoices || invoices.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="py-6 text-center text-gray-400 text-xs sm:text-sm"
                >
                  No invoices generated yet
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-2 sm:px-4 py-2 text-gray-700 truncate max-w-[80px] sm:max-w-none">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="block hover:text-blue-600"
                    >
                      {/* ✅ FIX: Add Red Asterisk if Tax is 0 */}
                      {invoice.number || invoice.invoice_number}
                      {Number(invoice.tax_percentage) === 0 && (
                        <span className="text-red-500 ml-1" title="Non-taxable Invoice">*</span>
                      )}
                    </Link>
                  </td>
                  <td className="px-2 sm:px-4 py-2 text-gray-700 truncate max-w-[100px]">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="block hover:text-blue-600"
                    >
                      {invoice.customer || invoice.customer_name}
                    </Link>
                  </td>
                  <td className="px-2 sm:px-4 py-2 text-gray-700">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="block hover:text-blue-600"
                    >
                      ₹{Number(invoice.total).toLocaleString("en-IN")}
                    </Link>
                  </td>
                  <td className="px-2 sm:px-4 py-2 text-gray-700">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="block hover:text-blue-600"
                    >
                      {formatDate(invoice.date || invoice.invoice_date)}
                    </Link>
                  </td>
                  <td className="px-2 sm:px-4 py-2 text-gray-700">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all duration-200"
                      title="View Invoice"
                    >
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}