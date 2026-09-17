// ─── Ledger Accounts ───
export const ledgerAccounts = [
    'Cash & Bank',
    'Accounts Receivable',
    'Accounts Payable',
    'Service Revenue',
    'Salaries Expense',
    'Office Rent',
    'Software Subscriptions',
    'Travel & Conveyance',
    'Hardware Purchases',
    'Retained Earnings',
    'Owner\'s Equity',
    'GST Payable',
    'GST Receivable (Input)',
    'Tax Expense',
    'Depreciation',
    'Prepaid Expenses',
];

// ─── Journal Entries ───
export const initialJournalEntries = [
    {
        id: 'JNL-0001', date: '2024-03-01', ref: 'INV-2401', narration: 'Invoice payment received from Acme Corp',
        lines: [
            { ledger: 'Cash & Bank', debit: 285000, credit: 0, desc: 'Payment received' },
            { ledger: 'Accounts Receivable', debit: 0, credit: 285000, desc: 'Invoice settled' },
        ],
    },
    {
        id: 'JNL-0002', date: '2024-03-05', ref: 'EXP-1001', narration: 'March office rent payment',
        lines: [
            { ledger: 'Office Rent', debit: 45000, credit: 0, desc: 'March 2024 rent' },
            { ledger: 'Cash & Bank', debit: 0, credit: 45000, desc: 'Paid via transfer' },
        ],
    },
    {
        id: 'JNL-0003', date: '2024-03-10', ref: 'SAL-032024', narration: 'March salary disbursement',
        lines: [
            { ledger: 'Salaries Expense', debit: 620000, credit: 0, desc: 'March payroll' },
            { ledger: 'Cash & Bank', debit: 0, credit: 620000, desc: 'Bank transfer' },
        ],
    },
    {
        id: 'JNL-0004', date: '2024-03-12', ref: 'EXP-1002', narration: 'AWS cloud subscription',
        lines: [
            { ledger: 'Software Subscriptions', debit: 38000, credit: 0, desc: 'AWS March' },
            { ledger: 'GST Receivable (Input)', debit: 6840, credit: 0, desc: 'GST 18%' },
            { ledger: 'Accounts Payable', debit: 0, credit: 44840, desc: 'AWS invoice payable' },
        ],
    },
];

// ─── Trial Balance ───
export const trialBalanceData = [
    { account: 'Cash & Bank', debit: 1850000, credit: 0 },
    { account: 'Accounts Receivable', debit: 680000, credit: 0 },
    { account: 'GST Receivable (Input)', debit: 124200, credit: 0 },
    { account: 'Prepaid Expenses', debit: 36000, credit: 0 },
    { account: 'Accounts Payable', debit: 0, credit: 285000 },
    { account: 'GST Payable', debit: 0, credit: 224100 },
    { account: 'Service Revenue', debit: 0, credit: 4250000 },
    { account: 'Salaries Expense', debit: 1860000, credit: 0 },
    { account: 'Office Rent', debit: 540000, credit: 0 },
    { account: 'Software Subscriptions', debit: 228000, credit: 0 },
    { account: 'Travel & Conveyance', debit: 87600, credit: 0 },
    { account: 'Depreciation', debit: 120000, credit: 0 },
    { account: 'Tax Expense', debit: 210000, credit: 0 },
    { account: 'Retained Earnings', debit: 0, credit: 680700 },
];

// ─── P&L ───
export const plData = {
    revenue: [
        { label: 'IT Services Revenue', amount: 3650000 },
        { label: 'Consulting Revenue', amount: 480000 },
        { label: 'Annual Support Contracts', amount: 120000 },
    ],
    expenses: [
        { label: 'Salaries & Wages', amount: 1860000 },
        { label: 'Office Rent', amount: 540000 },
        { label: 'Software & Licenses', amount: 228000 },
        { label: 'Travel & Conveyance', amount: 87600 },
        { label: 'Depreciation', amount: 120000 },
        { label: 'Tax Expense', amount: 210000 },
    ],
};

// ─── Balance Sheet ───
export const balanceSheetData = {
    assets: [
        { label: 'Cash & Bank', amount: 1850000 },
        { label: 'Accounts Receivable', amount: 680000 },
        { label: 'GST Receivable', amount: 124200 },
        { label: 'Prepaid Expenses', amount: 36000 },
        { label: 'Fixed Assets (Net)', amount: 480000 },
    ],
    liabilities: [
        { label: 'Accounts Payable', amount: 285000 },
        { label: 'GST Payable', amount: 224100 },
        { label: 'Salary Payable', amount: 0 },
    ],
    equity: [
        { label: 'Owner\'s Equity', amount: 1980400 },
        { label: 'Retained Earnings', amount: 680700 },
    ],
};

// ─── GST Report ───
export const gstData = [
    { month: 'Oct 2023', taxable: 380000, cgst: 34200, sgst: 34200, igst: 0, total: 68400 },
    { month: 'Nov 2023', taxable: 420000, cgst: 37800, sgst: 37800, igst: 0, total: 75600 },
    { month: 'Dec 2023', taxable: 510000, cgst: 0, sgst: 0, igst: 91800, total: 91800 },
    { month: 'Jan 2024', taxable: 680000, cgst: 61200, sgst: 61200, igst: 0, total: 122400 },
    { month: 'Feb 2024', taxable: 595000, cgst: 53550, sgst: 53550, igst: 0, total: 107100 },
    { month: 'Mar 2024', taxable: 780000, cgst: 70200, sgst: 70200, igst: 0, total: 140400 },
];
