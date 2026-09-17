'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import EditAttendanceForm from './EditAttendanceForm';
import BackButton from '@/components/BackButton';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/hrms`;

export default function EditAttendanceClient({ emp_id, date }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [employeeName, setEmployeeName] = useState('');
  const [attendance, setAttendance] = useState(null);

  const displayDate = new Date(date || new Date())
    .toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

  useEffect(() => {
    if (!emp_id || !date) {
      router.push('/hrms/attendance');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
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
            router.push('/hrms/attendance');
        }
      } catch (error) {
        toast.error('Failed to load attendance data');
        router.push('/hrms/attendance');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [emp_id, date, router]);

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
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
        router.push(`/hrms/attendance?date=${date}`);
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
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Attendance</h1>
          <p className="text-sm text-gray-500">Update attendance record</p>
        </div>
        <div className="shrink-0">
          <BackButton
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all border border-gray-200 shadow-sm flex items-center justify-center gap-1"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              {employeeName} - {displayDate}
            </h2>
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