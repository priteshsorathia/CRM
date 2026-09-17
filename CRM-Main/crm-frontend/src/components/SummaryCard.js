'use client';
import { 
  FaRupeeSign, FaCalendarDay, FaCalendarWeek, FaCalendarAlt,
  FaUsers, FaFileInvoiceDollar, FaMoneyBillWave, FaClock, FaUserCheck
} from "react-icons/fa";
import { useDashboard } from '@/app/(retailers)/context/DashboardContext';

const iconMap = {
  "rupee": FaRupeeSign,
  "calendar-day": FaCalendarDay,
  "calendar-week": FaCalendarWeek,
  "calendar": FaCalendarAlt,
  "users": FaUsers,
  "invoice": FaFileInvoiceDollar,
  "payment": FaMoneyBillWave,
  "clock": FaClock,
  "attendance": FaUserCheck
};

const colorMap = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", iconBg: "bg-blue-100", border: "border-blue-200" },
  green: { bg: "bg-green-50", text: "text-green-600", iconBg: "bg-green-100", border: "border-green-200" },
  yellow: { bg: "bg-yellow-50", text: "text-yellow-600", iconBg: "bg-yellow-100", border: "border-yellow-200" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", iconBg: "bg-purple-100", border: "border-purple-200" },
  red: { bg: "bg-red-50", text: "text-red-600", iconBg: "bg-red-100", border: "border-red-200" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600", iconBg: "bg-indigo-100", border: "border-indigo-200" }
};

export default function SummaryCard({ 
  title, value, icon = "rupee", color = "blue", currency = true, timeframe, onClick 
}) {
  const { timeframe: activeTimeframe } = useDashboard();
  const Icon = iconMap[icon] || FaRupeeSign;
  const colors = colorMap[color] || colorMap.blue;
  
  const isActive = activeTimeframe === timeframe;

  const formattedValue = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(value || 0);

  return (
    <div 
      onClick={onClick}
      className={`${colors.bg} rounded-lg p-4 shadow-sm flex flex-col h-full border-2 ${
        isActive ? `${colors.border} ring-2 ring-opacity-100 ${colors.text}` : 'border-gray-200'
      } transition-all duration-200 cursor-pointer hover:shadow-md`}
      title={`Show ${timeframe} data`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${colors.iconBg} ${colors.text}`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h3 className="text-sm sm:text-sm font-medium text-gray-500">{title}</h3>
        </div>
        {isActive && (
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
        )}
      </div>
      <p className="text-lg sm:text-2xl font-semibold text-gray-900 mt-auto">
        {currency ? `₹${formattedValue}` : formattedValue}
      </p>
    </div>
  );
}