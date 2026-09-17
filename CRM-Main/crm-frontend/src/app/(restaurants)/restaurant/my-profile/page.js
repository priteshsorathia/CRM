'use client';

import { useEffect, useState } from 'react';
import RestaurantLoader from '@/components/RestaurantLoader';
import { getApiBase } from '@/utils/apiBase';

function formatDate(dateString) {
  if (!dateString) return 'Not available';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return 'Not available';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getInitials(name) {
  const s = String(name || '').trim();
  if (!s) return 'U';
  return s
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

function formatRole(role) {
  if (!role) return 'Employee';
  const lowerRole = role.toLowerCase();
  if (lowerRole === 'shop_owner') return 'Shop Owner';
  if (lowerRole === 'restaurant_owner') return 'Restaurant Owner';
  if (lowerRole === 'admin') return 'Administrator';
  if (lowerRole === 'administrator') return 'Administrator';
  
  return role
    .replace(/_/g, ' ')
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export default function RestaurantMyProfilePage() {
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setError('');

        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('authToken') || localStorage.getItem('token')
            : null;

        if (!token) {
          setError('Authentication required. Please log in again.');
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${getApiBase()}/api/profile/get-profile`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to load profile');
        }

        const data = result.data || {};
        const mapped = {
          emp_id: data.id || data.emp_id || data.employee_id || '',
          full_name: data.name || data.full_name || data.username || 'User',
          role: data.role || data.user_role || 'Employee',
          join_date: data.createdAt || data.join_date || null,
          status: data.status || 'active',
          email: data.email || '',
          phone: data.phone || data.shop?.phone || '',
          username: data.username || '',
          salary: data.salary || 0,
          profile_picture: data.profile_picture || data.avatar || null,
        };

        setEmployeeData(mapped);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="p-4 sm:p-6">
      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <RestaurantLoader variant="container" message="Loading profile..." />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
      ) : employeeData ? (
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow overflow-hidden">
          {/* Profile Header */}
          <div className="text-center p-4 sm:p-6 border-b border-gray-100">
            <div className="flex justify-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-50 to-blue-200 flex items-center justify-center overflow-hidden shadow-sm border-2 border-white ring-4 ring-blue-50/50">
                <span className="text-2xl sm:text-3xl font-black text-blue-600">
                  {getInitials(employeeData.full_name)}
                </span>
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl font-black mt-4 text-gray-900 tracking-tight">
              {employeeData.full_name}
              <span className="ml-2 text-xs sm:text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                (You)
              </span>
            </h1>
            <p className="text-blue-600 text-sm sm:text-base font-bold uppercase tracking-wider mt-1">
              {formatRole(employeeData.role)}
            </p>
          </div>

          {/* Basic Information */}
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
              Basic Information
            </h2>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="w-full sm:w-40 text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-tighter mb-1 sm:mb-0">
                  Join Date
                </span>
                <span className="text-sm sm:text-base font-semibold text-gray-900">
                  {formatDate(employeeData.join_date)}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="w-full sm:w-40 text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-tighter mb-1 sm:mb-0">
                  Status
                </span>
                <span
                  className={`w-fit px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                    employeeData.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {employeeData.status || 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
              Contact Information
            </h2>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="w-full sm:w-40 text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-tighter mb-1 sm:mb-0">
                  Email Address
                </span>
                <span className="text-sm sm:text-base font-semibold text-gray-900 break-all">
                  {employeeData.email || 'Not provided'}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="w-full sm:w-40 text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-tighter mb-1 sm:mb-0">
                  Phone Number
                </span>
                <span className="text-sm sm:text-base font-semibold text-gray-900">
                  {employeeData.phone || 'Not provided'}
                </span>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="p-4 sm:p-6 pb-8">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
              Account Information
            </h2>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="w-full sm:w-40 text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-tighter mb-1 sm:mb-0">
                  Login Username
                </span>
                <span className="text-sm sm:text-base font-semibold text-gray-900 bg-blue-50/50 px-2 py-0.5 rounded w-fit">
                  {employeeData.username || 'Not set'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-red-50 text-red-700 rounded-md text-sm">
          Profile not found.
        </div>
      )}
    </div>
  );
}
