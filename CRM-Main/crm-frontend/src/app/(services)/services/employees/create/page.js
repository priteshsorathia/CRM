"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CreateEmployeePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/services/hrms/staff?tab=Onboarding");
  }, [router]);

  return null;
}
