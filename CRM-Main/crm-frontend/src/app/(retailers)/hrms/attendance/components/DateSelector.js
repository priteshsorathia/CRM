'use client';

export default function DateSelector({ 
  selectedDate, 
  endDate, 
  onRangeChange, 
  maxDate 
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
      <div className="flex flex-col w-full sm:w-40">
        <label className="text-[10px] text-gray-400 mb-1 ml-1 uppercase font-bold tracking-wider">From</label>
        <input
          type="date"
          required
          value={selectedDate}
          max={maxDate}
          onChange={(e) => onRangeChange(e.target.value, endDate)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full font-medium transition-all bg-gray-50/50"
        />
      </div>
      <div className="flex flex-col w-full sm:w-40">
        <label className="text-[10px] text-gray-400 mb-1 ml-1 uppercase font-bold tracking-wider">To</label>
        <input
          type="date"
          required
          value={endDate}
          min={selectedDate}
          max={maxDate}
          onChange={(e) => onRangeChange(selectedDate, e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full font-medium transition-all bg-gray-50/50"
        />
      </div>
    </div>
  );
}
