// src/shared/components/ecommerce/movimientos/MovimientoRegistroTable.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { FaEye, FaBoxOpen } from "react-icons/fa";
import { useAuth } from "@/auth/context";
import { fetchProductos } from "@/services/ecommerce/producto/producto.api";
import type {
  Producto,
  ProductoListQuery,
} from "@/services/ecommerce/producto/producto.types";
import type { Filters } from "./MovimientoRegistroFilters";
import Badgex from "@/shared/common/Badgex";

interface Props {
  filters: Filters;
  onSelectProducts: (productos: Producto[]) => void;
  onViewProduct?: (producto: Producto) => void;
}

const PAGE_SIZE = 6;

/* ======================================================
   HELPERS DE NORMALIZACIÓN
====================================================== */
type EstadoProducto = "activo" | "inactivo" | "descontinuado";

const normalizeEstado = (value?: string): EstadoProducto | undefined => {
  if (value === "activo") return "activo";
  if (value === "inactivo") return "inactivo";
  if (value === "descontinuado") return "descontinuado";
  return undefined;
};

const buildQuery = (
  filters: Filters,
  page: number
): Partial<ProductoListQuery> => ({
  page,
  perPage: PAGE_SIZE,
  almacenamiento_id: filters.almacenamiento_id
    ? Number(filters.almacenamiento_id)
    : undefined,
  categoria_id: filters.categoria_id ? Number(filters.categoria_id) : undefined,
  estado: normalizeEstado(filters.estado),
  stock_bajo: filters.stock_bajo || undefined,
  precio_bajo: filters.precio_bajo || undefined,
  precio_alto: filters.precio_alto || undefined,
});

export default function MovimientoRegistroTable({
  filters,
  onSelectProducts,
  onViewProduct,
}: Props) {
  const { token } = useAuth();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [, setLoading] = useState(false);

  /* ======================================================
     FETCH BACKEND
  ====================================================== */
  const cargarProductos = async (pageToLoad = page) => {
    if (!token) return;

    setLoading(true);
    try {
      const resp = await fetchProductos(token, buildQuery(filters, pageToLoad));
      const list = Array.isArray(resp?.data) ? resp.data : [];
      setProductos(list);
      setTotalPages(
        resp?.pagination?.totalPages ??
          Math.max(1, Math.ceil(list.length / PAGE_SIZE))
      );
    } catch (err) {
      console.error("Error cargando productos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    cargarProductos(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    cargarProductos(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  /* ======================================================
     SELECCIÓN → PADRE
  ====================================================== */
  useEffect(() => {
    onSelectProducts(productos.filter((p) => selectedIds.includes(p.uuid)));
  }, [selectedIds, productos, onSelectProducts]);

  const toggleCheckbox = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  /* ======================================================
     CHECKBOX MAESTRO
  ====================================================== */
  const pageIds = useMemo(() => productos.map((p) => p.uuid), [productos]);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const somePageSelected =
    !allPageSelected && pageIds.some((id) => selectedIds.includes(id));

  const masterRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (masterRef.current) masterRef.current.indeterminate = somePageSelected;
  }, [somePageSelected]);

  const toggleSelectPage = () => {
    setSelectedIds((prev) => {
      if (allPageSelected) {
        return prev.filter((id) => !pageIds.includes(id));
      }
      const set = new Set(prev);
      pageIds.forEach((id) => set.add(id));
      return Array.from(set);
    });
  };

  /* ======================================================
     PAGINADOR
  ====================================================== */
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

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    setPage(p);
  };

  /* ======================================================
     UI HELPERS
  ====================================================== */
  const COLS = [
    "w-[2%]",
    "w-[4%]",
    "w-[10%]",
    "w-[32%]",
    "w-[18%]",
    "w-[10%]",
    "w-[8%]",
    "w-[8%]",
    "w-[8%]",
  ];

  const Thumb = ({ url, alt }: { url?: string | null; alt: string }) =>
    url ? (
      <div className="w-10 h-10 rounded bg-gray-100 border border-gray-200 overflow-hidden">
        <img src={url} alt={alt} className="w-full h-full object-cover" />
      </div>
    ) : (
      <div className="w-10 h-10 rounded bg-gray-100 border border-gray-200 flex items-center justify-center">
        📦
      </div>
    );

  // ✅ FORMATO STOCK (igual al base: badge + texto abajo)
  const renderEstadoStock = (stock?: number, minimo?: number) => {
    const isInvalid = stock === undefined || minimo === undefined;

    if (isInvalid) {
      return <span className="text-xs text-red-500">Datos no disponibles</span>;
    }

    const bajo = stock < minimo; // igualito al código base
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

  /* ======================================================
     RENDER
  ====================================================== */
  return (
    <div className="bg-white rounded-md overflow-hidden shadow-default border border-gray30">
      <div className="overflow-x-auto bg-white">
        <table className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30 rounded-t-md">
          <colgroup>
            {COLS.map((w, i) => (
              <col key={i} className={w} />
            ))}
          </colgroup>

          <thead className="bg-[#E5E7EB]">
            <tr className="text-gray70 font-medium">
              <th className="px-4 py-3">
                <input
                  ref={masterRef}
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={toggleSelectPage}
                  disabled={!pageIds.length}
                  className="accent-gray-700"
                />
              </th>
              <th />
              <th>Código</th>
              <th>Producto</th>
              <th>Sede</th>
              <th>Stock</th>
              <th className="text-right">Precio</th>
              <th className="text-center">Estado</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray20">
            {productos.map((prod) => (
              <tr key={prod.uuid} className="hover:bg-gray10 transition-colors">
                <td className="h-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(prod.uuid)}
                    onChange={() => toggleCheckbox(prod.uuid)}
                    className="accent-gray-700"
                  />
                </td>

                <td className="h-12 px-4 py-3">
                  <Thumb url={prod.imagen_url} alt={prod.nombre_producto} />
                </td>

                <td className="h-12 px-4 py-3 text-gray70">
                  {prod.codigo_identificacion}
                </td>

                <td className="h-12 px-4 py-3 text-gray70">
                  <div className="font-medium line-clamp-1">
                    {prod.nombre_producto}
                  </div>
                  <div className="text-xs text-gray-500 line-clamp-1">
                    {prod.descripcion}
                  </div>
                </td>

                <td className="h-12 px-4 py-3 text-gray70">
                  {prod.almacenamiento?.nombre_almacen ?? "—"}
                </td>

                {/* ✅ AQUÍ va el formato de stock con etiqueta */}
                <td className="h-12 px-4 py-3">
                  {renderEstadoStock(prod.stock, (prod as any).stock_minimo)}
                </td>

                <td className="h-12 px-4 py-3 text-gray70 text-right">
                  S/ {Number(prod.precio).toFixed(2)}
                </td>

                <td className="h-12 px-4 py-3 text-center">
                  <Badgex>{prod.estado?.nombre ?? "—"}</Badgex>
                </td>

                <td className="h-12 px-4 py-3 text-center">
                  <button
                    onClick={() => onViewProduct?.(prod)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FaEye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINADOR COMPLETO */}
      <div className="flex items-center justify-end gap-2 border-b-[4px] border-gray90 py-3 px-3 mt-2">
        <button
          onClick={() => goToPage(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50"
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
              onClick={() => goToPage(p)}
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
          onClick={() => goToPage(page + 1)}
          disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}
