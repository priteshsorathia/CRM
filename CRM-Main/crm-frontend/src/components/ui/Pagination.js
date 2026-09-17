// src/components/ui/Pagination.js
import React from 'react';

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  showPageNumbers = true,
  showItemsPerPage = true,
  className = '',
}) {

//     currentPage: Number,      // Current active page
// totalPages: Number,       // Total number of pages
// onPageChange: Function,   // Handler for page changes
// itemsPerPage: Number,     // Current items per page (optional)
// onItemsPerPageChange: Function, // Handler for items per page change (optional)
// showPageNumbers: Boolean, // Toggle page numbers visibility (default: true)
// showItemsPerPage: Boolean,// Toggle items per page selector (default: true)
// className: String         // Additional CSS classes

  // Calculate visible page numbers with windowing
  const getVisiblePages = () => {
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust if we're at the beginning or end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={`flex flex-col sm:flex-row justify-between items-center gap-4 ${className}`}>
      {showItemsPerPage && onItemsPerPageChange && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Items per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="pl-3 pr-8 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-1">
        <NavButton
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="First page"
        >
          &laquo;
        </NavButton>

        <NavButton
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          &lsaquo;
        </NavButton>

        {showPageNumbers && (
          <>
            {visiblePages[0] > 1 && (
              <span className="px-2 py-1 text-gray-500">...</span>
            )}

            {visiblePages.map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-3 py-1 text-sm min-w-[2.5rem] rounded-md ${
                  currentPage === page
                    ? 'bg-primary-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            ))}

            {visiblePages[visiblePages.length - 1] < totalPages && (
              <span className="px-2 py-1 text-gray-500">...</span>
            )}
          </>
        )}

        <NavButton
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          &rsaquo;
        </NavButton>

        <NavButton
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Last page"
        >
          &raquo;
        </NavButton>
      </div>
    </div>
  );
}

function NavButton({ children, onClick, disabled, ariaLabel }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1 border border-gray-300 rounded-md ${
        disabled ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'
      }`}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}


// Basic Usage:
// <Pagination
//   currentPage={currentPage}
//   totalPages={totalPages}
//   onPageChange={setCurrentPage}
// />

// With Items Per Page Selector:
// <Pagination
//   currentPage={currentPage}
//   totalPages={totalPages}
//   onPageChange={setCurrentPage}
//   itemsPerPage={itemsPerPage}
//   onItemsPerPageChange={setItemsPerPage}
// />

// Minimal Version (Just Prev/Next):
// <Pagination
//   currentPage={currentPage}
//   totalPages={totalPages}
//   onPageChange={setCurrentPage}
//   showPageNumbers={false}
//   showItemsPerPage={false}
// />