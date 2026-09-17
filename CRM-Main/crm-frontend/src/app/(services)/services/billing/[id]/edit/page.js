"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LegacyInvoiceEditRedirect() {
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/services/billing/edit/${id}`);
  }, [id, router]);

  return <div className="p-10 text-center text-gray-500">Redirecting...</div>;
}

