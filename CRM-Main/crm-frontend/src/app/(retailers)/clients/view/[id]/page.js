"use client";

import BackButton from "@/components/BackButton";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
    CheckCircle,
    Wallet,
    FileText,
    AlertCircle,
    Calendar,
    Calculator,
    Banknote,
    Percent,
    Info,
    History,
    Clock,
    Eye,
    Download
} from "lucide-react";

export default function ClientLedgerPage() {
    const { id } = useParams();
    const customerName = decodeURIComponent(id);

    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    // Payment Form State
    const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
    const [amountToAdd, setAmountToAdd] = useState("");
    const [paymentNote, setPaymentNote] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touched, setTouched] = useState({});

    const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}`;

    const fetchClientInvoices = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE}/api/invoices?customer_name=${encodeURIComponent(customerName)}&limit=-1`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setInvoices(data.invoices || []);
                if (data.invoices.length > 0 && !selectedInvoiceId) {
                    setSelectedInvoiceId(data.invoices[0].id);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (customerName) fetchClientInvoices();
    }, [customerName]);

    // Validation helper
    const getAmountError = () => {
        if (!touched.amount) return "";
        if (!selectedInvoiceId) {
            return "Please select an invoice first";
        }
        const targetInvoice = invoices.find(inv => inv.id === parseInt(selectedInvoiceId));
        if (!targetInvoice) return "Selected invoice not found";

        if (!amountToAdd || parseFloat(amountToAdd) <= 0) {
            return "Enter a valid amount";
        }
        if (parseFloat(amountToAdd) > targetInvoice.balance_due) {
            return `Amount exceeds balance due (₹${targetInvoice.balance_due.toFixed(2)})`;
        }
        return "";
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();
        setTouched(prev => ({ ...prev, amount: true }));

        if (!selectedInvoiceId) return;

        const targetInvoice = invoices.find(inv => inv.id === parseInt(selectedInvoiceId));
        if (!targetInvoice) return;

        if (!amountToAdd || parseFloat(amountToAdd) <= 0) return;
        
        if (parseFloat(amountToAdd) > targetInvoice.balance_due) return;

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE}/api/invoices/${selectedInvoiceId}/payment`, {
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

            if (response.ok) {
                toast.success("Payment recorded successfully");
                setAmountToAdd("");
                setPaymentNote("");
                setTouched(prev => {
                    const next = { ...prev };
                    delete next.amount;
                    return next;
                });
                fetchClientInvoices();
            } else {
                const res = await response.json();
                toast.error(res.error || "Failed to record payment");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error recording payment");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDownloadPDF = async (invoiceId, invoiceNumber) => {
        toast.info(`Opening ${invoiceNumber} for download...`);
        window.location.href = `/invoices/${invoiceId}`;
    };

    // --- Calculations ---
    const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.balance_due || 0), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

    // Helper
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    // ✅ Identify Selected Invoice for History
    const selectedInvoiceData = invoices.find(inv => inv.id === parseInt(selectedInvoiceId));

    return (
        <div className="p-4 sm:p-6">

            {/* --- HEADER --- */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{customerName}</h1>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 shadow-sm items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                    <BackButton fallbackUrl="/clients" forceFallback={true} />
                </div>
            </div>

            {/* --- SUMMARY CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Total Invoiced */}
                <div className="bg-blue-50 rounded-lg p-4 sm:p-5 shadow-sm border border-blue-100 flex flex-row items-center gap-3 transition-all hover:shadow-md">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600 shrink-0">
                        <Calculator className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <p className="text-sm font-medium text-gray-500">Total Invoiced</p>
                        <h3 className="text-lg sm:text-2xl font-semibold text-gray-900 leading-tight">{formatCurrency(totalInvoiced)}</h3>
                    </div>
                </div>

                {/* Paid Amount */}
                <div className="bg-green-50 rounded-lg p-4 sm:p-5 shadow-sm border border-green-100 flex flex-row items-center gap-3 transition-all hover:shadow-md">
                    <div className="p-2 rounded-lg bg-green-100 text-green-600 shrink-0">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <p className="text-sm font-medium text-gray-500">Paid Amount</p>
                        <h3 className="text-lg sm:text-2xl font-semibold text-gray-900 leading-tight">{formatCurrency(totalPaid)}</h3>
                    </div>
                </div>

                {/* Pending Amount */}
                <div className="bg-yellow-50 rounded-lg p-4 sm:p-5 shadow-sm border border-yellow-100 flex flex-row items-center gap-3 transition-all hover:shadow-md">
                    <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600 shrink-0">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <p className="text-sm font-medium text-gray-500">Pending Amount</p>
                        <h3 className="text-lg sm:text-2xl font-semibold text-gray-900 leading-tight">{formatCurrency(totalOutstanding)}</h3>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT GRID --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT: INVOICE LIST */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-800 font-bold text-lg">Transaction History</h3>
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold">
                            {invoices.length} Records
                        </span>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-12 text-gray-400">Loading history...</div>
                        ) : invoices.length === 0 ? (
                            <div className="bg-white rounded-xl p-10 text-center border border-gray-200 shadow-sm">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <h3 className="text-gray-900 font-semibold">No Records</h3>
                                <p className="text-gray-500 text-sm mt-1">No transaction records found for this client.</p>
                            </div>
                        ) : (
                            invoices.map(invoice => {
                                const isEMI = invoice.payment_method === 'EMI';
                                const isAdvanced = invoice.payment_method === 'Advanced';
                                const totalAmount = invoice.total || 0;
                                const interestAmount = invoice.interest_amount || 0;
                                const interestRate = invoice.interest_percentage || 0;
                                const principalAmount = totalAmount - interestAmount;
                                const paidAmount = invoice.amount_paid || 0;
                                const outstandingBalance = invoice.balance_due || 0;
                                const status = invoice.payment_status || "Unpaid";

                                // EMI Calculations
                                const emiDuration = invoice.emi_months || 1;
                                const monthlyInstallment = totalAmount / emiDuration;
                                const remainingMonths = outstandingBalance > 0
                                    ? (outstandingBalance / monthlyInstallment).toFixed(1)
                                    : 0;

                                return (
                                    <div
                                        key={invoice.id}
                                        onClick={() => setSelectedInvoiceId(invoice.id)}
                                        className={`
                                    relative p-5 rounded-xl border transition-all cursor-pointer group
                                    ${selectedInvoiceId == invoice.id
                                                ? 'bg-blue-50 border-blue-400 shadow-sm ring-1 ring-blue-200'
                                                : 'bg-white border-gray-200 hover:border-blue-200 hover:shadow-sm'
                                            }
                                `}
                                    >
                                        {/* Header */}
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedInvoiceId == invoice.id ? 'border-blue-600 bg-white' : 'border-gray-300'}`}>
                                                    {selectedInvoiceId == invoice.id && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800 text-lg">{invoice.invoice_number}</h4>
                                                    <p className="text-xs text-gray-500">{new Date(invoice.invoice_date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {/* Dynamic Status Badge */}
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border mr-2 uppercase ${
                                                    status === 'Paid' 
                                                    ? 'bg-green-50 text-green-600 border-green-100' 
                                                    : 'bg-red-50 text-red-600 border-red-100'
                                                }`}>
                                                    {status}
                                                </span>

                                                {/* Action Buttons */}
                                                <div className="flex bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                                    <Link
                                                        href={`/invoices/${invoice.id}`}
                                                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-50 transition-colors border-r border-gray-100"
                                                        title="View Invoice"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDownloadPDF(invoice.id, invoice.invoice_number);
                                                        }}
                                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                                                        title="Download PDF"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {isEMI && (
                                                    <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded font-medium flex items-center gap-1 border border-purple-200">
                                                        <Percent className="w-3 h-3" /> EMI Plan
                                                    </span>
                                                )}
                                                {isAdvanced && (
                                                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-medium flex items-center gap-1 border border-blue-200">
                                                        Advanced
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* ✅ ADVANCED PAYMENT DETAILS */}
                                        {isAdvanced ? (
                                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-3 shadow-sm p-4 space-y-2">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-500">Total Bill Amount:</span>
                                                    <span className="font-bold text-gray-900">{formatCurrency(totalAmount)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-green-600">Initial Advance Paid:</span>
                                                    <span className="font-bold text-green-600">- {formatCurrency(paidAmount)}</span>
                                                </div>
                                                <div className="border-t my-1"></div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-red-800 uppercase">Balance Due</span>
                                                    <span className="text-xl font-bold text-red-600">{formatCurrency(outstandingBalance)}</span>
                                                </div>
                                            </div>
                                        ) : isEMI ? (
                                            /* ✅ EMI SPECIFIC DETAILS BLOCK */
                                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-3 shadow-sm">
                                                <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Info className="w-4 h-4 text-gray-500" />
                                                        <span className="text-xs font-bold text-gray-600 uppercase">EMI Breakdown</span>
                                                    </div>
                                                    {/* Duration Badge */}
                                                    <span className={`text-xs px-2 py-0.5 rounded font-bold flex items-center gap-1 ${remainingMonths > 0 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                                        <Clock className="w-3 h-3" />
                                                        {remainingMonths > 0 ? `${remainingMonths} Months Left` : 'Completed'}
                                                    </span>
                                                </div>
                                                <div className="p-4 space-y-3">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-500">Principal Amount:</span>
                                                        <span className="font-semibold text-gray-800">{formatCurrency(principalAmount)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-500">Rate of Interest:</span>
                                                        <span className="font-semibold text-gray-800">{interestRate}%</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-500">Total Payable Interest:</span>
                                                        <span className="font-semibold text-blue-600">+ {formatCurrency(interestAmount)}</span>
                                                    </div>
                                                    <div className="border-t border-gray-100 my-1"></div>
                                                    <div className="bg-purple-50 p-2 rounded space-y-1">
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-purple-800 font-medium">Selected Tenure:</span>
                                                            <span className="font-bold text-purple-700">{emiDuration} Months</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-purple-800 font-medium">Monthly Installment:</span>
                                                            <span className="font-bold text-purple-700">{formatCurrency(monthlyInstallment)} / month</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm mt-2">
                                                        <span className="text-gray-800 font-bold">Total Payable Amount:</span>
                                                        <span className="text-lg font-bold text-gray-900">{formatCurrency(totalAmount)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-green-600 font-medium">Paid Amount:</span>
                                                        <span className="font-bold text-green-600">- {formatCurrency(paidAmount)}</span>
                                                    </div>
                                                    <div className="mt-2 bg-red-50 p-3 rounded-md border border-red-100 flex justify-between items-center">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-red-800 uppercase tracking-wide">Outstanding Balance</span>
                                                            <span className="text-[10px] text-red-500 font-medium">(~{remainingMonths} months pending)</span>
                                                        </div>
                                                        <span className="text-xl font-bold text-red-600">{formatCurrency(outstandingBalance)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* STANDARD DISPLAY FOR NON-EMI */
                                            <div className="flex justify-between items-end mt-2 pl-9">
                                                <div className="text-sm text-gray-500">
                                                    <p>Total: {formatCurrency(invoice.total)}</p>
                                                    <p className="text-green-600">Paid: {formatCurrency(invoice.amount_paid)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Due Amount</p>
                                                    <p className="text-xl font-bold text-red-600">{formatCurrency(invoice.balance_due)}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* RIGHT: PAYMENT FORM & HISTORY */}
                <div className="lg:col-span-1 space-y-6">

                    {/* Payment Form */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-gray-500" />
                                Record Payment
                            </h2>
                        </div>
                        <form onSubmit={handleAddPayment} className="p-6 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Amount Received</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-medium">₹</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={amountToAdd}
                                        onChange={(e) => setAmountToAdd(e.target.value)}
                                        onBlur={() => setTouched(prev => ({ ...prev, amount: true }))}
                                        className={`w-full pl-10 pr-4 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl font-bold text-gray-900 placeholder-gray-300 transition-all outline-none ${
                                            getAmountError() ? 'border-red-400 focus:ring-red-100 focus:border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="0.00"
                                    />
                                </div>
                                {getAmountError() && (
                                    <p className="text-red-500 text-xs mt-2 font-medium">{getAmountError()}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Payment Mode</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Cash', 'UPI', 'Bank'].map((method) => (
                                        <button
                                            key={method}
                                            type="button"
                                            onClick={() => setPaymentMethod(method === 'Bank' ? 'Bank Transfer' : method)}
                                            className={`py-2.5 px-2 text-sm font-medium rounded-lg border transition-all ${paymentMethod === (method === 'Bank' ? 'Bank Transfer' : method)
                                                ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                                                }`}
                                        >
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Note</label>
                                <textarea
                                    value={paymentNote}
                                    onChange={(e) => setPaymentNote(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none outline-none"
                                    placeholder="Reference ID or remarks"
                                    rows="2"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting || invoices.length === 0}
                                className={`w-full py-3 px-6 rounded-lg text-white font-semibold text-base flex items-center justify-center gap-2 transition-all shadow-sm ${isSubmitting || invoices.length === 0
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md active:transform active:scale-[0.98]'
                                    }`}
                            >
                                {isSubmitting ? "Processing..." : (
                                    <><Banknote className="w-4 h-4" /> Confirm Payment</>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Payment History Table (Only for Selected Invoice) */}
                    {selectedInvoiceData && selectedInvoiceData.payments && selectedInvoiceData.payments.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                    <History className="w-4 h-4 text-gray-500" />
                                    Payment History
                                </h2>
                                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                    {selectedInvoiceData.invoice_number}
                                </span>
                            </div>
                            <div className="overflow-y-auto max-h-[180px] scrollbar-thin scrollbar-thumb-gray-200">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Amount</th>
                                            <th className="px-4 py-3">Mode</th>
                                            <th className="px-4 py-3">Note</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {selectedInvoiceData.payments.map((payment) => (
                                            <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                                    {new Date(payment.payment_date).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-green-600">
                                                    {formatCurrency(payment.amount)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                                        {payment.payment_method}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 text-xs">
                                                    {payment.note || "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
