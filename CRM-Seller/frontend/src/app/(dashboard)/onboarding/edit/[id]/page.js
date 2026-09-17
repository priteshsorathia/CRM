"use client";
import React, { useState, useEffect, use } from 'react';
import api from '../../../../../lib/axios';
import { useRouter } from 'next/navigation';
import {
  Building2,
  ChevronLeft,
  Check,
  UploadCloud,
  Loader2
} from 'lucide-react';

export default function EditOnboardingPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    businessName: '', businessType: '', panType: '', panNumber: '', gstNumber: '',
    addressProofType: '', fssaiLicense: '', fullName: '', email: '', phone: '', agreed: true,
    documentPan: null, documentAddress: null, documentGst: null
  });

  const API_URL = process.env.NEXT_PUBLIC_API_BASE;

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const res = await api.get(`/onboarding/${id}`);
        if (res.data.success) {
          const item = res.data.data;
          setFormData({
            businessName: item.businessName,
            businessType: item.businessType,
            panType: item.panType,
            panNumber: item.panNumber,
            gstNumber: item.gstNumber || '',
            addressProofType: item.addressProofType,
            fssaiLicense: item.fssaiLicense || '',
            fullName: item.fullName,
            email: item.email,
            phone: item.phone,
            agreed: true,
            documentPan: item.documentPan,
            documentAddress: item.documentAddress,
            documentGst: item.documentGst
          });
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        alert("Failed to load record details");
        router.push('/onboarding');
      } finally {
        setLoading(false);
      }
    };
    fetchRecord();
  }, [id, API_URL, router]);

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
    try {
      setSubmitting(true);
      const data = new FormData();
      Object.keys(formData).forEach(key => {
          if (formData[key] !== null && key !== 'agreed') {
              data.append(key, formData[key]);
          }
      });
      const res = await api.put(`/onboarding/${id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        router.push('/onboarding');
      }
    } catch (err) {
      console.error("Submit Error:", err);
      alert(err.response?.data?.message || "Failed to update record");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] animate-in fade-in zoom-in-95 duration-300"> 
      <div className="max-w-xl mx-auto">
        <div className="mb-4">
          <button onClick={() => router.push('/onboarding')} className="mb-2 flex items-center space-x-2 text-gray-400 hover:text-gray-600 transition-colors font-bold text-sm group">
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back Registry</span>
          </button>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-200">
                <Building2 size={18} />
             </div>
             <div>
                <h1 className="text-2xl font-semi text-slate-800 tracking-tight leading-none mb-1">Edit Profile</h1>
                <p className="text-gray-400 font-medium text-[11px] uppercase tracking-widest">Modifying Registration: #{id}</p>
             </div>
          </div>
        </div>

        <div className="relative flex justify-between items-center mb-4 px-2 mt-8">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>
          <div className="absolute top-1/2 left-0 h-0.5 bg-amber-500 -translate-y-1/2 z-0 transition-all duration-500" style={{ width: `${(currentStep - 1) * 50}%` }}></div>

          {[1, 2, 3].map((step) => (
            <div key={step} className="relative z-10 flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-300 ${currentStep >= step ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-white text-gray-400 border-2 border-gray-100'}`}>
                {currentStep > step ? <Check size={18} strokeWidth={4} /> : step}
              </div>
              <span className={`mt-3 text-[10px] font-black uppercase tracking-widest ${currentStep >= step ? 'text-amber-600' : 'text-gray-400'}`}>
                {step === 1 ? 'Business' : step === 2 ? 'Personal' : 'Documents'}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 md:p-12">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase ml-1">Business Name *</label>
                <input
                  type="text"
                  placeholder="Enter business name"
                  className={`w-full px-5 py-4 bg-white border ${errors.businessName ? 'border-red-400' : 'border-gray-200'} rounded-2xl outline-none font-bold text-slate-700 text-sm focus:ring-4 focus:ring-amber-500/5 transition-all`}
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                />
                {errors.businessName && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.businessName}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase ml-1">Business Type *</label>
                <select
                  className={`w-full px-5 py-4 bg-white border ${errors.businessType ? 'border-red-400' : 'border-gray-200'} rounded-2xl font-bold text-slate-700 appearance-none outline-none text-sm focus:ring-4 focus:ring-amber-500/5 transition-all`}
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                >
                  <option value="">Select type</option>
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
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase ml-1">PAN Number *</label>
                  <input
                    type="text"
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
              </div>

              <button onClick={nextStep} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-full font-bold text-sm transition-all shadow-lg active:scale-[0.98] mt-4">
                Continue to Personal Info
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase ml-1">Full Name *</label>
                <input
                  type="text"
                  className={`w-full px-5 py-4 bg-white border ${errors.fullName ? 'border-red-400' : 'border-gray-200'} rounded-2xl font-bold text-slate-700 outline-none text-sm`}
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase ml-1">Email Address *</label>
                <input
                  type="email"
                  className={`w-full px-5 py-4 bg-white border ${errors.email ? 'border-red-400' : 'border-gray-200'} rounded-2xl font-bold text-slate-700 outline-none text-sm`}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase ml-1">Phone Number *</label>
                <input
                  type="text"
                  className={`w-full px-5 py-4 bg-white border ${errors.phone ? 'border-red-400' : 'border-gray-200'} rounded-2xl font-bold text-slate-700 outline-none text-sm`}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={prevStep} className="flex-1 border-2 border-amber-50 text-amber-600 py-4 rounded-full font-bold text-sm text-center">
                  Previous
                </button>
                <button onClick={nextStep} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-full font-bold text-sm shadow-lg text-center">
                  Continue to Documents
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
               {[
                  { label: 'PAN Card', badge: 'Required', field: 'documentPan' },
                  { label: 'Address Proof', badge: 'Required', field: 'documentAddress' },
                  { label: 'GST Certificate', badge: 'Optional', field: 'documentGst' }
                ].map((doc, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <label className="text-xs font-bold text-slate-700 uppercase ml-1 tracking-wider">{doc.label}</label>
                      <span className="bg-amber-50 text-amber-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">{doc.badge}</span>
                    </div>
                    <label className="border-2 border-dashed border-amber-200 rounded-3xl p-6 flex flex-col items-center justify-center hover:bg-slate-50 transition-all cursor-pointer">
                      <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 mb-2">
                        <UploadCloud size={20} />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mt-2">
                        {formData[doc.field] instanceof File 
                          ? formData[doc.field].name 
                          : formData[doc.field] 
                            ? `Exists: ${formData[doc.field].split('/').pop()}` 
                            : 'Click to Replace Upload'}
                      </p>
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={(e) => setFormData(prev => ({ ...prev, [doc.field]: e.target.files[0] }))}
                      />
                    </label>
                  </div>
                ))}

              <div className="flex gap-4 pt-10">
                <button onClick={prevStep} className="flex-1 border-2 border-amber-50 text-amber-600 py-4 font-bold text-sm text-center rounded-full transition-colors active:bg-amber-50">
                  Previous
                </button>
                <button onClick={handleSubmit} className={`flex-1 ${submitting ? 'bg-slate-400' : 'bg-emerald-500 hover:bg-emerald-600'} text-white py-4 font-bold text-sm shadow-xl text-center rounded-full transition-all active:scale-95`} disabled={submitting}>
                  {submitting ? 'Updating Profile...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
