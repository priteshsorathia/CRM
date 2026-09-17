"use client";

import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getApiBase } from "@/utils/apiBase";

const API_BASE = getApiBase();

export default function BillingSettings() {
  const [billPrefix, setBillPrefix] = useState("RINV/");
  const [billNotes, setBillNotes] = useState("");
  const [tax, setTax] = useState("0.00");
  const [upiId, setUpiId] = useState("");

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState({
    billPrefix: "",
    tax: "",
    upiId: "",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("authToken") || localStorage.getItem("token");
        const response = await fetch(`${API_BASE}/api/settings/invoice`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json().catch(() => ({}));

        if (result.success && result.data) {
          const s = result.data;
          setBillPrefix(s.invoice_prefix || "RINV/");
          setBillNotes(s.invoice_notes || "");
          setTax(
            s.default_tax !== undefined && s.default_tax !== null
              ? String(s.default_tax)
              : "0.00"
          );
          setUpiId(s.upiId || "");
        }
      } catch (error) {
        console.error("Failed to load billing settings", error);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handlePrefixChange = (val) => {
    // Remove dots as requested: "Remove all stray dots from input fields"
    const cleaned = val.replace(/\./g, "");
    setBillPrefix(cleaned);

    // Validate if it is empty space (only spaces)
    if (cleaned.trim() === "") {
      setErrors((prev) => ({
        ...prev,
        billPrefix: "Bill Prefix is required and cannot be empty space.",
      }));
    } else {
      setErrors((prev) => ({ ...prev, billPrefix: "" }));
    }
  };

  const handlePrefixBlur = () => {
    const trimmed = billPrefix.trim();
    setBillPrefix(trimmed);
    if (!trimmed) {
      setErrors((prev) => ({
        ...prev,
        billPrefix: "Bill Prefix is required and cannot be empty space.",
      }));
    } else {
      setErrors((prev) => ({ ...prev, billPrefix: "" }));
    }
  };

  const handleTaxChange = (val) => {
    setTax(val);
    if (val.trim() === "") {
      setErrors((prev) => ({
        ...prev,
        tax: "Default GST (%) is required.",
      }));
    } else {
      const parsed = parseFloat(val);
      if (isNaN(parsed) || parsed < 0) {
        setErrors((prev) => ({
          ...prev,
          tax: "Default GST (%) must be a valid non-negative number.",
        }));
      } else {
        setErrors((prev) => ({ ...prev, tax: "" }));
      }
    }
  };

  const handleTaxBlur = () => {
    const trimmed = tax.trim();
    setTax(trimmed);
    if (!trimmed) {
      setErrors((prev) => ({
        ...prev,
        tax: "Default GST (%) is required.",
      }));
    } else {
      const parsed = parseFloat(trimmed);
      if (isNaN(parsed) || parsed < 0) {
        setErrors((prev) => ({
          ...prev,
          tax: "Default GST (%) must be a valid non-negative number.",
        }));
      } else {
        setErrors((prev) => ({ ...prev, tax: "" }));
      }
    }
  };

  const handleUpiIdChange = (val) => {
    setUpiId(val);
    const trimmed = val.trim();
    if (trimmed) {
      if (!/^[\w.-]+@[\w.-]+$/.test(trimmed)) {
        setErrors((prev) => ({
          ...prev,
          upiId: "Please enter a valid UPI ID (e.g. username@bank)",
        }));
      } else {
        setErrors((prev) => ({ ...prev, upiId: "" }));
      }
    } else {
      setErrors((prev) => ({ ...prev, upiId: "" }));
    }
  };

  const handleUpiIdBlur = () => {
    const trimmed = upiId.trim();
    setUpiId(trimmed);
    if (trimmed) {
      if (!/^[\w.-]+@[\w.-]+$/.test(trimmed)) {
        setErrors((prev) => ({
          ...prev,
          upiId: "Please enter a valid UPI ID (e.g. username@bank)",
        }));
      } else {
        setErrors((prev) => ({ ...prev, upiId: "" }));
      }
    } else {
      setErrors((prev) => ({ ...prev, upiId: "" }));
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();

    // Validate all fields on submit
    const prefixErr = billPrefix.trim() === "" ? "Bill Prefix is required and cannot be empty space." : "";
    const taxErr = tax.trim() === "" ? "Default GST (%) is required." : (isNaN(parseFloat(tax)) || parseFloat(tax) < 0 ? "Default GST (%) must be a valid non-negative number." : "");
    let upiIdErr = "";
    if (upiId.trim()) {
      if (!/^[\w.-]+@[\w.-]+$/.test(upiId.trim())) {
        upiIdErr = "Please enter a valid UPI ID (e.g. username@bank)";
      }
    }

    if (prefixErr || taxErr || upiIdErr) {
      setErrors({ billPrefix: prefixErr, tax: taxErr, upiId: upiIdErr });
      toast.error("Please fix validation errors before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");

      const payload = {
        invoicePrefix: billPrefix.trim() || "RINV/",
        invoiceNotes: billNotes.trim(),
        tax: parseFloat(tax) || 0,
        stockMatter: true,
        enableBuyBackExchange: false,
        priceColumnLabel: "Price per unit",
        upiId: upiId.trim() || null,
      };

      const response = await fetch(`${API_BASE}/api/settings/invoice`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));
      if (response.ok && result.success) {
        toast.success("Billing settings saved successfully!");
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

  return (
    <section className="p-4 w-full">
      <h2 className="text-xl font-semibold mb-4">Billing Settings</h2>

      <form onSubmit={handleSubmit} className="space-y-4 w-full" noValidate>
        <div className="bg-white p-4 rounded shadow-sm border space-y-4">
          <div>
            <label htmlFor="billPrefix" className="block text-sm font-medium mb-1">
              Bill Prefix <span className="text-red-500 font-bold">*</span>
            </label>
            <input
              id="billPrefix"
              value={billPrefix}
              onChange={(e) => handlePrefixChange(e.target.value)}
              onBlur={handlePrefixBlur}
              required
              className={`w-full border rounded p-2 ${errors.billPrefix ? "border-red-500 focus:outline-red-500" : ""}`}
              placeholder="e.g. RINV/"
            />
            {errors.billPrefix && (
              <p className="text-xs text-red-500 mt-1">{errors.billPrefix}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">
              Prefix used for bill numbers (example: <span className="font-medium">RINV/</span>).
              <br />
              Changing the prefix resets the bill counter to <span className="font-medium">1</span>.
            </p>
          </div>

          <div>
            <label htmlFor="tax" className="block text-sm font-medium mb-1">
              Default GST (%) <span className="text-red-500 font-bold">*</span>
            </label>
            <input
              id="tax"
              type="number"
              step="0.01"
              min="0"
              value={tax}
              onChange={(e) => handleTaxChange(e.target.value)}
              onBlur={handleTaxBlur}
              required
              className={`w-full border rounded p-2 ${errors.tax ? "border-red-500 focus:outline-red-500" : ""}`}
              placeholder="e.g. 0.00"
            />
            {errors.tax && (
              <p className="text-xs text-red-500 mt-1">{errors.tax}</p>
            )}
          </div>

          <div>
            <label htmlFor="upiId" className="block text-sm font-medium mb-1">
              UPI ID (for QR Code)
            </label>
            <input
              id="upiId"
              type="text"
              value={upiId}
              onChange={(e) => handleUpiIdChange(e.target.value)}
              onBlur={handleUpiIdBlur}
              className={`w-full border rounded p-2 ${errors.upiId ? "border-red-500 focus:outline-red-500" : ""}`}
              placeholder="e.g. business@okaxis"
            />
            {errors.upiId && (
              <p className="text-xs text-red-500 mt-1">{errors.upiId}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">
              Provide a valid UPI ID to generate payment QR codes for customers.
            </p>
          </div>

          <div>
            <label htmlFor="billNotes" className="block text-sm font-medium mb-1">
              Bill Footer Notes
            </label>
            <textarea
              id="billNotes"
              value={billNotes}
              onChange={(e) => setBillNotes(e.target.value)}
              rows={4}
              className="w-full border rounded p-2"
              placeholder="Footer note shown on printed bill..."
            />
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
