"use client";
import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import OnboardingForm from "../../OnboardingForm";

export default function EditEmployeePage() {
  const { id } = useParams();
  const empId = useMemo(() => String(id || ""), [id]);
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto space-y-4 px-4 sm:px-0 pb-20">
      <button
        onClick={() => router.push(`/services/hrms/staff`)}
        className="text-sm font-bold text-gray-600 hover:text-indigo-600 transition-colors"
      >
        ← Back to Staff List
      </button>

      <OnboardingForm
        mode="edit"
        employeeId={empId}
        onClose={() => router.push(`/services/hrms/staff`)}
        onSaved={() => router.push(`/services/hrms/staff`)}
      />
    </div>
  );
}
