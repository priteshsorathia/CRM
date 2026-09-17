import { Bell, ShieldAlert, UserPlus, FileText, Package, Briefcase, CreditCard } from 'lucide-react';

export const notificationTypes = ['All', 'Assets', 'HR', 'Projects', 'Billing'];

export const initialNotifications = [
    {
        id: 1,
        type: 'Assets',
        title: 'Asset Warranty Expiring',
        description: 'Warranty for MacBook Pro (Asset #AS-1024) expires in 15 days.',
        time: '2 hours ago',
        read: false,
        severity: 'warning',
        icon: Package
    },
    {
        id: 2,
        type: 'HR',
        title: 'New Employee Onboarding',
        description: 'James Miller has completed the background check process.',
        time: '4 hours ago',
        read: false,
        severity: 'info',
        icon: UserPlus
    },
    {
        id: 3,
        type: 'Projects',
        title: 'Project Milestone Reached',
        description: 'ERP System Migration has reached the "Beta Testing" phase.',
        time: 'Yesterday',
        read: true,
        severity: 'success',
        icon: Briefcase
    },
    {
        id: 4,
        type: 'Billing',
        title: 'Invoice Overdue',
        description: 'Invoice #INV-2403 for GlobalEdge Ltd is 10 days past due.',
        time: '2 days ago',
        read: false,
        severity: 'danger',
        icon: CreditCard
    },
    {
        id: 5,
        type: 'Assets',
        title: 'Maintenance Alert',
        description: 'Regular server maintenance scheduled for tonight at 11:59 PM.',
        time: '3 days ago',
        read: true,
        severity: 'info',
        icon: ShieldAlert
    },
    {
        id: 6,
        type: 'HR',
        title: 'Leave Request Approved',
        description: 'Your leave request for April 15-18 has been approved by HR.',
        time: '4 days ago',
        read: true,
        severity: 'success',
        icon: FileText
    },
    {
        id: 7,
        type: 'Billing',
        title: 'Payment Received',
        description: 'Payment of ₹1,48,000 received from Delta Dynamics.',
        time: '1 week ago',
        read: true,
        severity: 'success',
        icon: CreditCard
    }
];
