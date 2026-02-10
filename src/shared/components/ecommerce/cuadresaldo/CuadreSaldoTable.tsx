import { useState, useMemo, useEffect } from "react";
import { Icon } from "@iconify/react";
import type { ResumenDia } from "@/services/ecommerce/cuadreSaldo/cuadreSaldoC.types";
import TableActionx from "@/shared/common/TableActionx";

type Props = {
  rows: ResumenDia[];
  loading?: boolean;
  selected: string[]; // YYYY-MM-DD[]
  onToggle(date: string): void; // check/uncheck una fecha

  onView(
    date: string,
    estado: ResumenDia["estado"],
    montos?: {
      totalCobrado: number;
      totalDirectoEcommerce?: number;
      totalServicio: number;
    }
  ): void;

  // Monto total del abono (para mostrar en el paginador a la izquierda) 
  totalAmount?: number;
};


const money = (n: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
    n || 0
  );

const PAGE_SIZE = 5;

// Helpers SOLO VISUALES

const num = (v: any) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};


// Solo NO se puede seleccionar cuando está "Validado"
function isSelectable(estado: ResumenDia["estado"]) {
  return estado !== "Validado";
}
// Nuevo helper: monto filtrado por método de pago
function getMontoFiltrado(r: any) {
  // r.pedidosDetalle?: PedidoDiaItem[]
  if (!Array.isArray(r.pedidosDetalle)) return num(r.cobrado);

  const validPaymentMethods = ["Efectivo", "Digital Courier", "Digital Ecommerce"];
  return r.pedidosDetalle
    .filter((p: any) => validPaymentMethods.includes(p.metodoPago))
    .reduce((acc: number, p: any) => acc + num(p.monto), 0);
}

// Nuevo helper: neto correcto
function getNeto(r: any) {
  const monto = getMontoFiltrado(r);
  const servicio = num(r.servicio); // servicio total = courier + repartidor
  return monto - servicio;
}

// Mensajes sutiles (solo visual)
function HintChip({
  icon,
  label,
}: {
  icon: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] text-gray70">
      <Icon icon={icon} className="text-[14px] text-gray60" />
      <span className="leading-none">{label}</span>
    </span>
  );
}

function InlineEmptyMessage() {
  return (
    <div className="px-4 py-4">
      <div className="flex items-start gap-3 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-gray-200">
          <Icon
            icon="mdi:database-search-outline"
            className="text-[18px] text-gray60"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-gray90">
            No hay registros con estos filtros
          </div>
          <div className="mt-0.5 text-xs text-gray60">
            Prueba cambiando el courier o ampliando el rango de fechas.
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <HintChip icon="mdi:truck-outline" label="Cambiar courier" />
            <HintChip icon="mdi:calendar-range" label="Ampliar fechas" />
            <HintChip icon="mdi:filter-remove-outline" label="Limpiar filtros" />
          </div>
        </div>
      </div>
    </div>
  );
}

function InlineLoadingMessage() {
  return (
    <div className="px-4 py-4" aria-live="polite" aria-busy="true">
      <div className="flex items-start gap-3 rounded-md border border-gray-200 bg-white px-4 py-3">
        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 border border-gray-200">
          <Icon
            icon="mdi:loading"
            className="text-[18px] text-gray60 animate-spin"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-gray90">Cargando…</div>
          <div className="mt-0.5 text-xs text-gray60">
            Consultando el cuadre según el rango seleccionado.
          </div>

          {/* skeleton sutil (para que no se vea “pobre”) */}
          <div className="mt-2 space-y-2">
            <div className="h-2 w-[62%] rounded bg-gray-200/80 animate-pulse" />
            <div className="h-2 w-[48%] rounded bg-gray-200/70 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CuadreSaldoTable({
  rows,
  loading,
  selected,
  onToggle,
  onView,
  totalAmount,
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
      {/* Mensajes (sutiles) */}
      {loading && <InlineLoadingMessage />}
      {!loading && rows.length === 0 && <InlineEmptyMessage />}

      {/* Tabla */}
      {!loading && rows.length > 0 && (
        <div className="overflow-x-auto bg-white">
          <table className="min-w-full table-fixed text-sm bg-white border-b border-gray30 rounded-t-md">
            <colgroup>
              <col className="w-[6%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[12%]" />
            </colgroup>

            <thead className="bg-[#E5E7EB]">
              <tr className="text-gray70 font-roboto font-medium text-left">
                <th className="px-4 py-3"></th>
                <th className="px-4 py-3">Fec. Entrega</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Servicio (total)</th>
                <th className="px-4 py-3">Neto</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray20">
              {currentData.map((r) => {
                const checked = selected.includes(r.fecha);
                const selectable = isSelectable(r.estado);

                return (
                  <tr key={r.fecha} className="border-t">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle(r.fecha)}
                        disabled={!selectable}
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

                    <td className="p-3">{money(getMontoFiltrado(r))}</td>
                    <td className="p-3">{money(num((r as any).servicio))}</td>
                    <td className="p-3">{money(getNeto(r))}</td>


                    <td className="p-3 text-right">

                      <TableActionx
                        variant="view"
                        title="Ver pedidos del día"
                        onClick={() =>
                          onView(r.fecha, r.estado, {
                            totalCobrado: getMontoFiltrado(r),
                            totalServicio: num(r.servicio),
                          })
                        }
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
                    {Array.from({ length: 6 }).map((__, i) => (
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
        <div className="flex items-center justify-between border-b border-gray90 py-3 px-3 mt-2">

          {/* Total del abono */}
          <div className="text-sm font-semibold text-gray-500">
            {typeof totalAmount === 'number' && (
              <span>Total: {money(totalAmount)}</span>
            )}
          </div>

          {/* Botones de paginación agrupados a la derecha */}
          <div className="flex items-center gap-2">
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
        </div>
      )}
    </div>
  );
}
