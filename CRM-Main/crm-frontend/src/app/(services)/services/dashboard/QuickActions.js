"use client";
import { motion } from 'framer-motion';
import { FaProjectDiagram, FaUsers, FaUserTie, FaLaptopCode, FaFileInvoiceDollar, FaReceipt, FaChartPie, FaBook, FaArrowRight } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useRole } from "@/app/(services)/context/RoleContext";

const actions = [
    { icon: FaProjectDiagram, label: 'Add Project', sub: 'Create a new project', href: '/services/projects/new', color: 'text-indigo-600 bg-indigo-50 border-indigo-100', module: 'PROJECT', action: 'CREATE' },
    { icon: FaUsers, label: 'Add Client', sub: 'Onboard new client', href: '/services/clients/new', color: 'text-blue-600 bg-blue-50 border-blue-100', module: 'CLIENTS', action: 'CREATE' },
    { icon: FaUserTie, label: 'Add Employee', sub: 'Register staff member', href: '/services/hrms/staff?tab=Onboarding', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', module: 'EMPLOYEE', action: 'CREATE' },
    { icon: FaLaptopCode, label: 'Assign Asset', sub: 'Allocate hardware/software', href: '/services/assets', color: 'text-purple-600 bg-purple-50 border-purple-100', module: 'ASSETS', action: 'UPDATE' },
    { icon: FaFileInvoiceDollar, label: 'Create Invoice', sub: 'Bill for services', href: '/services/billing/new', color: 'text-amber-600 bg-amber-50 border-amber-100', module: 'BILLING', action: 'CREATE' },
    { icon: FaReceipt, label: 'Submit Expense', sub: 'Log operational costs', href: '/services/expenses/new', color: 'text-rose-600 bg-rose-50 border-rose-100', module: 'EXPENSES', action: 'CREATE' },
    { icon: FaBook, label: 'Accounting', sub: 'Journal & statements', href: '/services/accounting', color: 'text-slate-700 bg-slate-50 border-slate-100', module: 'ACCOUNTING', action: 'READ' },
    { icon: FaChartPie, label: 'View Reports', sub: 'Analyse metrics', href: '/services/reports', color: 'text-teal-600 bg-teal-50 border-teal-100', module: 'REPORTS', action: 'READ' },
];

export default function QuickActions() {
    const router = useRouter();
    const { can } = useRole();

    const filteredActions = actions.filter(action => {
        if (!action.module) return true;
        return can(action.module, action.action);
    });

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FaProjectDiagram className="text-gray-700" size={16} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Quick Actions</h2>
                        <p className="text-xs text-gray-600">Fast access to key features</p>
                    </div>
                </div>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2 sm:gap-3">
                {filteredActions.map(({ icon: Icon, label, sub, color, href }, i) => (
                    <motion.button
                        key={label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => href && router.push(href)}
                        className={`flex flex-col items-center sm:items-start p-2.5 sm:p-4 border border-gray-200 rounded-lg hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 ease-in-out group text-center sm:text-left bg-white cursor-pointer hover:border-indigo-400`}
                    >
                        <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-md sm:rounded-lg flex items-center justify-center mb-2 sm:mb-3 ${color}`}>
                            <Icon size={14} className="opacity-80" />
                        </div>
                        <p className="font-bold text-[10px] sm:text-base text-gray-900 mb-0.5 line-clamp-1">{label}</p>
                        <p className="text-[9px] sm:text-xs text-gray-600 line-clamp-1">{sub}</p>
                        <FaArrowRight className="text-gray-400 mt-1.5 sm:mt-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 group-hover:translate-x-1 transition-all" size={8} />
                    </motion.button>
                ))}
            </div>
        </div>
    );
}

