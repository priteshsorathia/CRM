'use client';

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function ViewPurchaseBillPage({ params }) {
    const { id } = use(params);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [bill, setBill] = useState(null);

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
            setLoading(true);
            try {
                const token = getToken();
                const shopId = getShopId();
                if (!token || !shopId) {
                    toast.error('Authentication error');
                    setLoading(false);
                    return;
                }

                const res = await fetch(`${API_BASE}/api/bill/view-bill/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    toast.error(err.message || 'Failed to fetch bill');
                    setLoading(false);
                    return;
                }

                const json = await res.json();
                // API may return { status, data } or the object directly
                const item = json?.data || json;
                setBill(item);
            } catch (err) {
                console.error('View bill fetch error', err);
                toast.error('Server error while fetching bill');
            } finally {
                setLoading(false);
            }
        };

        fetchBill();
    }, [id]);

    if (loading) {
        return (
            <div>
                <div>Loading...</div>
            </div>
        );
    }

    if (!bill) {
        return (
            <div>
                <div className="text-red-600">Bill not found.</div>
            </div>
        );
    }

    // Normalize file URL (make absolute if it starts with '/')
    let fileUrl = bill.billFileUrl || bill.billFile || null;
    if (fileUrl && fileUrl.startsWith('/')) fileUrl = `${API_BASE}${fileUrl}`;

    return (
        <div className="p-4 sm:p-6">


            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all active:scale-95">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Purchase Bill #{bill.billNumber || bill.id}</h1>
                        <p className="text-sm text-gray-500 mt-0.5">{bill.supplierName || '—'}</p>
                    </div>
                </div>

                <div className="flex w-full sm:w-auto gap-3">
                    <Link href={`/my-bills/edit/${bill.id}`} className="flex-1 sm:flex-none text-center px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-[13px] sm:text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">
                        Edit
                    </Link>
                    <Link href="/my-bills" className="flex-1 sm:flex-none text-center px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-[13px] sm:text-sm hover:bg-gray-200 transition-all active:scale-95">
                        Back
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-5 sm:space-y-6">
                <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                        <div className="text-xs text-gray-500">Bill Date</div>
                        <div className="font-medium">{bill.billDate ? new Date(bill.billDate).toLocaleDateString('en-GB') : '—'}</div>
                    </div>

                    <div>
                        <div className="text-xs text-gray-500">Bill Number</div>
                        <div className="font-medium">{bill.billNumber || '—'}</div>
                    </div>

                    <div>
                        <div className="text-xs text-gray-500">Payment Mode</div>
                        <div className="font-medium capitalize">{bill.paymentMode || '—'}</div>
                    </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                        <div className="text-xs text-gray-500">Supplier</div>
                        <div className="font-medium">{bill.supplierName || '—'}</div>
                        <div className="text-sm text-gray-600">{bill.supplierPhone || ''}</div>
                    </div>

                    <div>
                        <div className="text-xs text-gray-500">GST</div>
                        <div className="font-medium">{bill.supplierGst || '—'}</div>
                    </div>

                    <div>
                        <div className="text-xs text-gray-500">Notes</div>
                        <div className="font-medium">{bill.notes || '—'}</div>
                    </div>
                </div>

                <div className="grid sm:grid-cols-4 gap-4">
                    <div>
                        <div className="text-xs text-gray-500">Subtotal</div>
                        <div className="font-semibold">₹{Number(bill.subtotal || 0).toFixed(2)}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">Tax</div>
                        <div className="font-semibold">₹{Number(bill.taxAmount || 0).toFixed(2)}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">Discount</div>
                        <div className="font-semibold">₹{Number(bill.discountAmount || 0).toFixed(2)}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">Total</div>
                        <div className="font-semibold text-lg">₹{Number(bill.totalAmount || 0).toFixed(2)}</div>
                    </div>
                </div>

                {fileUrl && (
                    <div>
                        <div className="text-xs text-gray-500">Attachment</div>
                        <a href={fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600">Open file</a>
                    </div>
                )}
            </div>
        </div>
    );
}
