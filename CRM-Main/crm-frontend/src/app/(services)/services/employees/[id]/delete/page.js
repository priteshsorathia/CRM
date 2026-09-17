"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { hrmsApi } from "@/lib/api";

export default function DeleteEmployeePage() {
  const { id } = useParams();
  const empId = useMemo(() => String(id || ""), [id]);
  const router = useRouter();
  const promptedRef = useRef(false);
  const [status, setStatus] = useState("prompting"); // prompting | deleting | done

  useEffect(() => {
    if (promptedRef.current) return;
    promptedRef.current = true;

    const ok = window.confirm(`Are you sure you want to delete this employee (${empId})?`);
    if (!ok) {
      router.replace("/services/hrms/staff");
      return;
    }

    (async () => {
      setStatus("deleting");
      try {
        const res = await hrmsApi.deleteEmployee(empId);
        if (!res?.success) throw new Error(res?.error || "Failed to delete employee");
      } catch (e) {
        window.alert(e?.message || "Failed to delete employee");
      } finally {
        setStatus("done");
        router.replace("/services/hrms/staff");
      }
    })();
  }, [empId, router]);

  return (
    <div className="flex items-center justify-center min-h-[240px] text-sm font-semibold text-gray-500">
      {status === "deleting" ? "Deleting employee..." : "Redirecting..."}
    </div>
  );
}
