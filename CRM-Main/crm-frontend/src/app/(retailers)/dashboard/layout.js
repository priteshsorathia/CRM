'use client';
import { DashboardProvider } from '@/app/(retailers)/context/DashboardContext';

export default function DashboardLayout({ children }) {
  return (
    <DashboardProvider>
      {children}
    </DashboardProvider>
  );
}