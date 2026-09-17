import React from "react";

export default function PrevNextPager({
  page,
  pages,
  onPageChange,
  loading = false,
  className = "",
  compact = false,
  border = "top",
}) {
  const safePages = Math.max(1, Number(pages) || 1);
  const safePage = Math.min(safePages, Math.max(1, Number(page) || 1));

  const prevDisabled = loading || safePage <= 1;
  const nextDisabled = loading || safePage >= safePages;
  const borderClass =
    border === "none"
      ? ""
      : border === "both"
        ? "border-y border-gray-200"
        : "border-t border-gray-200";

  return (
    <div
      className={[
        "flex items-center justify-between",
        borderClass,
        compact ? "px-4 py-3" : "px-6 py-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="text-sm text-gray-500">
        Page {safePage} of {safePages}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={prevDisabled}
          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(safePages, safePage + 1))}
          disabled={nextDisabled}
          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
