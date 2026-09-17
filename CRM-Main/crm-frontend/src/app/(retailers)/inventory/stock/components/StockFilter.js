import { FiFilter } from "react-icons/fi";
import DatePicker from "react-flatpickr";
import "flatpickr/dist/themes/light.css";
import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export default function StockFilter({ 
  searchTerm, 
  setSearchTerm, 
  dateFrom, 
  setDateFrom, 
  dateTo, 
  setDateTo, 
  itemFilter, 
  setItemFilter, 
  stockTypeFilter, 
  setStockTypeFilter, 
  sortBy, 
  setSortBy, 
  applyFilters, 
  resetFilters,
  shopId,
  filtersData = {} // Receive filter options from parent
}) {
  const [localItems, setLocalItems] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [dropdownStates, setDropdownStates] = useState({
    itemFilter: false,
    stockTypeFilter: false,
    sortBy: false,
  });

  const handleDropdownClick = (name) => {
    setDropdownStates(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleDropdownBlur = (name) => {
    setDropdownStates(prev => ({ ...prev, [name]: false }));
  };

  const handleDropdownChange = (name) => {
    setDropdownStates(prev => ({ ...prev, [name]: false }));
  };

  // Update local state when filtersData changes
  useEffect(() => {
    if (filtersData.items) {
      setLocalItems(filtersData.items);
    }
  }, [filtersData]);

  const handleReset = () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
    setItemFilter("");
    setStockTypeFilter("");
    setSortBy("newest");
    resetFilters();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-3 sm:p-5 mb-4 sm:mb-6 border border-gray-100">
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {/* Search Input - Always Visible */}
        <div className="flex gap-2">
            <div className="relative flex-1">
                <input
                    type="text"
                    placeholder="Search by item name or code"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value.trimStart())}
                    onBlur={() => setSearchTerm(searchTerm.trim())}
                    onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                    className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <FiFilter className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base" />
            </div>
            
            {/* Mobile Toggle Button */}
            <button 
                type="button"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className={`sm:hidden p-2.5 rounded-xl border transition-all ${showMobileFilters ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-700'}`}
            >
                <FiFilter className="w-5 h-5" />
            </button>
        </div>

        {/* Filters Grid - Collapsible on Mobile */}
        <div className={`${showMobileFilters ? 'block' : 'hidden'} sm:block space-y-4 animate-in fade-in slide-in-from-top-2 duration-200`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Date From */}
            <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                Date From
                </label>
                <DatePicker
                options={{ 
                    dateFormat: "Y-m-d", 
                    maxDate: new Date(),
                    onChange: function(selectedDates, dateStr) {
                    setDateFrom(dateStr);
                    }
                }}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={dateFrom}
                placeholder="Select date"
                />
            </div>

            {/* Date To */}
            <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                Date To
                </label>
                <DatePicker
                options={{ 
                    dateFormat: "Y-m-d", 
                    maxDate: new Date(),
                    minDate: dateFrom || undefined,
                    onChange: function(selectedDates, dateStr) {
                    setDateTo(dateStr);
                    }
                }}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={dateTo}
                placeholder="Select date"
                />
            </div>

            {/* Item Filter */}
            <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                Item
                </label>
                <div className="relative">
                  <select
                  value={itemFilter}
                  onChange={(e) => {
                    setItemFilter(e.target.value);
                    handleDropdownChange('itemFilter');
                  }}
                  onClick={() => handleDropdownClick('itemFilter')}
                  onBlur={() => handleDropdownBlur('itemFilter')}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none bg-none pr-10"
                  >
                  <option value="">All Items</option>
                  {localItems.map(item => (
                      <option key={item.id} value={item.id}>
                      {item.item_name} ({item.item_code})
                      </option>
                  ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${dropdownStates.itemFilter ? 'rotate-180' : ''}`} />
                  </div>
                </div>
            </div>

            {/* Stock Type Filter */}
            <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                Stock Type
                </label>
                <div className="relative">
                  <select
                  value={stockTypeFilter}
                  onChange={(e) => {
                    setStockTypeFilter(e.target.value);
                    handleDropdownChange('stockTypeFilter');
                  }}
                  onClick={() => handleDropdownClick('stockTypeFilter')}
                  onBlur={() => handleDropdownBlur('stockTypeFilter')}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none bg-none pr-10"
                  >
                  <option value="">All Types</option>
                  <option value="in">Stock In</option>
                  <option value="out">Stock Out</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${dropdownStates.stockTypeFilter ? 'rotate-180' : ''}`} />
                  </div>
                </div>
            </div>

            {/* Sort By */}
            <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                Sort By
                </label>
                <div className="relative">
                  <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    handleDropdownChange('sortBy');
                  }}
                  onClick={() => handleDropdownClick('sortBy')}
                  onBlur={() => handleDropdownBlur('sortBy')}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none bg-none pr-10"
                  >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name_asc">Name A-Z</option>
                  <option value="name_desc">Name Z-A</option>
                  <option value="quantity_high">Highest Quantity</option>
                  <option value="quantity_low">Lowest Quantity</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${dropdownStates.sortBy ? 'rotate-180' : ''}`} />
                  </div>
                </div>
            </div>
            </div>

            {/* Filter Action Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={handleReset}
                    className="flex-1 sm:flex-none px-6 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition flex items-center justify-center"
                >
                    Reset
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}