'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import AuthLoader from "@/components/AuthLoader";

const SITE_NAME = process.env.NEXT_PUBLIC_APP_NAME;
const VERSION = process.env.NEXT_PUBLIC_APP_VERSION;

const formSchema = z.object({
    fullname: z.string()
        .transform(val => val.trim())
        .pipe(
            z.string()
             .min(2, "Full name must be at least 2 characters")
             .max(50, "Full name must be less than 50 characters")
             .regex(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces")
        ),
    email: z.string()
        .transform(val => val.trim())
        .pipe(
            z.string()
             .min(1, "Email is required")
             .email("Please enter a valid email address (e.g. user@example.com)")
             .max(100, "Email must be less than 100 characters")
        ),
    phone: z.string()
        .transform(val => val.trim())
        .pipe(
            z.string()
             .min(1, "Phone number is required")
             .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number (starts with 6-9)")
             .refine(val => {
                 const uniqueDigits = new Set(val);
                 return uniqueDigits.size > 1;
             }, "Repetitive digits like 9999999999 are not allowed")
        ),
    business_type: z.string().min(1, "Please select a business type"),
    other_business_type: z.string()
        .transform(val => val.trim())
        .pipe(
            z.string()
             .max(50, "Business type must be less than 50 characters")
             .regex(/^[a-zA-Z0-9\s,.-]*$/, "Special characters are not allowed")
        )
        .optional(),
    business_name: z.string()
        .transform(val => val.trim())
        .refine(val => val === "" || (val.length >= 2 && val.length <= 100 && /^[a-zA-Z0-9\s&,.-]+$/.test(val)), {
            message: "Business name must be between 2 and 100 characters and contain no invalid special characters"
        })
        .optional(),
    business_location: z.string()
        .transform(val => val.trim())
        .refine(val => val === "" || (val.length >= 2 && val.length <= 100 && /^[a-zA-Z0-9\s,.-]+$/.test(val)), {
            message: "Business city/location must be between 2 and 100 characters and contain no invalid special characters"
        })
        .optional(),
    message: z.string()
        .transform(val => val.trim())
        .pipe(
            z.string()
             .min(10, "Please describe your business needs (minimum 10 characters)")
             .max(500, "Message must be less than 500 characters")
             .regex(/^[^<>]*$/, "HTML/Script tags are not allowed")
        ),
});

export default function GetStartedClient() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showOther, setShowOther] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(formSchema),
        mode: "onChange"
    });

    const selectedBusinessType = watch("business_type");

    useEffect(() => {
        setShowOther(selectedBusinessType === "other");
    }, [selectedBusinessType]);

    const onSubmit = async (data) => {
        if (data.business_type === "other" && !data.other_business_type?.trim()) {
            toast.error("Please specify your business type.");
            return;
        }

        setIsSubmitting(true);

        const source = 'Website';

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/get-started/get-started/submit`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        fullname: data.fullname,
                        email: data.email,
                        phone: data.phone,
                        business_type: data.business_type,
                        other_business_type: data.other_business_type || "",
                        business_name: data.business_name || "",
                        business_location: data.business_location || "",
                        message: data.message,
                        source,
                    }),
                }
            );

            const res = await response.json();

            if (res.status === "success") {
                toast.success(res.message || "Thank you! We will contact you shortly.");
                reset();
                setShowOther(false);
            } else {
                toast.error(res.message || "Submission failed. Please try again.");
            }
        } catch (error) {
            console.error("API Error:", error);
            toast.error("Server error. Please try again later.");
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <>
            {isSubmitting && <AuthLoader />}
            <div className="min-h-screen flex bg-white">
                {/* Left Form Section */}
                <div className="w-full max-w-lg mx-auto lg:w-[480px] flex flex-col justify-center px-8 py-12 lg:px-12 lg:shadow-[-8px_0_32px_rgba(0,0,0,0.04)]">
                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-8">
                            <img src="/shop-logo.png" alt={`${SITE_NAME} Logo`} className="h-10" />
                            <sub className="text-gray-500 text-sm"> v{VERSION}</sub>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Start Your New Shop</h1>
                        <p className="text-gray-500">Fill out the form below and our team will get back to you within 24 hours</p>
                        <p className="text-gray-500 mt-2">
                            Already have an Account? <a href="/login" className="text-indigo-600 font-medium hover:underline">Login to your dashboard</a>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name <span className="text-red-600">*</span>
                            </label>
                            <input
                                {...register("fullname")}
                                type="text"
                                placeholder="Enter your full name"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            />
                            {errors.fullname && <p className="text-red-600 text-sm mt-1">{errors.fullname.message}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address <span className="text-red-600">*</span>
                            </label>
                            <input
                                {...register("email")}
                                type="email"
                                placeholder="Enter your email address"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            />
                            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number <span className="text-red-600">*</span>
                            </label>
                            <input
                                {...register("phone")}
                                type="tel"
                                placeholder="Enter your phone number"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            />
                            {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>}
                        </div>

                        {/* Business Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Business Type <span className="text-red-600">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    {...register("business_type")}
                                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 appearance-none bg-none bg-no-repeat peer cursor-pointer"
                                >
                                    <option value="" disabled hidden>
                                        What type of business do you run?
                                    </option>

                                <optgroup label="Retail & Shops">
                                    <option value="kirana">Kirana/General Store</option>
                                    <option value="supermarket">Supermarket</option>
                                    <option value="electronics">Electronics & Mobile Shop</option>
                                    <option value="clothing">Clothing & Fashion Store</option>
                                    <option value="medical">Medical Store/Chemist</option>
                                    <option value="paan">Paan/Beverage Shop</option>
                                    <option value="stationery">Stationery/Book Shop</option>
                                    <option value="jewelry">Jewelry & Accessories</option>
                                </optgroup>

                                <optgroup label="Food & Beverage">
                                    <option value="restaurant">Restaurant/Dhaba</option>
                                    <option value="sweet">Sweet Shop/Mithai</option>
                                    <option value="bakery">Bakery/Confectionery</option>
                                    <option value="juice">Juice Center</option>
                                    <option value="tea">Tea Stall/Coffee Shop</option>
                                    <option value="icecream">Ice Cream Parlor</option>
                                    <option value="streetfood">Street Food Vendor</option>
                                </optgroup>

                                <optgroup label="Services">
                                    <option value="salon">Salon/Beauty Parlor</option>
                                    <option value="barber">Barber Shop</option>
                                    <option value="tailor">Tailor/Cloth Merchant</option>
                                    <option value="repair">Mobile/Electronics Repair</option>
                                    <option value="laundry">Laundry/Dry Cleaner</option>
                                    <option value="cyber">Cyber Cafe</option>
                                    <option value="photocopy">Photocopy/Printing</option>
                                </optgroup>

                                <optgroup label="Manufacturing">
                                    <option value="handicraft">Handicrafts/Small Scale</option>
                                    <option value="textile">Textile/Garment Unit</option>
                                    <option value="food">Food Processing Unit</option>
                                    <option value="packaging">Packaging Unit</option>
                                </optgroup>

                                <optgroup label="Other Businesses">
                                    <option value="travel">Travel Agency</option>
                                    <option value="tuition">Coaching/Tuition Center</option>
                                    <option value="agri">Agriculture/Farming</option>
                                    <option value="freelancer">Freelancer/Professional</option>
                                    <option value="home">Home-Based Business</option>
                                    <option value="other">Other (Please Specify)</option>
                                </optgroup>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-500 transition-transform duration-300 peer-focus:rotate-180">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </div>
                        </div>
                        {errors.business_type && <p className="text-red-600 text-sm mt-1">{errors.business_type.message}</p>}
                    </div>

                        {/* Other Business Type */}
                        {showOther && (
                            <div>
                                <input
                                    {...register("other_business_type")}
                                    type="text"
                                    placeholder="Please specify your business type"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        )}

                        {/* Business Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                            <input
                                {...register("business_name")}
                                type="text"
                                placeholder="Enter your business name"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Business City (Location)</label>
                            <input
                                {...register("business_location")}
                                type="text"
                                placeholder="Enter your Business Location City/State"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tell us about your business needs <span className="text-red-600">*</span>
                            </label>
                            <textarea
                                {...register("message")}
                                rows={5}
                                placeholder="Describe your business and what you're looking for in a POS system"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 resize-vertical"
                            />
                            {errors.message && <p className="text-red-600 text-sm mt-1">{errors.message.message}</p>}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white font-medium py-4 rounded-lg flex items-center justify-center gap-2 transition"
                        >
                            {isSubmitting ? (
                                "Submitting..."
                            ) : (
                                <>
                                    <i className="fas fa-paper-plane"></i> Submit Application
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-gray-500">
                        © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.<br />
                        <a href="/auth/privacy" className="text-indigo-600 hover:underline">Privacy Policy</a> |
                        <a href="/auth/terms" className="text-indigo-600 hover:underline mx-1">Terms of Service</a> |
                        <a href="/auth/support" className="text-indigo-600 hover:underline">Support</a>
                    </div>
                </div>

                {/* Right Side (Desktop) */}
                <div className="hidden lg:flex flex-1 bg-indigo-50 items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent"></div>
                    <div className="max-w-lg z-10 px-10">
                        <img src="/assets/get-started.jpg" alt="Shop POS System" className="w-full max-w-md mx-auto mb-8 rounded-lg" />

                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Transform Your Business With {SITE_NAME}</h2>
                        <p className="text-gray-600 mb-10">Join India's fastest-growing businesses using our smart POS solution designed for modern retailers and shop owners.</p>

                        <div className="grid grid-cols-2 gap-6">
                            {[
                                { icon: "fa-calculator", title: "Smart Billing", desc: "Automatic KG calculations & instant GST invoices" },
                                { icon: "fa-rupee-sign", title: "Revenue Insights", desc: "Real-time dashboards showing daily profits" },
                                { icon: "fa-file-invoice", title: "Tax Compliance", desc: "Automatic tax/non-tax invoice segregation" },
                                { icon: "fa-users", title: "Staff Management", desc: "Track employee performance & incentives" },
                                { icon: "fa-store", title: "Shop Portfolio", desc: "Marketing-ready business profile (Coming Soon)" },
                                { icon: "fa-shield-alt", title: "Secure Access", desc: "Role-based permissions for staff" },
                            ].map((feature, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                                        <i className={`fas ${feature.icon}`}></i>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                                        <p className="text-sm text-gray-600">{feature.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 bg-white p-4 rounded-lg border border-gray-200 flex items-center gap-3">
                            <i className="fas fa-check-circle text-green-500 text-xl"></i>
                            <p className="text-gray-700"><strong className="text-gray-900">15000 +</strong> Indian businesses trust our platform</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fonts & Icons */}
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            <style jsx global>{`
        body { font-family: 'Inter', sans-serif; }
      `}</style>
        </>
    );
}
