'use client';

import { useCallback, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import DraftItemRow from "@/app/(retailers)/invoices/components/draftItemRow";
import DraftQuickCalculation from "@/app/(retailers)/invoices/components/draftQuickCalculation";
import { CheckCircle, Save, RefreshCw, X, ChevronDown } from "lucide-react";
import BackButton from "@/components/BackButton";
import { FiPlus } from "react-icons/fi";
import PhoneInput from "@/components/PhoneInput";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from 'sonner';
import { useShop } from '@/context/ShopContext';
import { Combobox } from '@headlessui/react';
import InvoiceItems from "@/app/(retailers)/invoices/components/InvoiceItems";

export default function DraftInvoiceForm({
    shopDetails,
    invoiceNumber,
    invoiceData,
    draftId = null
}) {
    const { currentShop } = useShop();
    const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}`;

    const [merchantUpi, setMerchantUpi] = useState('');
    const [logoUrl, setLogoUrl] = useState('');

    // ✅ CONFIG STATE: Holds the dynamic settings
    const [config, setConfig] = useState({
        priceLabel: "Price per unit",
        enableBuyBack: false,
        makingChargesLabel: "Making Charges",
    });

    // Fetch invoice settings
    useEffect(() => {
        const fetchSettings = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) return;
            try {
                const res = await fetch(`${API_BASE}/api/settings/invoice`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await res.json();
                if (result.success) {
                    const s = result.data;
                    setConfig({
                        priceLabel: s.price_column_label || "Price per unit",
                        enableBuyBack: s.enable_buyback_exchange || false,
                        makingChargesLabel: s.making_charges_label || "Making Charges",
                    });
                }
            } catch (e) {
                console.error("Failed to fetch invoice settings", e);
            }
        };
        fetchSettings();
    }, [API_BASE]);

    const [customerQuery, setCustomerQuery] = useState('');
    const [customerSuggestions, setCustomerSuggestions] = useState([]);

    const [items, setItems] = useState([{
        id: 1,
        item_id: '',
        item_name: '',
        unit_id: '',
        unit_name: '',
        unit_symbol: '',
        quantity: '',
        quantity_kg: '',
        quantity_g: '',
        price_per_unit: '',
        item_total: 0
    }]);

    const [formData, setFormData] = useState({
        invoice_number: invoiceNumber || "",
        customer_name: "",
        customer_phone: "",
        customer_address: "",
        customer_gst: "",
        invoice_date: new Date().toISOString().split("T")[0],
        tax: 0,
        discount: 0,
        discount_type: "percentage",
        payment_method: "Cash",
        payment_status: "Paid",
        interest_rate: 0,
        emi_months: 3,
        amount_paid: 0,
        payment_type: "Full",
        show_emi_details: true,
        exchange: "false",
        buyback: "false",
        making_charges: 0
    });

    const [subtotal, setSubtotal] = useState(0);
    const [total, setTotal] = useState(0);
    const [taxAmount, setTaxAmount] = useState(0);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [interestAmount, setInterestAmount] = useState(0);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [savingDraft, setSavingDraft] = useState(false);
    const [errors, setErrors] = useState({});
    const [discountTypeOpen, setDiscountTypeOpen] = useState(false);
    const [paymentMethodOpen, setPaymentMethodOpen] = useState(false);
    const router = useRouter();

    // --- 0. SET LOGO URL ON MOUNT ---
    useEffect(() => {
        const path = shopDetails?.logo_path || shopDetails?.logo;
        if (path) {
            if (path.startsWith('http')) {
                setLogoUrl(path);
            } else {
                const cleanPath = path.startsWith('/') ? path : `/${path}`;
                setLogoUrl(`${API_BASE}${cleanPath}?t=${Date.now()}`);
            }
        }
    }, [shopDetails]);

    // --- INITIALIZE DRAFT DATA ---
    useEffect(() => {
        if (invoiceData) {
            const discountAmountValue = parseFloat(invoiceData.discount_amount) || 0;

            const shopName = shopDetails?.shop_name || "Shop";
            const defaultCustomerPattern = `${shopName}'s Customer`;
            let customerName = invoiceData.customer_name || "";

            if (customerName === defaultCustomerPattern) {
                customerName = "";
            }

            setCustomerQuery(customerName);

            const isEMI = invoiceData.payment_method === "EMI" || (invoiceData.emi_months && parseInt(invoiceData.emi_months) > 0);
            const isAdvanced = invoiceData.payment_method === "Advanced" || (parseFloat(invoiceData.amount_paid) > 0 && parseFloat(invoiceData.balance_due) > 0);
            const derivedPaymentType = isEMI ? "EMI" : (isAdvanced ? "Advanced" : "Full");

            setFormData(prev => ({
                ...prev,
                invoice_number: invoiceData.invoice_number || prev.invoice_number || "",
                customer_name: customerName,
                customer_phone: invoiceData.customer_phone || "",
                customer_address: invoiceData.customer_address || "",
                customer_gst: invoiceData.customer_gst || "",
                invoice_date: invoiceData.invoice_date || new Date().toISOString().split("T")[0],
                tax: invoiceData.tax_percentage || invoiceData.tax || 0,
                discount: invoiceData.discount || 0,
                discount_type: invoiceData.discount_type || "percentage",
                payment_method: invoiceData.payment_method || "Cash",
                payment_status: invoiceData.payment_status || "Paid",
                interest_rate: invoiceData.interest_percentage || 0,
                emi_months: invoiceData.emi_months || 0,
                amount_paid: invoiceData.amount_paid || 0,
                exchange: invoiceData.exchange ? "true" : "false",
                buyback: invoiceData.buyback ? "true" : "false",
                making_charges: invoiceData.making_charges || 0,
                payment_type: derivedPaymentType
            }));

            const initialItems = invoiceData.items || invoiceData.draft_items || [];
            setItems(initialItems.length > 0 ? initialItems : items);
            setSubtotal(parseFloat(invoiceData.subtotal) || 0);
            setTaxAmount(parseFloat(invoiceData.tax_amount) || 0);
            setTotal(parseFloat(invoiceData.total) || 0);
            setDiscountAmount(discountAmountValue);
            setInterestAmount(parseFloat(invoiceData.interest_amount) || 0);
        }
    }, [invoiceData, shopDetails]);

    // --- CUSTOMER SEARCH ---
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (customerQuery.length < 2) {
                setCustomerSuggestions([]);
                return;
            }

            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`${API_BASE}/api/invoices/search-customers?query=${encodeURIComponent(customerQuery)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await response.json();
                if (result.success) {
                    setCustomerSuggestions(result.data);
                }
            } catch (error) {
                console.error("Error searching customers", error);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [customerQuery]);

    const handleCustomerSelect = (customer) => {
        if (!customer) return;

        setFormData(prev => ({
            ...prev,
            customer_name: customer.customer_name,
            customer_phone: customer.customer_phone || "",
            customer_address: customer.customer_address || "",
            customer_gst: customer.customer_gst || ""
        }));
        setCustomerQuery(customer.customer_name);
    };

    const handleInputChange = useCallback(
        (e) => {
            const { name, value } = e.target;

            setErrors((prev) => {
                if (prev[name]) {
                    const nextErrors = { ...prev };
                    delete nextErrors[name];
                    return nextErrors;
                }
                return prev;
            });

            setFormData((prev) => {
                const newData = { ...prev, [name]: value };

                if (name === "payment_method") {
                    const unpaidMethods = ["Advanced", "EMI"];
                    if (unpaidMethods.includes(value)) {
                        newData.payment_status = "Unpaid";
                        newData.payment_type = value;
                    } else {
                        // If nature is already Advanced or EMI, keep it.
                        if (newData.payment_type !== "Advanced" && newData.payment_type !== "EMI") {
                            newData.payment_status = "Paid";
                            newData.payment_type = "Full";
                        }
                    }
                }

                if (name === "payment_option" && value === "Advanced") {
                    newData.payment_method = "Cash";
                    newData.payment_type = "Advanced";
                    newData.payment_status = "Unpaid";
                }
                if (name === "payment_option" && value === "EMI") {
                    newData.payment_method = "EMI";
                    newData.payment_type = "EMI";
                    newData.payment_status = "Unpaid";
                }
                if (name === "payment_option" && value === "Full") {
                    newData.payment_method = "Cash";
                    newData.payment_type = "Full";
                    newData.payment_status = "Paid";
                }

                return newData;
            });
        },
        [errors]
    );

    const validateForm = useCallback(() => {
        const newErrors = {};

        // Validate Invoice Number
        if (!formData.invoice_number || !formData.invoice_number.trim()) {
            newErrors.invoice_number = "Invoice Number is required.";
        }

        // Validate Customer Name
        if (formData.customer_name && formData.customer_name.length > 100) {
            newErrors.customer_name = "Customer name cannot exceed 100 characters";
        }

        // Validate Phone if provided
        const phone = formData.customer_phone ? formData.customer_phone.replace(/\D/g, "") : "";
        if (phone && phone.length !== 10) {
            newErrors.customer_phone = "Enter a valid 10-digit phone number";
        }

        // Validate Customer GST
        if (formData.customer_gst && formData.customer_gst.trim()) {
            if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.customer_gst.trim().toUpperCase())) {
                newErrors.customer_gst = "Invalid GSTIN format (e.g. 22AAAAA0000A1Z5)";
            }
        }

        // Validate Tax
        if (formData.tax !== undefined && formData.tax !== "") {
            const taxVal = parseFloat(formData.tax);
            if (isNaN(taxVal) || taxVal < 0 || taxVal > 100) {
                newErrors.tax = "Tax percentage must be between 0 and 100";
            }
        }

        // Validate Discount
        if (formData.discount !== undefined && formData.discount !== "") {
            const discVal = parseFloat(formData.discount);
            if (isNaN(discVal) || discVal < 0) {
                newErrors.discount = "Discount must be a positive number";
            } else if (formData.discount_type === "percentage" && discVal > 100) {
                newErrors.discount = "Discount percentage cannot exceed 100";
            } else if (formData.discount_type === "flat" && discVal > subtotal + taxAmount) {
                newErrors.discount = "Discount cannot exceed subtotal + tax";
            }
        }

        // Validate Making Charges
        if (formData.making_charges !== undefined && formData.making_charges !== "") {
            const mcVal = parseFloat(formData.making_charges);
            if (isNaN(mcVal) || mcVal < 0) {
                newErrors.making_charges = "Making charges must be a positive number";
            }
        }

        // Validate EMI details if payment_type is EMI
        if (formData.payment_type === "EMI") {
            const rateVal = parseFloat(formData.interest_rate);
            if (isNaN(rateVal) || rateVal < 0 || rateVal > 100) {
                newErrors.interest_rate = "Interest rate must be between 0% and 100%";
            }
            const monthsVal = parseInt(formData.emi_months);
            if (isNaN(monthsVal) || monthsVal <= 0 || monthsVal > 60) {
                newErrors.emi_months = "EMI months must be between 1 and 60";
            }
        }

        // Validate Advanced Amount
        if (formData.payment_type === "Advanced") {
            const amtPaid = parseFloat(formData.amount_paid);
            if (isNaN(amtPaid) || amtPaid < 0) {
                newErrors.amount_paid = "Amount paid must be a positive number";
            } else if (amtPaid > total) {
                newErrors.amount_paid = "Amount paid cannot exceed the invoice total";
            }
        }

        // Validate Items
        const hasItems = items.some(
            (item) => item.item_name && item.quantity && item.price_per_unit
        );
        if (!hasItems) {
            newErrors.items = "Please add at least one item to save as draft";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [
        formData.invoice_number,
        formData.customer_name,
        formData.customer_phone,
        formData.customer_gst,
        formData.tax,
        formData.discount,
        formData.discount_type,
        formData.making_charges,
        formData.payment_type,
        formData.interest_rate,
        formData.emi_months,
        formData.amount_paid,
        items,
        subtotal,
        taxAmount,
        total,
    ]);

    // --- TOTAL CALCULATION ---
    const recalculateTotals = useCallback((itemsArray) => {
        const newSubtotal = itemsArray.reduce((sum, item) => {
            const itemTotal = parseFloat(item.item_total) || 0;
            return sum + itemTotal;
        }, 0);

        const taxRate = parseFloat(formData.tax) || 0;
        const newTaxAmount = (newSubtotal * taxRate) / 100;

        let newDiscountAmount = 0;
        const discountValue = parseFloat(formData.discount) || 0;

        if (formData.discount_type === "percentage") {
            newDiscountAmount = (newSubtotal * discountValue) / 100;
        } else {
            newDiscountAmount = discountValue;
        }

        const maxDiscount = newSubtotal + newTaxAmount;
        if (newDiscountAmount > maxDiscount) {
            newDiscountAmount = maxDiscount;
        }

        const principalAmount = Math.max(0, newSubtotal + newTaxAmount - newDiscountAmount);

        let calculatedInterest = 0;
        if (formData.payment_type === 'EMI') {
            const rate = parseFloat(formData.interest_rate) || 0;
            const months = parseInt(formData.emi_months) || 1;
            calculatedInterest = (principalAmount * rate * months) / 100;
        }

        const makingCharges = parseFloat(formData.making_charges) || 0;
        const newTotal = principalAmount + calculatedInterest + makingCharges;

        setSubtotal(newSubtotal);
        setTaxAmount(newTaxAmount);
        setDiscountAmount(newDiscountAmount);
        setInterestAmount(calculatedInterest);
        setTotal(newTotal);
    }, [formData.tax, formData.discount, formData.discount_type, formData.payment_method, formData.payment_type, formData.interest_rate, formData.emi_months, formData.making_charges]);

    useEffect(() => {
        recalculateTotals(items);
    }, [formData.tax, formData.discount, formData.discount_type, formData.payment_method, formData.payment_type, formData.interest_rate, formData.emi_months, formData.making_charges, recalculateTotals, items]);

    // --- ITEM HANDLERS ---
    const addItem = (initialData = null) => {
        setErrors((prev) => {
            const next = { ...prev };
            delete next.items;
            return next;
        });
        setItems((prevItems) => {
            // ✅ FIX: Prevent adding duplicate empty rows
            if (!initialData && prevItems.length > 0) {
                const lastItem = prevItems[prevItems.length - 1];
                if (!lastItem.item_id && !lastItem.item_name) {
                    return prevItems;
                }
            }

            const newId = prevItems.length > 0 ? Math.max(...prevItems.map(item => item.id)) + 1 : 1;
            return [...prevItems, {
                id: newId,
                item_id: initialData?.item_id || '',
                item_name: initialData?.item_name || '',
                unit_id: initialData?.unit_id || '',
                unit_name: initialData?.unit_name || '',
                unit_symbol: initialData?.unit_symbol || '',
                quantity: initialData?.quantity || '',
                quantity_kg: initialData?.quantity_kg || initialData?.quantity || '',
                quantity_g: initialData?.quantity_g || (initialData?.quantity ? (parseFloat(initialData.quantity) * 1000).toString() : ''),
                price_per_unit: initialData?.price_per_unit || '',
                item_total: initialData?.item_total || 0
            }];
        });
    };

    const removeItem = (id) => {
        setErrors((prev) => {
            const next = { ...prev };
            delete next.items;
            return next;
        });
        if (items.length > 1) {
            const updatedItems = items.filter((item) => item.id !== id);
            setItems(updatedItems);
        } else {
            const clearedItem = {
                id: items[0].id,
                item_id: '',
                item_name: '',
                unit_id: '',
                unit_name: '',
                unit_symbol: '',
                quantity: '',
                quantity_kg: '',
                quantity_g: '',
                price_per_unit: '',
                item_total: 0
            };
            setItems([clearedItem]);
        }
    };

    const updateItem = (id, data) => {
        setErrors((prev) => {
            const next = { ...prev };
            delete next.items;
            return next;
        });
        const updatedItems = items.map(item =>
            item.id === id ? { ...item, ...data } : item
        );

        setItems(updatedItems);
        recalculateTotals(updatedItems);
    };

    // --- QUICK CALC: Apply to last item ---
    const handleApplyCalculation = useCallback((calculatedWeight) => {
        if (items.length === 0) {
            toast.error('Please add at least one item to the invoice first');
            return;
        }
        const lastItemIndex = items.length - 1;
        const lastItem = items[lastItemIndex];
        if (!lastItem.item_id || !lastItem.item_name) {
            toast.error('Please select an item in the last row first');
            return;
        }
        const updatedLastItem = {
            ...lastItem,
            quantity: calculatedWeight.toString(),
            quantity_kg: calculatedWeight.toString(),
            quantity_g: (calculatedWeight * 1000).toString()
        };
        if (lastItem.price_per_unit) {
            const price = parseFloat(lastItem.price_per_unit) || 0;
            updatedLastItem.item_total = calculatedWeight * price;
        }
        const updatedItems = [...items];
        updatedItems[lastItemIndex] = updatedLastItem;
        setItems(updatedItems);
        toast.success(`${calculatedWeight.toFixed(3)} kg applied to "${lastItem.item_name}"`);
    }, [items]);

    // --- SAVE / UPDATE DRAFT ---
    const handleSaveDraft = async () => {
        if (savingDraft || isSubmitting) return;
        if (!validateForm()) {
            toast.error("Please fix the validation errors before saving draft.");
            return;
        }

        const validItems = items.filter(item =>
            item.item_name && item.quantity && item.price_per_unit
        );

        const customerNameToSave = formData.customer_name || (shopDetails?.shop_name || "Shop") + "'s Customer";

        const draftPayload = {
            invoice_number: formData.invoice_number || null,
            customer_name: customerNameToSave,
            customer_phone: formData.customer_phone || "",
            customer_address: formData.customer_address || "",
            customer_gst: formData.customer_gst || "",
            invoice_date: formData.invoice_date,
            tax: parseFloat(formData.tax) || 0,
            discount: parseFloat(formData.discount) || 0,
            discount_type: formData.discount_type || "percentage",
            discount_amount: discountAmount || 0,
            making_charges: parseFloat(formData.making_charges) || 0,
            payment_method: formData.payment_method || "Cash",
            items: validItems.map(item => ({
                item_id: item.item_id || null,
                item_name: item.item_name,
                unit_id: item.unit_id || null,
                unit_name: item.unit_name || '',
                unit_symbol: item.unit_symbol || '',
                quantity: parseFloat(item.quantity) || 0,
                price_per_unit: parseFloat(item.price_per_unit) || 0,
                item_total: parseFloat(item.item_total) || 0
            })),
            subtotal: subtotal || 0,
            tax_amount: taxAmount || 0,
            total: total || 0,
            payment_status: formData.payment_status || "Paid",
            interest_percentage: parseFloat(formData.interest_rate) || 0,
            interest_amount: interestAmount || 0,
            emi_months: parseInt(formData.emi_months) || 0,
            amount_paid: formData.payment_method === 'Advanced' || formData.payment_type === 'Advanced' ? parseFloat(formData.amount_paid) || 0 : 0,
            exchange: formData.exchange === 'true' || formData.exchange === true,
            buyback: formData.buyback === 'true' || formData.buyback === true,
            notes: invoiceData?.notes || "Draft invoice for customer"
        };

        setSavingDraft(true);

        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const url = draftId
                ? `${API_BASE}/api/draft-invoices/update-draft/${draftId}`
                : `${API_BASE}/api/draft-invoices/save-draft`;
            const method = draftId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(draftPayload)
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(draftId ? 'Draft updated successfully!' : 'Draft saved successfully!');
            } else {
                throw new Error(result.error || 'Failed to save draft');
            }
        } catch (error) {
            console.error('Error saving draft:', error);
            toast.error('Error saving draft: ' + error.message);
        } finally {
            setSavingDraft(false);
        }
    };

    // --- RENDER ---
    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold">
                    Edit Draft Invoice
                </h1>
                <BackButton />
            </div>

            {/* Shop Info Section */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Shop Information</h2>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <div className="flex-1 space-y-1 sm:space-y-2 text-sm sm:text-base">
                        <p className="font-medium">{shopDetails.shop_name || "N/A"}</p>
                        <p className="text-gray-600 truncate" title={shopDetails.shop_address}>{shopDetails.shop_address || "Address not available"}</p>
                        <p>Phone: {shopDetails.shop_phone || "N/A"}</p>
                        {shopDetails.shop_email && <p>Email: {shopDetails.shop_email}</p>}
                        <p>GST: {shopDetails.shop_gst || "Not registered"}</p>
                    </div>
                    {logoUrl && (
                        <div className="flex-shrink-0 flex justify-center sm:justify-end">
                            <img src={logoUrl} alt="Shop Logo" className="h-14 sm:h-16 object-contain" onError={(e) => e.target.style.display = 'none'} />
                        </div>
                    )}
                </div>
            </div>

            {/* Invoice Details Section */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Invoice Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Invoice Number</label>
                        <input
                            type="text"
                            name="invoice_number"
                            value={formData.invoice_number}
                            onChange={handleInputChange}
                            className={`w-full px-2 sm:px-3 py-1 sm:py-2 border rounded-md text-sm sm:text-base ${
                                errors.invoice_number ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300"
                            }`}
                        />
                        {errors.invoice_number && (
                            <p className="text-red-500 text-xs mt-1">{errors.invoice_number}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Invoice Date*</label>
                        <input
                            type="date"
                            name="invoice_date"
                            value={formData.invoice_date}
                            onChange={handleInputChange}
                            max={new Date().toISOString().split("T")[0]}
                            required
                            className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md text-sm sm:text-base"
                        />
                    </div>
                </div>
            </div>

            {/* Billing Information Section */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Billing Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-3 sm:space-y-4">
                        <div className="relative">
                            <label className="block text-sm sm:text-sm font-semibold text-gray-800 mb-1">
                                Customer Name*
                            </label>

                            <Combobox value={formData.customer_name} onChange={handleCustomerSelect}>
                                <div className="relative">
                                    <Combobox.Input
                                        className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md text-sm sm:text-base"
                                        onChange={(event) => {
                                            setCustomerQuery(event.target.value);
                                            setFormData(prev => ({ ...prev, customer_name: event.target.value }));
                                        }}
                                        displayValue={() => customerQuery}
                                        placeholder="Enter customer name or leave blank"
                                    />
                                    {customerSuggestions.length > 0 && (
                                        <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                                            {customerSuggestions.map((person, idx) => (
                                                <Combobox.Option
                                                    key={idx}
                                                    value={person}
                                                    className={({ active }) => `relative cursor-default select-none py-2 pl-4 pr-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="block truncate font-medium">{person.customer_name}</span>
                                                    </div>
                                                </Combobox.Option>
                                            ))}
                                        </Combobox.Options>
                                    )}
                                </div>
                            </Combobox>
                            {errors?.customer_name && (
                                <p className="text-[10px] text-red-500 font-bold ml-1 mt-1">
                                    {errors.customer_name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm sm:text-sm font-semibold text-gray-800 mb-1">GST Number</label>
                            <input
                                type="text"
                                name="customer_gst"
                                value={formData.customer_gst}
                                onChange={handleInputChange}
                                placeholder="Enter GST number"
                                className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md text-sm sm:text-base"
                            />
                            {errors?.customer_gst && (
                                <p className="text-[10px] text-red-500 font-bold ml-1 mt-1">
                                    {errors.customer_gst}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                        <div>
                            <label className="block text-sm sm:text-sm font-semibold text-gray-800 mb-1">Phone Number</label>
                            <PhoneInput name="customer_phone" value={formData.customer_phone} onChange={handleInputChange} placeholder="Enter customer phone number" error={errors?.customer_phone} />
                        </div>
                        <div>
                            <label className="block text-sm sm:text-sm font-semibold text-gray-800 mb-1">Billing Address</label>
                            <textarea
                                name="customer_address"
                                value={formData.customer_address}
                                onChange={handleInputChange}
                                placeholder="Enter customer address"
                                rows="1"
                                className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md text-sm sm:text-base text-gray-800 resize-y"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Items Section */}
            <InvoiceItems
                items={items}
                errors={errors}
                addItem={addItem}
                removeItem={removeItem}
                updateItem={updateItem}
                config={config}
                RowComponent={DraftItemRow}
            />

            {/* Quick Calculation for Draft */}
            <DraftQuickCalculation onApplyCalculation={handleApplyCalculation} />

            {/* Totals Section */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Totals</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Subtotal (₹)</label>
                        <input type="number" value={subtotal.toFixed(2)} readOnly className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md bg-gray-100 text-sm sm:text-base" />
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Tax (%)</label>
                        <input type="number" name="tax" value={formData.tax} onChange={handleInputChange} step="0.01" min="0" max="100" className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md text-sm sm:text-base" />
                        {errors.tax && (
                            <p className="text-[10px] text-red-500 font-bold ml-1 mt-1">
                                {errors.tax}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Discount Type</label>
                        <div className="relative">
                            <select
                                name="discount_type"
                                value={formData.discount_type}
                                onChange={handleInputChange}
                                onFocus={() => setDiscountTypeOpen(true)}
                                onBlur={() => setDiscountTypeOpen(false)}
                                className="w-full pl-2 pr-8 py-1 sm:py-2 border border-gray-300 rounded-md text-sm sm:text-base appearance-none cursor-pointer"
                            >
                                <option value="percentage">Percentage (%)</option>
                                <option value="flat">Flat (₹)</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400">
                                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${discountTypeOpen ? "rotate-180" : ""}`} />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">{formData.discount_type === 'percentage' ? 'Discount (%)' : 'Discount (₹)'}</label>
                        <input type="number" name="discount" value={formData.discount} onChange={handleInputChange} step="0.01" min="0" max={formData.discount_type === 'percentage' ? '100' : undefined} placeholder={formData.discount_type === 'percentage' ? 'Enter %' : 'Enter ₹'} className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md text-sm sm:text-base" />
                        {errors.discount && (
                            <p className="text-[10px] text-red-500 font-bold ml-1 mt-1">
                                {errors.discount}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Making Charges (₹)</label>
                        <input type="number" name="making_charges" value={formData.making_charges} onChange={handleInputChange} step="0.01" min="0" placeholder="Enter amount" className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md text-sm sm:text-base" />
                        {errors.making_charges && (
                            <p className="text-[10px] text-red-500 font-bold ml-1 mt-1">
                                {errors.making_charges}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Total (₹)</label>
                        <input type="number" value={total.toFixed(2)} readOnly className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md bg-gray-100 text-sm sm:text-base font-semibold text-green-600" />
                    </div>
                </div>

                {/* Payment Method Section */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                            Payment Method
                        </label>
                        <div className="flex flex-col gap-2">
                            <div className="relative">
                                <select
                                    name="payment_method"
                                    value={formData.payment_method}
                                    onChange={handleInputChange}
                                    onFocus={() => setPaymentMethodOpen(true)}
                                    onBlur={() => setPaymentMethodOpen(false)}
                                    className="w-full pl-2 pr-8 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base appearance-none cursor-pointer"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Card">Credit/Debit Card</option>
                                    <option value="Net Banking">Net Banking</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Cheque">Cheque</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400">
                                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${paymentMethodOpen ? "rotate-180" : ""}`} />
                                </div>
                            </div>

                            {/* Advanced and EMI Radio Buttons */}
                            <div className="mt-2 space-y-2">
                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                                    Payment Options
                                </label>
                                <div className="flex items-center space-x-4">
                                    <label className="inline-flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="payment_option"
                                            value="Full"
                                            checked={formData.payment_type === "Full"}
                                            onChange={() => handleInputChange({ target: { name: 'payment_option', value: 'Full' } })}
                                            className="form-radio text-green-600 h-4 w-4"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">
                                            Full Payment
                                        </span>
                                    </label>
                                    <label className="inline-flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="payment_option"
                                            value="Advanced"
                                            checked={formData.payment_type === "Advanced"}
                                            onChange={() => handleInputChange({ target: { name: 'payment_option', value: 'Advanced' } })}
                                            className="form-radio text-blue-600 h-4 w-4"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">
                                            Advanced
                                        </span>
                                    </label>
                                    <label className="inline-flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="payment_option"
                                            value="EMI"
                                            checked={formData.payment_type === "EMI"}
                                            onChange={() => handleInputChange({ target: { name: 'payment_option', value: 'EMI' } })}
                                            className="form-radio text-purple-600 h-4 w-4"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">EMI</span>
                                    </label>
                                </div>
                            </div>

                            {/* Advanced Amount Input */}
                            {formData.payment_type === "Advanced" && (
                                <div className="bg-blue-50 p-3 rounded border border-blue-200 animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-xs font-bold text-blue-800 mb-1">
                                        Advanced Amount Received (₹)
                                    </label>
                                    <input
                                        type="number"
                                        name="amount_paid"
                                        value={formData.amount_paid}
                                        onChange={handleInputChange}
                                        placeholder="Enter amount paid"
                                        className="w-full px-2 py-1 border border-blue-400 rounded focus:ring-blue-500"
                                    />
                                    {errors.amount_paid && (
                                        <p className="text-[10px] text-red-500 font-bold ml-1 mt-1">
                                            {errors.amount_paid}
                                        </p>
                                    )}
                                    <p className="text-xs text-blue-600 mt-1">
                                        Balance Due: ₹
                                        {(
                                            total - (parseFloat(formData.amount_paid) || 0)
                                        ).toFixed(2)}
                                    </p>
                                </div>
                            )}

                            {/* EMI Options */}
                            {formData.payment_type === "EMI" && formData.show_emi_details && (
                                <div className="bg-purple-50 p-3 rounded border border-purple-200 space-y-3 animate-in fade-in slide-in-from-top-2 relative">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(p => ({ ...p, show_emi_details: false }))}
                                        className="absolute top-2 right-2 text-purple-400 hover:text-purple-600 p-1"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <div>
                                        <label className="block text-xs font-bold text-purple-800 mb-1">
                                            Rate of Interest (%)
                                        </label>
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="number"
                                                name="interest_rate"
                                                value={formData.interest_rate}
                                                onChange={handleInputChange}
                                                step="0.01"
                                                className="w-24 px-2 py-1 border border-purple-400 rounded focus:ring-purple-500"
                                            />
                                            <span className="text-sm font-bold text-purple-700">%</span>
                                            <span className="text-xs text-purple-600 ml-auto">
                                                Interest: ₹{interestAmount.toFixed(2)}
                                            </span>
                                        </div>
                                        {errors.interest_rate && (
                                            <p className="text-[10px] text-red-500 font-bold ml-1 mt-1">
                                                {errors.interest_rate}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-purple-800 mb-1">Duration (Months)</label>
                                        <div className="flex gap-2">
                                            {[3, 6, 9, 12].map((month) => (
                                                <label
                                                    key={month}
                                                    className={`cursor-pointer px-3 py-1 rounded text-xs border transition-all ${parseInt(formData.emi_months) === month
                                                        ? "bg-purple-600 text-white border-purple-600"
                                                        : "bg-white text-purple-700 border-purple-300 hover:bg-purple-100"
                                                        }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="emi_months"
                                                        value={month}
                                                        checked={parseInt(formData.emi_months) === month}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, emi_months: parseInt(e.target.value) }))}
                                                        className="hidden"
                                                    />
                                                    {month} M
                                                </label>
                                            ))}
                                        </div>
                                        {errors.emi_months && (
                                            <p className="text-[10px] text-red-500 font-bold ml-1 mt-1">
                                                {errors.emi_months}
                                            </p>
                                        )}
                                    </div>
                                    {formData.emi_months > 0 && total > 0 && (
                                        <div className="pt-2 border-t border-purple-200">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-semibold text-purple-900">Monthly Installment:</span>
                                                <span className="text-sm font-bold text-purple-700">₹{(total / formData.emi_months).toFixed(2)} / month</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Hidden EMI Details Banner */}
                            {formData.payment_type === "EMI" && !formData.show_emi_details && (
                                <div className="bg-yellow-50 p-2 rounded border border-yellow-200 flex justify-between items-center">
                                    <span className="text-xs text-yellow-800 font-medium italic">EMI Details are hidden</span>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(p => ({ ...p, show_emi_details: true }))}
                                        className="text-xs text-blue-600 hover:underline"
                                    >
                                        Show Details
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment Status section to keep structure consistent */}
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                            Payment Status
                        </label>
                        <div className="flex items-center space-x-4 mt-2">
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="payment_status"
                                    value="Paid"
                                    checked={formData.payment_status === "Paid"}
                                    onChange={handleInputChange}
                                    className="form-radio text-green-600 h-4 w-4"
                                />
                                <span className="ml-2 text-sm text-gray-700">Paid</span>
                            </label>
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="payment_status"
                                    value="Unpaid"
                                    checked={formData.payment_status === "Unpaid"}
                                    onChange={handleInputChange}
                                    className="form-radio text-red-600 h-4 w-4"
                                />
                                <span className="ml-2 text-sm text-gray-700">Unpaid / Partial</span>
                            </label>
                        </div>
                    </div>
                </div>


                <div className="mt-2 text-right space-y-1">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Applied Discount: <span className="text-red-600">₹{discountAmount.toFixed(2)}</span></label>
                    {/* Display Interest in Totals */}
                    {formData.payment_type === "EMI" && (
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                            Added Interest ({formData.interest_rate}%):{" "}
                            <span className="text-blue-600">
                                + ₹{interestAmount.toFixed(2)}
                            </span>
                        </label>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50">
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={savingDraft || isSubmitting}
                        className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium flex items-center gap-2 ${savingDraft || isSubmitting
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500'
                            }`}
                    >
                        {savingDraft ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Update Draft
                            </>
                        )}
                    </button>
                    <BackButton />
                </div>
            </div>
        </div>
    );
}
