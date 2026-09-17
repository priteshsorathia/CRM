"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import EmployeeOverview from './EmployeeOverview';
import EmployeeTable from './EmployeeTable';
import OnboardingForm from './OnboardingForm';

import { hrmsApi } from '@/lib/api';
import { useRole } from '@/app/(services)/context/RoleContext';
import AccessDenied from "@/components/AccessDenied";

export default function EmployeesPage() {
    const { can, loading: roleLoading } = useRole();
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const isStaffPath = String(pathname || "").startsWith("/services/hrms/staff");

    const [employees, setEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);
    const [employeesError, setEmployeesError] = useState('');
    const [statusFilter, setStatusFilter] = useState('total');

    const loadEmployees = useCallback(async () => {
        setLoadingEmployees(true);
        setEmployeesError('');
        try {
            const res = await hrmsApi.getEmployees();
            if (res?.success) setEmployees(Array.isArray(res.data) ? res.data : []);
            else setEmployeesError(res?.error || 'Failed to load employees');
        } catch (e) {
            setEmployeesError(e?.message || 'Failed to load employees');
        } finally {
            setLoadingEmployees(false);
        }
    }, []);

    useEffect(() => {
        if (!roleLoading && can('EMPLOYEE', 'READ')) {
            loadEmployees();
        }
    }, [loadEmployees, roleLoading, can]);

    const showOnboarding = useMemo(() => {
        return (searchParams?.get("tab") || "").toLowerCase() === "onboarding";
    }, [searchParams]);

    useEffect(() => {
        if (showOnboarding) {
            document.title = "Create Employee";
        } else {
            document.title = "Employee Management";
        }
    }, [showOnboarding]);

    if (roleLoading) {
        return <div className="p-10 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" /></div>;
    }

    if (!can('EMPLOYEE', 'READ')) {
        return (
            <AccessDenied
                title="Employee Directory Access Restricted"
                message="You do not have permission to view the employee directory. Please contact your administrator if you believe this is an error."
                homeHref="/services"
                homeLabel="Back to Dashboard"
            />
        );
    }

    const normalizeStatus = (value) => String(value || '').trim().toLowerCase();

    const filteredEmployees = useMemo(() => {
        if (statusFilter === 'total') return employees;

        if (statusFilter === 'newJoiners') {
            const now = new Date();
            const month = now.getMonth();
            const year = now.getFullYear();
            return employees.filter(emp => {
                const joinDate = emp.join_date ? new Date(emp.join_date) : null;
                return joinDate && joinDate.getFullYear() === year && joinDate.getMonth() === month;
            });
        }

        const filterMap = {
            active: 'active',
            onLeave: ['on_leave', 'on leave'],
            probation: 'probation',
            resigned: 'resigned'
        };

        const target = filterMap[statusFilter];
        return employees.filter(emp => {
            const status = normalizeStatus(emp.status);
            if (Array.isArray(target)) return target.includes(status);
            return status === target;
        });
    }, [employees, statusFilter]);

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{showOnboarding ? 'Create Employee' : 'Employee Management'}</h1>
                    <p className="text-sm text-gray-500 mt-1">{showOnboarding ? 'Add a new member to your workforce directory.' : 'Manage your workforce, attendance and operations.'}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 justify-start sm:justify-end">
                    {isStaffPath ? (
                        <button
                            type="button"
                            onClick={() => {
                                if (showOnboarding) {
                                    router.replace('/services/hrms/staff');
                                } else {
                                    router.push("/services/hrms");
                                }
                            }}
                            className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-800 font-bold text-sm hover:bg-gray-200 transition-all active:scale-95 whitespace-nowrap"
                        >
                            {"\u2190"} Back
                        </button>
                    ) : null}
                    
                    {can('EMPLOYEE', 'CREATE') && !showOnboarding && (
                        <button
                            type="button"
                            onClick={() => router.push('/services/hrms/staff?tab=Onboarding')}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all active:scale-95 whitespace-nowrap"
                        >
                            <UserPlus size={18} />
                            Create Employee
                        </button>
                    )}
                </div>
            </div>

            {/* Tab Content */}
            <div>
                {showOnboarding ? (
                    <div className="space-y-4 pt-2">
                        {can('EMPLOYEE', 'CREATE') ? (
                            <OnboardingForm
                                onClose={() => {
                                    router.replace('/services/hrms/staff');
                                }}
                                onCreated={() => {
                                    loadEmployees();
                                    router.replace('/services/hrms/staff');
                                }}
                            />
                        ) : (
                            <div className="bg-white p-10 rounded-2xl border border-gray-200 shadow-sm text-center flex flex-col items-center gap-6">
                                <div className="p-4 bg-rose-50 text-rose-600 rounded-full">
                                    <X size={32} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
                                    <p className="text-sm text-gray-500 mt-2">You do not have permission to onboard new staff.</p>
                                    <button 
                                        onClick={() => router.replace('/services/hrms/staff')}
                                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-all"
                                    >
                                        Go Back
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : null}

                {!showOnboarding ? (
                    <div className="space-y-6">
                        <EmployeeOverview 
                            employees={employees} 
                            loading={loadingEmployees} 
                            activeFilter={statusFilter}
                            onFilterChange={setStatusFilter}
                        />
                        
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    Employee List
                                    {statusFilter !== 'total' && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                                            {statusFilter.replace(/([A-Z])/g, ' $1').trim()}
                                            <button onClick={() => setStatusFilter('total')} className="hover:text-indigo-900 ml-1">
                                                <X size={12} />
                                            </button>
                                        </span>
                                    )}
                                </h2>
                            </div>
                            <EmployeeTable
                                employees={filteredEmployees}
                                loading={loadingEmployees}
                                error={employeesError}
                                onRefresh={loadEmployees}
                            />
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
