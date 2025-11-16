// src/shared/components/ecommerce/movimientos/MovimientoRegistroTable.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { FaEye } from "react-icons/fa";
import { useAuth } from "@/auth/context";
import { fetchProductos } from "@/services/ecommerce/producto/producto.api";
import type { Producto } from "@/services/ecommerce/producto/producto.types";
import type { Filters } from "@/shared/components/ecommerce/movimientos/MovimientoRegistroFilters";
import Badgex from "@/shared/common/Badgex";

interface Props {
  filters: Filters;
  onSelectProducts: (productos: Producto[]) => void;
  onViewProduct?: (producto: Producto) => void; // pasa el objeto completo
}

export default function MovimientoRegistroTable({
  filters,
  onSelectProducts,
  onViewProduct,
}: Props) {
  const { token } = useAuth();

  const [allProductos, setAllProductos] = useState<Producto[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;

  // Carga inicial - filtrando productos inactivos
  useEffect(() => {
    if (!token) return;
    fetchProductos(token)
      .then((rows: unknown) => {
        const list: Producto[] = Array.isArray(rows)
          ? rows
          : Array.isArray((rows as any)?.data)
          ? (rows as any).data
          : [];

        const productosActivos = list.filter(
          (p: Producto) =>
            p.estado?.nombre !== "Inactivo" && Number(p.stock) > 0
        );
        setAllProductos(productosActivos);
      })
      .catch(console.error);
  }, [token]);

  // Comunicar selección hacia arriba
  useEffect(() => {
    const seleccionados = allProductos.filter((p: Producto) =>
      selectedIds.includes(p.uuid)
    );
    onSelectProducts(seleccionados);
  }, [selectedIds, allProductos, onSelectProducts]);

  // ------- Filtrado en memoria -------
  const filtered = useMemo(() => {
    let data: Producto[] = [...allProductos];

    data = data.filter(
      (p: Producto) => p.estado?.nombre !== "Inactivo" && Number(p.stock) > 0
    );

    if (filters.almacenamiento_id) {
      data = data.filter(
        (p: Producto) =>
          String(p.almacenamiento_id ?? "") ===
          String(filters.almacenamiento_id)
      );
    }

    if (filters.categoria_id) {
      data = data.filter(
        (p: Producto) =>
          String((p as any).categoria_id ?? (p as any)?.categoria?.id ?? "") ===
          String(filters.categoria_id)
      );
    }

    if (filters.estado) {
      data = data.filter(
        (p: Producto) =>
          (p.estado?.nombre ?? "").toLowerCase() ===
          filters.estado.toLowerCase()
      );
    }

    const search = (filters.search ?? "").trim();
    if (search) {
      const needle = search.toLowerCase();
      data = data.filter((p: Producto) =>
        (p.nombre_producto ?? "").toLowerCase().includes(needle)
      );
    }

    if (filters.stock_bajo) {
      data = data.filter((p: Producto) => {
        const min =
          typeof (p as any).stock_minimo === "number"
            ? (p as any).stock_minimo
            : 5;
        return Number(p.stock) <= Number(min);
      });
    }

    if (filters.precio_bajo !== filters.precio_alto) {
      const precios = data
        .map((p: Producto) => Number(p.precio))
        .filter((n: number) => !Number.isNaN(n));
      if (precios.length > 0) {
        const sorted = [...precios].sort((a, b) => a - b);
        const p25 = sorted[Math.floor(sorted.length * 0.25)];
        const p75 = sorted[Math.floor(sorted.length * 0.75)];

        if (filters.precio_bajo)
          data = data.filter((p: Producto) => Number(p.precio) <= p25);
        if (filters.precio_alto)
          data = data.filter((p: Producto) => Number(p.precio) >= p75);
      }
    }

    return data;
  }, [allProductos, filters]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const toggleCheckbox = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((uuid) => uuid !== id) : [...prev, id]
    );
  };

  const handleView = (prod: Producto) => {
    if (onViewProduct) onViewProduct(prod);
    else console.warn("onViewProduct no fue proporcionado");
  };

  // Paginador base (5 botones con elipsis)
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

  // Mantener altura constante por página (6 filas)
  const visibleCount = Math.max(1, pageData.length);
  const emptyRows = Math.max(0, pageSize - visibleCount);

  // Definición de widths
  const COLS = useMemo(
    () => [
      "w-[4%]", // checkbox
      "w-[12%]", // Código
      "w-[30%]", // Producto
      "w-[20%]", // Sedes
      "w-[10%]", // Stock
      "w-[8%]", // Precio
      "w-[8%]", // Estado
      "w-[8%]", // Acciones
    ],
    []
  );

  // ✅ NEW: lógica del checkbox maestro (solo página actual)
  const pageIds = useMemo(() => pageData.map((p) => p.uuid), [pageData]);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const somePageSelected =
    !allPageSelected && pageIds.some((id) => selectedIds.includes(id));

  const masterRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (masterRef.current) {
      masterRef.current.indeterminate = somePageSelected; // estado parcial visual
    }
  }, [somePageSelected]);

  const toggleSelectPage = () => {
    setSelectedIds((prev) => {
      if (allPageSelected) {
        // deseleccionar todos los de la página
        return prev.filter((id) => !pageIds.includes(id));
      }
      // seleccionar todos los de la página (mantener los ya fuera de página)
      const set = new Set(prev);
      pageIds.forEach((id) => set.add(id));
      return Array.from(set);
    });
  };
  // ✅ END NEW

  return (
    <div className="bg-white rounded-md overflow-hidden shadow-default">
      <section className="flex-1 overflow-auto">
        <div className="overflow-x-auto bg-white">
          <table className="h-full min-w-full table-fixed text-[12px] bg-white border-b border-gray30 rounded-t-md">
            <colgroup>
              {COLS.map((w, i) => (
                <col key={i} className={w} />
              ))}
            </colgroup>

            <thead className="bg-[#E5E7EB]">
              <tr className="text-gray70 font-roboto font-medium">
                <th className="px-4 py-3 text-left">
                  {/* ✅ NEW: checkbox maestro en header */}
                  <label className="inline-flex items-center gap-2">
                    <input
                      ref={masterRef}
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={toggleSelectPage}
                      disabled={pageIds.length === 0}
                      className="accent-gray-700 cursor-pointer"
                      aria-label="Seleccionar todos los productos de esta página"
                      title="Seleccionar todos (página)"
                    />
                  </label>
                </th>
                <th className="px-4 py-3 text-left">Código</th>
                <th className="px-4 py-3 text-left">Producto</th>
                <th className="px-4 py-3 text-left">Sedes</th>
                <th className="px-4 py-3 text-left">Stock</th>
                <th className="px-4 py-3 text-right">Precio</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody className="h-full divide-y divide-gray20">
              {pageData.map((prod: Producto) => (
                <tr
                  key={prod.uuid}
                  className="hover:bg-gray10 transition-colors"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(prod.uuid)}
                      onChange={() => toggleCheckbox(prod.uuid)}
                      className="accent-gray-700 cursor-pointer"
                      aria-label={`Seleccionar ${
                        prod.nombre_producto ?? "producto"
                      }`}
                    />
                  </td>

                  <td className="px-4 py-3 text-gray70 font-[400]">
                    {prod.codigo_identificacion}
                  </td>

                  <td className="px-4 py-3 text-gray70 font-[400]">
                    <div
                      className="font-semibold w-full overflow-hidden text-ellipsis line-clamp-1"
                      title={prod.nombre_producto ?? undefined}
                    >
                      {prod.nombre_producto ?? "—"}
                    </div>
                    <div
                      className="text-gray-500 text-xs w-full overflow-hidden text-ellipsis line-clamp-1"
                      title={prod.descripcion ?? undefined}
                    >
                      {prod.descripcion ?? "—"}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-gray70 font-[400]">
                    {prod.almacenamiento?.nombre_almacen || (
                      <span className="text-gray-400 italic">No asignado</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-gray70 font-[400]">
                    {prod.stock}
                  </td>

                  <td className="px-4 py-3 text-right text-gray70 font-[400]">
                    S/ {Number(prod.precio).toFixed(2)}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <Badgex
                      className={
                        prod.estado?.nombre === "Inactivo"
                          ? "bg-gray30"
                          : "bg-gray90 text-white"
                      }
                    >
                      {prod.estado?.nombre || "Desconocido"}
                    </Badgex>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => handleView(prod)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Ver detalle"
                        aria-label={`Ver ${prod.nombre_producto ?? "producto"}`}
                      >
                        <FaEye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Relleno para altura constante */}
              {emptyRows > 0 &&
                Array.from({ length: emptyRows }).map((_, idx) => (
                  <tr key={`empty-${idx}`} className="hover:bg-transparent">
                    {Array.from({ length: 8 }).map((__, i) => (
                      <td key={i} className="px-4 py-3">
                        &nbsp;
                      </td>
                    ))}
                  </tr>
                ))}

              {pageData.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-gray70 italic"
                    colSpan={8}
                  >
                    Aún no hay productos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginador */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-end gap-2 border-b-[4px] border-gray90 py-3 px-3 mt-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                  onClick={() => setCurrentPage(p)}
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
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
            >
              &gt;
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
