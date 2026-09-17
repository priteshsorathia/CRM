'use client';

import { useState } from "react";
import { CheckCircle } from "lucide-react";

export default function EditAttendanceForm({ attendance, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    status: attendance?.status || "present",
    check_in: attendance?.check_in?.substring(0, 5) || "",
    check_out: attendance?.check_out?.substring(0, 5) || "",
    note: attendance?.note || "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.check_in && formData.check_out) {
      const checkInTime = new Date(`2000-01-01T${formData.check_in}`);
      const checkOutTime = new Date(`2000-01-01T${formData.check_out}`);

      if (checkOutTime <= checkInTime) {
        newErrors.check_out = 'Check-out time must be after check-in time';
      }
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Status Field */}
      <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status *
        </label>
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:flex sm:flex-wrap gap-2">
          {[
            { value: 'present', label: 'Present', color: 'bg-green-600 border-green-600' },
            { value: 'absent', label: 'Absent', color: 'bg-red-600 border-red-600' },
            { value: 'late', label: 'Late', color: 'bg-yellow-500 border-yellow-500' },
            { value: 'half_day', label: 'Half Day', color: 'bg-blue-600 border-blue-600' },
            { value: 'leave', label: 'Leave', color: 'bg-purple-600 border-purple-600' },
            { value: 'weekend', label: 'Weekend', color: 'bg-gray-800 border-gray-800' },
          ].map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => handleChange({ target: { name: "status", value: type.value } })}
              disabled={loading}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold border transition-all ${formData.status === type.value
                ? `${type.color} text-white`
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Time Fields */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            In Time
          </label>
          <input
            type="time"
            name="check_in"
            value={formData.check_in}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Out Time
          </label>
          <input
            type="time"
            name="check_out"
            value={formData.check_out}
            onChange={handleChange}
            className={`w-full px-3 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${errors.check_out ? 'border-red-500' : 'border-gray-300'
              }`}
            disabled={loading}
          />
        </div>
      </div>
      {errors.check_out && (
        <p className="mt-[-12px] text-xs text-red-600 font-medium">{errors.check_out}</p>
      )}

      {/* Note Field */}
      <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Remarks
        </label>
        <textarea
          name="note"
          value={formData.note}
          onChange={handleChange}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={loading}
          placeholder="Enter any remarks about this attendance"
        ></textarea>
      </div>

      {/* Form Actions */}
      <div className="pt-6 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all active:scale-95 shadow-sm"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Updating
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Update Record
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
