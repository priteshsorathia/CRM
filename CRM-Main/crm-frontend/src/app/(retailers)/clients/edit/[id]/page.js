"use client";

import BackButton from "@/components/BackButton";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export default function EditClientPage() {
    const { id } = useParams();
    const router = useRouter();

    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    // Edit Client Details Form State
    const [editName, setEditName] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editTotal, setEditTotal] = useState("");

    // Add Payment Form State
    const [amountToAdd, setAmountToAdd] = useState("");
    const [paymentNote, setPaymentNote] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Cash");

    // UI/Submission States
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingDetails, setIsSavingDetails] = useState(false);
    const [touched, setTouched] = useState({});

    const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}`;

    // Fetch specific unpaid invoice
    const fetchInvoiceDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE}/api/invoices/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setInvoice(data);
                setEditName(data.customer_name || "");
                setEditPhone(data.customer_phone || "");
                setEditTotal(data.total != null ? data.total.toString() : "");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchInvoiceDetails();
    }, [id]);

    // Validation helpers
    const getInlineError = (field) => {
        if (!touched[field]) return "";
        if (field === "customer_name" && !editName.trim()) {
            return "Client Name is required";
        }
        if (field === "customer_phone") {
            if (!editPhone.trim()) return "Mobile Number is required";
            const digits = editPhone.replace(/\D/g, "");
            if (digits.length !== 10) return "Enter a valid 10-digit phone number";
        }
        if (field === "total") {
            if (!editTotal || parseFloat(editTotal) <= 0) return "Total Amount is required";
        }
        if (field === "amount") {
            if (!amountToAdd || parseFloat(amountToAdd) <= 0) return "Amount Received is required";
            if (invoice && parseFloat(amountToAdd) > invoice.balance_due) {
                return `Amount exceeds balance due (₹${invoice.balance_due.toFixed(2)})`;
            }
        }
        return "";
    };

    const handleSaveDetails = async (e) => {
        e.preventDefault();
        setTouched(prev => ({
            ...prev,
            customer_name: true,
            customer_phone: true,
            total: true
        }));

        const nameError = !editName.trim();
        const phoneError = !editPhone.trim() || editPhone.replace(/\D/g, "").length !== 10;
        const totalError = !editTotal || parseFloat(editTotal) <= 0;

        if (nameError || phoneError || totalError) {
            return;
        }

        setIsSavingDetails(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE}/api/invoices/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...invoice,
                    customer_name: editName.trim(),
                    customer_phone: editPhone.replace(/\D/g, ""),
                    total: parseFloat(editTotal),
                    subtotal: parseFloat(editTotal) - (invoice.tax_amount || 0) + (invoice.discount_amount || 0),
                    items: invoice.invoice_items || invoice.items || []
                })
            });

            const result = await response.json();
            if (response.ok) {
                toast.success("Client details updated successfully");
                fetchInvoiceDetails();
            } else {
                toast.error(result.error || "Failed to update client details");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error updating client details");
        } finally {
            setIsSavingDetails(false);
        }
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();
        setTouched(prev => ({ ...prev, amount: true }));

        if (!amountToAdd || parseFloat(amountToAdd) <= 0 || (invoice && parseFloat(amountToAdd) > invoice.balance_due)) {
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE}/api/invoices/${id}/payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: parseFloat(amountToAdd),
                    note: paymentNote.trim(),
                    method: paymentMethod
                })
            });

            const result = await response.json();
            if (response.ok) {
                toast.success("Payment entry added successfully");
                setAmountToAdd("");
                setPaymentNote("");
                // Reset touched for payment amount
                setTouched(prev => {
                    const next = { ...prev };
                    delete next.amount;
                    return next;
                });
                fetchInvoiceDetails();
            } else {
                toast.error(result.error || "Failed to add payment");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error adding payment");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-4 sm:p-6">
                <div className="text-center py-10">Loading details...</div>
            </div>
        );
    }

    if (!invoice) return <div className="p-10 text-center">Invoice not found</div>;

    const currentBalance = parseFloat(editTotal || 0) - (invoice.amount_paid || 0);

    return (
        <div className="p-4 sm:p-6">

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Edit Client</h1>
                <BackButton fallbackUrl="/clients" forceFallback={true} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Client Details Edit Form */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-bold mb-4 border-b pb-2 text-gray-900">Client Details</h2>
                    <form onSubmit={handleSaveDetails} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Client Name</label>
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onBlur={() => setTouched(prev => ({ ...prev, customer_name: true }))}
                                className={`mt-1 w-full px-3 py-2 border rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                                    getInlineError("customer_name") ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-blue-400'
                                }`}
                                placeholder="Enter client name"
                            />
                            {getInlineError("customer_name") && (
                                <p className="text-red-500 text-xs mt-1 font-medium">{getInlineError("customer_name")}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                            <input
                                type="text"
                                value={editPhone}
                                onChange={(e) => setEditPhone(e.target.value)}
                                onBlur={() => setTouched(prev => ({ ...prev, customer_phone: true }))}
                                className={`mt-1 w-full px-3 py-2 border rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                                    getInlineError("customer_phone") ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-blue-400'
                                }`}
                                placeholder="Enter mobile number"
                            />
                            {getInlineError("customer_phone") && (
                                <p className="text-red-500 text-xs mt-1 font-medium">{getInlineError("customer_phone")}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 font-semibold">Total Amount</label>
                            <input
                                type="number"
                                step="0.01"
                                value={editTotal}
                                onChange={(e) => setEditTotal(e.target.value)}
                                onBlur={() => setTouched(prev => ({ ...prev, total: true }))}
                                className={`mt-1 w-full px-3 py-2 border rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                                    getInlineError("total") ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-blue-400'
                                }`}
                                placeholder="Enter total amount"
                            />
                            {getInlineError("total") && (
                                <p className="text-red-500 text-xs mt-1 font-medium">{getInlineError("total")}</p>
                            )}
                        </div>

                        <div className="flex justify-between text-sm py-1 border-t border-gray-100">
                            <span className="text-gray-600">Invoice Number:</span>
                            <span className="font-semibold text-gray-900">{invoice.invoice_number}</span>
                        </div>

                        {invoice.payment_method === 'EMI' && (
                            <div className="my-2 border-t border-b border-gray-100 py-2 bg-blue-50/50 px-2 rounded">
                                <div className="flex justify-between mb-1">
                                    <span className="text-gray-600 text-sm">Rate of Interest:</span>
                                    <span className="font-bold text-blue-600">{invoice.interest_percentage}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 text-sm">Total Payable Interest:</span>
                                    <span className="font-bold text-blue-600">+ ₹{invoice.interest_amount?.toFixed(2) || "0.00"}</span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between border-t pt-2 text-sm">
                            <span className="text-gray-600">Total Paid:</span>
                            <span className="font-semibold text-green-600">₹{invoice.amount_paid?.toFixed(2) || "0.00"}</span>
                        </div>
                        <div className="flex justify-between bg-red-50 p-2 rounded text-sm">
                            <span className="text-gray-800 font-bold">Outstanding Amount:</span>
                            <span className="font-bold text-red-600">₹{Math.max(0, currentBalance).toFixed(2)}</span>
                        </div>

                        <button
                            type="submit"
                            disabled={isSavingDetails}
                            className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${
                                isSavingDetails ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                        >
                            {isSavingDetails ? "Saving..." : "Save Details"}
                        </button>
                    </form>
                </div>

                {/* Right: Add Payment Form */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-bold mb-4 border-b pb-2 text-gray-900">Add Payment Entry</h2>
                    <form onSubmit={handleAddPayment} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Amount Received (₹)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={amountToAdd}
                                onChange={(e) => setAmountToAdd(e.target.value)}
                                onBlur={() => setTouched(prev => ({ ...prev, amount: true }))}
                                className={`mt-1 w-full px-3 py-2 border rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                                    getInlineError("amount") ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-blue-400'
                                }`}
                                placeholder="Enter amount received"
                                max={invoice.balance_due}
                            />
                            {getInlineError("amount") && (
                                <p className="text-red-500 text-xs mt-1 font-medium">{getInlineError("amount")}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="Cash">Cash</option>
                                <option value="UPI">UPI</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Note</label>
                            <textarea
                                value={paymentNote}
                                onChange={(e) => setPaymentNote(e.target.value)}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                placeholder="Optional note"
                                rows="2"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting || invoice.balance_due <= 0}
                            className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${
                                isSubmitting || invoice.balance_due <= 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {isSubmitting ? "Adding..." : "Add Entry"}
                        </button>
                    </form>
                </div>
            </div>

            {/* Payment History Table */}
            <div className="mt-6 bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold mb-4 text-gray-900">Payment History</h2>
                {invoice.payments && invoice.payments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Method</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Note</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 text-gray-900">
                                {invoice.payments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td className="px-4 py-2 text-sm">{new Date(payment.payment_date).toLocaleDateString()}</td>
                                        <td className="px-4 py-2 text-sm font-semibold text-green-600">₹{payment.amount.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-sm">{payment.payment_method}</td>
                                        <td className="px-4 py-2 text-sm text-gray-500">{payment.note || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm">No payment entries found yet.</p>
                )}
            </div>
        </div>
    );
}