'use client';

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "react-flatpickr";
import "flatpickr/dist/themes/light.css";
import { toast } from "sonner";
import { isSvgFile } from "@/utils/fileValidation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function EditPurchaseBillPage({ params }) {
    const { id } = use(params); // ✅ Unwrap params Promise for Next.js 15
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [billFile, setBillFile] = useState(null);
    const [existingFileUrl, setExistingFileUrl] = useState(null);

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

        const shopId = localStorage.getItem("shopId");
        if (shopId) return shopId;

        const currentShop = localStorage.getItem("currentShop");
        if (currentShop) {
            try {
                const parsed = JSON.parse(currentShop);
                return parsed.id || parsed._id || parsed.shopId || null;
            } catch (e) {
                return currentShop;
            }
        }

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

    useEffect(() => {
        const fetchBill = async () => {
            try {
                const token = getToken();
                const shopId = getShopId();
                if (!token || !shopId) return;

                const res = await fetch(`${API_BASE}/api/bill/get-bills/shop/?shopId=${shopId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) return;
                const json = await res.json();
                const item = (json.data || []).find((b) => String(b.id) === String(id));
                if (!item) {
                    toast.error('Bill not found');
                    return;
                }

                setForm({
                    supplierName: item.supplierName || "",
                    supplierPhone: item.supplierPhone || "",
                    supplierGst: item.supplierGst || "",
                    billNumber: item.billNumber || "",
                    billDate: item.billDate ? new Date(item.billDate) : new Date(),
                    subtotal: item.subtotal ?? "",
                    taxAmount: item.taxAmount ?? "",
                    discountAmount: item.discountAmount ?? "",
                    totalAmount: item.totalAmount ?? "",
                    paymentMode: item.paymentMode ? item.paymentMode.toUpperCase() : "",
                    notes: item.notes || "",
                });

                if (item.billFileUrl) setExistingFileUrl(`${process.env.NEXT_PUBLIC_API_URL}${item.billFileUrl}`);
            } catch (err) {
                console.error('Fetch bill error', err);
                toast.error('Failed to load bill');
            }
        };

        fetchBill();
    }, [id]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = getToken();
            const shopId = getShopId();
            if (!token || !shopId) {
                toast.error('Authentication error');
                setLoading(false);
                return;
            }

            // If user provided a new file -> use multipart endpoint
            if (billFile) {
                const formData = new FormData();
                formData.append('shopId', shopId);
                Object.entries(form).forEach(([key, value]) => {
                    if (value !== '' && value !== null) {
                        // convert Date to ISO string
                        if (key === 'billDate' && value instanceof Date) {
                            formData.append(key, value.toISOString().split('T')[0]);
                        } else {
                            formData.append(key, value);
                        }
                    }
                });
                formData.append('bill', billFile);

                const res = await fetch(`${API_BASE}/api/bill/update-bill/${id}`, {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });

                const data = await res.json();
                if (!res.ok) {
                    toast.error(data.message || 'Failed to update bill');
                    setLoading(false);
                    return;
                }

                toast.success('Bill updated successfully');
                router.push('/my-bills');
                return;
            }

            // No new file -> send JSON to keep existing file
            const payload = {
                shopId,
                ...form,
                billDate: form.billDate instanceof Date ? form.billDate.toISOString().split('T')[0] : form.billDate,
            };

            const res = await fetch(`${API_BASE}/api/bill/update/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) {
                toast.error(data.message || 'Failed to update bill');
                setLoading(false);
                return;
            }

            toast.success('Bill updated successfully');
            router.push('/my-bills');
        } catch (err) {
            console.error('Update error', err);
            toast.error('Server error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-6">


            <div className="mb-6">
                <h1 className="text-xl font-bold">Edit Purchase Bill</h1>
                <p className="text-sm text-gray-500">Update purchase bill details</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 sm:p-6 space-y-6">
                <section>
                    <h3 className="font-semibold mb-3 text-gray-700">Supplier Information</h3>
                    <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                            <input name="supplierName" required placeholder="Supplier Name *" className="input" value={form.supplierName} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Phone</label>
                            <input name="supplierPhone" placeholder="Supplier Phone" className="input" value={form.supplierPhone} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier GST</label>
                            <input name="supplierGst" placeholder="Supplier GST" className="input" value={form.supplierGst} onChange={handleChange} />
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="font-semibold mb-3 text-gray-700">Bill No</h3>
                    <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bill Number</label>
                            <input name="billNumber" placeholder="Bill Number" className="input" value={form.billNumber} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bill Date</label>
                            <DatePicker className="input" options={{ dateFormat: 'Y-m-d' }} value={form.billDate} onChange={([d]) => setForm({ ...form, billDate: d })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
                            <select name="paymentMode" className="input" value={form.paymentMode} onChange={handleChange} required>
                                <option value="">Payment Mode *</option>
                                <option value="CASH">Cash</option>
                                <option value="UPI">UPI</option>
                                <option value="CARD">Card</option>
                                <option value="LENDED">Lended (Udhar)</option>
                                <option value="BANK_TRANSFER">Bank Transfer</option>
                            </select>
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="font-semibold mb-3 text-gray-700">Amount Details</h3>
                    <div className="grid sm:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subtotal</label>
                            <input type="number" name="subtotal" placeholder="Subtotal" className="input" value={form.subtotal} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Amount</label>
                            <input type="number" name="taxAmount" placeholder="Tax Amount" className="input" value={form.taxAmount} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
                            <input type="number" name="discountAmount" placeholder="Discount" className="input" value={form.discountAmount} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount *</label>
                            <input type="number" name="totalAmount" placeholder="Total Amount *" required className="input font-semibold" value={form.totalAmount} onChange={handleChange} />
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="font-semibold mb-3 text-gray-700">Bill Attachment</h3>
                    {existingFileUrl && (
                        <div className="mb-2">
                            <a href={existingFileUrl} target="_blank" className="text-indigo-600">Current file</a>
                        </div>
                    )}
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.csv" className="input" onChange={(e) => {
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
                    }} />
                    <p className="text-sm text-gray-500">Leave empty to keep the existing file.</p>
                </section>

                <textarea name="notes" rows={3} placeholder="Additional notes..." className="input" value={form.notes} onChange={handleChange} />

                <div className="flex gap-3">
                    <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">{loading ? 'Saving...' : 'Update Purchase Bill'}</button>
                    <button type="button" onClick={() => router.back()} className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">Cancel</button>
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
