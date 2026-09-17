'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import EditAttendanceForm from './EditAttendanceForm';
import { getApiBase } from '@/utils/apiBase';
import BackButton from '@/components/BackButton';

const API_URL = `${getApiBase()}/api/hrms`;

export default function EditAttendanceClient({ emp_id, date }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [employeeName, setEmployeeName] = useState('');
  const [attendance, setAttendance] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const displayDate = new Date(date || new Date())
    .toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

  useEffect(() => {
    // Restrict edit to Admin/Owner only.
    try {
      const rawUser = localStorage.getItem('userData') || localStorage.getItem('user');
      const u = rawUser ? JSON.parse(rawUser) : null;
      const raw = String(u?.role || u?.user_role || u?.user?.role || '').trim().toLowerCase();
      const variants = new Set([
        raw,
        raw.replace(/\s+/g, '_'),
        raw.replace(/_/g, ' '),
        raw.replace(/[-/]+/g, '_'),
        raw.replace(/[-/]+/g, ' '),
      ]);
      const isAdmin = (() => {
        for (const v of variants) {
          if (v === 'admin' || v === 'administrator') return true;
          if (v === 'owner' || v === 'shop_owner' || v === 'shop owner' || v === 'restaurant_owner' || v === 'restaurant owner') return true;
          if (v.endsWith('_owner')) return true;
          if (v.includes('owner')) return true;
          if (v.includes('admin')) return true;
        }
        return false;
      })();

      if (!isAdmin) {
        router.replace(`/restaurant/hrms/attendance?date=${encodeURIComponent(date || '')}`);
        return;
      }
      setIsAuthorized(true);
    } catch {
      router.replace(`/restaurant/hrms/attendance?date=${encodeURIComponent(date || '')}`);
      return;
    }

    if (!emp_id || !date) {
      router.push('/restaurant/hrms/attendance');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        const response = await fetch(`${API_URL}/attendance/record?emp_id=${emp_id}&date=${date}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
          setEmployeeName(data.data.full_name);
          setAttendance({
            status: data.data.status,
            check_in: data.data.check_in,
            check_out: data.data.check_out,
            note: data.data.note
          });
        } else {
          toast.error(data.error);
          router.push('/restaurant/hrms/attendance');
        }
      } catch (error) {
        toast.error('Failed to load attendance data');
        router.push('/restaurant/hrms/attendance');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [emp_id, date, router]);

  if (!isAuthorized) {
    return null;
  }

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_URL}/attendance/record`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          emp_id,
          date,
          ...formData
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Attendance updated successfully');
        router.push(`/restaurant/hrms/attendance?date=${date}`);
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !attendance) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Attendance</h1>
          <p className="text-xs sm:text-sm text-gray-500">Update attendance record for staff</p>
        </div>
        <div className="shrink-0">
          <BackButton
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all border border-gray-200 shadow-sm flex items-center justify-center gap-1"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-bold text-[#5655eb]">
              {employeeName}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 font-medium">{displayDate}</p>
          </div>
          <EditAttendanceForm
            attendance={attendance}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
