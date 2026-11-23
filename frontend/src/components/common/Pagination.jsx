import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AppSelect from './AppSelect';

export default function Pagination({ pagination, onPageChange, onLimitChange }) {
  if (!pagination) return null;

  const { page = 1, limit = 10, total = 0, totalPages = 1 } = pagination;

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Generate page numbers
  const pages = [];
  const maxButtons = 5;
  let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 bg-white border-t border-slate-100 rounded-b-xl text-sm">
      {/* Limit & Info */}
      <div className="flex items-center gap-3 text-slate-500 text-xs sm:text-sm">
        <span>Menampilkan</span>
        <div className="w-20">
          <AppSelect
            value={limit}
            onChange={(val) => onLimitChange(Number(val))}
            options={[
              { value: 10, label: '10' },
              { value: 25, label: '25' },
              { value: 50, label: '50' },
              { value: 100, label: '100' },
            ]}
            isSearchable={false}
            menuPlacement="top"
            styles={{
              control: (base) => ({
                ...base,
                minHeight: '28px',
                height: '28px',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                padding: '0 2px',
              }),
              valueContainer: (base) => ({
                ...base,
                padding: '0 6px',
              }),
              dropdownIndicator: (base) => ({
                ...base,
                padding: '2px',
              }),
            }}
          />
        </div>
        <span>
          dari <strong className="font-semibold text-slate-700">{total}</strong> data
          ({startItem}-{endItem})
        </span>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Halaman Sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="h-8 min-w-[32px] px-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50"
            >
              1
            </button>
            {startPage > 2 && <span className="text-slate-400 px-1">...</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-semibold transition-colors ${
              p === page
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {p}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-slate-400 px-1">...</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              className="h-8 min-w-[32px] px-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Halaman Berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
