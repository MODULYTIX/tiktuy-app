import React from 'react';

interface PaginatorProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Paginator: React.FC<PaginatorProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const visiblePages = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(
          1,
          '...',
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        pages.push(
          1,
          '...',
          currentPage - 1,
          currentPage,
          currentPage + 1,
          '...',
          totalPages
        );
      }
    }
    return pages;
  };

  return (
    <nav className="flex items-center gap-1 text-sm p-1">
      {visiblePages().map((page, i) =>
        typeof page === 'number' ? (
          <button
            key={i}
            onClick={() => onPageChange(page)}
            className={`px-2 py-1 border rounded w-7 h-7 text-center ${
              page === currentPage ? 'bg-orange-500 text-white' : ''
            }`}>
            {page}
          </button>
        ) : (
          <span
            key={i}
            className="px-2 py-1 text-gray-500 select-none w-7 h-7 text-center">
            …
          </span>
        )
      )}
    </nav>
  );
};

export default Paginator;
