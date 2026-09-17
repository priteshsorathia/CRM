'use client';

import EmployeeProfile from '@/app/(retailers)/hrms/components/EmployeeProfile';
import { useParams, useRouter } from 'next/navigation'; // Added useRouter
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/hrms`;

export default function ViewEmployeePage() {
  const { id } = useParams();
  const router = useRouter(); // Initialize router for redirection
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        // ========================================================
        // CRITICAL FIX: Use 'authToken' instead of 'token'
        // ========================================================
        const token = localStorage.getItem("authToken");
        
        // If no token exists, redirect to login immediately
        if (!token) {
            toast.error("Authentication failed. Please login.");
            router.push('/login');
            return;
        }

        const response = await fetch(`${API_URL}/staff/${id}`, { 
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await response.json();
        
        if (data.success) {
            setEmployee(data.data);
        } else {
            // Handle backend saying token is invalid (even if it exists in localStorage)
            if (response.status === 401 || response.status === 403) {
                toast.error("Session expired. Please login again.");
                router.push('/login');
                return;
            }
            toast.error(data.error);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load employee details");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [id, router]);
  
  return (
    <div className="p-4 sm:p-6">
      {loading ? (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : employee ? (
        <EmployeeProfile employeeData={employee} />
      ) : (
        <div className="text-center p-10 text-red-500 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-medium">Employee not found</h3>
            <p className="text-sm text-gray-500 mt-2">The employee with ID {id} could not be found.</p>
        </div>
      )}
    </div>
  );
}