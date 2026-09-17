// src/app/my-profile/[id]/edit/page.js
'use client';

import StaffForm from '@/app/(retailers)/hrms/components/StaffForm';
import { useAuth } from '@/context/AuthContext';

export default function EditMyProfilePage({ params }) {
  const { user } = useAuth();
  

  // Mock user data structure
  const currentUserData = {
    emp_id: user.emp_id,
    full_name: user.full_name,
    email: user.email,
    username: 'johndoe', // Add mock values as needed
    phone: '+1234567890',
    role: user.role,
    salary: 75000,
    join_date: '2023-01-15',
    status: 'active',
    user_role: 'admin'
  };

  return (
    <div className="p-4 sm:p-6">
      <StaffForm 
        isEdit={true} 
        employeeData={user}
        // employeeData={currentUserData}
        isCurrentUser={true}
      />
    </div>
  );
}