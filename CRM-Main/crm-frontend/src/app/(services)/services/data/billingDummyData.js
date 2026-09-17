// ─── Invoice Stats ───
export const billingStats = {
    totalInvoiced: 4250000,
    paid: 2980000,
    overdue: 480000,
    draft: 3,
    outstanding: 1270000,
};

// ─── Invoices ───
export const initialInvoices = [
    {
        id: 'INV-2401', client: 'Acme Corp', project: 'ERP System Migration', amount: 285000, paid: 285000, due: '2024-02-15', issued: '2024-01-15', status: 'Paid',
        items: [{ desc: 'System Architecture Design', qty: 40, rate: 3500, tax: 18 }, { desc: 'Backend Development', qty: 60, rate: 3200, tax: 18 }],
        payments: [{ date: '2024-02-12', amount: 285000, method: 'Bank Transfer', ref: 'TXN-7823' }],
    },
    {
        id: 'INV-2402', client: 'TechNova Solutions', project: 'Mobile App Development', amount: 168000, paid: 84000, due: '2024-03-30', issued: '2024-02-28', status: 'Partially Paid',
        items: [{ desc: 'UI/UX Design Phase 1', qty: 30, rate: 2800, tax: 18 }, { desc: 'iOS Development', qty: 30, rate: 3200, tax: 18 }],
        payments: [{ date: '2024-03-05', amount: 84000, method: 'UPI', ref: 'TXN-8012' }],
    },
    {
        id: 'INV-2403', client: 'GlobalEdge Ltd', project: 'Network Infrastructure', amount: 124000, paid: 0, due: '2024-02-28', issued: '2024-01-28', status: 'Overdue',
        items: [{ desc: 'Network Audit', qty: 20, rate: 4000, tax: 18 }, { desc: 'Hardware Setup', qty: 1, rate: 44000, tax: 18 }],
        payments: [],
    },
    {
        id: 'INV-2404', client: 'BrightStar Inc', project: 'Cloud Security Audit', amount: 95000, paid: 0, due: '2024-04-15', issued: '2024-03-15', status: 'Sent',
        items: [{ desc: 'Security Assessment', qty: 20, rate: 4000, tax: 18 }, { desc: 'Penetration Testing', qty: 5, rate: 3000, tax: 18 }],
        payments: [],
    },
    {
        id: 'INV-2405', client: 'CloudBase Pvt Ltd', project: 'CRM Implementation', amount: 210000, paid: 0, due: '2024-04-30', issued: '2024-03-10', status: 'Draft',
        items: [{ desc: 'CRM Setup & Config', qty: 30, rate: 3500, tax: 18 }, { desc: 'Data Migration', qty: 20, rate: 4500, tax: 18 }],
        payments: [],
    },
    {
        id: 'INV-2406', client: 'Delta Dynamics', project: 'E-Commerce Platform', amount: 148000, paid: 148000, due: '2024-03-10', issued: '2024-02-10', status: 'Paid',
        items: [{ desc: 'Frontend Development', qty: 40, rate: 2800, tax: 18 }, { desc: 'Payment Integration', qty: 8, rate: 3500, tax: 18 }],
        payments: [{ date: '2024-03-08', amount: 148000, method: 'NEFT', ref: 'TXN-8765' }],
    },
];

export const paymentMethods = ['Bank Transfer', 'UPI', 'NEFT', 'IMPS', 'Cheque', 'Cash'];
export const taxRates = [0, 5, 12, 18, 28];
export const paymentTerms = ['Immediate', 'Net 15', 'Net 30', 'Net 45', 'Net 60', '50% Advance'];
