"use client";
import React, { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import GlassCard from "../components/GlassCard";
import { hrmsApi } from "@/lib/api";

export default function MyProfilePage() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const userData = localStorage.getItem("userData");
                if (!userData) {
                    setLoading(false);
                    return;
                }

                const parsedUser = JSON.parse(userData);
                const identifier = parsedUser.employeeId || parsedUser.emp_id || parsedUser.id;

                if (identifier) {
                    const response = await hrmsApi.getEmployee(identifier).catch(err => {
                        console.error("API Call Failed:", err);
                        return null;
                    });
                    
                    if (response?.success && response.data) {
                        setProfile(response.data);
                    } else {
                        setProfile(parsedUser);
                    }
                } else {
                    setProfile(parsedUser);
                }
            } catch (error) {
                console.error("Failed to fetch profile data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="p-8 text-center bg-white rounded-2xl border border-gray-200">
                <p className="text-gray-500">User session not found. Please log in again.</p>
            </div>
        );
    }

    const getUserDisplayName = () => {
        return profile.full_name || profile.name || profile.username || "User";
    };

    const getUserRole = () => {
        const role = profile.role || "User";
        const roleMap = {
            'shop_owner': 'Shop Owner',
            'restaurant_owner': 'Restaurant Owner',
            'admin': 'Administrator',
            'administrator': 'Administrator'
        };
        const mapped = roleMap[role.toLowerCase()] || role;
        return mapped
            .replace(/_/g, ' ')
            .split(/\s+/)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');
    };

    const getUserInitials = () => {
        const source = profile.full_name || profile.name || profile.email?.split("@")[0] || "User";
        const parts = source.trim().split(/\s+/);
        const first = parts[0]?.[0] || "";
        const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
        return (first + last).toUpperCase();
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (e) {
            return "-";
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-0">
            <GlassCard className="p-0 overflow-hidden bg-white border border-gray-100 shadow-xl shadow-slate-200/50">
                {/* Re-integrated Avatar Header */}
                <div className="flex flex-col items-center text-center space-y-4 pt-10 pb-8 bg-slate-50 border-b border-slate-100">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-indigo-100 border-4 border-white shadow-xl flex items-center justify-center">
                            <span className="text-3xl font-black text-indigo-600 tracking-tighter">
                                {getUserInitials()}
                            </span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-indigo-600 rounded-full border-4 border-white flex items-center justify-center text-white shadow-lg">
                            <ShieldCheck size={16} strokeWidth={3} />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center justify-center gap-3">
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                                {getUserDisplayName()}
                            </h1>
                            <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-md">
                                {profile.status || "Active"}
                            </span>
                        </div>
                        <p className="text-indigo-600 text-sm font-black uppercase tracking-[0.2em] opacity-80">
                            {getUserRole()}
                        </p>
                    </div>
                </div>

                {/* Sectioned Content from Screenshot */}
                <div className="p-0">
                    {/* Basic Information */}
                    <div className="p-10 border-b border-gray-50">
                        <h3 className="text-[11px] font-black text-gray-300 uppercase tracking-[0.2em] mb-10">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
                            <InfoRow label="JOIN DATE" value={formatDate(profile.join_date)} />
                            <InfoRow 
                                label="STATUS" 
                                value={
                                    <span className="px-3 py-1 bg-green-50 text-green-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-green-100 italic">
                                        {profile.status || "ACTIVE"}
                                    </span>
                                } 
                            />
                            <InfoRow 
                                label="MONTHLY SALARY" 
                                value={
                                    <span className="font-black text-gray-900">
                                        ₹{profile.salary || 0}
                                    </span>
                                } 
                            />
                            <InfoRow label="BLOOD GROUP" value={profile.bloodGroup} />
                            <InfoRow label="DATE OF BIRTH" value={formatDate(profile.dob)} />
                            <InfoRow label="GENDER" value={profile.gender} />
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="p-10 border-b border-gray-50">
                        <h3 className="text-[11px] font-black text-gray-300 uppercase tracking-[0.2em] mb-10">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
                            <InfoRow label="EMAIL ADDRESS" value={profile.email} />
                            <InfoRow label="PHONE NUMBER" value={profile.phone} />
                            <div className="md:col-span-2">
                                <InfoRow label="PHYSICAL ADDRESS" value={profile.address} />
                            </div>
                        </div>
                    </div>

                    {/* Account Information */}
                    <div className="p-10">
                        <h3 className="text-[11px] font-black text-gray-300 uppercase tracking-[0.2em] mb-10">Account Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
                            <InfoRow 
                                label="LOGIN USERNAME" 
                                value={
                                    <span className="px-3 py-1 bg-blue-50/50 rounded-lg text-blue-600 font-bold border border-blue-100/50">
                                        {profile.username || "n/a"}
                                    </span>
                                } 
                            />
                            <InfoRow label="EMPLOYEE ID" value={profile.emp_id} />
                            <InfoRow label="DEPARTMENT" value={profile.department} />
                            <InfoRow label="WORK LOCATION" value={profile.workLocation} />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2">
                    <ShieldCheck size={14} className="text-indigo-400" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
                        Verified Employee Profile • CRM HMS
                    </span>
                </div>
            </GlassCard>
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="space-y-2">
            <p className="text-[10px] font-bold text-gray-400 opacity-70 uppercase tracking-widest">{label}</p>
            <div className="text-[15px] font-bold text-gray-800">
                {value || "-"}
            </div>
        </div>
    );
}
