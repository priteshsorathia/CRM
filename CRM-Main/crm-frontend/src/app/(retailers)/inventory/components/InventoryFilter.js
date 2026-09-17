"use client";
import { FiFilter } from "react-icons/fi";
import { useState, useEffect } from "react";

// Custom select wrapper with animated up/down arrow
function SelectField({ label, value, onChange, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer transition-all"
        >
          {children}
        </select>
        {/* Animated chevron */}
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>
    </div>
  );
}

export default function FilterBar({
  searchTerm,
  setSearchTerm,
  stockFilter,
  setStockFilter,
  categoryFilter,
  setCategoryFilter,
  brandFilter,
  setBrandFilter,
  sortBy,
  setSortBy,
  itemsPerPage,
  setItemsPerPage,
  applyFilters,
  resetFilters,
  shopId,
  filtersData = {},
}) {
  const [localCategories, setLocalCategories] = useState([]);
  const [localBrands, setLocalBrands] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Update local state when filtersData changes
  useEffect(() => {
    if (filtersData.categories) setLocalCategories(filtersData.categories);
    if (filtersData.brands) setLocalBrands(filtersData.brands);
  }, [filtersData]);

  const handleReset = () => {
    setSearchTerm("");
    setStockFilter("");
    setCategoryFilter("");
    setBrandFilter("");
    setSortBy("name_asc");
    setItemsPerPage(10);
    resetFilters();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") applyFilters();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-3 sm:p-5 mb-4 sm:mb-6 border border-gray-100">
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {/* Search Input - Always Visible */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by item name, code or barcode"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.trimStart())}
              onBlur={() => setSearchTerm(searchTerm.trim())}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <FiFilter className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base" />
          </div>
          {/* Mobile Toggle Button */}
          <button
            type="button"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={`sm:hidden p-2.5 rounded-xl border transition-all ${
              showMobileFilters
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-white border-gray-200 text-gray-700"
            }`}
          >
            <FiFilter className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Grid - Collapsible on Mobile */}
        <div
          className={`${
            showMobileFilters ? "block" : "hidden"
          } sm:block space-y-4 animate-in fade-in slide-in-from-top-2 duration-200`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <SelectField
              label="Stock Status"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
            >
              <option value="">All Stock</option>
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="low_stock">Low Stock</option>
            </SelectField>

            <SelectField
              label="Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {localCategories.map((category, index) => (
                <option key={index} value={category}>
                  {category}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Brand"
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
            >
              <option value="">All Brands</option>
              {localBrands.map((brand, index) => (
                <option key={index} value={brand}>
                  {brand}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Sort By"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name_asc">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
              <option value="price_high">Price High</option>
              <option value="price_low">Price Low</option>
              <option value="stock_high">Stock High</option>
              <option value="stock_low">Stock Low</option>
            </SelectField>

            <SelectField
              label="Show"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
            >
              <option value="5">5 Items</option>
              <option value="10">10 Items</option>
              <option value="20">20 Items</option>
              <option value="50">50 Items</option>
            </SelectField>
          </div>

          {/* Reset Button */}
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