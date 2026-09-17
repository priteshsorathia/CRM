'use client';

import { useEffect, useState } from 'react';
import EmployeeProfile from '@/app/(retailers)/hrms/components/EmployeeProfile';

export default function MyProfilePage() {
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

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/get-profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to load profile');
        }

        // Map API response into the shape EmployeeProfile expects, without changing its UI
        const data = result.data;
        const mapped = {
          emp_id: data.id,
          full_name: data.name,
          role: data.role,
          join_date: data.createdAt,
          status: data.status || 'active',
          email: data.email,
          phone: data.phone || '',
          username: data.username,
          salary: data.salary || 0,
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
      {loading && (
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">Loading profile...</p>
        </div>
      )}

      {!loading && error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
      )}

      {!loading && !error && employeeData && (
        <EmployeeProfile employeeData={employeeData} isCurrentUser={true} />
      )}
    </div>
  );
}