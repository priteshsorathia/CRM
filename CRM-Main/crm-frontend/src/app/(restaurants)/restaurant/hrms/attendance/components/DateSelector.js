'use client';
import BackButton from '@/components/BackButton';

export default function DateSelector({ selectedDate, isToday, onDateChange, maxDate }) {
  return (
    <div className="flex flex-row items-center justify-between gap-2 sm:gap-4">
      {/* Date section - left side */}
      <div className="flex flex-col xs:flex-row items-center gap-2">
        <label htmlFor="date" className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-tight">Date:</label>
        <div className="relative group">
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            max={maxDate}
            className="px-3 py-1.5 sm:py-2 border-2 border-gray-100 rounded-lg text-xs sm:text-sm font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all cursor-pointer bg-white"
          />
          {isToday && (
            <span className="absolute -top-2 -right-2 bg-blue-600 text-white px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter shadow-sm ring-1 ring-white">
              Today
            </span>
          )}
        </div>
      </div>

      {/* Back button - right side */}
      <BackButton />
    </div>
  );
}
