'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FaArrowLeft,
  FaSpinner,
  FaSave,
  FaEye,
  FaEyeSlash,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaUserTag,
  FaDollarSign,
  FaCalendar,
  FaKey
} from "react-icons/fa";
import { toast } from "sonner";
import RestaurantLoader from "@/components/RestaurantLoader";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}`;

const restaurantRoles = [
  { value: 'waiter', label: 'Waiter/Waitress' },
  { value: 'chef', label: 'Chef' },
  { value: 'manager', label: 'Manager' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'host', label: 'Host/Hostess' },
  { value: 'bartender', label: 'Bartender' },
  { value: 'cleaner', label: 'Cleaner' },
  { value: 'other', label: 'Other' }
];

export default function AddStaffPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingEmpId, setLoadingEmpId] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const hasFetchedEmpId = useRef(false);
  
  const [formData, setFormData] = useState({
    emp_id: '',
    full_name: '',
    email: '',
    username: '',
    password: '',
    phone: '',
    role: '',
    salary: '',
    join_date: new Date().toISOString().split('T')[0],
    status: 'active'
  });

  useEffect(() => {
    if (!hasFetchedEmpId.current) {
      fetchNextEmpId();
    }
  }, []);

  const fetchNextEmpId = async () => {
    if (hasFetchedEmpId.current) return;
    
    try {
      setLoadingEmpId(true);
      hasFetchedEmpId.current = true;
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE}/api/hrms/staff/next-emp-id`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.emp_id) {
          setFormData(prev => ({ ...prev, emp_id: data.emp_id }));
        }
      }
    } catch (err) {
      console.error('Error fetching next emp ID:', err);
    } finally {
      setLoadingEmpId(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/hrms/staff`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          salary: formData.salary ? parseFloat(formData.salary) : 0,
          join_date: new Date(formData.join_date).toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Staff member added successfully');
          router.push('/restaurant/staff');
        } else {
          toast.error(data.error || 'Failed to add staff member');
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add staff member');
      }
    } catch (err) {
      console.error('Error adding staff:', err);
      toast.error('Failed to add staff member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/restaurant/staff"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <FaArrowLeft />
            Back
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            Add Staff Member
          </h1>
          <p className="text-gray-600 text-sm">
            Add a new staff member to your restaurant
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaUser />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee ID *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.emp_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, emp_id: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb]"
                    placeholder="EMP-001"
                    disabled={loadingEmpId}
                  />
                  {loadingEmpId && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <FaSpinner className="animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb]"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FaEnvelope />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb]"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FaPhone />
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb]"
                  placeholder="9876543210"
                />
              </div>
            </div>
          </div>

          {/* Role & Employment */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaUserTag />
              Role & Employment
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb]"
                >
                  <option value="">Select Role</option>
                  {restaurantRoles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FaDollarSign />
                  Salary (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.salary}
                  onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb]"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FaCalendar />
                  Join Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.join_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, join_date: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Login Credentials */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaKey />
              Login Credentials (Optional)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb]"
                  placeholder="johndoe"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb]"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Link
              href="/restaurant/staff"
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-[#5655eb] to-[#4338ca] text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <FaSave />
                  Add Staff Member
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
