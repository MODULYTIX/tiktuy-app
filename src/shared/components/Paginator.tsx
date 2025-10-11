import React, { useMemo } from 'react';

interface PaginatorProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;

  /** Apariencia opcional. Por defecto mantiene el estilo actual (naranja). */
  appearance?: 'default' | 'grayRounded';
  /** Muestra botones anterior/siguiente. Por defecto no se muestran (no cambia tus tablas). */
  showArrows?: boolean;
  /** Clases extra para el contenedor, por si quieres alinearlo o añadir bordes fuera. */
  containerClassName?: string;
}

const Paginator: React.FC<PaginatorProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  appearance = 'default',
  showArrows = false,
  containerClassName = '',
}) => {
  const pages = useMemo<(number | string)[]>(() => {
    const out: (number | string)[] = [];
    if (totalPages <= 0) return out;

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) out.push(i);
    } else {
      if (currentPage <= 3) {
        out.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        out.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        out.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return out;
  }, [currentPage, totalPages]);

  const isGray = appearance === 'grayRounded';

  const wrapCls = [
    'flex items-center gap-2 text-sm',
    // en tus otras tablas era: "flex items-center gap-1 text-sm p-1"
    // mantenemos el padding como opcional via containerClassName
    containerClassName || (isGray ? '' : 'p-1'),
  ].join(' ');

  const btnBaseDefault =
    'px-2 py-1 border rounded w-7 h-7 text-center transition-colors';
  const btnActiveDefault = 'bg-orange-500 text-white';
  const btnInactiveDefault = '';

  const btnBaseGray =
    'w-8 h-8 flex items-center justify-center rounded transition-colors';
  const btnActiveGray = 'bg-gray90 text-white';
  const btnInactiveGray = 'bg-gray10 text-gray70 hover:bg-gray20';

  const dotsCls = isGray ? 'px-2 text-gray70 select-none w-7 h-7 text-center' : 'px-2 py-1 text-gray-500 select-none w-7 h-7 text-center';

  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  return (
    <nav className={wrapCls} role="navigation" aria-label="Paginación">
      {showArrows && (
        <button
          type="button"
          onClick={() => !prevDisabled && onPageChange(currentPage - 1)}
          disabled={prevDisabled}
          aria-label="Página anterior"
          className={
            isGray
              ? `${btnBaseGray} ${prevDisabled ? 'opacity-50 cursor-not-allowed' : btnInactiveGray}`
              : `${btnBaseDefault} ${prevDisabled ? 'opacity-50 cursor-not-allowed' : btnInactiveDefault}`
          }
        >
          &lt;
        </button>
      )}

      {pages.map((p, i) =>
        typeof p === 'number' ? (
          <button
            type="button"
            key={`p-${p}-${i}`}
            onClick={() => onPageChange(p)}
            aria-current={p === currentPage ? 'page' : undefined}
            className={
              isGray
                ? `${btnBaseGray} ${p === currentPage ? btnActiveGray : btnInactiveGray}`
                : `${btnBaseDefault} ${p === currentPage ? btnActiveDefault : btnInactiveDefault}`
            }
          >
            {p}
          </button>
        ) : (
          <span key={`dots-${i}`} className={dotsCls} aria-hidden="true">
            …
          </span>
        )
      )}

      {showArrows && (
        <button
          type="button"
          onClick={() => !nextDisabled && onPageChange(currentPage + 1)}
          disabled={nextDisabled}
          aria-label="Página siguiente"
          className={
            isGray
              ? `${btnBaseGray} ${nextDisabled ? 'opacity-50 cursor-not-allowed' : btnInactiveGray}`
              : `${btnBaseDefault} ${nextDisabled ? 'opacity-50 cursor-not-allowed' : btnInactiveDefault}`
          }
        >
          &gt;
        </button>
      )}
    </nav>
  );
};

export default Paginator;
