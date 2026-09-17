"use client";

import { CheckCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getApiBase } from "@/utils/apiBase";

function pad4(n) {
  return String(n).padStart(2, "0");
}

export default function ClientPrefixSettings() {
  const API_BASE = useMemo(() => getApiBase(), []);
  const [clientPrefix, setClientPrefix] = useState("CLT-");
  const [clientCounter, setClientCounter] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token =
          localStorage.getItem("authToken") || localStorage.getItem("token");
        const response = await fetch(`${API_BASE}/api/settings/client`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json().catch(() => ({}));

        if (result.success && result.data) {
          const s = result.data;
          setClientPrefix(s.client_prefix || "CLT-");
          setClientCounter(Number(s.client_counter || 1) || 1);
        }
      } catch (error) {
        console.error("Failed to load client settings", error);
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
    setIsSubmitting(true);
    try {
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/settings/client`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientPrefix: clientPrefix.trim() || "CLT-",
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (response.ok && result.success) {
        setClientPrefix(result.data?.client_prefix || clientPrefix.trim() || "CLT-");
        setClientCounter(Number(result.data?.client_counter || 1) || 1);
        toast.success("Client prefix saved successfully!");
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

  const preview = `${clientPrefix || "CLT-"}${pad4(clientCounter || 1)}`;

  return (
    <section className="p-4 w-full">
      <h2 className="text-xl font-semibold mb-4">Client Prefix</h2>

      <form onSubmit={handleSubmit} className="space-y-4 w-full">
        <div className="bg-white p-4 rounded shadow-sm border space-y-4">
          <div>
            <label
              htmlFor="clientPrefix"
              className="block text-sm font-medium mb-1"
            >
              Client Prefix
            </label>
            <input
              id="clientPrefix"
              value={clientPrefix}
              onChange={(e) => setClientPrefix(e.target.value)}
              required
              className="w-full border rounded p-2"
              placeholder="e.g. CLT-"
            />
            <p className="text-xs text-slate-500 mt-1">
              Client ID preview: <span className="font-medium">{preview}</span>.
              Changing the prefix resets the counter to{" "}
              <span className="font-medium">01</span>.
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
