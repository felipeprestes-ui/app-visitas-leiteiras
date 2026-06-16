interface PaginationProps {
  page: number;
  pageCount: number;
  onPage: (p: number) => void;
}

export function Pagination({ page, pageCount, onPage }: PaginationProps) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: Math.min(pageCount, 7) }, (_, i) => {
    if (pageCount <= 7) return i + 1;
    if (page <= 4) return i + 1;
    if (page >= pageCount - 3) return pageCount - 6 + i;
    return page - 3 + i;
  });

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
        className="px-2 py-1 text-sm rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ‹
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPage(p)}
          className={`px-3 py-1 text-sm rounded border transition-colors ${
            p === page
              ? 'bg-primary text-white border-primary'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {p}
        </button>
      ))}
      <button
        disabled={page === pageCount}
        onClick={() => onPage(page + 1)}
        className="px-2 py-1 text-sm rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ›
      </button>
    </div>
  );
}
