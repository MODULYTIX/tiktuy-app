import React from "react";
import type { PedidoDiaItem } from "@/services/courier/cuadre_saldo/cuadreSaldoE.types";

type Props = {
  open: boolean;
  fecha: string;
  ecommerceNombre: string;
  items: PedidoDiaItem[];
  loading: boolean;
  onClose: () => void;
  onAbonarDia: () => void;
  totalServicio: number;
};

/* ================= helpers ================= */
const formatPEN = (v: number) =>
  `S/. ${Number(v || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const toDMY = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// ✅ NUEVO: si es DIRECTO_ECOMMERCE, el monto se VISUALIZA como 0 (solo UI)
function montoVisual(it: PedidoDiaItem): number {
  const mp = String((it as any)?.metodoPago ?? "").trim().toUpperCase();
  if (mp === "DIRECTO_ECOMMERCE") return 0;
  return Number((it as any)?.monto ?? 0);
}

const EcommerceDetalleModal: React.FC<Props> = ({
  open,
  fecha,
  ecommerceNombre,
  items,
  loading,
  onClose,
  onAbonarDia,
  totalServicio,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
      <div className="w-[960px] max-w-[96vw] rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="text-sm">
            <div className="font-semibold">
              Pedidos del día • {toDMY(fecha)}
            </div>
            <div className="text-gray-500">
              Ecommerce:{" "}
              <span className="font-semibold text-gray-800">
                {ecommerceNombre}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-black"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pt-2 pb-5 space-y-3">
          {/* Resumen + botón */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[13px] text-gray-700">
              Pedidos del día: <b>{items.length}</b> · Servicio total del día:{" "}
              <b>{formatPEN(totalServicio)}</b>
            </div>
            <button
              className={[
                "rounded-md px-4 py-2 text-[13px] font-medium",
                loading
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:opacity-90",
              ].join(" ")}
              disabled={loading}
              onClick={onAbonarDia}
              title="Abonar todo el día (Por Validar)"
            >
              Abonar día completo
            </button>
          </div>

          {/* Tabla con formato base */}
          <div className="mt-1 bg-white rounded-md overflow-hidden shadow-default border border-gray30 relative">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 text-sm">
                Cargando...
              </div>
            )}

            <section className="flex-1 overflow-auto max-h-[420px]">
              <div className="overflow-x-auto bg-white">
                <table className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30 rounded-t-md">
                  <colgroup>
                    <col className="w-[35%]" />
                    <col className="w-[20%]" />
                    <col className="w-[20%]" />
                    <col className="w-[25%]" />
                  </colgroup>

                  <thead className="bg-[#E5E7EB]">
                    <tr className="text-gray70 font-roboto font-medium">
                      <th className="px-4 py-3 text-left">Cliente</th>
                      <th className="px-4 py-3 text-left">Método de pago</th>
                      <th className="px-4 py-3 text-left">Monto</th>
                      <th className="px-4 py-3 text-left">
                        Servicio (total)
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray20">
                    {items.length === 0 ? (
                      <tr className="hover:bg-transparent">
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-gray70 italic"
                        >
                          Sin pedidos
                        </td>
                      </tr>
                    ) : (
                      items.map((it) => (
                        <tr
                          key={it.id}
                          className="hover:bg-gray10 transition-colors"
                        >
                          <td className="px-4 py-3 text-gray70">
                            {it.cliente}
                          </td>
                          <td className="px-4 py-3 text-gray70">
                            {it.metodoPago ?? "-"}
                          </td>

                          {/* ✅ CAMBIO: si DIRECTO_ECOMMERCE => mostrar 0 */}
                          <td className="px-4 py-3 text-gray70">
                            {formatPEN(montoVisual(it))}
                          </td>

                          {/* ✅ NO TOCAR SERVICIOS */}
                          <td className="px-4 py-3 text-gray70">
                            {formatPEN(
                              it.servicioCourier + it.servicioRepartidor
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EcommerceDetalleModal;
