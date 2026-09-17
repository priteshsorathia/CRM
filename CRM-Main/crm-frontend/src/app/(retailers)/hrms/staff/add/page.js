'use client';

import StaffForm from '@/app/(retailers)/hrms/components/StaffForm'; // Make sure this form sends POST to /api/hrms/staff

export default function AddStaffPage() {

  return (
    <div className="p-4 sm:p-6">
      <StaffForm isEdit={false} />
    </div>
  );
}