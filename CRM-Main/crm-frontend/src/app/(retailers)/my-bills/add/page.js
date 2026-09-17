'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "react-flatpickr";
import "flatpickr/dist/themes/light.css";
import { toast } from "sonner";
import { isSvgFile } from "@/utils/fileValidation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function AddPurchaseBillPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [billFile, setBillFile] = useState(null);

    const [form, setForm] = useState({
        supplierName: "",
        supplierPhone: "",
        supplierGst: "",
        billNumber: "",
        billDate: new Date(),
        subtotal: "",
        taxAmount: "",
        discountAmount: "",
        totalAmount: "",
        paymentMode: "",
        notes: "",
    });

    const getToken = () =>
        typeof window !== "undefined"
            ? localStorage.getItem("authToken") || localStorage.getItem("token")
            : null;

    const getShopId = () => {
        if (typeof window === "undefined") return null;

        // Prefer explicit shopId key if present
        const shopId = localStorage.getItem("shopId");
        if (shopId) return shopId;

        // Fallback: some builds store the current shop object under `currentShop`
        const currentShop = localStorage.getItem("currentShop");
        if (currentShop) {
            try {
                const parsed = JSON.parse(currentShop);
                // common id field names
                return parsed.id || parsed._id || parsed.shopId || null;
            } catch (e) {
                // If it's not JSON, it might be a plain id string
                return currentShop;
            }
        }

        // Final fallback: userData may contain shop info
        const userData = localStorage.getItem("userData");
        if (userData) {
            try {
                const parsed = JSON.parse(userData);
                if (parsed && parsed.shop) return parsed.shop.id || parsed.shop._id || null;
            } catch (e) {
                // ignore
            }
        }

        return null;
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Auto-calculate Total Amount
    useEffect(() => {
        const subtotal = parseFloat(form.subtotal) || 0;
        const taxAmount = parseFloat(form.taxAmount) || 0;
        const discountAmount = parseFloat(form.discountAmount) || 0;
        
        if (form.subtotal !== "" || form.taxAmount !== "" || form.discountAmount !== "") {
            const calculatedTotal = subtotal - taxAmount - discountAmount;
            setForm(prev => ({
                ...prev,
                totalAmount: calculatedTotal > 0 ? Number(calculatedTotal.toFixed(2)).toString() : ""
            }));
        }
    }, [form.subtotal, form.taxAmount, form.discountAmount]);

    // ✅ MAIN FIX: FormData submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = getToken();
            const shopId = getShopId();

            if (!token || !shopId) {
                toast.error("Authentication error. Please login again.");
                return;
            }

            const formData = new FormData();
            formData.append("shopId", shopId);

            Object.entries(form).forEach(([key, value]) => {
                if (value !== "" && value !== null) {
                    formData.append(key, value);
                }
            });

            if (billFile) {
                formData.append("bill", billFile); // 🔴 must be "bill"
            }

            const res = await fetch(`${API_BASE}/api/bill/create-bill`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Failed to add purchase bill");
                return;
            }

            toast.success("Purchase bill added successfully");
            router.push("/my-bills");

        } catch (err) {
            console.error(err);
            toast.error("Server error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-6">


            {/* Header */}
            <div className="mb-6">
                <h1 className="text-xl font-bold">Add Purchase Bill</h1>
                <p className="text-sm text-gray-500">
                    Record items purchased from wholesaler / supplier
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-lg shadow p-4 sm:p-6 space-y-6"
            >
                {/* Supplier Info */}
                <section>
                    <h3 className="font-semibold mb-3 text-gray-700">Supplier Information</h3>
                    <div className="grid sm:grid-cols-3 gap-4">
                        <input name="supplierName" required placeholder="Supplier Name *" className="input" onChange={handleChange} />
                        <input name="supplierPhone" placeholder="Supplier Phone" className="input" onChange={handleChange} />
                        <input name="supplierGst" placeholder="Supplier GST" className="input" onChange={handleChange} />
                    </div>
                </section>

                {/* Bill Info */}
                <section>
                    <h3 className="font-semibold mb-3 text-gray-700">Bill Details</h3>
                    <div className="grid sm:grid-cols-3 gap-4">
                        <input name="billNumber" placeholder="Bill Number" className="input" onChange={handleChange} />
                        <DatePicker
                            className="input"
                            options={{ dateFormat: "Y-m-d" }}
                            value={form.billDate}
                            onChange={([d]) => setForm({ ...form, billDate: d })}
                        />
                        <select name="paymentMode" className="input" onChange={handleChange} required>
                            <option value="">Payment Mode *</option>
                            <option value="CASH">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="CARD">Card</option>
                            <option value="Lended">Lended (Udhar)</option>
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                        </select>
                    </div>
                </section>

                {/* Amounts */}
                <section>
                    <h3 className="font-semibold mb-3 text-gray-700">Amount Details</h3>
                    <div className="grid sm:grid-cols-4 gap-4">
                        <input type="number" name="subtotal" value={form.subtotal} placeholder="Subtotal" className="input" onChange={handleChange} />
                        <input type="number" name="taxAmount" value={form.taxAmount} placeholder="Tax Amount" className="input" onChange={handleChange} />
                        <input type="number" name="discountAmount" value={form.discountAmount} placeholder="Discount" className="input" onChange={handleChange} />
                        <input type="number" name="totalAmount" value={form.totalAmount} placeholder="Total Amount *" required className="input font-semibold" onChange={handleChange} />
                    </div>
                </section>

                {/* File Upload */}
                <section>
                    <h3 className="font-semibold mb-3 text-gray-700">Bill Attachment</h3>
                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.csv"
                        className="input"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                if (isSvgFile(file)) {
                                    e.target.value = "";
                                    setBillFile(null);
                                    return;
                                }
                                setBillFile(file);
                            } else {
                                setBillFile(null);
                            }
                        }}
                    />
                </section>

                {/* Notes */}
                <textarea name="notes" rows={3} placeholder="Additional notes" className="input" onChange={handleChange} />

                {/* Actions */}
                <div className="flex gap-3">
                    <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
                        {loading ? "Saving..." : "Save Purchase Bill"}
                    </button>
                    <button type="button" onClick={() => router.back()} className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">
                        Cancel
                    </button>
                </div>
            </form>

            <style jsx>{`
        .input {
          width: 100%;
          padding: 0.6rem 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }
        .input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 1px #6366f1;
        }
      `}</style>
        </div>
    );
}
