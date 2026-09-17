export const activityModules = ['All', 'Projects', 'HR', 'Billing', 'Assets', 'Accounting', 'Clients'];

export const initialActivities = [
    {
        id: 'ACT-9821',
        activity: 'Updated Project Budget',
        user: 'Arjun Mehta',
        module: 'Projects',
        status: 'Success',
        date: '2024-03-03 11:24 AM',
        details: 'Project budget for "ERP Migration" increased by ₹50,000.',
        action: 'Update'
    },
    {
        id: 'ACT-9820',
        activity: 'Failed Login Attempt',
        user: 'System',
        module: 'HR',
        status: 'Failed',
        date: '2024-03-03 10:45 AM',
        details: 'Multiple incorrect password attempts detected from IP 192.168.1.45.',
        action: 'Security'
    },
    {
        id: 'ACT-9819',
        activity: 'New Client Onboarded',
        user: 'Sarah Jenkins',
        module: 'Clients',
        status: 'Success',
        date: '2024-03-03 09:15 AM',
        details: 'Acme Corp profile created and validated.',
        action: 'Create'
    },
    {
        id: 'ACT-9818',
        activity: 'Invoice Generated',
        user: 'System',
        module: 'Billing',
        status: 'Success',
        date: '2024-03-02 04:30 PM',
        details: 'Invoice #INV-2405 generated for CloudBase Pvt Ltd.',
        action: 'Generate'
    },
    {
        id: 'ACT-9817',
        activity: 'Asset Assignment Changed',
        user: 'Rahul Khanna',
        module: 'Assets',
        status: 'Success',
        date: '2024-03-02 02:10 PM',
        details: 'MacBook Pro (AS-1024) reassigned from HR to Engineering.',
        action: 'Assignment'
    },
    {
        id: 'ACT-9816',
        activity: 'Journal Entry Posted',
        user: 'Vikram Singh',
        module: 'Accounting',
        status: 'Success',
        date: '2024-03-02 11:00 AM',
        details: 'Journal entry JNL-0004 posted for AWS subscription.',
        action: 'Post'
    },
    {
        id: 'ACT-9815',
        activity: 'Bulk Employee Update',
        user: 'Sarah Jenkins',
        module: 'HR',
        status: 'Warning',
        date: '2024-03-01 05:45 PM',
        details: 'Updated salaries for 12 employees. 2 records failed validation.',
        action: 'Update'
    },
    {
        id: 'ACT-9814',
        activity: 'Project Milestone Changed',
        user: 'Arjun Mehta',
        module: 'Projects',
        status: 'Success',
        date: '2024-03-01 02:30 PM',
        details: 'Milestone "Testing phase" marked as complete.',
        action: 'Status'
    }
];
