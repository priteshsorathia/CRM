'use client';
import { createContext, useContext, useState } from 'react';

const DashboardContext = createContext();

export function DashboardProvider({ children }) {
  const [timeframe, setTimeframe] = useState('week');
  const [chartType, setChartType] = useState('line');

  return (
    <DashboardContext.Provider value={{
      timeframe,
      setTimeframe,
      chartType,
      setChartType
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}