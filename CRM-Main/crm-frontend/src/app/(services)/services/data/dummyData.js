// ─── Metrics ───
export const metricsData = [
    { id: 1, title: 'Active Projects', value: '45', growth: '+12%', isPositive: true, type: 'projects' },
    { id: 2, title: 'Total Clients', value: '128', growth: '+5%', isPositive: true, type: 'clients' },
    { id: 3, title: 'Employees', value: '64', growth: '+2%', isPositive: true, type: 'employees' },
    { id: 4, title: 'Assets Assigned', value: '256', growth: '+8%', isPositive: true, type: 'assets' },
    { id: 5, title: 'Monthly Revenue', value: '$1,24,500', growth: '+15%', isPositive: true, type: 'revenue' },
    { id: 6, title: 'Total Expenses', value: '$42,300', growth: '-3%', isPositive: false, type: 'expenses' },
    { id: 7, title: 'Net Profit', value: '$82,200', growth: '+22%', isPositive: true, type: 'profit' },
    { id: 8, title: 'Pending Invoices', value: '14', growth: '+2', isPositive: false, type: 'pending' },
    { id: 9, title: 'Overdue Payments', value: '3', growth: '-1', isPositive: true, type: 'overdue' },
];

// ─── Charts ───
export const revenueData = [
    { name: 'Jan', revenue: 65000, target: 60000 },
    { name: 'Feb', revenue: 72000, target: 65000 },
    { name: 'Mar', revenue: 85000, target: 75000 },
    { name: 'Apr', revenue: 92000, target: 85000 },
    { name: 'May', revenue: 105000, target: 95000 },
    { name: 'Jun', revenue: 124500, target: 110000 },
];

export const expenseData = [
    { name: 'Jan', expense: 35000 },
    { name: 'Feb', expense: 38000 },
    { name: 'Mar', expense: 41000 },
    { name: 'Apr', expense: 40500 },
    { name: 'May', expense: 43000 },
    { name: 'Jun', expense: 42300 },
];

export const profitData = [
    { name: 'Jan', profit: 30000 },
    { name: 'Feb', profit: 34000 },
    { name: 'Mar', profit: 44000 },
    { name: 'Apr', profit: 51500 },
    { name: 'May', profit: 62000 },
    { name: 'Jun', profit: 82200 },
];

export const clientDistribution = [
    { name: 'Enterprise', value: 45 },
    { name: 'SME', value: 35 },
    { name: 'Startup', value: 15 },
    { name: 'Government', value: 5 },
];

// ─── Activities ───
export const recentActivities = [
    { id: 1, type: 'project', title: 'Cloud Migration project created', timestamp: '2 mins ago', status: 'completed' },
    { id: 2, type: 'invoice', title: 'Invoice INV-042 generated — Acme Corp', timestamp: '1 hour ago', status: 'pending' },
    { id: 3, type: 'expense', title: 'Travel expense submitted by John Doe', timestamp: '3 hours ago', status: 'review' },
    { id: 4, type: 'asset', title: 'MacBook Pro M3 assigned to Jane Smith', timestamp: '1 day ago', status: 'completed' },
    { id: 5, type: 'employee', title: 'Mike Johnson onboarded as Dev Lead', timestamp: '2 days ago', status: 'completed' },
];
