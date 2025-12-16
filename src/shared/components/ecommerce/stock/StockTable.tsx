import { useEffect, useMemo, useState } from "react";
import { FaEye, FaEdit } from "react-icons/fa";
import type { Producto } from "@/services/ecommerce/producto/producto.types";
import Badgex from "@/shared/common/Badgex";

interface Props {
  productos: Producto[];
  onVer: (producto: Producto) => void;
  onEditar: (producto: Producto) => void;
  filtrarInactivos?: boolean;
  soloLectura?: boolean;
  loading?: boolean;
}

const PAGE_SIZE = 5;

/* ---------------------------------------------------
   SKELETON ROW COMPONENT
---------------------------------------------------- */
const SkeletonRow = () => (
  <tr className="animate-pulse">
    {/* Miniatura */}
    <td className="px-4 py-4">
      <div className="w-12 h-12 bg-gray-200 rounded-md"></div>
    </td>

    {/* Código */}
    <td className="px-4 py-4">
      <div className="h-3 w-16 bg-gray-200 rounded"></div>
    </td>

    {/* Producto */}
    <td className="px-4 py-4">
      <div className="h-3 w-40 bg-gray-200 rounded mb-2"></div>
      <div className="h-3 w-28 bg-gray-200 rounded"></div>
    </td>

    {/* Sede */}
    <td className="px-4 py-4">
      <div className="h-3 w-24 bg-gray-200 rounded"></div>
    </td>

    {/* Stock */}
    <td className="px-4 py-4">
      <div className="h-3 w-14 bg-gray-200 rounded mb-1"></div>
      <div className="h-3 w-20 bg-gray-200 rounded"></div>
    </td>

    {/* Precio */}
    <td className="px-4 py-4 text-right">
      <div className="h-3 w-12 bg-gray-200 rounded ml-auto"></div>
    </td>

    {/* Estado */}
    <td className="px-4 py-4 text-center">
      <div className="h-4 w-16 bg-gray-200 rounded mx-auto"></div>
    </td>

    {/* Acciones */}
    <td className="px-4 py-4 text-center">
      <div className="flex items-center justify-center gap-3">
        <div className="w-4 h-4 bg-gray-200 rounded"></div>
        <div className="w-4 h-4 bg-gray-200 rounded"></div>
      </div>
    </td>
  </tr>
);

export default function StockTable({
  productos,
  onVer,
  onEditar,
  filtrarInactivos = true,
  soloLectura = false,
  loading = false,
}: Props) {
  const [page, setPage] = useState(1);

  /* ---------------------------------------------------
    FILTRADO REAL
  ---------------------------------------------------- */
  const productosFiltrados = useMemo(() => {
    const base = [...productos];

    if (!filtrarInactivos) return base;

    return base.filter((p: any) => {
      const estado = p?.estado?.nombre?.toLowerCase?.() ?? "";
      const tieneStock = typeof p?.stock === "number" && p.stock > 0;

      return estado !== "inactivo" && tieneStock;
    });
  }, [productos, filtrarInactivos]);

  /* ---------------------------------------------------
    PAGINACIÓN
  ---------------------------------------------------- */
  const totalPages = Math.max(1, Math.ceil(productosFiltrados.length / PAGE_SIZE));

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const currentData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return productosFiltrados.slice(start, start + PAGE_SIZE);
  }, [productosFiltrados, page]);

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

  /* ---------------------------------------------------
    COMPONENTES
  ---------------------------------------------------- */
  const renderEstadoStock = (stock?: number, minimo?: number) => {
    const isInvalid = stock === undefined || minimo === undefined;

    if (isInvalid) {
      return <span className="text-xs text-red-500">Datos no disponibles</span>;
    }

    const bajo = stock < minimo;
    const bg = bajo
      ? "bg-yellow-100 text-yellow-700"
      : "bg-green-100 text-green-700";

    const texto = bajo ? "Stock bajo" : "Stock normal";

    return (
      <>
        <span className={`${bg} text-xs px-2 py-1 rounded inline-flex items-center gap-1`}>
          📦 {stock}
        </span>
        <div className="text-xs text-gray-500">{texto}</div>
      </>
    );
  };

  const colClasses = [
    "w-[6%]", // Miniatura
    "w-[12%]", // Código
    "w-[28%]", // Producto
    "w-[18%]", // Almacén
    "w-[12%]", // Stock
    "w-[10%]", // Precio
    "w-[8%]", // Estado
    "w-[6%]", // Acciones
  ];

  const Thumb = ({ url, alt }: { url?: string | null; alt: string }) =>
    url ? (
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

  /* ---------------------------------------------------
    SKELETON MODE
  ---------------------------------------------------- */
  if (loading) {
    return (
      <div className="bg-white rounded-md overflow-hidden shadow-default">
        <section className="flex-1 overflow-auto">
          <div className="overflow-x-auto bg-white">
            <table className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30 rounded-t-md">
              <colgroup>
                {colClasses.map((cls, i) => (
                  <col key={i} className={cls} />
                ))}
              </colgroup>

              <thead className="bg-[#E5E7EB]">
                <tr className="text-gray70 font-roboto font-medium">
                  <th className="px-4 py-3"></th>
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
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  /* ---------------------------------------------------
    VACÍO
  ---------------------------------------------------- */
  if (!productosFiltrados.length) {
    return (
      <div className="p-6 text-center text-gray-500 bg-white rounded shadow-sm">
        No hay productos activos con stock disponible.
      </div>
    );
  }

  /* ===================================================
      VISTA NORMAL
  ==================================================== */
  return (
    <div className="bg-white rounded-md overflow-hidden shadow-default">
      <section className="flex-1 overflow-auto">
        <div className="overflow-x-auto bg-white">
          <table className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30 rounded-t-md">
            <colgroup>
              {colClasses.map((cls, i) => (
                <col key={i} className={cls} />
              ))}
            </colgroup>

            <thead className="bg-[#E5E7EB]">
              <tr className="text-gray70 font-roboto font-medium">
                <th className="px-4 py-3"></th>
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
              {currentData.map((prod: any) => (
                <tr
                  key={prod.uuid ?? prod.id}
                  className="hover:bg-gray10 transition-colors"
                >
                  <td className="px-4 py-3 align-middle">
                    <Thumb url={prod.imagen_url} alt={prod.nombre_producto} />
                  </td>

                  <td className="px-4 py-3 text-gray70 font-[400]">
                    {prod.codigo_identificacion}
                  </td>

                  <td className="px-4 py-3 text-gray70 font-[400]">
                    <div className="font-semibold line-clamp-2">
                      {prod.nombre_producto}
                    </div>
                    <div className="text-gray-500 text-xs line-clamp-2">
                      {prod.descripcion}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-gray70 font-[400]">
                    {prod.almacenamiento?.nombre_almacen || (
                      <span className="text-gray-400 italic">No asignado</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {renderEstadoStock(prod.stock_en_sede ?? prod.stock, prod.stock_minimo)}
                  </td>

                  <td className="px-4 py-3 text-right text-gray70 font-[400]">
                    S/ {Number(prod.precio).toFixed(2)}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <Badgex
                      className={
                        prod?.estado?.nombre?.toLowerCase?.() === "inactivo"
                          ? "bg-gray30"
                          : ""
                      }
                    >
                      {prod?.estado?.nombre || "Desconocido"}
                    </Badgex>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => onVer(prod)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FaEye size={16} />
                      </button>

                      {!soloLectura && (
                        <button
                          onClick={() => onEditar(prod)}
                          className="text-amber-600 hover:text-amber-800"
                        >
                          <FaEdit size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {/* Empty rows for consistent height */}
              {Array.from({ length: Math.max(0, PAGE_SIZE - currentData.length) }).map(
                (_, idx) => (
                  <tr key={`empty-${idx}`}>
                    {Array.from({ length: 8 }).map((__, i) => (
                      <td key={i} className="px-4 py-3">&nbsp;</td>
                    ))}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {productosFiltrados.length > 0 && (
          <div className="flex items-center justify-end gap-2 border-b-[4px] border-gray90 py-3 px-3 mt-2">
            <button
              onClick={() => goToPage(page - 1)}
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
                  onClick={() => goToPage(p)}
                  className={[
                    "w-8 h-8 flex items-center justify-center rounded",
                  ].join(" ")}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => goToPage(page + 1)}
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
