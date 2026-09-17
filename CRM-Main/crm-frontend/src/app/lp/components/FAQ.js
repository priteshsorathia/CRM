'use client';
import { useState } from 'react';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState(0);

    const faqs = [
        {
            category: "Getting Started",
            questions: [
                {
                    q: "How long does it take to set up CRM?",
                    a: "You can be up and running in less than 15 minutes! Our onboarding process is simple: create an account, add your business details, and import your inventory. Our support team is available 24/7 to help you get started."
                },
                {
                    q: "Do I need any technical knowledge to use CRM?",
                    a: "Not at all! CRM is designed to be user-friendly and intuitive. If you can use a smartphone, you can use CRM. We also provide comprehensive video tutorials and live training sessions for all new users."
                },
                {
                    q: "Can I import my existing data?",
                    a: "Yes! You can easily import your existing inventory, customer data, and vendor information from Excel, CSV files, or other POS systems. Our data migration team can help you transfer large databases."
                }
            ]
        },
        {
            category: "Pricing & Plans",
            questions: [
                {
                    q: "What's included in the free trial?",
                    a: "The 14-day free trial includes full access to all features - POS, inventory management, HRMS, analytics, and GST filing. No credit card required. You can upgrade, downgrade, or cancel anytime."
                },
                {
                    q: "What happens after my trial ends?",
                    a: "After your trial, you can choose a plan that fits your business size. If you don't select a plan, your account will be downgraded to our free plan with limited features. Your data is always safe and accessible."
                },
                {
                    q: "Are there any hidden fees?",
                    a: "Absolutely not! Our pricing is transparent. What you see is what you pay. No setup fees, no hidden charges, no long-term contracts. You only pay for what you use."
                }
            ]
        },
        {
            category: "Features",
            questions: [
                {
                    q: "Is CRM GST compliant?",
                    a: "Yes! CRM is 100% GST compliant. We automatically calculate GST, generate compliant invoices, and help you file GST returns. Our system is updated with every regulatory change to keep you compliant."
                },
                {
                    q: "Can I use CRM on mobile devices?",
                    a: "Absolutely! CRM works seamlessly on smartphones, tablets, and desktops. Our mobile apps (iOS & Android) let you manage your business from anywhere, anytime."
                },
                {
                    q: "Does CRM work offline?",
                    a: "Yes! Our POS system works offline and automatically syncs when you're back online. You'll never miss a sale even if your internet connection drops."
                }
            ]
        },
        {
            category: "Security & Support",
            questions: [
                {
                    q: "How secure is my data?",
                    a: "Your data security is our top priority. We use bank-grade 256-bit SSL encryption, automated daily backups, and secure cloud storage. Your data is protected against unauthorized access, loss, or damage."
                },
                {
                    q: "What kind of support do you offer?",
                    a: "We provide 24/7 customer support via phone, email, and live chat. Plus, you get access to our knowledge base, video tutorials, and community forum. Premium plans include dedicated account managers."
                },
                {
                    q: "Can I cancel anytime?",
                    a: "Yes, you can cancel your subscription anytime with no penalties or cancellation fees. If you cancel, you'll have access to your data for 90 days to export or download."
                }
            ]
        }
    ];

    const allQuestions = faqs.flatMap((category) =>
        category.questions.map((q) => ({ ...q, category: category.category }))
    );

    const toggleQuestion = (index) => {
        setOpenIndex(openIndex === index ? -1 : index);
    };

    return (
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 text-sm font-semibold mb-6">
                        <HelpCircle className="w-4 h-4" />
                        Frequently Asked Questions
                    </div>

                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                        Got questions?
                        <span className="block gradient-text">We've got answers</span>
                    </h2>
                    <p className="text-xl text-gray-600">
                        Everything you need to know about CRM
                    </p>
                </div>

                {/* FAQ Accordion */}
                <div className="max-w-4xl mx-auto">
                    <div className="space-y-4">
                        {allQuestions.map((item, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-xl border-2 border-gray-200 hover:border-[#5655eb]/30 transition-all duration-300 overflow-hidden"
                            >
                                <button
                                    onClick={() => toggleQuestion(index)}
                                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex-1">
                                        <span className="text-xs font-semibold text-[#5655eb] mb-1 block">
                                            {item.category}
                                        </span>
                                        <span className="text-lg font-semibold text-gray-900 pr-4">
                                            {item.q}
                                        </span>
                                    </div>
                                    <ChevronDown
                                        className={`w-6 h-6 text-gray-600 flex-shrink-0 transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-purple-600' : ''
                                            }`}
                                    />
                                </button>

                                <div
                                    className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96' : 'max-h-0'
                                        }`}
                                >
                                    <div className="px-6 pb-6 pt-2">
                                        <p className="text-gray-600 leading-relaxed">{item.a}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
}
