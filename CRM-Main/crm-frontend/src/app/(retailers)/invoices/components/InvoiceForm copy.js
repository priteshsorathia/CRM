"use client";
import { useCallback, useState } from "react";
import ItemRow from "@/app/(retailers)/invoices/components/ItemRow";
import QuickCalculation from "@/app/(retailers)/invoices/components/QuickCalculation";
import { ArrowLeft, CheckCircle } from "lucide-react";
import BackButton from "@/components/BackButton";
import { FiPlus } from "react-icons/fi";
import PhoneInput from "@/components/PhoneInput";

export default function InvoiceForm({
  shopDetails,
  shopSettings,
  invoiceNumber,
}) {
  const [items, setItems] = useState([{ id: 1 }]);
  const [formData, setFormData] = useState({
    invoice_number: invoiceNumber,
    customer_name: "",
    customer_phone: "",
    invoice_date: new Date().toISOString().split("T")[0],
    tax: shopSettings.tax,
    discount: 0,
    payment_method: "Cash",
  });

  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);

  const addItem = () => {
    setItems([...items, { id: items.length + 1 }]);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id, data) => {
    // Recalculate totals when items change
    const newSubtotal = Object.values(items).reduce((sum, item) => {
      return sum + (item.total || 0);
    }, 0);

    const newTaxAmount = (newSubtotal * formData.tax) / 100;
    const newTotal = newSubtotal + newTaxAmount - formData.discount;

    setSubtotal(newSubtotal);
    setTaxAmount(newTaxAmount);
    setTotal(newTotal);
  };

  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Recalculate totals when tax or discount changes
      if (name === "tax" || name === "discount") {
        const newTaxAmount =
          (subtotal * (name === "tax" ? parseFloat(value) : formData.tax)) /
          100;
        const newDiscount =
          name === "discount" ? parseFloat(value) : formData.discount;
        const newTotal = subtotal + newTaxAmount - newDiscount;

        setTaxAmount(newTaxAmount);
        setTotal(newTotal);
      }
    },
    [subtotal, formData.tax, formData.discount]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would handle form submission to your backend
    console.log("Form submitted:", {
      ...formData,
      items,
      subtotal,
      tax: taxAmount,
      total,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold">
          Create New Invoice
        </h1>
        <BackButton />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Shop Information Section */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
            Shop Information
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {/* Shop Details */}
            <div className="flex-1 space-y-1 sm:space-y-2 text-sm sm:text-base">
              <p className="font-medium">{shopDetails.shop_name || "N/A"}</p>
              <p
                className="text-gray-600 truncate"
                title={shopDetails.shop_address}
              >
                {shopDetails.shop_address || "Address not available"}
              </p>
              <p>Phone: {shopDetails.shop_phone || "N/A"}</p>
              {shopDetails.shop_email && <p>Email: {shopDetails.shop_email}</p>}
              <p>GST: {shopDetails.shop_gst || "Not registered"}</p>
            </div>

            {/* Logo - Right Side */}
            {shopDetails.logo_path && (
              <div className="flex-shrink-0 flex justify-center sm:justify-end">
                <img
                  src={shopDetails.logo_path}
                  alt="Shop Logo"
                  className="h-14 sm:h-16 object-contain"
                />
              </div>
            )}
          </div>
        </div>

        {/* Invoice Details Section */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
            Invoice Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                name="invoice_number"
                value={formData.invoice_number}
                readOnly
                className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-gray-100 text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                Invoice Date*
              </label>
              <input
                type="date"
                name="invoice_date"
                value={formData.invoice_date}
                onChange={handleInputChange}
                max={new Date().toISOString().split("T")[0]}
                required
                className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
              />
            </div>
          </div>
        </div>

        {/* Billing Information Section */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
            Billing Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Column 1 */}
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm sm:text-sm font-semibold text-gray-800 mb-1">
                  Customer Name*
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  placeholder="Enter customer name"
                  className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-sm sm:text-sm font-semibold text-gray-800 mb-1">
                  GST Number
                </label>
                <input
                  type="text"
                  name="customer_gst"
                  value={formData.customer_gst}
                  onChange={handleInputChange}
                  placeholder="Enter GST number"
                  className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm sm:text-sm font-semibold text-gray-800 mb-1">
                  Phone Number
                </label>
                <PhoneInput
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleInputChange}
                  placeholder="Enter customer phone number"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-sm font-semibold text-gray-800 mb-1">
                  Billing Address
                </label>
                <textarea
                  name="customer_address"
                  value={formData.customer_address}
                  onChange={handleInputChange}
                  placeholder="Enter customer address"
                  rows="1"
                  className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base text-gray-800 resize-y" /* Added text-gray-800 and resize-y */
                />
              </div>
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-bold">Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="px-3 py-1.5 bg-gray-500 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <FiPlus />
              <span>Add Item</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] divide-y divide-gray-200 text-xs sm:text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 sm:px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider ">
                    Unit
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                    quantity
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Price Per Unit (₹)
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Total (₹)
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <ItemRow
                    key={item.id}
                    id={item.id}
                    onRemove={removeItem}
                    onUpdate={updateItem}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Calculation Section */}
        <QuickCalculation />

        {/* Totals Section */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
            Totals
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                Subtotal (₹)
              </label>
              <input
                type="number"
                value={subtotal.toFixed(2)}
                readOnly
                className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md bg-gray-100 text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                Tax (%)
              </label>
              <input
                type="number"
                name="tax"
                value={formData.tax}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                Discount (₹)
              </label>
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                Total (₹)
              </label>
              <input
                type="number"
                value={total.toFixed(2)}
                readOnly
                className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md bg-gray-100 text-sm sm:text-base"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleInputChange}
                className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
              </select>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50">
          <div className="flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Create Invoice
            </button>
            <BackButton />
          </div>
        </div>
      </form>
    </div>
  );
}
