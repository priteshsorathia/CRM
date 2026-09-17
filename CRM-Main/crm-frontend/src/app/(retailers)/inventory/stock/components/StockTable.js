import { Edit } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function StockTable({ stockEntries = [], loading = false }) {
  // Debug: Log the received data
  useEffect(() => {
    console.log('📊 StockTable received data:', stockEntries);
    console.log('📊 Data type:', typeof stockEntries);
    console.log('📊 Data length:', stockEntries?.length || 0);
    
    if (stockEntries && stockEntries.length > 0) {
      console.log('📊 First entry structure:', stockEntries[0]);
      console.log('📊 First entry item:', stockEntries[0].item);
      console.log('📊 First entry unit:', stockEntries[0].unit);
    }
  }, [stockEntries]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!stockEntries || !Array.isArray(stockEntries) || stockEntries.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <p className="text-gray-500">No stock entries found</p>
        <p className="text-sm text-gray-400 mt-2">The table is ready but there's no data to display.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stockEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {entry.item?.item_name || 'Unknown Item'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {entry.item?.item_code || 'No Code'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{entry.quantity}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span 
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      entry.stockType === 'in' 
                        ? 'text-green-800 bg-green-100' 
                        : 'text-red-800 bg-red-100'
                    }`}
                  >
                    {entry.stockType?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {entry.unit?.symbol || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {entry.pricePerUnit ? `₹${entry.pricePerUnit}` : 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {formatDate(entry.createdAt)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link 
                    href={`/inventory/stock/edit/${entry.id}`}
                    className="inline-flex items-center justify-center w-9 h-9 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all duration-200"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}