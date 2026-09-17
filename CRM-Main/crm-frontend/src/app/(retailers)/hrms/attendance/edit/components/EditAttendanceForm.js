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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Status Field */}
      <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status *
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleChange({ target: { name: "status", value: "present" } })}
            disabled={loading}
            className={`px-3 py-2 rounded-md text-sm font-medium border ${
              formData.status === "present"
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Present
          </button>
          <button
            type="button"
            onClick={() => handleChange({ target: { name: "status", value: "absent" } })}
            disabled={loading}
            className={`px-3 py-2 rounded-md text-sm font-medium border ${
              formData.status === "absent"
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Absent
          </button>
          <button
            type="button"
            onClick={() => handleChange({ target: { name: "status", value: "late" } })}
            disabled={loading}
            className={`px-3 py-2 rounded-md text-sm font-medium border ${
              formData.status === "late"
                ? "bg-yellow-500 text-white border-yellow-500"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Late
          </button>
          <button
            type="button"
            onClick={() => handleChange({ target: { name: "status", value: "half_day" } })}
            disabled={loading}
            className={`px-3 py-2 rounded-md text-sm font-medium border ${
              formData.status === "half_day"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Half Day
          </button>
          <button
            type="button"
            onClick={() => handleChange({ target: { name: "status", value: "leave" } })}
            disabled={loading}
            className={`px-3 py-2 rounded-md text-sm font-medium border ${
              formData.status === "leave"
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Leave
          </button>
          <button
            type="button"
            onClick={() => handleChange({ target: { name: "status", value: "weekend" } })}
            disabled={loading}
            className={`px-3 py-2 rounded-md text-sm font-medium border ${
              formData.status === "weekend"
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Weekend
          </button>
        </div>
      </div>

      {/* Time Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Check In Time
          </label>
          <input
            type="time"
            name="check_in"
            value={formData.check_in}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.check_in ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Check Out Time
          </label>
          <input
            type="time"
            name="check_out"
            value={formData.check_out}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.check_out ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          />
          {errors.check_out && (
            <p className="mt-1 text-sm text-red-600">{errors.check_out}</p>
          )}
        </div>
      </div>

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
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Updating
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Update Attendance
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
