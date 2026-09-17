'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import EditPayrollForm from './components/EditPayrollForm';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/hrms`;

export default function PayrollDetailPage() {
  const router = useRouter();
  const { id } = useParams(); // This is the Payroll ID (database ID)
  const [loading, setLoading] = useState(true);
  const [payroll, setPayroll] = useState(null);

  useEffect(() => {
    if (!id) {
      router.push('/hrms/payroll');
      return;
    }

    const fetchPayroll = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/payroll/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
            setPayroll(data.data);
        } else {
            toast.error(data.error || 'Payroll not found');
            router.push('/hrms/payroll');
        }
      } catch (error) {
        toast.error('Network error loading payroll');
      } finally {
        setLoading(false);
      }
    };

    fetchPayroll();
  }, [id, router]);

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${API_URL}/payroll/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Payroll updated successfully');
        // Go back to HRMS after save
        router.push('/hrms');
      } else {
        toast.error(data.error || 'Update failed');
      }
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !payroll) {
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

      {payroll && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6">
             <h1 className="text-xl sm:text-2xl font-bold mb-6">
              Edit Payroll
            </h1>
            <h2 className="text-xl font-semibold mb-4">
              {payroll.full_name} - {new Date(payroll.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <EditPayrollForm 
              payroll={payroll} 
              onSubmit={handleSubmit}
              loading={loading}
            />
          </div>
        </div>
      )}
    </div>
  );
}
