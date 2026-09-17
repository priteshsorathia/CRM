export function TopItemsTable({ items = [] }) {
  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow p-3 sm:p-4 h-full">
      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Top Selling Items</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-2">Item</th>
              <th className="py-2 px-2">Qty</th>
              <th className="py-2 pl-2">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {!items || items.length === 0 ? (
              <tr>
                <td colSpan="3" className="py-4 text-center text-gray-400">
                  No items found
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={idx} className="border-b last:border-b-0">
                  <td className="py-2 pr-2 truncate max-w-[100px]">{item.name}</td>
                  <td className="py-2 px-2">{item.qty}</td>
                  <td className="py-2 pl-2">
                    ₹{item.revenue.toLocaleString('en-IN')}
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