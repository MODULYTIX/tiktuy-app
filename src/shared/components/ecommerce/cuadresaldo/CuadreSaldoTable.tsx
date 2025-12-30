// src/shared/components/ecommerce/cuadreSaldo/CuadreSaldoTable.tsx
import { useState, useMemo, useEffect } from "react";
import type { ResumenDia } from "@/services/ecommerce/cuadreSaldo/cuadreSaldoC.types";
import TableActionx from "@/shared/common/TableActionx";

type Props = {
  rows: ResumenDia[];
  loading?: boolean;
  selected: string[]; // YYYY-MM-DD[]
  onToggle(date: string): void; // check/uncheck una fecha
  onView(date: string, estado: ResumenDia["estado"]): void; // click en ojito (con estado)
};

const money = (n: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
    n || 0
  );

const PAGE_SIZE = 5;

/* ============================
 * Helpers SOLO VISUALES
 * ============================ */
const num = (v: any) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

function getMontoDirectoEcommerce(r: any) {
  return num(
    r?.montoDirectoEcommerce ??
      r?.monto_directo_ecommerce ??
      r?.directoEcommerceMonto ??
      r?.directo_ecommerce_monto ??
      r?.cobradoDirectoEcommerce ??
      r?.cobrado_directo_ecommerce ??
      0
  );
}

function cobradoVisual(r: any) {
  const cobrado = num(r?.cobrado);
  const directo = getMontoDirectoEcommerce(r);
  return Math.max(0, cobrado - directo);
}

function netoVisual(r: any) {
  return cobradoVisual(r) - num(r?.servicio);
}

/** ✅ Solo NO se puede seleccionar cuando está "Validado" */
function isSelectable(estado: ResumenDia["estado"]) {
  return estado !== "Validado";
}

export default function CuadreSaldoTable({
  rows,
  loading,
  selected,
  onToggle,
  onView,
}: Props) {
  const [page, setPage] = useState(1);

  // paginación
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

  /**
   * ✅ Limpieza automática:
   * si una fecha en `selected` ahora está Validado, la removemos.
   */
  useEffect(() => {
    if (!rows.length || !selected.length) return;

    const validatedSelected = selected.filter((date) => {
      const r = rows.find((x) => x.fecha === date);
      return r?.estado === "Validado";
    });
    if (!validatedSelected.length) return;

    validatedSelected.forEach((d) => onToggle(d));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  return (
    <div className="overflow-hidden rounded-md shadow-default bg-white">
      {/* Mensajes */}
      {loading && (
        <div className="px-4 py-3 text-sm text-gray-500">Cargando...</div>
      )}
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
                const selectable = isSelectable(r.estado);

                const pill =
                  r.estado === "Validado"
                    ? "bg-gray-900 text-white"
                    : r.estado === "Sin Validar"
                    ? "bg-gray-100 text-gray-700 border border-gray-200"
                    : "bg-blue-100 text-blue-900 border border-blue-200";

                const cobradoV = cobradoVisual(r as any);
                const netoV = netoVisual(r as any);

                return (
                  <tr key={r.fecha} className="border-t">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle(r.fecha)}
                        disabled={!selectable} // ✅ solo Validado
                        className="h-4 w-4 accent-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                        title={
                          selectable
                            ? "Seleccionar fecha"
                            : "No puedes seleccionar fechas Validadas"
                        }
                      />
                    </td>

                    <td className="p-3">
                      {new Date(r.fecha + "T00:00:00").toLocaleDateString(
                        "es-PE"
                      )}
                    </td>

                    <td className="p-3">{money(cobradoV)}</td>
                    <td className="p-3">{money(num((r as any).servicio))}</td>
                    <td className="p-3">{money(netoV)}</td>

                    <td className="p-3">
                      <span className={`px-3 py-1 text-xs rounded-full ${pill}`}>
                        {r.estado}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <TableActionx
                        variant="view"
                        title="Ver pedidos del día"
                        onClick={() => onView(r.fecha, r.estado)}
                        size="sm"
                      />
                    </td>
                  </tr>
                );
              })}

              {/* Relleno */}
              {emptyRows > 0 &&
                Array.from({ length: emptyRows }).map((_, idx) => (
                  <tr key={`empty-${idx}`} className="hover:bg-transparent">
                    {Array.from({ length: 7 }).map((__, i) => (
                      <td key={i} className="px-4 py-3">
                        &nbsp;
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginador */}
      {rows.length > 0 && (
        <div className="flex items-center justify-end gap-2 border-b border-gray90 py-3 px-3 mt-2">
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
    </div>
  );
}
