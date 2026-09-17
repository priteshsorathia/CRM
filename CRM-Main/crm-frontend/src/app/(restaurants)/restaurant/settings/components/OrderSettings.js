"use client";

import { CheckCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getApiBase } from "@/utils/apiBase";

function pad2(n) {
  return String(n).padStart(2, "0");
}

export default function OrderSettings() {
  const API_BASE = useMemo(() => getApiBase(), []);
  const [orderPrefix, setOrderPrefix] = useState("ORD-");
  const [orderCounter, setOrderCounter] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token =
          localStorage.getItem("authToken") || localStorage.getItem("token");
        const response = await fetch(`${API_BASE}/api/settings/order`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json().catch(() => ({}));

        if (result.success && result.data) {
          const s = result.data;
          setOrderPrefix(s.order_prefix || "ORD-");
          setOrderCounter(Number(s.order_counter || 1) || 1);
        }
      } catch (error) {
        console.error("Failed to load order settings", error);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    if (!API_BASE) {
      setLoading(false);
      return;
    }

    fetchSettings();
  }, [API_BASE]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const trimmed = orderPrefix.trim();
    if (!trimmed) {
      setError("Order Prefix is required.");
      return;
    }
    if (trimmed.includes('.')) {
      setError("Order Prefix cannot contain dots.");
      return;
    }
    if (trimmed.length > 50) {
      setError("Order Prefix cannot exceed 50 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/settings/order`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderPrefix: trimmed,
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (response.ok && result.success) {
        setOrderPrefix(result.data?.order_prefix || trimmed);
        setOrderCounter(Number(result.data?.order_counter || 1) || 1);
        toast.success("Order settings saved successfully!");
      } else {
        throw new Error(result.error || "Failed to save");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save settings");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) return <div className="p-4 text-gray-500">Loading settings...</div>;

  const preview = `${orderPrefix || "ORD-"}${pad2(orderCounter || 1)}`;

  return (
    <section className="p-4 w-full">
      <h2 className="text-xl font-semibold mb-4">Order Settings</h2>

      <form onSubmit={handleSubmit} className="space-y-4 w-full">
        <div className="bg-white p-4 rounded shadow-sm border space-y-4">
          <div>
            <label htmlFor="orderPrefix" className="block text-sm font-medium mb-1">
              Order Prefix
            </label>
            <input
              id="orderPrefix"
              value={orderPrefix}
              onChange={(e) => {
                setOrderPrefix(e.target.value);
                setError(null);
              }}
              required
              maxLength={50}
              className={`w-full border rounded p-2 ${
                error ? "border-red-500 focus:ring-red-500 focus:border-red-500 outline-none" : "border-gray-300"
              }`}
              placeholder="e.g. ORD-"
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            <p className="text-xs text-slate-500 mt-1">
              Order number will be generated as{" "}
              <span className="font-medium">{preview}</span>. Changing the prefix
              resets the counter to <span className="font-medium">1</span>.
            </p>
          </div>
        </div>

        <div className="flex justify-start pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2 ${
              isSubmitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

