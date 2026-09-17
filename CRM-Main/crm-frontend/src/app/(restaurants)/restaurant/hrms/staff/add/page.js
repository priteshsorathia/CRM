'use client';

import StaffForm from '@/app/(retailers)/hrms/components/StaffForm';

export default function AddStaffPage() {
  return (
    <div className="p-4 sm:p-6">
      <StaffForm
        isEdit={false}
        staffBasePath="/restaurant/hrms/staff"
        userType="restaurants"
        roleOptions={[
          { label: "Owner", value: "owner" },
          { label: "Manager", value: "manager" },
          { label: "Staff", value: "staff" },
          { label: "Cook", value: "cook" },
        ]}
      />
    </div>
  );
}
