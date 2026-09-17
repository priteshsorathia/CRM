"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function InvoiceAccordion({
    id,
    title,
    children,
    defaultOpen = true,
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const storedState = localStorage.getItem(`invoice_accordion_${id}`);
        if (storedState !== null) {
            setIsOpen(storedState === "true");
        }
    }, [id]);

    const toggleAccordion = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        localStorage.setItem(`invoice_accordion_${id}`, newState);
    };

    if (!isMounted) {
        return (
            <div className="bg-white rounded-lg shadow mb-4">
                <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100">
                    <h2 className="text-base sm:text-lg font-bold">{title}</h2>
                </div>
                {defaultOpen && <div className="p-4 sm:p-6">{children}</div>}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow mb-4 transition-all duration-200 ease-in-out">
            <button
                type="button"
                onClick={toggleAccordion}
                className="w-full flex justify-between items-center p-4 sm:p-6 bg-white hover:bg-gray-50 transition-colors rounded-t-lg focus:outline-none"
            >
                <h2 className="text-base sm:text-lg font-bold text-gray-800">
                    {title}
                </h2>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
            </button>

            {isOpen && (
                <div className="p-4 sm:p-6 border-t border-gray-100 animate-in fade-in slide-in-from-top-1 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
}
