"use client";
import React, { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  Check,
  UploadCloud,
  ShieldAlert
} from 'lucide-react';

export default function NewOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    businessName: '', businessType: '', panType: '', panNumber: '', gstNumber: '',
    addressProofType: '', fssaiLicense: '', fullName: '', email: '', phone: '', agreed: false,
    documentPan: null, documentAddress: null, documentGst: null
  });

  // Pre-fill from lead conversion query params
  useEffect(() => {
    if (searchParams.get('prefill') === '1') {
      setFormData(prev => ({
        ...prev,
        businessName: searchParams.get('businessName') || '',
        businessType: searchParams.get('businessType') || '',
        fullName: searchParams.get('fullName') || '',
        email: searchParams.get('email') || '',
        phone: searchParams.get('phone') || '',
      }));
    }
  }, [searchParams]);

  const validateStep = (step) => {
    let newErrors = {};
    if (step === 1) {
      if (!formData.businessName) newErrors.businessName = 'Business name is required';
      if (!formData.businessType) newErrors.businessType = 'Business type is required';
      if (!formData.panType) newErrors.panType = 'PAN type is required';
      if (!formData.panNumber) newErrors.panNumber = 'PAN number is required';
      else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) newErrors.panNumber = 'Invalid PAN format';
      if (!formData.addressProofType) newErrors.addressProofType = 'Address proof type is required';
    } else if (step === 2) {
      if (!formData.fullName) newErrors.fullName = 'Full name is required';
      if (!formData.email) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
      if (!formData.phone) newErrors.phone = 'Phone number is required';
      else if (!/^[0-9]{10}$/.test(formData.phone)) newErrors.phone = '10 digits required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => validateStep(currentStep) && setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.agreed) return alert("Please agree to terms.");
    if (!formData.documentPan || !formData.documentAddress) {
      return alert("PAN and Address Proof are required securely.");
    }

    try {
      setLoading(true);
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null) {
          data.append(key, formData[key]);
        }
      });
      const res = await api.post('/onboarding', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        router.push('/onboarding');
      }
    } catch (err) {
      console.error("Submit Error:", err);
      alert(err.response?.data?.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] animate-in fade-in zoom-in-95 duration-300">
      <div className="max-w-xl mx-auto">
        <div className="mb-4">
          <button onClick={() => router.push('/onboarding')} className="mb-2 flex items-center space-x-2 text-gray-400 hover:text-gray-600 transition-colors font-bold text-sm group">
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back Oversight</span>
          </button>
          <h1 className="text-3xl font-semibold text-slate-800 tracking-tight mb-2">Business Onboarding {loading && "..."}</h1>
          <p className="text-gray-400 font-medium text-sm text-[11px]">Fill out form below and our team will get back to you within 24 hours</p>
        </div>

        <div className="relative flex justify-between items-center mb-8 px-2">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>
          <div className="absolute top-1/2 left-0 h-0.5 bg-indigo-500 -translate-y-1/2 z-0 transition-all duration-500" style={{ width: `${(currentStep - 1) * 50}%` }}></div>

          {[1, 2, 3].map((step) => (
            <div key={step} className="relative z-10 flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${currentStep >= step ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-gray-400 border-2 border-gray-100'}`}>
                {currentStep > step ? <Check size={18} strokeWidth={4} /> : step}
              </div>
              <span className={`mt-3 text-[10px] font-semibold uppercase tracking-widest ${currentStep >= step ? 'text-indigo-600' : 'text-gray-400'}`}>
                {step === 1 ? 'Business Info' : step === 2 ? 'Personal Info' : 'Document Upload'}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 md:p-12 mb-20">

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase ml-1">Business Name *</label>
                <input
                  type="text"
                  placeholder="Enter your business name"
                  className={`w-full px-5 py-4 bg-white border ${errors.businessName ? 'border-red-400' : 'border-gray-200'} rounded-2xl focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all font-bold text-slate-700 placeholder:text-gray-300 text-sm`}
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                />
                {errors.businessName && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.businessName}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase ml-1">Business Type *</label>
                <select
                  className={`w-full px-5 py-4 bg-white border ${errors.businessType ? 'border-red-400' : 'border-gray-200'} rounded-2xl font-bold text-slate-700 appearance-none outline-none text-sm`}
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                >
                  <option value="">Select your business type</option>
                  <option value="Individual/Proprietor">Individual/Proprietor</option>
                  <option value="Partnership Firm">Partnership Firm</option>
                  <option value="LLP">LLP</option>
                  <option value="Private Limited Company">Private Limited Company</option>
                  <option value="Public Limited Company">Public Limited Company</option>
                  <option value="HUF">HUF</option>
                </select>
                {errors.businessType && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.businessType}</p>}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase ml-1">PAN Type *</label>
                  <select
                    className={`w-full px-5 py-4 bg-white border ${errors.panType ? 'border-red-400' : 'border-gray-200'} rounded-2xl font-bold text-slate-700 appearance-none outline-none text-sm`}
                    value={formData.panType}
                    onChange={(e) => setFormData({ ...formData, panType: e.target.value })}
                  >
                    <option value="">Select PAN type</option>
                    <option value="Personal PAN">Personal PAN</option>
                    <option value="Company PAN">Company PAN</option>
                  </select>
                  {errors.panType && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.panType}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase ml-1">PAN Number *</label>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    className={`w-full px-5 py-4 bg-white border ${errors.panNumber ? 'border-red-400' : 'border-gray-200'} rounded-2xl font-bold text-slate-700 uppercase outline-none text-sm`}
                    value={formData.panNumber}
                    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                  />
                  {errors.panNumber && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.panNumber}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase ml-1">Address Proof Type *</label>
                <select
                  className={`w-full px-5 py-4 bg-white border ${errors.addressProofType ? 'border-red-400' : 'border-gray-200'} rounded-2xl font-bold text-slate-700 appearance-none outline-none text-sm`}
                  value={formData.addressProofType}
                  onChange={(e) => setFormData({ ...formData, addressProofType: e.target.value })}
                >
                  <option value="">Select address proof type</option>
                  <option value="Electricity Bill">Electricity Bill</option>
                  <option value="Water Bill">Water Bill</option>
                  <option value="Rent Agreement">Rent Agreement</option>
                </select>
                {errors.addressProofType && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.addressProofType}</p>}
              </div>

              <button onClick={nextStep} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-full font-bold text-sm transition-all shadow-lg active:scale-[0.98] mt-4">
                Next: Personal Info
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase ml-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  className={`w-full px-5 py-4 bg-white border ${errors.fullName ? 'border-red-400' : 'border-gray-200'} rounded-2xl font-bold text-slate-700 outline-none text-sm`}
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
                {errors.fullName && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.fullName}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase ml-1">Email Address *</label>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className={`w-full px-5 py-4 bg-white border ${errors.email ? 'border-red-400' : 'border-gray-200'} rounded-2xl font-bold text-slate-700 outline-none text-sm`}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {errors.email && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase ml-1">Phone Number *</label>
                <input
                  type="text"
                  placeholder="Enter your phone number"
                  className={`w-full px-5 py-4 bg-white border ${errors.phone ? 'border-red-400' : 'border-gray-200'} rounded-2xl font-bold text-slate-700 outline-none text-sm`}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                {errors.phone && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.phone}</p>}
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={prevStep} className="flex-1 border-2 border-indigo-50 text-indigo-600 py-4 rounded-full font-bold text-sm text-center">
                  Previous
                </button>
                <button onClick={nextStep} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-full font-bold text-sm shadow-lg text-center">
                  Next: Documents
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              {[
                { label: 'PAN Card', badge: 'Company PAN', field: 'documentPan' },
                { label: 'Address Proof', badge: 'Electricity Bill', field: 'documentAddress' },
                { label: 'GST Certificate', field: 'documentGst' }
              ].map((doc, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <label className="text-xs font-bold text-slate-700 uppercase ml-1 tracking-wider">{doc.label} {idx < 2 && '*'}</label>
                    {doc.badge && <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black px-2 py-0.5 rounded-full">{doc.badge}</span>}
                  </div>
                  <label className="border-2 border-dashed border-indigo-200 rounded-3xl p-6 flex flex-col items-center justify-center hover:bg-slate-50 transition-all cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mb-2">
                      <UploadCloud size={20} />
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                      {formData[doc.field] ? formData[doc.field].name : 'Click to Upload'}
                    </p>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => setFormData(prev => ({ ...prev, [doc.field]: e.target.files[0] }))}
                    />
                  </label>
                </div>
              ))}

              <div className="space-y-4 pt-4">
                <label className="flex items-start space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="mt-1 w-5 h-5 rounded-md border-gray-200 text-indigo-600 focus:ring-0"
                    checked={formData.agreed}
                    onChange={() => setFormData({ ...formData, agreed: !formData.agreed })}
                  />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    I agree to the <span className="text-indigo-600">Terms</span> and <span className="text-indigo-600">Privacy Policy</span>.
                  </span>
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={prevStep} className="flex-1 border-2 border-indigo-50 text-indigo-600 py-4 font-bold text-sm text-center rounded-full">
                  Previous
                </button>
                <button onClick={handleSubmit} className={`flex-1 ${loading ? 'bg-slate-400' : 'bg-indigo-600'} text-white py-4 font-bold text-sm shadow-lg text-center rounded-full`} disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
