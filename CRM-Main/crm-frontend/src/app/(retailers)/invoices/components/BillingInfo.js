"use client";

import { Combobox } from "@headlessui/react";
import PhoneInput from "@/components/PhoneInput";
import { History, X, FileText } from "lucide-react";
import InvoiceAccordion from "./InvoiceAccordion";
import Loader from "@/components/Loader";

export default function BillingInfo({
    formData,
    errors = {},
    handleInputChange,
    handleCustomerSelect,
    customerQuery,
    setCustomerQuery,
    customerSuggestions,
    previousInvoices,
    showPreviousInvoices,
    setShowPreviousInvoices,
    loadPreviousInvoice,
    loadingPreviousInvoices,
    isEdit,
    getDisplayCustomerName,
}) {
    return (
        <InvoiceAccordion
            id="billing-info"
            title="Billing Information"
            defaultOpen={true}
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-3 sm:space-y-4">
                    <div className="relative">
                        <label className="block text-sm sm:text-sm font-semibold text-gray-800 mb-1">
                            Customer Name<span className="text-red-500">*</span>{" "}
                            <span className="text-xs text-gray-500 ml-1">
                                {!formData.customer_name &&
                                    `(Will show as "${getDisplayCustomerName()}")`}
                            </span>
                        </label>

                        <Combobox
                            value={formData.customer_name}
                            onChange={handleCustomerSelect}
                        >
                            <div className="relative">
                                <Combobox.Input
                                    className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
                                    onChange={(event) => {
                                        setCustomerQuery(event.target.value);
                                        // Also update form data directly so typing works
                                        handleInputChange({
                                            target: { name: "customer_name", value: event.target.value },
                                        });
                                    }}
                                    displayValue={() => customerQuery}
                                    placeholder={`Enter customer name or leave blank`}
                                />
                                {customerSuggestions.length > 0 && (
                                    <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                                        {customerSuggestions.map((person, idx) => (
                                            <Combobox.Option
                                                key={idx}
                                                value={person}
                                                className={({ active }) =>
                                                    `relative cursor-default select-none py-2 pl-4 pr-4 ${active
                                                        ? "bg-blue-100 text-blue-900"
                                                        : "text-gray-900"
                                                    }`
                                                }
                                            >
                                                <div className="flex flex-col">
                                                    <span className="block truncate font-medium">
                                                        {person.customer_name}
                                                    </span>
                                                    {(person.customer_phone || person.customer_gst) && (
                                                        <span className="block truncate text-xs text-gray-500">
                                                            {person.customer_phone
                                                                ? `📞 ${person.customer_phone}`
                                                                : ""}
                                                            {person.customer_phone && person.customer_gst
                                                                ? " • "
                                                                : ""}
                                                            {person.customer_gst
                                                                ? `GST: ${person.customer_gst}`
                                                                : ""}
                                                        </span>
                                                    )}
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
                        <label className="block text-sm sm:text-sm font-semibold text-gray-800 mb-1">
                            GST Number
                        </label>
                        <input
                            type="text"
                            name="customer_gst"
                            value={formData.customer_gst}
                            onChange={handleInputChange}
                            placeholder="Enter GST number"
                            className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
                        />
                        {errors?.customer_gst && (
                            <p className="text-[10px] text-red-500 font-bold ml-1 mt-1">
                                {errors.customer_gst}
                            </p>
                        )}
                    </div>

                    {/* Previous Invoices Section */}
                    {!isEdit && formData.customer_name && previousInvoices.length > 0 && (
                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={() => setShowPreviousInvoices(!showPreviousInvoices)}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                            >
                                <History size={16} />
                                {showPreviousInvoices ? "Hide" : "Show"} Previous Invoices (
                                {previousInvoices.length})
                            </button>

                            {showPreviousInvoices && (
                                <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-semibold text-gray-700">
                                            Previous Invoices
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => setShowPreviousInvoices(false)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    {loadingPreviousInvoices ? (
                                        <Loader variant="container" message="Loading invoices..." className="py-2" />
                                    ) : (
                                        <div className="space-y-2">
                                            {previousInvoices.map((invoice) => (
                                                <div
                                                    key={invoice.id}
                                                    className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:border-blue-300 transition-colors"
                                                >
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <FileText size={14} className="text-gray-400" />
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {invoice.invoice_number}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {new Date(
                                                                invoice.invoice_date
                                                            ).toLocaleDateString()}{" "}
                                                            • ₹{parseFloat(invoice.total || 0).toFixed(2)}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => loadPreviousInvoice(invoice.id)}
                                                        className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                                                    >
                                                        Continue
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="space-y-3 sm:space-y-4">
                    <div>
                        <label className="block text-sm sm:text-sm font-semibold text-gray-800 mb-1">
                            Phone Number <span className="text-xs font-normal text-gray-400">(optional)</span>
                        </label>
                        <PhoneInput
                            name="customer_phone"
                            value={formData.customer_phone}
                            onChange={handleInputChange}
                            placeholder="Enter customer phone number"
                            error={errors?.customer_phone}
                        />
                    </div>
                    <div>
                        <label className="block text-sm sm:text-sm font-semibold text-gray-800 mb-1">
                            Billing Address
                        </label>
                        <textarea
                            name="customer_address"
                            value={formData.customer_address}
                            onChange={handleInputChange}
                            placeholder="Enter customer address"
                            rows="1"
                            className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base text-gray-800 resize-y"
                        />
                    </div>
                </div>
            </div>
        </InvoiceAccordion>
    );
}
