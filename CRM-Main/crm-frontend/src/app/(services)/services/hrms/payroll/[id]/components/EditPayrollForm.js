"use client";

import BackButton from "@/components/BackButton";
import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function EditPayrollForm({ payroll, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    basic_salary: payroll.basic_salary,
    allowances: payroll.allowances,
    deductions: payroll.deductions,
    net_salary: payroll.net_salary,
    status: payroll.status,
    notes: payroll.notes || "",
  });

  useEffect(() => {
    const basic = parseFloat(formData.basic_salary) || 0;
    const allow = parseFloat(formData.allowances) || 0;
    const deduct = parseFloat(formData.deductions) || 0;
    const workingDays = parseFloat(payroll.working_days) || 0;
    const presentDays = parseFloat(payroll.paid_days ?? payroll.present_days) || 0;
    const perDay = workingDays > 0 ? basic / workingDays : 0;
    const earnedBasic = Math.round(perDay * presentDays);
    const net = earnedBasic + allow - deduct;

    if (net !== formData.net_salary) {
      setFormData((prev) => ({ ...prev, net_salary: net }));
    }
  }, [
    formData.basic_salary,
    formData.allowances,
    formData.deductions,
    payroll.working_days,
    payroll.present_days,
    payroll.paid_days,
    formData.net_salary,
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-4">
          <div className="form-group">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Net Salary (₹)
            </label>
            <input
              type="number"
              step="0.01"
              name="net_salary"
              value={formData.net_salary}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-blue-600 cursor-not-allowed"
              readOnly
              required
            />
          </div>
          <div className="form-group">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Basic Salary (₹)
            </label>
            <input
              type="number"
              step="0.01"
              name="basic_salary"
              value={formData.basic_salary}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 cursor-not-allowed"
              readOnly
              required
            />
          </div>
          <div className="form-group">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Allowances (₹)
            </label>
            <input
              type="number"
              step="0.01"
              name="allowances"
              value={formData.allowances}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-medium"
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="form-group">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Deductions (₹)
            </label>
            <input
              type="number"
              step="0.01"
              name="deductions"
              value={formData.deductions}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-medium"
            />
          </div>
          <div className="form-group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleChange({ target: { name: "status", value: "pending" } })}
                className={`py-2 px-1 border rounded-lg text-xs font-bold transition-all ${
                  formData.status === "pending"
                    ? "bg-yellow-500 text-white border-yellow-500"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => handleChange({ target: { name: "status", value: "paid" } })}
                className={`py-2 px-1 border rounded-lg text-xs font-bold transition-all ${
                  formData.status === "paid"
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                Paid
              </button>
              <button
                type="button"
                onClick={() => handleChange({ target: { name: "status", value: "cancelled" } })}
                className={`py-2 px-1 border rounded-lg text-xs font-bold transition-all ${
                  formData.status === "cancelled"
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="form-group">
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Remarks</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder="Add any relevant notes..."
        />
      </div>
      <div className="pt-6 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all active:scale-95 shadow-sm"
          >
            <CheckCircle className="w-4 h-4" />
            {loading ? "Saving..." : "Update Payroll"}
          </button>
          <BackButton />
        </div>
      </div>
    </form>
  );
}

