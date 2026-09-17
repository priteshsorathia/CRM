'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  FileText, Phone, Mail, HelpCircle,
  CheckCircle, AlertCircle, Upload, ChevronDown,
  Clock, AlertTriangle, X, ArrowLeft, Eye, Download
} from 'lucide-react';
import { isSvgFile } from '@/utils/fileValidation';

export default function SupportPage() {
  const router = useRouter();

  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState('ticket');
  const [focusedSelect, setFocusedSelect] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [ticketErrors, setTicketErrors] = useState({});
  const [callbackErrors, setCallbackErrors] = useState({});
  const [viewingFile, setViewingFile] = useState(null);
  const [minDate, setMinDate] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    setMinDate(new Date().toISOString().split('T')[0]);
    const savedTab = localStorage.getItem('supportActiveTab');
    if (savedTab) {
      setActiveTab(savedTab);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setViewingFile(null);
      }
    };
    if (viewingFile) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [viewingFile]);

  // --- FORM STATES ---
  const [ticketForm, setTicketForm] = useState({
    email: '',
    subject: '',
    category: '',
    subcategory: '',
    other_detail: '',
    priority: '',
    description: ''
  });

  const [callbackForm, setCallbackForm] = useState({
    name: '',
    email: '',
    phone: '',
    preferred_time: '',
    preferred_date: '',
    issue_description: ''
  });

  // --- CONFIGURATION ---
  const COMPANY_NAME = "CRM";
  const SUPPORT_EMAIL = "support@crm.com";
  const SITE_NAME = "CRM Shop Management";

  const CATEGORIES = {
    "technical": { label: "Technical Issue", sub: { "login": "Login Problem", "bug": "Software Bug", "other": "Other" } },
    "billing": { label: "Billing & Payments", sub: { "invoice": "Invoice Issue", "payment": "Payment Failed", "refund": "Refund Request" } },
    "account": { label: "Account Management", sub: { "profile": "Update Profile", "security": "Security/Privacy" } },
    "other": { label: "Other", sub: {} }
  };

  const PRIORITIES = { "low": "Low", "normal": "Normal", "high": "High", "critical": "Critical" };
  const CALLBACK_TIMES = { "morning": "10:00 AM - 01:00 PM", "afternoon": "01:00 PM - 04:00 PM", "evening": "04:00 PM - 07:00 PM" };

  const FAQS = [
    { question: "How do I reset my password?", answer: "Go to the login page and click 'Forgot Password'. Follow the instructions sent to your email." },
    { question: "How do I update my billing information?", answer: "Navigate to the Billing section in your dashboard settings to update payment methods." },
    { question: "Can I export my invoice data?", answer: "Yes, go to the Invoices page and click the 'Export' button to download CSV or PDF reports." },
    { question: "What are the support hours?", answer: "Our team is available Mon-Fri from 10:00 AM to 7:00 PM IST." }
  ];

  // --- VALIDATION HELPER FUNCTIONS ---
  const containsMaliciousContent = (val) => {
    if (!val || typeof val !== 'string') return false;
    const lowerVal = val.toLowerCase();
    
    // Check for HTML/Script tags, iframe, srcdoc, or onload/onerror/onclick event handlers
    const xssPattern = /<[^>]*>|javascript:|on\w+\s*=/i;
    
    // Check for SQL injection patterns
    const sqlPattern = /('|--|#|\/\*|\*\/|\bunion\b|\bselect\b.*\bfrom\b|\bdrop\b|\binsert\b.*\binto\b)/i;
    
    return xssPattern.test(lowerVal) || sqlPattern.test(lowerVal);
  };

  const sanitizeValue = (val) => {
    if (!val || typeof val !== 'string') return '';
    return val
      .replace(/<[^>]*>/g, '') // strip all HTML tags
      .replace(/['"\\;]/g, '') // remove SQL/XSS characters
      .trim();
  };

  const containsOnlyNumbersOrSpecialChars = (val) => {
    if (!val || typeof val !== 'string') return false;
    // Strip out all numbers, spaces, and special characters/punctuation
    const lettersOnly = val.replace(/[\d\s\p{P}\p{S}]/gu, '');
    return lettersOnly.length === 0;
  };

  const validateTicket = () => {
    const errs = {};
    const emojiRegex = /[\uD800-\uDFFF]|[\u2600-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDC00-\uDFFF]/;

    // Email Address
    const trimmedEmail = ticketForm.email.trim();
    if (!trimmedEmail) {
      errs.email = "Email Address is required";
    } else if (trimmedEmail.length < 5 || trimmedEmail.length > 100) {
      errs.email = "Email must be between 5 and 100 characters";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = "Please enter a valid email address";
    }

    // Subject
    const trimmedSubject = ticketForm.subject.trim();
    if (!trimmedSubject) {
      errs.subject = "Subject is required";
    } else if (trimmedSubject.length < 5 || trimmedSubject.length > 150) {
      errs.subject = "Subject must be between 5 and 150 characters";
    } else if (emojiRegex.test(ticketForm.subject)) {
      errs.subject = "Emojis are not allowed";
    } else if (containsOnlyNumbersOrSpecialChars(trimmedSubject)) {
      errs.subject = "Subject cannot consist only of numbers or special characters";
    } else if (containsMaliciousContent(trimmedSubject)) {
      errs.subject = "HTML, XSS, and SQL Injection patterns are not allowed";
    }

    // Category
    if (!ticketForm.category) {
      errs.category = "Category is required";
    }

    // Priority
    if (!ticketForm.priority) {
      errs.priority = "Priority is required";
    }

    // Description
    const trimmedDescription = ticketForm.description.trim();
    if (!trimmedDescription) {
      errs.description = "Description is required";
    } else if (trimmedDescription.length < 20 || trimmedDescription.length > 2000) {
      errs.description = "Description must be between 20 and 2000 characters";
    } else if (emojiRegex.test(ticketForm.description)) {
      errs.description = "Emojis are not allowed";
    } else if (containsOnlyNumbersOrSpecialChars(trimmedDescription)) {
      errs.description = "Description cannot consist only of numbers or special characters";
    } else if (containsMaliciousContent(trimmedDescription)) {
      errs.description = "HTML, XSS, and SQL Injection patterns are not allowed";
    }

    // Other Detail
    const trimmedOtherDetail = ticketForm.other_detail?.trim();
    if ((ticketForm.category === 'other' || ticketForm.subcategory === 'other') && !trimmedOtherDetail) {
      errs.other_detail = "Please specify details for Other option";
    } else if (trimmedOtherDetail) {
      if (trimmedOtherDetail.length < 3 || trimmedOtherDetail.length > 150) {
        errs.other_detail = "Details must be between 3 and 150 characters";
      } else if (emojiRegex.test(ticketForm.other_detail)) {
        errs.other_detail = "Emojis are not allowed";
      } else if (containsOnlyNumbersOrSpecialChars(trimmedOtherDetail)) {
        errs.other_detail = "Details cannot consist only of numbers or special characters";
      } else if (containsMaliciousContent(trimmedOtherDetail)) {
        errs.other_detail = "HTML, XSS, and SQL Injection patterns are not allowed";
      }
    }

    setTicketErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateCallback = () => {
    const errs = {};
    const emojiRegex = /[\uD800-\uDFFF]|[\u2600-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDC00-\uDFFF]/;

    // Full Name
    const trimmedName = callbackForm.name.trim();
    if (!trimmedName) {
      errs.name = "Full Name is required";
    } else if (trimmedName.length < 3 || trimmedName.length > 50) {
      errs.name = "Full Name must be between 3 and 50 characters";
    } else if (emojiRegex.test(callbackForm.name)) {
      errs.name = "Emojis are not allowed";
    } else if (!/^[a-zA-Z\s.-]+$/.test(trimmedName)) {
      errs.name = "Full Name can only contain letters, spaces, dots, and hyphens";
    } else if (containsMaliciousContent(trimmedName)) {
      errs.name = "HTML, XSS, and SQL Injection patterns are not allowed";
    }

    // Email
    const trimmedEmail = callbackForm.email.trim();
    if (!trimmedEmail) {
      errs.email = "Email Address is required";
    } else if (trimmedEmail.length < 5 || trimmedEmail.length > 100) {
      errs.email = "Email must be between 5 and 100 characters";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = "Please enter a valid email address";
    }

    // Phone
    const cleanedPhone = callbackForm.phone.replace(/\D/g, '');
    if (!callbackForm.phone.trim()) {
      errs.phone = "Phone Number is required";
    } else if (cleanedPhone.length !== 10 || callbackForm.phone.trim().length > 15) {
      errs.phone = "Phone number must be exactly 10 digits";
    } else if (/^(.)\1{9}$/.test(cleanedPhone)) {
      errs.phone = "Please enter a valid mobile number (repeated digits are not allowed)";
    } else if (!/^[6-9]/.test(cleanedPhone)) {
      errs.phone = "Please enter a valid mobile number starting with 6, 7, 8, or 9";
    }

    // Preferred Date
    if (!callbackForm.preferred_date) {
      errs.preferred_date = "Preferred Date is required";
    }

    // Preferred Time
    if (!callbackForm.preferred_time) {
      errs.preferred_time = "Preferred Time is required";
    }

    // Issue Description
    const trimmedIssueDesc = callbackForm.issue_description.trim();
    if (!trimmedIssueDesc) {
      errs.issue_description = "Brief Description is required";
    } else if (trimmedIssueDesc.length < 10 || trimmedIssueDesc.length > 500) {
      errs.issue_description = "Description must be between 10 and 500 characters";
    } else if (emojiRegex.test(callbackForm.issue_description)) {
      errs.issue_description = "Emojis are not allowed";
    } else if (containsOnlyNumbersOrSpecialChars(trimmedIssueDesc)) {
      errs.issue_description = "Description cannot consist only of numbers or special characters";
    } else if (containsMaliciousContent(trimmedIssueDesc)) {
      errs.issue_description = "HTML, XSS, and SQL Injection patterns are not allowed";
    }

    setCallbackErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // --- HANDLERS ---

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = [];
    const newPreviews = [];

    selectedFiles.forEach(file => {
      // Validate allowed file types (JPG, PNG, PDF)
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

      if (!allowedMimeTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        toast.error(`File "${file.name}" is not supported. Only JPG, PNG, and PDF files are allowed.`);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large (Max 10MB)`);
        return;
      }
      validFiles.push(file);
      const url = URL.createObjectURL(file);
      if (file.type.startsWith('image/')) {
        newPreviews.push({ name: file.name, url, type: 'image', rawType: file.type });
      } else {
        newPreviews.push({ name: file.name, url, type: 'file', rawType: file.type });
      }
    });

    setFiles([...files, ...validFiles]);
    setPreviews([...previews, ...newPreviews]);
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    const newPreviews = [...previews];
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!validateTicket()) {
      return;
    }
    setLoading(true);
    setStatus({ type: '', message: '' });

    const source = 'Website';

    const formData = new FormData();
    Object.keys(ticketForm).forEach(key => {
      const val = typeof ticketForm[key] === 'string' ? sanitizeValue(ticketForm[key]) : ticketForm[key];
      formData.append(key, val);
    });
    formData.append('source', source);
    files.forEach(file => formData.append('attachments', file));

    try {
      const token = localStorage.getItem('authToken');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/support/ticket`, {
        method: 'POST',
        headers,
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        setStatus({ type: 'success', message: 'Support ticket submitted successfully!' });
        setTicketForm({ email: '', subject: '', category: '', subcategory: '', other_detail: '', priority: '', description: '' });
        setFiles([]);
        setPreviews([]);
      } else {
        setStatus({ type: 'error', message: data.error || 'Failed to submit.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Server connection failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCallbackSubmit = async (e) => {
    e.preventDefault();
    if (!validateCallback()) {
      return;
    }
    setLoading(true);
    setStatus({ type: '', message: '' });

    const source = 'Website';

    const sanitizedCallbackForm = {};
    Object.keys(callbackForm).forEach(key => {
      sanitizedCallbackForm[key] = typeof callbackForm[key] === 'string' ? sanitizeValue(callbackForm[key]) : callbackForm[key];
    });

    try {
      const token = localStorage.getItem('authToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/support/callback`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...sanitizedCallbackForm, source })
      });
      const data = await res.json();

      if (data.success) {
        setStatus({ type: 'success', message: 'Callback scheduled successfully!' });
        setCallbackForm({ name: '', email: '', phone: '', preferred_time: '', preferred_date: '', issue_description: '' });
      } else {
        setStatus({ type: 'error', message: data.error || 'Failed to schedule.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Server connection failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    // ✅ FIX: "fixed inset-0 z-[9999]" forces this page to cover the Sidebar/Navbar completely
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-50 to-white overflow-y-auto" suppressHydrationWarning>
      <div className="min-h-screen text-slate-800 font-sans">

        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            suppressHydrationWarning
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          {/* Header */}
          <header className="text-center mb-12 py-8">
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
            <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-br from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
              How can we help you today?
            </h1>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
              Our dedicated support team is here to assist you with any questions or issues.
              Choose the option that best fits your needs.
            </p>
          </header>

          {/* Tab Navigation */}
          <nav className="flex flex-wrap justify-center gap-2 mb-8 bg-slate-100/50 p-2 rounded-xl shadow-sm border border-slate-200 mx-auto max-w-fit">
            {[
              { id: 'ticket', icon: FileText, label: 'Support Ticket' },
              { id: 'callback', icon: Phone, label: 'Request Callback' },
              { id: 'contact', icon: Mail, label: 'Contact Info' },
              { id: 'faq', icon: HelpCircle, label: 'FAQ' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setStatus({ type: '', message: '' });
                  localStorage.setItem('supportActiveTab', tab.id);
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md transform scale-105'
                    : 'text-slate-500 hover:text-indigo-600 hover:bg-white'}`}
                suppressHydrationWarning
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Main Content Area */}
          <main className="max-w-4xl mx-auto pb-12">

            {/* Status Messages */}
            {status.message && (
              <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border shadow-sm animate-in fade-in slide-in-from-top-2 ${status.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span className="font-medium">{status.message}</span>
              </div>
            )}

            {/* --- TAB: SUPPORT TICKET --- */}
            {activeTab === 'ticket' && (
              <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-800">
                    <FileText className="text-indigo-600 w-7 h-7" /> Submit Support Ticket
                  </h2>
                  <p className="text-slate-500 mt-1">Describe your issue in detail and we'll get back to you within 24 hours.</p>
                </div>

                <div className="p-8">                  <form onSubmit={handleTicketSubmit} className="space-y-6" noValidate>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input type="email" placeholder="your.email@example.com"
                          maxLength={100}
                          className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${ticketErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'} bg-slate-50 focus:bg-white`}
                          value={ticketForm.email} onChange={e => {
                            setTicketForm({ ...ticketForm, email: e.target.value });
                            if (ticketErrors.email) setTicketErrors({ ...ticketErrors, email: '' });
                          }}
                          suppressHydrationWarning
                        />
                        {ticketErrors.email && <p className="text-red-500 text-xs mt-1">{ticketErrors.email}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Subject <span className="text-red-500">*</span>
                        </label>
                        <input type="text" placeholder="Enter Subject"
                          maxLength={150}
                          className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${ticketErrors.subject ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'} bg-slate-50 focus:bg-white`}
                          value={ticketForm.subject} onChange={e => {
                            setTicketForm({ ...ticketForm, subject: e.target.value });
                            if (ticketErrors.subject) setTicketErrors({ ...ticketErrors, subject: '' });
                          }}
                          suppressHydrationWarning
                        />
                        {ticketErrors.subject && <p className="text-red-500 text-xs mt-1">{ticketErrors.subject}</p>}
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            className={`w-full px-4 py-3 pr-10 rounded-xl border-2 outline-none transition-all bg-slate-50 focus:bg-white appearance-none bg-none peer cursor-pointer ${ticketErrors.category ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'}`}
                            value={ticketForm.category}
                            onFocus={() => setFocusedSelect('category')}
                            onBlur={() => setFocusedSelect(null)}
                            onChange={e => {
                              setTicketForm({ ...ticketForm, category: e.target.value, subcategory: '', other_detail: '' });
                              if (ticketErrors.category) setTicketErrors({ ...ticketErrors, category: '' });
                              e.target.blur();
                            }}
                            suppressHydrationWarning
                          >
                            <option value="">Select a category</option>
                            {Object.entries(CATEGORIES).map(([key, val]) => (
                              <option key={key} value={key}>{val.label}</option>
                            ))}
                          </select>
                          <div className={`absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-500 transition-transform duration-300 ${focusedSelect === 'category' ? 'rotate-180' : ''}`}>
                            <ChevronDown className="w-5 h-5" />
                          </div>
                        </div>
                        {ticketErrors.category && <p className="text-red-500 text-xs mt-1">{ticketErrors.category}</p>}
                      </div>

                      {ticketForm.category && CATEGORIES[ticketForm.category]?.sub && Object.keys(CATEGORIES[ticketForm.category].sub).length > 0 && (
                        <div className="animate-in fade-in zoom-in duration-200">
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Sub Category</label>
                          <div className="relative">
                            <select
                              className="w-full px-4 py-3 pr-10 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-slate-50 focus:bg-white appearance-none bg-none peer cursor-pointer"
                              value={ticketForm.subcategory}
                              onFocus={() => setFocusedSelect('subcategory')}
                              onBlur={() => setFocusedSelect(null)}
                              onChange={e => {
                                setTicketForm({ ...ticketForm, subcategory: e.target.value, other_detail: '' });
                                if (ticketErrors.subcategory) setTicketErrors({ ...ticketErrors, subcategory: '' });
                                e.target.blur();
                              }}
                              suppressHydrationWarning
                            >
                              <option value="">Select sub category</option>
                              {Object.entries(CATEGORIES[ticketForm.category].sub).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                              ))}
                            </select>
                            <div className={`absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-500 transition-transform duration-300 ${focusedSelect === 'subcategory' ? 'rotate-180' : ''}`}>
                              <ChevronDown className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Specify Other Details */}
                    {(ticketForm.category === 'other' || ticketForm.subcategory === 'other') && (
                      <div className="animate-in fade-in zoom-in duration-200">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Specify Details <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Please specify details"
                          maxLength={150}
                          className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all bg-slate-50 focus:bg-white ${ticketErrors.other_detail ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500'}`}
                          value={ticketForm.other_detail || ''}
                          onChange={e => {
                            setTicketForm({ ...ticketForm, other_detail: e.target.value });
                            if (ticketErrors.other_detail) setTicketErrors({ ...ticketErrors, other_detail: '' });
                          }}
                          suppressHydrationWarning
                        />
                        {ticketErrors.other_detail && <p className="text-red-500 text-xs mt-1">{ticketErrors.other_detail}</p>}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Priority <span className="text-red-500">*</span>
                      </label>
                      <div className="flex flex-wrap gap-4">
                        {Object.entries(PRIORITIES).map(([key, label]) => (
                          <label key={key} className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${ticketForm.priority === key ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold' : 'border-slate-200 hover:border-slate-300'
                            }`}>
                            <input type="radio" name="priority" value={key}
                              suppressHydrationWarning
                              checked={ticketForm.priority === key}
                              onChange={e => {
                                setTicketForm({ ...ticketForm, priority: e.target.value });
                                if (ticketErrors.priority) setTicketErrors({ ...ticketErrors, priority: '' });
                              }}
                              className="hidden"
                            />
                            <span className="text-sm font-medium">{label}</span>
                          </label>
                        ))}
                      </div>
                      {ticketErrors.priority && <p className="text-red-500 text-xs mt-2">{ticketErrors.priority}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea rows={5}
                        placeholder="Please describe your issue in detail"
                        maxLength={2000}
                        className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all bg-slate-50 focus:bg-white resize-y ${ticketErrors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'}`}
                        value={ticketForm.description} onChange={e => {
                          setTicketForm({ ...ticketForm, description: e.target.value });
                          if (ticketErrors.description) setTicketErrors({ ...ticketErrors, description: '' });
                        }}
                        suppressHydrationWarning
                      ></textarea>
                      {ticketErrors.description && <p className="text-red-500 text-xs mt-1">{ticketErrors.description}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Attachments</label>
                      <div
                        onClick={() => fileInputRef.current.click()}
                        className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 hover:border-indigo-400 cursor-pointer transition-all group"
                      >
                        <input ref={fileInputRef} type="file" multiple accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={handleFileChange} suppressHydrationWarning />
                        <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-100 transition-colors">
                          <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-600" />
                        </div>
                        <p className="text-sm font-medium text-slate-700">Click to upload documents or screenshots</p>
                        <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG, PDF (Max 10MB)</p>
                      </div>

                      {/* File Previews */}
                      {previews.length > 0 && (
                        <div className="flex flex-wrap gap-3 mt-4">
                          {previews.map((file, idx) => (
                            <div key={idx} className="relative w-24 h-24 border border-slate-200 rounded-xl overflow-hidden shadow-sm group">
                              {file.type === 'image' ? (
                                <img src={file.url} alt="preview" className="w-full h-full object-cover" />
                              ) : (
                                <div className="flex flex-col items-center justify-center h-full bg-slate-50 text-slate-500 p-2">
                                  <FileText className="w-8 h-8 mb-1" />
                                  <span className="text-[10px] w-full text-center truncate px-1">{file.name}</span>
                                </div>
                              )}
                              
                              {/* View Action Overlay */}
                              <div
                                onClick={() => setViewingFile(file)}
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                              >
                                <Eye className="text-white w-6 h-6" />
                              </div>

                              <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                suppressHydrationWarning>
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button type="submit" disabled={loading}
                      className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                      suppressHydrationWarning
                    >
                      {loading ? <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span> : <><FileText className="w-5 h-5" /> Submit Ticket</>}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* --- TAB: CALLBACK REQUEST --- */}
            {activeTab === 'callback' && (
              <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-800">
                    <Phone className="text-indigo-600 w-7 h-7" /> Request a Callback
                  </h2>
                  <p className="text-slate-500 mt-1">Schedule a phone call with our support team at your convenience.</p>
                </div>

                <div className="p-8">                  <form onSubmit={handleCallbackSubmit} className="space-y-6" noValidate>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input type="text" placeholder="Enter your full name"
                          maxLength={50}
                          className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${callbackErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'} bg-slate-50 focus:bg-white`}
                          value={callbackForm.name} onChange={e => {
                            setCallbackForm({ ...callbackForm, name: e.target.value });
                            if (callbackErrors.name) setCallbackErrors({ ...callbackErrors, name: '' });
                          }}
                          suppressHydrationWarning
                        />
                        {callbackErrors.name && <p className="text-red-500 text-xs mt-1">{callbackErrors.name}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Email Address <span className="text-red-500">*</span>
                        </label>                         <input type="email" placeholder="your.email@example.com"
                          maxLength={100}
                          className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${callbackErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'} bg-slate-50 focus:bg-white`}
                          value={callbackForm.email} onChange={e => {
                            setCallbackForm({ ...callbackForm, email: e.target.value });
                            if (callbackErrors.email) setCallbackErrors({ ...callbackErrors, email: '' });
                          }}
                          suppressHydrationWarning
                        />
                        {callbackErrors.email && <p className="text-red-500 text-xs mt-1">{callbackErrors.email}</p>}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input type="tel" placeholder="Enter phone number"
                          maxLength={10}
                          className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${callbackErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'} bg-slate-50 focus:bg-white`}
                          value={callbackForm.phone} onChange={e => {
                            // only allow digits, restrict length to 10
                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setCallbackForm({ ...callbackForm, phone: val });
                            if (callbackErrors.phone) setCallbackErrors({ ...callbackErrors, phone: '' });
                          }}
                          suppressHydrationWarning
                        />
                        {callbackErrors.phone && <p className="text-red-500 text-xs mt-1">{callbackErrors.phone}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Preferred Date <span className="text-red-500">*</span>
                        </label>
                        <input type="date" min={minDate}
                          className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${callbackErrors.preferred_date ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'} bg-slate-50 focus:bg-white`}
                          value={callbackForm.preferred_date} onChange={e => {
                            setCallbackForm({ ...callbackForm, preferred_date: e.target.value });
                            if (callbackErrors.preferred_date) setCallbackErrors({ ...callbackErrors, preferred_date: '' });
                          }}
                          suppressHydrationWarning
                        />
                        {callbackErrors.preferred_date && <p className="text-red-500 text-xs mt-1">{callbackErrors.preferred_date}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Preferred Time <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          className={`w-full px-4 py-3 pr-10 rounded-xl border-2 outline-none transition-all bg-slate-50 focus:bg-white appearance-none bg-none peer cursor-pointer ${callbackErrors.preferred_time ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'}`}
                          value={callbackForm.preferred_time}
                          onFocus={() => setFocusedSelect('preferred_time')}
                          onBlur={() => setFocusedSelect(null)}
                          onChange={e => {
                            setCallbackForm({ ...callbackForm, preferred_time: e.target.value });
                            if (callbackErrors.preferred_time) setCallbackErrors({ ...callbackErrors, preferred_time: '' });
                            e.target.blur();
                          }}
                          suppressHydrationWarning
                        >
                          <option value="">Select time slot</option>
                          {Object.entries(CALLBACK_TIMES).map(([key, val]) => (
                            <option key={key} value={val}>{val}</option>
                          ))}
                        </select>
                        <div className={`absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-500 transition-transform duration-300 ${focusedSelect === 'preferred_time' ? 'rotate-180' : ''}`}>
                          <ChevronDown className="w-5 h-5" />
                        </div>
                      </div>
                      {callbackErrors.preferred_time && <p className="text-red-500 text-xs mt-1">{callbackErrors.preferred_time}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Brief Description <span className="text-red-500">*</span>
                      </label>
                      <textarea rows={3} placeholder="What do you need help with?"
                        maxLength={500}
                        className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all bg-slate-50 focus:bg-white resize-y ${callbackErrors.issue_description ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'}`}
                        value={callbackForm.issue_description} onChange={e => {
                          setCallbackForm({ ...callbackForm, issue_description: e.target.value });
                          if (callbackErrors.issue_description) setCallbackErrors({ ...callbackErrors, issue_description: '' });
                        }}
                        suppressHydrationWarning
                      ></textarea>
                      {callbackErrors.issue_description && <p className="text-red-500 text-xs mt-1">{callbackErrors.issue_description}</p>}
                    </div>

                    <button type="submit" disabled={loading}
                      className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                      suppressHydrationWarning
                    >
                      {loading ? <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span> : <><Phone className="w-5 h-5" /> Schedule Callback</>}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* --- TAB: CONTACT INFO --- */}
            {activeTab === 'contact' && (
              <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-800">
                    <Mail className="text-indigo-600 w-7 h-7" /> Contact Information
                  </h2>
                  <p className="text-slate-500 mt-1">Get in touch with us directly.</p>
                </div>

                <div className="p-8 grid md:grid-cols-2 gap-6">

                  {/* Email Support */}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-5 p-6 rounded-2xl border border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-200 hover:shadow-md hover:-translate-y-1 transition-all group">
                    <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
                      <Mail className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">Email Support</h3>
                      <p className="text-indigo-600 font-medium mt-1">{SUPPORT_EMAIL}</p>
                      <p className="text-xs text-slate-500 mt-1">Response: Within 24 hours</p>
                    </div>
                  </a>

                  {/* Business Hours */}
                  <div className="flex items-center gap-5 p-6 rounded-2xl border border-amber-100 bg-amber-50/30 hover:bg-amber-50 hover:border-amber-200 hover:shadow-md transition-all">
                    <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center text-2xl shadow-sm">
                      <Clock className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">Business Hours</h3>
                      <p className="text-amber-700 font-medium mt-1">10:00 AM - 07:00 PM</p>
                      <p className="text-xs text-slate-500 mt-1">Mon - Fri (IST)</p>
                    </div>
                  </div>

                  {/* Emergency */}
                  <div className="md:col-span-2 flex items-center gap-5 p-6 rounded-2xl border border-red-100 bg-red-50/30 hover:bg-red-50 hover:border-red-200 hover:shadow-md transition-all">
                    <div className="w-14 h-14 bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-2xl shadow-sm">
                      <AlertTriangle className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">Emergency Support</h3>
                      <p className="text-red-600 font-medium mt-1">Critical Issues Only</p>
                      <p className="text-xs text-slate-500 mt-1">If your system is completely down, please mark your ticket as "Critical".</p>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* --- TAB: FAQ --- */}
            {activeTab === 'faq' && (
              <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-800">
                    <HelpCircle className="text-indigo-600 w-7 h-7" /> Frequently Asked Questions
                  </h2>
                </div>

                <div className="p-8 space-y-4">
                  {FAQS.map((faq, idx) => (
                    <details key={idx} className="group border border-slate-200 rounded-xl bg-white open:bg-slate-50 open:border-indigo-100 transition-all duration-300">
                      <summary className="flex cursor-pointer items-center justify-between p-5 font-semibold text-slate-800 list-none hover:text-indigo-600 transition-colors">
                        <span className="text-lg">{faq.question}</span>
                        <ChevronDown className="w-5 h-5 text-slate-400 transition-transform duration-300 group-open:rotate-180 group-open:text-indigo-600" />
                      </summary>
                      <div className="px-5 pb-6 text-slate-600 leading-relaxed border-t border-slate-100 pt-4 animate-in fade-in slide-in-from-top-1">
                        {faq.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}

          </main>

          <div className="text-center text-slate-400 text-sm mt-12 pb-4">
            <p>&copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
          </div>
        </div>
      </div>

      {viewingFile && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setViewingFile(null);
            }
          }}
          className="fixed inset-0 z-[10000] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-lg truncate max-w-lg">{viewingFile.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingFile(null)}
                className="text-slate-400 hover:text-slate-600 bg-slate-200/50 hover:bg-slate-200 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-100 min-h-[300px]">
              {viewingFile.type === 'image' ? (
                <img
                  src={viewingFile.url}
                  alt={viewingFile.name}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md"
                />
              ) : viewingFile.rawType === 'application/pdf' ? (
                <iframe
                  src={viewingFile.url}
                  className="w-full h-[60vh] rounded-lg border border-slate-200 bg-white"
                  title={viewingFile.name}
                />
              ) : (
                <div className="text-center py-12 px-6">
                  <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-10 h-10" />
                  </div>
                  <h4 className="font-semibold text-slate-800 text-lg mb-2">No preview available for this file type</h4>
                  <p className="text-slate-500 text-sm mb-6">You can still open/download it to view it on your device.</p>
                  <a
                    href={viewingFile.url}
                    download={viewingFile.name}
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow hover:bg-indigo-700 transition-colors"
                  >
                    <Download className="w-5 h-5" /> Download File
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <a
                href={viewingFile.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold px-4 py-2 text-sm transition-colors"
              >
                <Eye className="w-4 h-4" /> Open in New Tab
              </a>
              <button
                type="button"
                onClick={() => setViewingFile(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-5 py-2 rounded-xl text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}