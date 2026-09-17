"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import EditPayrollForm from "./components/EditPayrollForm";
import { getApiBase } from "@/utils/apiBase";

const API_URL = `${getApiBase()}/api/hrms`;

export default function PayrollDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [payroll, setPayroll] = useState(null);

  useEffect(() => {
    if (!id) {
      router.replace("/services/hrms?tab=Payroll");
      return;
    }

    const fetchPayroll = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch(`${API_URL}/payroll/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (data.success) {
          setPayroll(data.data);
        } else {
          toast.error(data.error || "Payroll not found");
          router.replace("/services/hrms?tab=Payroll");
        }
      } catch {
        toast.error("Network error loading payroll");
      } finally {
        setLoading(false);
      }
    };

    fetchPayroll();
  }, [id, router]);

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/payroll/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Payroll updated successfully");
        router.push("/services/hrms?tab=Payroll");
      } else {
        toast.error(data.error || "Update failed");
      }
    } catch {
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !payroll) {
    return (
      <div className="p-3 sm:p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      {payroll ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-8">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mb-1">
              Edit Payroll
            </h1>
            <p className="text-xs sm:text-sm font-bold text-blue-600 uppercase tracking-wider mb-6">
              {payroll.full_name} •{" "}
              {new Date(payroll.month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
            <EditPayrollForm payroll={payroll} onSubmit={handleSubmit} loading={loading} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

