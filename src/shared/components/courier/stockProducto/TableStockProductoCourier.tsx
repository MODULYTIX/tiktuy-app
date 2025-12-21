// src/role/courier/components/TableStockProductoCourier.tsx
import { useEffect, useMemo, useState } from "react";
import { FaBoxOpen } from "react-icons/fa";
import type { Producto } from "@/services/courier/producto/productoCourier.type";
import type { StockFilters } from "@/role/courier/pages/StockProducto";
import Badgex from "@/shared/common/Badgex";
import TableActionx from "@/shared/common/TableActionx";

// ---- utilidades
function toNumber(n: unknown) {
  if (n == null) return 0;
  if (typeof n === "number") return n;
  const s = String(n).replace(/,/g, ".");
  const v = Number(s);
  return Number.isFinite(v) ? v : 0;
}
function formatPEN(n: number) {
  return n.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ---- paginación del modelo base
const PAGE_SIZE = 5;

interface Props {
  data: Producto[];
  filters: StockFilters;
  loading?: boolean;
  error?: string | null;
  /** callback opcional al hacer clic en el ojo */
  onView?: (row: Producto) => void;
}

// ---- Thumb (Miniatura de imagen)
const Thumb = ({ url, alt }: { url?: string | null; alt: string }) => {
  return url ? (
    <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
      <img
        src={url}
        alt={alt}
        className="w-full h-full object-cover"
        draggable={false}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  ) : (
    <div className="w-12 h-12 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-[14px]">
      <span className="opacity-60">📦</span>
    </div>
  );
};

export default function TableStockProductoCourier({
  data,
  filters,
  loading,
  error,
  onView,
}: Props) {
  const [page, setPage] = useState(1);

  // Filtros + ordenamiento
  const filtered = useMemo(() => {
    let arr = [...data];

    // Búsqueda
    const q = filters.q.trim().toLowerCase();
    if (q) {
      arr = arr.filter((p) => {
        const nombre = p.nombre_producto?.toLowerCase() || "";
        const desc = p.descripcion?.toLowerCase() || "";
        const codigo = p.codigo_identificacion?.toLowerCase() || "";
        return (
          nombre.includes(q) ||
          desc.includes(q) ||
          codigo.includes(q)
        );
      });
    }

    // Ecommerce origen (NUEVO - CORRECTO)
    if (filters.ecommerceOrigenId) {
      arr = arr.filter(
        (p) =>
          String(p.ecommerce_origen_id) ===
          filters.ecommerceOrigenId
      );
    }

    // Categoría
    if (filters.categoriaId) {
      arr = arr.filter(
        (p) => String(p.categoria_id) === filters.categoriaId
      );
    }

    // Estado
    if (filters.estado) {
      arr = arr.filter(
        (p) => (p.estado?.nombre || "") === filters.estado
      );
    }

    // Stock bajo
    if (filters.stockBajo) {
      arr = arr.filter(
        (p) => (p.stock ?? 0) <= (p.stock_minimo ?? 0)
      );
    }

    // Orden por precio
    if (filters.precioOrden) {
      arr.sort((a, b) => {
        const pa = toNumber(a.precio);
        const pb = toNumber(b.precio);
        return filters.precioOrden === "asc"
          ? pa - pb
          : pb - pa;
      });
    }

    return arr;
  }, [data, filters]);


  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => setPage(1), [filters]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const currentData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const pagerItems = useMemo(() => {
    const maxButtons = 5;
    const pages: (number | string)[] = [];

    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, page - 2);
      let end = Math.min(totalPages, page + 2);

      if (page <= 3) {
        start = 1;
        end = maxButtons;
      } else if (page >= totalPages - 2) {
        start = totalPages - (maxButtons - 1);
        end = totalPages;
      }

      for (let i = start; i <= end; i++) pages.push(i);
      if (start > 1) {
        pages.unshift("...");
        pages.unshift(1);
      }
      if (end < totalPages) {
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  }, [page, totalPages]);

  const emptyRows = Math.max(0, PAGE_SIZE - currentData.length);

  // STOCK con el MISMO formato del código base (badge + texto abajo)
  const renderStock = (p: Producto) => {
    const isInvalid = p.stock == null || p.stock_minimo == null;

    if (isInvalid) {
      return <span className="text-xs text-red-500">Datos no disponibles</span>;
    }

    const stock = toNumber(p.stock);
    const minimo = toNumber(p.stock_minimo);

    // igualito al base: "bajo" cuando stock < mínimo
    const bajo = stock < minimo;
    const bg = bajo
      ? "bg-yellow-100 text-yellow-700"
      : "bg-green-100 text-green-700";

    const texto = bajo ? "Stock bajo" : "Stock normal";

    return (
      <div className="flex flex-col items-start gap-1">
        <span
          className={`${bg} text-xs px-2 py-1 rounded inline-flex items-center gap-1`}
        >
          <FaBoxOpen className="text-[14px]" />
          {stock}
        </span>
        <div className="text-xs text-gray-500">{texto}</div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-md overflow-hidden shadow-default">
      {loading && (
        <div className="px-4 py-3 text-sm text-gray-500">
          Cargando productos…
        </div>
      )}
      {error && !loading && (
        <div className="px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {!loading && !error && (
        <section className="flex-1 overflow-auto">
          <div className="overflow-x-auto bg-white">
            <table className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30 rounded-t-md">
              <colgroup>
                <col className="w-[8%]" /> {/* Miniatura */}
                <col className="w-[12%]" /> {/* Código */}
                <col className="w-[32%]" /> {/* Producto */}
                <col className="w-[18%]" /> {/* Sede */}
                <col className="w-[14%]" /> {/* Stock */}
                <col className="w-[12%]" /> {/* Precio */}
                <col className="w-[6%]" /> {/* Estado */}
                <col className="w-[6%]" /> {/* Acciones */}
              </colgroup>

              <thead className="bg-[#E5E7EB]">
                <tr className="text-gray70 font-roboto font-medium">
                  <th className="px-4 py-3 text-left"></th>
                  <th className="px-4 py-3 text-left">Código</th>
                  <th className="px-4 py-3 text-left">Producto</th>
                  <th className="px-4 py-3 text-left">Sede</th>
                  <th className="px-4 py-3 text-left">Stock</th>
                  <th className="px-4 py-3 text-right">Precio</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray20">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-4 text-center text-gray70 italic"
                    >
                      No hay productos para mostrar.
                    </td>
                  </tr>
                ) : (
                  <>
                    {currentData.map((p) => {
                      const precioNum = toNumber(p.precio);

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-gray10 transition-colors"
                        >
                          {/* Miniatura */}
                          <td className="px-4 py-3 align-middle">
                            <Thumb url={p.imagen_url} alt={p.nombre_producto} />
                          </td>

                          <td className="px-4 py-3 text-gray70 font-normal">
                            {p.codigo_identificacion}
                          </td>

                          <td className="px-4 py-3 text-gray70 font-normal">
                            <div className="font-semibold">
                              {p.nombre_producto}
                            </div>
                            {p.descripcion && (
                              <div className="text-gray-500 text-xs line-clamp-2">
                                {p.descripcion}
                              </div>
                            )}
                            {p.categoria?.nombre && (
                              <div className="text-gray-400 text-[11px]">
                                Categoría: {p.categoria.nombre}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3 text-gray70 font-normal">
                            {p.almacenamiento?.nombre_almacen || (
                              <span className="italic text-gray-400">-</span>
                            )}
                          </td>

                          {/* aquí ya queda con el formato del stock del código base */}
                          <td className="px-4 py-3">{renderStock(p)}</td>

                          <td className="px-4 py-3 text-right text-gray70 font-normal">
                            S/. {formatPEN(precioNum)}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <Badgex
                              className={
                                p.estado?.nombre === "Activo"
                                  ? "bg-black text-white"
                                  : "bg-gray30 text-gray80"
                              }
                            >
                              {p.estado?.nombre || "-"}
                            </Badgex>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center">
                              <TableActionx
                                variant="view"
                                title={`Ver ${p.nombre_producto}`}
                                onClick={
                                  typeof onView === "function"
                                    ? () => onView(p)
                                    : undefined
                                }
                                disabled={typeof onView !== "function"}
                                size="sm"
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {emptyRows > 0 &&
                      Array.from({ length: emptyRows }).map((_, idx) => (
                        <tr
                          key={`empty-${idx}`}
                          className="hover:bg-transparent"
                        >
                          {Array.from({ length: 8 }).map((__, i) => (
                            <td key={i} className="px-4 py-3">
                              &nbsp;
                            </td>
                          ))}
                        </tr>
                      ))}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="flex items-center justify-end gap-2 border-b-[4px] border-gray90 py-3 px-3 mt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
              >
                &lt;
              </button>

              {pagerItems.map((p, i) =>
                typeof p === "string" ? (
                  <span key={`dots-${i}`} className="px-2 text-gray70">
                    {p}
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    aria-current={page === p ? "page" : undefined}
                    className={[
                      "w-8 h-8 flex items-center justify-center rounded",
                      page === p
                        ? "bg-gray90 text-white"
                        : "bg-gray10 text-gray70 hover:bg-gray20",
                    ].join(" ")}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
              >
                &gt;
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
