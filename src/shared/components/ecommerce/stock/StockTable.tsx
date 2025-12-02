import { useEffect, useMemo, useState } from "react";
import { FaEye, FaEdit } from "react-icons/fa";
import type { Producto } from "@/services/ecommerce/producto/producto.types";
import Badgex from "@/shared/common/Badgex";

interface Props {
  productos: Producto[];
  onVer: (producto: Producto) => void;
  onEditar: (producto: Producto) => void;
  filtrarInactivos?: boolean;
}

const PAGE_SIZE = 5;

export default function StockTable({
  productos,
  onVer,
  onEditar,
  filtrarInactivos = true,
}: Props) {
  const [page, setPage] = useState(1);

  // 👇 AHORA la tabla respeta el ORDEN que ya viene del padre.
  // Solo aplica (opcionalmente) el filtro de inactivos y stock 0.
  const productosFiltrados = useMemo(() => {
    const base = [...productos]; // respeta el orden recibido desde StockPage

    if (!filtrarInactivos) return base;

    return base.filter(
      (p: any) =>
        p?.estado?.nombre !== "Inactivo" &&
        typeof p?.stock === "number" &&
        p.stock > 0
    );
  }, [productos, filtrarInactivos]);

  // Paginación
  const totalPages = Math.max(
    1,
    Math.ceil(productosFiltrados.length / PAGE_SIZE)
  );

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
        <span
          className={`${bg} text-xs px-2 py-1 rounded inline-flex items-center gap-1`}
        >
          📦 {stock}
        </span>
        <div className="text-xs text-gray-500">{texto}</div>
      </>
    );
  };

  const emptyRows = Math.max(0, PAGE_SIZE - currentData.length);

  if (!productosFiltrados.length) {
    return (
      <div className="p-6 text-center text-gray-500 bg-white rounded shadow-sm">
        No hay productos activos con stock disponible.
      </div>
    );
  }

  // Col widths: nueva 1ª columna es la miniatura
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

  // Pequeño helper de miniatura
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
                <th className="px-4 py-3 text-left"> </th>
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
                  {/* Miniatura */}
                  <td className="px-4 py-3 align-middle">
                    <Thumb url={prod.imagen_url} alt={prod.nombre_producto} />
                  </td>

                  <td className="px-4 py-3 text-gray70 font-[400]">
                    {prod.codigo_identificacion}
                  </td>

                  <td className="px-4 py-3 text-gray70 font-[400]">
                    <div className="font-semibold line-clamp-2 ">
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
                    {renderEstadoStock(prod.stock, prod.stock_minimo)}
                  </td>

                  <td className="px-4 py-3 text-right text-gray70 font-[400]">
                    S/ {Number(prod.precio).toFixed(2)}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <Badgex
                      className={
                        prod?.estado?.nombre === "Inactivo" ? "bg-gray30" : ""
                      }
                    >
                      {prod?.estado?.nombre || "Desconocido"}
                    </Badgex>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => onVer(prod)}
                        title="Ver producto"
                        aria-label={`Ver ${prod.nombre_producto}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FaEye size={16} />
                      </button>
                      <button
                        onClick={() => onEditar(prod)}
                        title="Editar producto"
                        aria-label={`Editar ${prod.nombre_producto}`}
                        className="text-amber-600 hover:text-amber-800"
                      >
                        <FaEdit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

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
            </tbody>
          </table>
        </div>

        {/* Paginador */}
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
