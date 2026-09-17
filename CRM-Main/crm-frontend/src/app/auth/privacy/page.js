"use client";

import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const PrivacyPolicy = () => {
  const router = useRouter();
  
  // --- CONSTANTS ---
  const COMPANY_NAME = "CRM";
  const PRODUCT_NAME = "CRM platform";
  const COMPANY_EMAIL = "support@crm.com";
  const GDPR_CONTACT_EMAIL = "support@crm.com";
  const CONTACT_PAGE_URL = "/auth/support";
  const COMPANY_ADDRESS = "Aamrakunj Business Centre, 209, nr. PANCHSHLOK RESIDENCY, Zundal, Ahmedabad, Gujarat 382424";

  // --- DYNAMIC DATE LOGIC ---
  // Option 1: Fixed date based on your text (Recommended for legal documents)
  const [lastUpdatedDate, setLastUpdatedDate] = useState("1st August, 2025");

  // Option 2: Truly dynamic (Always shows today's date). 
  // Uncomment the useEffect below if you want the date to always show the current day.
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
        <title>Privacy Policy | {COMPANY_NAME}</title>
        <meta name="description" content={`Privacy Policy for ${COMPANY_NAME}`} />
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
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Privacy Policy</h1>
          <p className="mt-2 text-gray-600">Last Updated: {lastUpdatedDate}</p>
        </header>

        <main className="prose prose-indigo max-w-none text-gray-700">
          
          {/* 1. Introduction */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p>
              {COMPANY_NAME} ("we," "our," or "us") operates the {PRODUCT_NAME}. We are committed to protecting your privacy and handling your personal information with transparency and care. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services.
            </p>

            <div className="bg-gray-50 border-l-4 border-indigo-600 p-4 my-6">
              <p className="font-medium text-gray-800">
                <strong>Important:</strong> By accessing or using our service, you acknowledge that you have read, understood, and agree to be bound by all the terms of this Privacy Policy. If you do not agree, please do not use our services.
              </p>
            </div>

            <p>This policy complies with:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The Information Technology Act, 2000 (India) and its amendments</li>
              <li>General Data Protection Regulation (GDPR) for EU users</li>
              <li>California Consumer Privacy Act (CCPA) for California residents</li>
            </ul>
          </section>

          {/* 2. Definitions */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Definitions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <dl className="space-y-4">
                <div>
                  <dt className="font-semibold text-gray-800">Personal Data</dt>
                  <dd className="text-gray-600">Any information relating to an identified or identifiable natural person.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-800">Processing</dt>
                  <dd className="text-gray-600">Any operation performed on Personal Data, whether automated or manual.</dd>
                </div>
              </dl>
              <dl className="space-y-4">
                <div>
                  <dt className="font-semibold text-gray-800">Data Subject</dt>
                  <dd className="text-gray-600">The individual to whom Personal Data relates.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-800">Consent</dt>
                  <dd className="text-gray-600">Freely given, specific, informed and unambiguous indication of the Data Subject's wishes.</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* 3. Information We Collect */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Information We Collect</h2>
            <p>We collect several types of information to provide and improve our services to you:</p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3.1 Personal Information You Provide</h3>
            <p>When you register for an account or use our services, we may collect:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Identity Data:</strong> Full name, username, government ID (for verification)</li>
              <li><strong>Contact Data:</strong> Email address, phone number, business address</li>
              <li><strong>Financial Data:</strong> Bank account details, GSTIN, payment card information</li>
              <li><strong>Transaction Data:</strong> Details about payments and other transactions</li>
              <li><strong>Profile Data:</strong> Username and password, preferences, feedback</li>
              <li><strong>Marketing Data:</strong> Your preferences for receiving marketing communications</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3.2 Automated Collection</h3>
            <p>When you interact with our services, we automatically collect:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Technical Data:</strong> IP address, login data, browser type/version, time zone</li>
              <li><strong>Usage Data:</strong> Information about how you use our platform</li>
              <li><strong>Device Data:</strong> Device identifiers, operating system, mobile network</li>
              <li><strong>Location Data:</strong> Approximate location based on IP or precise location (with consent)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3.3 Data from Third Parties</h3>
            <p>We may receive information about you from:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Business partners (payment processors, analytics providers)</li>
              <li>Advertising networks</li>
              <li>Publicly available sources</li>
            </ul>
          </section>

          {/* 4. How We Use Your Information */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How We Use Your Information</h2>
            <p>We use your information for the following purposes:</p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4.1 Service Delivery</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and maintain our {PRODUCT_NAME}</li>
              <li>To process transactions and generate invoices</li>
              <li>To enable KG-based calculations for product sales</li>
              <li>To provide tax/non-tax invoice segregation</li>
              <li>To generate real-time revenue dashboards</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4.2 Business Operations</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>To manage payments, fees, and charges</li>
              <li>To track employee incentives and performance</li>
              <li>To maintain our marketing-ready shop portfolio system</li>
              <li>To implement role-based access control (RBAC)</li>
              <li>To maintain activity logs for debugging purposes</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4.3 Communication</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>To send service-related notifications</li>
              <li>To provide customer support</li>
              <li>To send promotional messages (with your consent)</li>
              <li>To notify you about changes to our services</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4.4 Analytics & Improvement</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>To understand how users interact with our platform</li>
              <li>To develop new features and functionality</li>
              <li>To troubleshoot and prevent technical issues</li>
              <li>To measure effectiveness of our marketing</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4.5 Legal Compliance</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>To comply with tax and accounting regulations</li>
              <li>To respond to lawful requests from authorities</li>
              <li>To protect our legal rights and prevent fraud</li>
            </ul>
          </section>

          {/* 5. Legal Basis (GDPR) */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Legal Basis for Processing (GDPR)</h2>
            <p>For users in the European Economic Area (EEA), we process your personal information under the following legal bases:</p>
            <ol className="list-decimal pl-5 space-y-2 mt-4">
              <li><strong>Contractual Necessity:</strong> When processing is necessary for the performance of our contract with you</li>
              <li><strong>Legitimate Interests:</strong> When processing is necessary for our legitimate business interests</li>
              <li><strong>Legal Obligation:</strong> When processing is necessary to comply with legal requirements</li>
              <li><strong>Consent:</strong> When we have obtained your explicit consent</li>
            </ol>
          </section>

          {/* 6. Data Sharing */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Sharing and Disclosure</h2>
            <p>We may share your information in the following situations:</p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6.1 With Service Providers</h3>
            <p>We may share your data with third-party vendors who provide services including:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Payment processing (Razorpay, Stripe)</li>
              <li>Cloud hosting (AWS, Google Cloud)</li>
              <li>Customer support tools</li>
              <li>Marketing and analytics services</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6.2 For Business Transfers</h3>
            <p>If we undergo a merger, acquisition, or asset sale, your data may be transferred.</p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6.3 With Affiliates</h3>
            <p>We may share information with our parent company, subsidiaries, and other affiliated companies.</p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6.4 With Business Partners</h3>
            <p>We may share information with partners who offer complementary services.</p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6.5 For Legal Reasons</h3>
            <p>We may disclose information when required by law or to protect our rights.</p>
          </section>

          {/* 7. Security */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Security</h2>
            <p>We implement robust security measures to protect your data:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Encryption of data in transit (TLS 1.2+) and at rest (AES-256)</li>
              <li>Regular security audits and penetration testing</li>
              <li>Role-based access controls with least privilege principle</li>
              <li>Multi-factor authentication for administrative access</li>
              <li>Regular employee security training</li>
            </ul>

            <div className="bg-gray-50 border-l-4 border-indigo-600 p-4 my-6">
              <p className="font-medium text-gray-800">
                <strong>Note:</strong> While we implement these measures, no system is 100% secure. We cannot guarantee absolute security of your information.
              </p>
            </div>
          </section>

          {/* 8. Retention */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Data Retention</h2>
            <p>We retain personal information only as long as necessary:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account Data:</strong> Until account deletion request (plus 90 days for recovery)</li>
              <li><strong>Transaction Records:</strong> 7 years for tax compliance</li>
              <li><strong>Marketing Data:</strong> Until consent withdrawal or 3 years of inactivity</li>
              <li><strong>System Logs:</strong> 12 months for security monitoring</li>
            </ul>
            <p className="mt-2">After retention periods expire, we securely delete or anonymize your data.</p>
          </section>

          {/* 9. Rights */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the following rights:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-4">
              <div>
                <h3 className="font-semibold text-gray-800">9.1 Access and Portability</h3>
                <p className="text-sm">You can request a copy of your personal data in a structured format.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">9.2 Correction</h3>
                <p className="text-sm">You may update or correct inaccurate information.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">9.3 Deletion</h3>
                <p className="text-sm">You can request deletion of your personal data under certain conditions.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">9.4 Restriction</h3>
                <p className="text-sm">You may request we limit processing of your data.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">9.5 Objection</h3>
                <p className="text-sm">You may object to certain processing activities.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">9.6 Consent Withdrawal</h3>
                <p className="text-sm">You can withdraw consent for marketing communications anytime.</p>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="font-semibold text-gray-800">9.7 Complaint</h3>
              <p>You have the right to lodge a complaint with a supervisory authority.</p>
            </div>
          </section>

          {/* 10. International Transfers */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. International Data Transfers</h2>
            <p>Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place, including:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>EU Standard Contractual Clauses for transfers outside the EEA</li>
              <li>Data processing agreements with all vendors</li>
              <li>Limiting access to personnel who need the information</li>
            </ul>
          </section>

          {/* 11. Cookies */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Cookies and Tracking Technologies</h2>
            <p>We use cookies and similar technologies to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Authenticate users and prevent fraud</li>
              <li>Remember user preferences</li>
              <li>Analyze site traffic and usage patterns</li>
              <li>Deliver targeted advertisements</li>
            </ul>
            <p className="mt-2">You can manage cookie preferences through your browser settings.</p>
          </section>

          {/* 12. Children */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Children's Privacy</h2>
            <p>Our services are not directed to individuals under 16. We do not knowingly collect personal information from children. If we become aware of such collection, we will take steps to delete the information.</p>
          </section>

          {/* 13. Changes */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Changes to This Policy</h2>
            <p>We may update this Privacy Policy periodically. We will notify you of changes by:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Posting the new policy on this page with a new "Last Updated" date</li>
              <li>Sending email notifications for material changes</li>
              <li>Displaying prominent notices within our application</li>
            </ul>
            <p className="mt-2">Your continued use after changes constitutes acceptance of the updated policy.</p>
          </section>

          {/* 14. Contact */}
          <section className="mb-10 bg-indigo-50 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contact Information</h2>
            <p className="mb-4">If you have questions about this policy or wish to exercise your rights:</p>
            <ul className="list-none space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <i className="fas fa-envelope mt-1 text-indigo-600 w-5"></i>
                <span><strong>Email:</strong> <a href={`mailto:${COMPANY_EMAIL}`} className="text-indigo-600 hover:text-indigo-800 underline">{COMPANY_EMAIL}</a></span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fas fa-user-shield mt-1 text-indigo-600 w-5"></i>
                <span><strong>GDPR Requests:</strong> <a href={`mailto:${GDPR_CONTACT_EMAIL}`} className="text-indigo-600 hover:text-indigo-800 underline">{GDPR_CONTACT_EMAIL}</a></span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fas fa-headset mt-1 text-indigo-600 w-5"></i>
                <span><strong>Support:</strong> <Link href={CONTACT_PAGE_URL} className="text-indigo-600 hover:text-indigo-800 underline">Support Portal</Link></span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fas fa-map-marker-alt mt-1 text-indigo-600 w-5"></i>
                <span><strong>Postal Address:</strong> {COMPANY_ADDRESS}</span>
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">Data Protection Officer</h3>
            <p>Our Data Protection Officer can be contacted at:</p>
            <address className="not-italic mt-2 bg-white p-4 rounded border border-indigo-100 shadow-sm">
              <strong>{COMPANY_NAME}</strong><br />
              Attn: Data Protection Officer<br />
              {COMPANY_ADDRESS}<br />
              <span className="block mt-2">
                Email: <a href={`mailto:${GDPR_CONTACT_EMAIL}`} className="text-indigo-600 hover:text-indigo-800">{GDPR_CONTACT_EMAIL}</a>
              </span>
            </address>
          </section>
        </main>

        <div className="text-center text-gray-600 italic mt-12 border-t pt-8">
          <p>This Privacy Policy was last updated on {lastUpdatedDate}</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;