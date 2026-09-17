"use client";

import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const TermsAndConditions = () => {
  const router = useRouter();
  
  // --- CONSTANTS ---
  const COMPANY_NAME = "CRM";
  const SERVICE_NAME = "CRM Service";
  const SUPPORT_EMAIL = "support@crm.com";
  const SUPPORT_URL = "/auth/support";
  const COMPANY_ADDRESS = "Aamrakunj Business Centre, 209, nr. PANCHSHLOK RESIDENCY, Zundal, Ahmedabad, Gujarat 382424";

  // --- DYNAMIC DATE LOGIC ---
  // Option 1: Fixed date based on your text (Corrected spelling of August)
  const [lastUpdatedDate, setLastUpdatedDate] = useState("1st August, 2025");

  // Option 2: Truly dynamic (Uncomment below to always show today's date)
  /*
  useEffect(() => {
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    setLastUpdatedDate(today.toLocaleDateString('en-US', options));
  }, []);
  */

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Terms and Conditions | {COMPANY_NAME}</title>
        <meta name="description" content={`Terms and Conditions for ${COMPANY_NAME}`} />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
              <div className="bg-white rounded-lg px-4 py-3 shadow-lg inline-block">
                <Image
                  src="/shop-logo.png"
                  alt="CRM Logo"
                  width={160}
                  height={48}
                  className="h-12 w-auto object-contain"
                  priority
                />
              </div>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Terms and Conditions</h1>
          <p className="mt-2 text-gray-600">Last Updated: {lastUpdatedDate}</p>
        </header>

        <main className="prose prose-indigo max-w-none text-gray-700">
          
          {/* 1. Acceptance */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the {COMPANY_NAME} ("Service"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to all of these Terms, do not use our Service.
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4">
              <p className="font-medium text-yellow-800">
                <strong>Important:</strong> These Terms contain important provisions, including an arbitration agreement that limits your rights to bring claims against us. Please read carefully.
              </p>
            </div>
          </section>

          {/* 2. Account Registration */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Account Registration</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.1 Eligibility</h3>
            <p>To use our Service, you must:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Be at least 18 years old</li>
              <li>Be a legitimate business owner with valid proof of business</li>
              <li>Provide accurate and complete registration information</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.2 Business Verification</h3>
            <p>You must provide documentation proving your business ownership, which may include:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>GST registration certificate</li>
              <li>Shop establishment license</li>
              <li>Business bank account details</li>
              <li>Other government-issued business documents</li>
            </ul>
            <p className="mt-3 font-semibold text-red-600">
              Strict Policy: We reserve the right to reject any application that fails our verification process or appears fraudulent.
            </p>
          </section>

          {/* 3. Prohibited Activities */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Prohibited Activities</h2>
            <p>You agree not to use the Service for any unlawful purpose or in any way that violates these Terms. Specifically, you must not:</p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-5 my-4">
              <h4 className="text-red-700 font-bold mb-2 uppercase flex items-center gap-2">
                <i className="fas fa-ban"></i> STRICTLY PROHIBITED
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-red-800">
                <li>Sell, distribute, or manage any illegal substances, products, or services</li>
                <li>Engage in any fraudulent, deceptive, or illegal business practices</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Sell counterfeit or stolen goods</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3.1 Consequences of Violation</h3>
            <p>If we determine, in our sole discretion, that you have violated these Terms:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your account will be <strong>immediately and permanently terminated</strong></li>
              <li>We may report you to the appropriate law enforcement authorities</li>
              <li>We reserve the right to take legal action against you</li>
              <li>Any outstanding balances will become immediately due</li>
            </ul>
          </section>

          {/* 4. Monitoring */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Account Monitoring</h2>
            <p>To ensure compliance with these Terms and applicable laws:</p>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Monitoring Policy</h3>
            <p>We reserve the right to monitor any and all activities on our platform, including but not limited to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Transaction records and sales data</li>
              <li>Inventory management activities</li>
              <li>User access patterns</li>
              <li>Any other activities related to your use of the Service</li>
            </ul>
            <p className="mt-2 text-sm italic">This monitoring may occur at any time, without prior notice, at our sole discretion.</p>
          </section>

          {/* 5. Security */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Account Security</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">5.1 Email Address Policy</h3>
            <div className="bg-indigo-50 border-l-4 border-indigo-600 p-4 my-4">
              <p className="font-medium text-indigo-900">
                <strong>Important:</strong> The email address used during registration serves as your permanent account identifier. You <span className="underline font-bold">cannot change</span> your registered email address after account creation.
              </p>
            </div>
            <p>You are solely responsible for:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Maintaining the security of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Ensuring your registered email account remains accessible</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">5.2 Password Requirements</h3>
            <p>You must:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use a strong, unique password</li>
              <li>Not share your password with anyone</li>
              <li>Immediately notify us of any unauthorized access</li>
            </ul>
          </section>

          {/* 6. Service Usage */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Service Usage</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6.1 Permitted Use</h3>
            <p>You may use the Service only for:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Legitimate business transactions</li>
              <li>Managing your authorized retail operations</li>
              <li>Generating valid tax invoices for legal sales</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6.2 Restrictions</h3>
            <p>You may not:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Resell, lease, or share access to the Service</li>
              <li>Use the Service to process transactions for third parties</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
            </ul>
          </section>

          {/* 7. Termination */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Termination</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">7.1 By You</h3>
            <p>You may terminate your account by submitting a written request to <a href={`mailto:${SUPPORT_EMAIL}`} className="text-indigo-600 underline">{SUPPORT_EMAIL}</a>. Termination will be effective after processing all outstanding transactions.</p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">7.2 By Us</h3>
            <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason including:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Violation of these Terms</li>
              <li>Suspected illegal activity</li>
              <li>Failure to pay fees</li>
              <li>Security concerns</li>
            </ul>
            <p className="mt-3 font-semibold">
              No Refunds: Upon termination for any reason, you will not be entitled to any refund of unused fees or credits.
            </p>
          </section>

          {/* 8. Modifications */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Modifications to Terms</h2>
            <p>We reserve the right to modify these Terms at any time. We will notify you of changes by:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Posting the revised Terms on our website</li>
              <li>Sending an email to your registered address</li>
            </ul>
            <p className="mt-2">Your continued use after changes constitutes acceptance of the modified Terms.</p>
          </section>

          {/* 9. Liability */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, {COMPANY_NAME} shall not be liable for:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Any indirect, incidental, or consequential damages</li>
              <li>Loss of profits, data, or business opportunities</li>
              <li>Any unauthorized access to or use of your account</li>
            </ul>
          </section>

          {/* 10. Governing Law */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in <strong>Gurugram, Haryana</strong>.</p>
          </section>

          {/* 11. Contact */}
          <section className="mb-10 bg-gray-100 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Information</h2>
            <p className="mb-4">For questions about these Terms, please contact us:</p>
            <ul className="list-none space-y-3">
              <li className="flex items-start gap-3">
                <i className="fas fa-envelope mt-1 text-indigo-600"></i>
                <div>
                  <span className="font-semibold block">Email:</span>
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-indigo-600 hover:text-indigo-800 underline">{SUPPORT_EMAIL}</a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <i className="fas fa-headset mt-1 text-indigo-600"></i>
                <div>
                  <span className="font-semibold block">Support:</span>
                  <Link href={SUPPORT_URL} className="text-indigo-600 hover:text-indigo-800 underline">Support Portal</Link>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <i className="fas fa-map-marker-alt mt-1 text-indigo-600"></i>
                <div>
                  <span className="font-semibold block">Postal Address:</span>
                  <span className="text-gray-700">{COMPANY_ADDRESS}</span>
                </div>
              </li>
            </ul>
          </section>

        </main>

        <div className="text-center text-gray-600 italic mt-12 border-t pt-8">
          <p>These Terms and Conditions were last updated on {lastUpdatedDate}</p>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;