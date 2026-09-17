'use client';

export default function SummaryCard({ title, value, bgColor = 'bg-white', icon }) {
  return (
    <div className={`${bgColor} rounded-xl p-3 sm:p-5 shadow-sm flex flex-col h-full border border-gray-100`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-1 sm:mb-2 gap-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2">
          {icon && (
            <div className={`p-1.5 sm:p-2 rounded-xl bg-white/60 shadow-sm shrink-0 w-fit`}>
              {icon}
            </div>
          )}
          <h3 className="text-[11px] sm:text-sm font-bold text-gray-600 leading-tight sm:line-clamp-1">{title}</h3>
        </div>
      </div>
      <p className="text-base sm:text-2xl font-bold text-gray-900 mt-auto truncate pt-1 text-center w-full">{value}</p>
    </div>
  );
}