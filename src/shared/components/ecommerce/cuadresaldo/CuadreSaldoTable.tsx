import { useState, useMemo, useEffect } from "react";
import type { ResumenDia } from "@/services/ecommerce/cuadreSaldo/cuadreSaldoC.types";

type Props = {
  rows: ResumenDia[];
  loading?: boolean;
  selected: string[];                                   // YYYY-MM-DD[]
  onToggle(date: string): void;                         // check/uncheck una fecha
  onView(date: string, estado: ResumenDia["estado"]): void; // click en ojito (con estado)
};

const money = (n: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(n || 0);

const PAGE_SIZE = 5;

export default function CuadreSaldoTable({
  rows,
  loading,
  selected,
  onToggle,
  onView,
}: Props) {
  const [page, setPage] = useState(1);

  // Filtro y paginación
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  useEffect(() => setPage(1), [rows]);

  const currentData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, page]);

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
      if (start > 1) { pages.unshift('...'); pages.unshift(1); }
      if (end < totalPages) { pages.push('...'); pages.push(totalPages); }
    }
    return pages;
  }, [page, totalPages]);

  const emptyRows = Math.max(0, PAGE_SIZE - currentData.length);

  const renderStock = (r: ResumenDia) => {
    const stockBajo = r.cobrado <= r.servicio; // Ajusta esta condición si necesitas mostrar estado de stock
    return (
      <div className="flex items-center gap-2">
        <span className={stockBajo ? 'text-amber-600' : 'text-green-600'}>•</span>
        <span className="text-gray70">{r.cobrado}</span>
        <span className="text-xs text-gray-500">
          {stockBajo ? 'Stock bajo' : 'Stock normal'}
        </span>
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-md shadow-default bg-white">
      {/* Mensajes */}
      {loading && <div className="px-4 py-3 text-sm text-gray-500">Cargando...</div>}
      {!loading && rows.length === 0 && (
        <div className="px-4 py-3 text-sm text-gray-500">No hay datos.</div>
      )}

      {/* Tabla */}
      {!loading && rows.length > 0 && (
        <div className="overflow-x-auto bg-white">
          <table className="min-w-full table-fixed text-sm bg-white border-b border-gray30 rounded-t-md">
            <colgroup>
              <col className="w-[6%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[16%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
            </colgroup>

            <thead className="bg-[#E5E7EB]">
              <tr className="text-gray70 font-roboto font-medium text-left">
                <th className="px-4 py-3"></th>
                <th className="px-4 py-3">Fec. Entrega</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Servicio (total)</th>
                <th className="px-4 py-3">Neto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray20">
              {currentData.map((r) => {
                const checked = selected.includes(r.fecha);
                const pill =
                  r.estado === "Validado"
                    ? "bg-gray-900 text-white"
                    : r.estado === "Sin Validar"
                    ? "bg-gray-100 text-gray-700 border border-gray-200"
                    : "bg-blue-100 text-blue-900 border border-blue-200";

                return (
                  <tr key={r.fecha} className="border-t">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle(r.fecha)}
                        disabled={r.estado === "Validado"}
                        className="h-4 w-4 accent-blue-600"
                      />
                    </td>
                    <td className="p-3">
                      {new Date(r.fecha + "T00:00:00").toLocaleDateString("es-PE")}
                    </td>
                    <td className="p-3">{money(r.cobrado)}</td>
                    <td className="p-3">{money(r.servicio)}</td>
                    <td className="p-3">{money(r.neto)}</td>
                    <td className="p-3">
                      <span className={`px-3 py-1 text-xs rounded-full ${pill}`}>{r.estado}</span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => onView(r.fecha, r.estado)} // ← enviamos fecha + estado
                        className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 hover:bg-gray-50"
                        title="Ver pedidos del día"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" strokeWidth="2" />
                          <circle cx="12" cy="12" r="3" strokeWidth="2" />
                        </svg>
                        Ver
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* Relleno para mantener altura */}
              {emptyRows > 0 &&
                Array.from({ length: emptyRows }).map((_, idx) => (
                  <tr key={`empty-${idx}`} className="hover:bg-transparent">
                    {Array.from({ length: 7 }).map((__, i) => (
                      <td key={i} className="px-4 py-3">&nbsp;</td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginador */}
      {rows.length > 0 && (
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
                  page === p ? "bg-gray90 text-white" : "bg-gray10 text-gray70 hover:bg-gray20",
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
    </div>
  );
}
