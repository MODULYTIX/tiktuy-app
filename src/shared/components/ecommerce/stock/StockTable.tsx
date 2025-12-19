import { useMemo } from "react";
import type { Producto } from "@/services/ecommerce/producto/producto.types";
import Badgex from "@/shared/common/Badgex";
import TableActionx from "@/shared/common/TableActionx";


interface Props {
  productos: Producto[];

  /** Backend pagination */
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;

  onVer: (producto: Producto) => void;
  onEditar: (producto: Producto) => void;
  filtrarInactivos?: boolean;
  soloLectura?: boolean;
  loading?: boolean;
}

const PAGE_SIZE = 5;

/* ---------------------------------------------------
   SKELETON ROW
---------------------------------------------------- */
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="h-12 px-4 py-3">
      <div className="w-10 h-10 bg-gray-200 rounded" />
    </td>
    <td className="h-12 px-4 py-3">
      <div className="h-3 w-16 bg-gray-200 rounded" />
    </td>
    <td className="h-12 px-4 py-3">
      <div className="h-3 w-40 bg-gray-200 rounded mb-1" />
      <div className="h-3 w-28 bg-gray-200 rounded" />
    </td>
    <td className="h-12 px-4 py-3">
      <div className="h-3 w-24 bg-gray-200 rounded" />
    </td>
    <td className="h-12 px-4 py-3">
      <div className="h-3 w-20 bg-gray-200 rounded" />
    </td>
    <td className="h-12 px-4 py-3 text-right">
      <div className="h-3 w-12 bg-gray-200 rounded ml-auto" />
    </td>
    <td className="h-12 px-4 py-3 text-center">
      <div className="h-4 w-16 bg-gray-200 rounded mx-auto" />
    </td>
    <td className="h-12 px-4 py-3 text-center">
      <div className="flex justify-center gap-3">
        <div className="w-8 h-8 bg-gray-200 rounded-md" />
        <div className="w-8 h-8 bg-gray-200 rounded-md" />
      </div>
    </td>
  </tr>
);

/* ---------------------------------------------------
   COMPONENT
---------------------------------------------------- */
export default function StockTable({
  productos,
  currentPage,
  totalPages,
  onPageChange,
  onVer,
  onEditar,
  filtrarInactivos = true,
  soloLectura = false,
  loading = false,
}: Props) {
  /* ---------------------------------------------------
     FILTRADO (NO PAGINA)
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

  const currentData = productosFiltrados;

  /* ---------------------------------------------------
     PAGINADOR
  ---------------------------------------------------- */
  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === currentPage) return;
    onPageChange(p);
  };

  const pagerItems = useMemo(() => {
    const maxButtons = 5;
    const pages: (number | string)[] = [];

    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);

      if (currentPage <= 3) {
        start = 1;
        end = maxButtons;
      } else if (currentPage >= totalPages - 2) {
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
  }, [currentPage, totalPages]);

  /* ---------------------------------------------------
     RENDER STOCK
  ---------------------------------------------------- */
  const renderEstadoStock = (stock?: number, minimo?: number) => {
    if (stock === undefined || minimo === undefined) {
      return <span className="text-xs text-red-500">Datos no disponibles</span>;
    }

    const bajo = stock < minimo;
    const bg = bajo ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700";

    return (
      <div>
        <span className={`${bg} text-xs px-2 py-1 rounded inline-flex items-center gap-1`}>
          📦 {stock}
        </span>
        <div className="text-xs text-gray-500">{bajo ? "Stock bajo" : "Stock normal"}</div>
      </div>
    );
  };

  /* ---------------------------------------------------
     LOADING
  ---------------------------------------------------- */
  if (loading) {
    return (
      <table className="min-w-full table-fixed text-[12px]">
        <tbody>
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </tbody>
      </table>
    );
  }

  if (!productosFiltrados.length) {
    return (
      <div className="py-10 text-center text-gray-500 bg-white rounded shadow-default">
        No hay productos activos con stock disponible.
      </div>
    );
  }

  /* ===================================================
     TABLE (DISEÑO  TABLA PEDIDOS)
  ==================================================== */
  return (
    <div className="bg-white rounded-md overflow-hidden shadow-default border border-gray30">
      <div className="overflow-x-auto bg-white">
        <table className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30 rounded-t-md">
          <thead className="bg-[#E5E7EB]">
            <tr className="text-gray70 font-roboto font-medium">
              <th className="px-4 py-3">Imagen</th>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Almacén</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3 text-right">Precio</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray20">
            {currentData.map((prod: any) => (
              <tr key={prod.uuid ?? prod.id} className="hover:bg-gray10 transition-colors">
                <td className="h-12 px-4 py-3">
                  <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">📦</div>
                </td>

                <td className="h-12 px-4 py-3 text-gray70">{prod.codigo_identificacion}</td>

                <td className="h-12 px-4 py-3 text-gray70">
                  <div className="font-medium">{prod.nombre_producto}</div>
                  <div className="text-xs text-gray-500 truncate">{prod.descripcion}</div>
                </td>

                <td className="h-12 px-4 py-3 text-gray70">
                  {prod.almacenamiento?.nombre_almacen ?? "—"}
                </td>

                <td className="h-12 px-4 py-3 text-gray70">
                  {renderEstadoStock(prod.stock_en_sede ?? prod.stock, prod.stock_minimo)}
                </td>

                <td className="h-12 px-4 py-3 text-gray70 text-right">
                  S/ {Number(prod.precio).toFixed(2)}
                </td>

                <td className="h-12 px-4 py-3 text-center">
                  <Badgex>{prod?.estado?.nombre ?? "—"}</Badgex>
                </td>

                <td className="h-12 px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <TableActionx
                      variant="view"
                      title="Ver"
                      onClick={() => onVer(prod)}
                      size="sm"
                    />

                    {!soloLectura && (
                      <TableActionx
                        variant="edit"
                        title="Editar"
                        onClick={() => onEditar(prod)}
                        size="sm"
                      />
                    )}

                    {/* Ejemplo de custom (si luego lo necesitas):
                    <TableActionx
                      variant="custom"
                      title="Eliminar"
                      icon="solar:trash-bin-trash-bold"
                      colorClassName="bg-rose-50 text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100 hover:ring-rose-300 focus-visible:ring-rose-400"
                      onClick={() => onEliminar(prod)}
                      size="sm"
                    />
                    */}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINADOR (IGUAL A PEDIDOS) */}
      <div className="flex items-center justify-end gap-2 border-b-[4px] border-gray90 py-3 px-3 mt-2">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50"
        >
          &lt;
        </button>

        {pagerItems.map((p, i) =>
          typeof p === "string" ? (
            <span key={i} className="px-2 text-gray70">
              {p}
            </span>
          ) : (
            <button
              key={p}
              onClick={() => goToPage(p)}
              className={[
                "w-8 h-8 flex items-center justify-center rounded",
                p === currentPage ? "bg-gray90 text-white" : "bg-gray10 text-gray70 hover:bg-gray20",
              ].join(" ")}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}
