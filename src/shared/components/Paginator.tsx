import React, { useMemo } from "react";

interface PaginatorProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;

  /** Apariencia opcional. Ahora por defecto usa el estilo "grayRounded" (modelo). */
  appearance?: "default" | "grayRounded";
  /** Muestra botones anterior/siguiente. */
  showArrows?: boolean;
  /** Clases extra para el contenedor. Si lo pasas, se añaden al final. */
  containerClassName?: string;
}

const Paginator: React.FC<PaginatorProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  // ✅ CAMBIO: por defecto usamos el estilo modelo
  appearance = "grayRounded",
  showArrows = false,
  containerClassName = "",
}) => {
  const pages = useMemo<(number | string)[]>(() => {
    const out: (number | string)[] = [];
    if (totalPages <= 0) return out;

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) out.push(i);
    } else {
      if (currentPage <= 3) {
        out.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        out.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        out.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
      }
    }
    return out;
  }, [currentPage, totalPages]);

  const isGray = appearance === "grayRounded";

  // ===== ✅ TU MODELO EXACTO =====
  const MODEL_WRAP =
    "flex flex-wrap items-center justify-center sm:justify-end gap-2 border-b-[4px] border-gray90 py-3 px-3 mt-2";
  const MODEL_BTN_BASE =
    "w-8 h-8 flex items-center justify-center rounded bg-gray10 text-gray70 hover:bg-gray20 border-0 outline-none " +
    "disabled:opacity-50 disabled:hover:bg-gray10 disabled:cursor-not-allowed";
  const MODEL_BTN_ACTIVE = "bg-gray90 text-white hover:bg-gray90";
  const MODEL_DOTS = "px-2 text-gray70 select-none";

  // ===== Default (si alguna vez lo quieres mantener) =====
  const DEFAULT_WRAP = "flex items-center gap-2 text-sm p-1";
  const DEFAULT_BTN_BASE =
    "px-2 py-1 border rounded w-7 h-7 text-center transition-colors";
  const DEFAULT_BTN_ACTIVE = "bg-orange-500 text-white";
  const DEFAULT_DOTS =
    "px-2 py-1 text-gray-500 select-none w-7 h-7 text-center";

  const wrapCls = [
    isGray ? MODEL_WRAP : DEFAULT_WRAP,
    containerClassName,
  ]
    .filter(Boolean)
    .join(" ");

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
              ? MODEL_BTN_BASE
              : `${DEFAULT_BTN_BASE} ${
                  prevDisabled ? "opacity-50 cursor-not-allowed" : ""
                }`
          }
        >
          &lt;
        </button>
      )}

      {pages.map((p, i) =>
        typeof p === "number" ? (
          <button
            type="button"
            key={`p-${p}-${i}`}
            onClick={() => onPageChange(p)}
            aria-current={p === currentPage ? "page" : undefined}
            disabled={false}
            className={
              isGray
                ? [
                    MODEL_BTN_BASE,
                    p === currentPage ? MODEL_BTN_ACTIVE : "",
                  ].join(" ")
                : `${DEFAULT_BTN_BASE} ${
                    p === currentPage ? DEFAULT_BTN_ACTIVE : ""
                  }`
            }
          >
            {p}
          </button>
        ) : (
          <span key={`dots-${i}`} className={isGray ? MODEL_DOTS : DEFAULT_DOTS}>
            {p}
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
              ? MODEL_BTN_BASE
              : `${DEFAULT_BTN_BASE} ${
                  nextDisabled ? "opacity-50 cursor-not-allowed" : ""
                }`
          }
        >
          &gt;
        </button>
      )}
    </nav>
  );
};

export default Paginator;
