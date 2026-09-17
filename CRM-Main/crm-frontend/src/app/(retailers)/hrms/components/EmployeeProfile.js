'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, KeyRound, Edit } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import BackButton from '@/components/BackButton';

export default function EmployeeProfile({ employeeData, isCurrentUser = false }) {
  const router = useRouter();
  const { user } = useAuth();

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Function to handle image error
  const handleImageError = (e) => {
    console.log('Image failed to load, using fallback');
    e.target.src = '/placeholder.svg'; // Create this or use data URL
    e.target.onerror = null; // Prevent infinite loop
  };

  // Create a fallback avatar using initials
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const formatRole = (role) => {
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
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow overflow-hidden">
      {/* Back button only for non-current user profiles */}
      {/* Back button only for non-current user profiles */}
      {!isCurrentUser && (
        <div className="flex justify-end p-3 sm:pr-4 sm:pt-4">
          <BackButton />
        </div>
      )}

      {/* Profile Header */}
      <div className={`text-center p-4 sm:p-6 ${!isCurrentUser ? 'border-b border-gray-100' : ''}`}>
        <div className="flex justify-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-50 to-blue-200 flex items-center justify-center overflow-hidden shadow-sm border-2 border-white ring-4 ring-blue-50/50">
            {/* Try image first, fallback to initials */}
            {employeeData.profile_picture ? (
              <img
                src={employeeData.profile_picture}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <span className="text-2xl sm:text-3xl font-black text-blue-600">
                  {getInitials(employeeData.full_name)}
                </span>
              </div>
            )}
          </div>
        </div>
        <h1 className="text-xl sm:text-2xl font-black mt-4 text-gray-900 tracking-tight">
          {employeeData.full_name}
          {isCurrentUser && (
            <span className="ml-2 text-xs sm:text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">(You)</span>
          )}
        </h1>
        <p className="text-blue-600 text-sm sm:text-base font-bold uppercase tracking-wider mt-1">
          {formatRole(employeeData.role)}
        </p>
      </div>

      {/* Basic Information */}
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <span className="w-full sm:w-40 text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-tighter mb-1 sm:mb-0">Join Date</span>
            <span className="text-sm sm:text-base font-semibold text-gray-900">{formatDate(employeeData.join_date)}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center">
            <span className="w-full sm:w-40 text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-tighter mb-1 sm:mb-0">Status</span>
            <span className={`w-fit px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${employeeData.status === 'active'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
              }`}>
              {employeeData.status || 'Unknown'}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center">
            <span className="w-full sm:w-40 text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-tighter mb-1 sm:mb-0">Monthly Salary</span>
            <span className="text-sm sm:text-base font-black text-gray-900 bg-gray-50 px-2 py-1 rounded-lg w-fit">₹{(employeeData.salary || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Contact Information</h2>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <span className="w-full sm:w-40 text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-tighter mb-1 sm:mb-0">Email Address</span>
            <span className="text-sm sm:text-base font-semibold text-gray-900 break-all">{employeeData.email || 'Not provided'}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center">
            <span className="w-full sm:w-40 text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-tighter mb-1 sm:mb-0">Phone Number</span>
            <span className="text-sm sm:text-base font-semibold text-gray-900">{employeeData.phone || 'Not provided'}</span>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="p-4 sm:p-6 pb-8">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Account Information</h2>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <span className="w-full sm:w-40 text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-tighter mb-1 sm:mb-0">Login Username</span>
            <span className="text-sm sm:text-base font-semibold text-gray-900 bg-blue-50/50 px-2 py-0.5 rounded w-fit">{employeeData.username || 'Not set'}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {/* <div className="p-6 bg-gray-50 flex justify-center space-x-4">
        {isCurrentUser ? (
          <>
            <Link
              href={`/my-profile/${employeeData.id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit My Profile
            </Link>
            <Link
              href="/my-profile/change-password"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md flex items-center gap-2 hover:bg-gray-200 transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              Change Password
            </Link>
          </>
        ) : (
          <>
            <Link
              href={`/hrms/staff/${employeeData.id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </Link>
            <Link
              href={`/hrms/staff/${employeeData.id}/change-password`}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md flex items-center gap-2 hover:bg-gray-200 transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              Change Password
            </Link>
          </>
        )}
      </div> */}
    </div>
  );
}