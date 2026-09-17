'use client';

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}`;

export default function AddExpensePage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    amount: "",
    expenseDate: "", // Must start empty per requirements
    paymentMode: "",  // Must start empty per requirements
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [isOpenCategory, setIsOpenCategory] = useState(false);
  const [isOpenPayment, setIsOpenPayment] = useState(false);

  const sanitizeInput = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/<[^>]*>/g, '').trim(); // Remove HTML tags and trim
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("authToken") || localStorage.getItem("token");
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = {};
    const sanitizedTitle = sanitizeInput(formData.title);
    const sanitizedDescription = sanitizeInput(formData.description);
    const sanitizedNotes = sanitizeInput(formData.notes);

    if (!sanitizedTitle) {
      newErrors.title = "Title is required";
    } else if (sanitizedTitle.length > 100) {
      newErrors.title = "Title must be at most 100 characters";
    }

    if (sanitizedDescription.length > 500) {
      newErrors.description = "Description must be at most 500 characters";
    }

    if (sanitizedNotes.length > 500) {
      newErrors.notes = "Notes must be at most 500 characters";
    }

    const amt = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amt) || amt <= 0) {
      newErrors.amount = "Amount must be a positive number";
    } else if (amt > 99999999) {
      newErrors.amount = "Amount is too large";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    } else if (!["Rent", "Salary", "Utilities", "Purchase", "Maintenance", "Other"].includes(formData.category)) {
      newErrors.category = "Invalid category selected";
    }

    if (!formData.expenseDate) {
      newErrors.expenseDate = "Expense date is required";
    } else {
      const parsedDate = new Date(formData.expenseDate);
      if (isNaN(parsedDate.getTime())) {
        newErrors.expenseDate = "Invalid date format";
      }
    }

    if (!formData.paymentMode) {
      newErrors.paymentMode = "Payment mode is required";
    } else if (!["Cash", "Card", "UPI", "Bank Transfer"].includes(formData.paymentMode)) {
      newErrors.paymentMode = "Invalid payment mode selected";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const token = getToken();
    if (!token) {
      toast.error("No authentication token found. Please login again.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: sanitizedTitle,
        description: sanitizedDescription,
        category: formData.category,
        amount: amt,
        expenseDate: formData.expenseDate,
        paymentMode: formData.paymentMode,
        notes: sanitizedNotes,
      };

      const res = await fetch(`${API_BASE}/api/expenses/create-expense`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Create expense failed:", data);
        toast.error(data.message || "Failed to create expense");
        return;
      }

      toast.success("Expense created successfully");
      router.push("/expense");
    } catch (err) {
      console.error("Error creating expense:", err);
      toast.error("Error creating expense. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold">
            Add Expense
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Record a new shop expense for your accounts.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow p-4 sm:p-6 space-y-4 sm:space-y-5"
        >
          {/* Title */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Title<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Shop Rent"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                errors.title ? "border-red-500" : "border-gray-200"
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Short description about this expense"
              className={`w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                errors.description ? "border-red-500" : "border-gray-200"
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.description}</p>
            )}
          </div>

          {/* Grid row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Category<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="category"
                  value={formData.category}
                  onClick={() => setIsOpenCategory(!isOpenCategory)}
                  onBlur={() => setIsOpenCategory(false)}
                  onChange={(e) => {
                    handleChange(e);
                    setIsOpenCategory(false);
                  }}
                  className={`peer w-full border rounded-lg px-3 py-2 pr-10 text-sm appearance-none bg-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                    errors.category ? "border-red-500" : "border-gray-200"
                  }`}
                >
                  <option value="">Select category</option>
                  <option value="Rent">Rent</option>
                  <option value="Salary">Salary</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Purchase">Purchase</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Other">Other</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpenCategory ? "rotate-180" : "rotate-0"}`} />
                </div>
              </div>
              {errors.category && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.category}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Amount (₹)<span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                  errors.amount ? "border-red-500" : "border-gray-200"
                }`}
              />
              {errors.amount && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.amount}</p>
              )}
            </div>
          </div>

          {/* Grid row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Expense Date */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Expense Date<span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="expenseDate"
                value={formData.expenseDate}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                  errors.expenseDate ? "border-red-500" : "border-gray-200"
                }`}
              />
              {errors.expenseDate && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.expenseDate}</p>
              )}
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Payment Mode<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="paymentMode"
                  value={formData.paymentMode}
                  onClick={() => setIsOpenPayment(!isOpenPayment)}
                  onBlur={() => setIsOpenPayment(false)}
                  onChange={(e) => {
                    handleChange(e);
                    setIsOpenPayment(false);
                  }}
                  className={`peer w-full border rounded-lg px-3 py-2 pr-10 text-sm appearance-none bg-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                    errors.paymentMode ? "border-red-500" : "border-gray-200"
                  }`}
                >
                  <option value="">Select mode</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpenPayment ? "rotate-180" : "rotate-0"}`} />
                </div>
              </div>
              {errors.paymentMode && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.paymentMode}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Extra notes (optional)"
              className={`w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                errors.notes ? "border-red-500" : "border-gray-200"
              }`}
            />
            {errors.notes && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.notes}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/expense")}
              className="px-3 sm:px-4 py-2 border rounded-lg text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm text-white bg-primary-600 hover:bg-primary-700 transition ${submitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
            >
              {submitting ? "Saving..." : "Save Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


