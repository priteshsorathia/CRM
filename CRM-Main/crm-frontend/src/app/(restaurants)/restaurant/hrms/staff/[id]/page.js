'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import StaffForm from '@/app/(retailers)/hrms/components/StaffForm';
import Loader from '@/components/Loader';
import { getApiBase } from '@/utils/apiBase';

const API_URL = `${getApiBase()}/api/hrms`;

export default function EditStaffPage() {
  const { id } = useParams();
  const router = useRouter();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      try {
        const token = localStorage.getItem('authToken');

        if (!token) {
          toast.error("Please login first");
          router.push('/auth/login');
          return;
        }

        const response = await fetch(`${API_URL}/staff/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (data.success) {
          setEmployee(data.data);
        } else {
          toast.error(data.error || "Failed to fetch employee details");
          router.push('/restaurant/hrms/staff');
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
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">

      {loading ? (
        <Loader variant="container" message="Fetching employee details..." className="h-64" />
      ) : employee ? (
        <StaffForm
          isEdit={true}
          employeeData={employee}
          staffBasePath="/restaurant/hrms/staff"
          roleOptions={[
            { label: "Owner", value: "owner" },
            { label: "Manager", value: "manager" },
            { label: "Staff", value: "staff" },
            { label: "Cook", value: "cook" },
          ]}
        />
      ) : (
        <div className="text-center p-10 text-red-500 bg-white rounded-lg shadow">
          Employee not found
        </div>
      )}
    </div>
  );
}
