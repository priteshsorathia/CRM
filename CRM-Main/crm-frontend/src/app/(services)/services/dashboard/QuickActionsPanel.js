"use client";
import React from 'react';
import GlassCard from '../components/GlassCard';
import SectionHeader from '../components/SectionHeader';
import AnimatedButton from '../components/AnimatedButton';
import { FaLaptopCode, FaUsers, FaUserTie, FaLaptop, FaFileInvoiceDollar, FaReceipt, FaChartPie } from 'react-icons/fa';
import { useRole } from '@/app/(services)/context/RoleContext';

export default function QuickActionsPanel() {
    const { can } = useRole();
    const actions = [
        { id: 1, icon: <FaLaptopCode />, title: "Add Project", description: "Create development project", module: 'PROJECT', action: 'CREATE' },
        { id: 2, icon: <FaUsers />, title: "Add Client", description: "Onboard new partner", module: 'CLIENTS', action: 'CREATE' },
        { id: 3, icon: <FaUserTie />, title: "Add Employee", description: "Register staff member", module: 'EMPLOYEE', action: 'CREATE' },
        { id: 4, icon: <FaLaptop />, title: "Assign Asset", description: "Allocate hardware", module: 'ASSETS', action: 'UPDATE' },
        { id: 5, icon: <FaFileInvoiceDollar />, title: "Create Invoice", description: "Bill clients for services", module: 'BILLING', action: 'CREATE' },
        { id: 6, icon: <FaReceipt />, title: "Submit Expense", description: "Log operational costs", module: 'EXPENSES', action: 'CREATE' },
        { id: 7, icon: <FaChartPie />, title: "View Reports", description: "Analyze global metrics", module: 'REPORTS', action: 'READ' },
    ];

    const filteredActions = actions.filter(action => {
        if (!action.module) return true;
        return can(action.module, action.action);
    });

    return (
        <GlassCard delay={0.6}>
            <SectionHeader title="Quick Actions" subtitle="Frequently used shortcuts" />
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[290px] pr-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                {filteredActions.map((action, idx) => (
                    <AnimatedButton
                        key={action.id}
                        icon={action.icon}
                        title={action.title}
                        description={action.description}
                        delay={0.6 + (idx * 0.05)}
                    />
                ))}
            </div>
        </GlassCard>
    );
}
