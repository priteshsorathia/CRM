'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import StaffForm from '@/app/(retailers)/hrms/components/StaffForm';
import Loader from '@/components/Loader';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/hrms`;

export default function EditStaffPage() {
  const { id } = useParams(); // Gets 'EMP-001' from URL
  const router = useRouter();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      try {
        const token = localStorage.getItem('authToken'); // Use correct token key

        if (!token) {
          toast.error("Please login first");
          router.push('/login');
          return;
        }

        // Fetch data using the ID from the URL
        const response = await fetch(`${API_URL}/staff/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (data.success) {
          setEmployee(data.data); // Store the fetched employee data
        } else {
          toast.error(data.error || "Failed to fetch employee details");
          router.push('/hrms/staff'); // Go back if not found
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        toast.error("Network error");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEmployeeDetails();
    }
  }, [id, router]);

  return (
    <div className="p-4 sm:p-6">

      {loading ? (
        <Loader variant="container" message="Fetching employee details..." className="h-64" />
      ) : employee ? (
        /* CRITICAL: Pass the fetched 'employee' data to the form */
        <StaffForm
          isEdit={true}
          employeeData={employee}
        />
      ) : (
        <div className="text-center p-10 text-red-500 bg-white rounded-lg shadow">
          Employee not found
        </div>
      )}
    </div>
  );
}