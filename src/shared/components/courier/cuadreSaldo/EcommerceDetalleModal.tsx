import React, { useMemo, useState } from "react";
import type { PedidoDiaItem } from "@/services/courier/cuadre_saldo/cuadreSaldoE.types";

type Props = {
  open: boolean;
  fecha: string;
  ecommerceNombre: string;
  items: PedidoDiaItem[];
  loading: boolean;
  onClose: () => void;
  onAbonarDia: () => void;

  // ✅ ahora este "totalServicio" debe ser SOLO courier (igual lo recalculo abajo por seguridad)
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

// ✅ DIRECTO_ECOMMERCE => monto visual 0 (solo UI)
function montoVisual(it: PedidoDiaItem): number {
  const mp = String((it as any)?.metodoPago ?? "").trim().toUpperCase();
  if (mp === "DIRECTO_ECOMMERCE") return 0;
  return Number((it as any)?.monto ?? 0);
}

// ✅ detecta si es imagen (para preview)
const isProbablyImageUrl = (url: string) => {
  try {
    const u = new URL(url);
    const ext = (u.pathname.split(".").pop() || "").toLowerCase();
    return ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext);
  } catch {
    return false;
  }
};

const EcommerceDetalleModal: React.FC<Props> = ({
  open,
  fecha,
  ecommerceNombre,
  items,
  loading,
  onClose,
  onAbonarDia,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // ✅ servicio total del día = SOLO servicio courier
  const totalServicioCourierDia = useMemo(
    () => items.reduce((acc, it: any) => acc + Number(it?.servicioCourier ?? 0), 0),
    [items]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
      <div className="w-[1200px] max-w-[96vw] rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="text-sm">
            <div className="font-semibold">Pedidos del día • {toDMY(fecha)}</div>
            <div className="text-gray-500">
              Ecommerce:{" "}
              <span className="font-semibold text-gray-800">{ecommerceNombre}</span>
            </div>
          </div>
          <button
            onClick={() => {
              setPreviewUrl(null);
              onClose();
            }}
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
              <b>{formatPEN(totalServicioCourierDia)}</b>
              <span className="text-[12px] text-gray-500"> (solo courier)</span>
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

          {/* Tabla */}
          <div className="mt-1 bg-white rounded-md overflow-hidden shadow-default border border-gray30 relative">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 text-sm">
                Cargando...
              </div>
            )}

            <section className="flex-1 overflow-auto max-h-[460px]">
              <div className="overflow-x-auto bg-white">
                <table className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30 rounded-t-md">
                  <colgroup>
                    <col className="w-[22%]" />
                    <col className="w-[12%]" />
                    <col className="w-[12%]" />
                    <col className="w-[12%]" />
                    <col className="w-[18%]" /> {/* ✅ Motivo */}
                    <col className="w-[12%]" /> {/* ✅ Evidencia */}
                    <col className="w-[12%]" /> {/* ✅ Abonado */}
                  </colgroup>

                  <thead className="bg-[#E5E7EB]">
                    <tr className="text-gray70 font-roboto font-medium">
                      <th className="px-4 py-3 text-left">Cliente</th>
                      <th className="px-4 py-3 text-left">Método</th>
                      <th className="px-4 py-3 text-left">Monto</th>
                      <th className="px-4 py-3 text-left">Servicio courier</th>
                      <th className="px-4 py-3 text-left">Motivo</th>
                      <th className="px-4 py-3 text-left">Evidencia</th>
                      <th className="px-4 py-3 text-left">Abono</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray20">
                    {items.length === 0 ? (
                      <tr className="hover:bg-transparent">
                        <td colSpan={7} className="px-4 py-8 text-center text-gray70 italic">
                          Sin pedidos
                        </td>
                      </tr>
                    ) : (
                      items.map((it: any) => {
                        const motivo =
                          it?.motivo ??
                          it?.servicioRepartidorMotivo ??
                          it?.servicio_repartidor_motivo ??
                          "-";

                        const evidenciaUrl =
                          it?.pagoEvidenciaUrl ??
                          it?.pago_evidencia_url ??
                          it?.pagoEvidencia ??
                          it?.pago_evidencia ??
                          null;

                        return (
                          <tr key={it.id} className="hover:bg-gray10 transition-colors">
                            <td className="px-4 py-3 text-gray70">
                              <div className="font-medium text-gray80">{it.cliente}</div>
                              <div className="mt-0.5 text-[11px] text-gray-500">
                                Pedido #{it.id}
                              </div>
                            </td>

                            <td className="px-4 py-3 text-gray70">{it.metodoPago ?? "-"}</td>

                            {/* ✅ DIRECTO_ECOMMERCE => mostrar 0 */}
                            <td className="px-4 py-3 text-gray70">{formatPEN(montoVisual(it))}</td>

                            {/* ✅ Servicio total (Ecommerce) = SOLO courier */}
                            <td className="px-4 py-3 text-gray70">
                              {formatPEN(Number(it.servicioCourier ?? 0))}
                            </td>

                            {/* ✅ Motivo */}
                            <td className="px-4 py-3 text-gray70">
                              <div className="line-clamp-2">{motivo || "-"}</div>
                            </td>

                            {/* ✅ Evidencia */}
                            <td className="px-4 py-3">
                              {!evidenciaUrl ? (
                                <span className="text-gray-400">—</span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewUrl(String(evidenciaUrl))}
                                    className="rounded-md border px-2 py-1 text-[11px] font-medium hover:bg-gray-50"
                                    title="Ver evidencia"
                                  >
                                    Ver
                                  </button>
                                  <a
                                    href={String(evidenciaUrl)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-md bg-gray-900 px-2 py-1 text-[11px] font-medium text-white hover:opacity-90"
                                    title="Abrir en nueva pestaña"
                                  >
                                    Abrir
                                  </a>
                                </div>
                              )}
                            </td>

                            {/* Abono */}
                            <td className="px-4 py-3">
                              <span
                                className={[
                                  "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold",
                                  it.abonado ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-900",
                                ].join(" ")}
                              >
                                {it.abonado ? "Abonado" : "Sin abonar"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                setPreviewUrl(null);
                onClose();
              }}
              className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Evidencia */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="text-sm font-medium truncate">Vista previa de evidencia</div>
              <button
                onClick={() => setPreviewUrl(null)}
                className="rounded-md p-2 hover:bg-gray-100"
                aria-label="Cerrar vista previa"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[75vh] overflow-auto bg-gray-50">
              {isProbablyImageUrl(previewUrl) ? (
                <img
                  src={previewUrl}
                  alt="Evidencia"
                  className="block max-h-[75vh] w-full object-contain"
                />
              ) : (
                <iframe
                  src={previewUrl}
                  className="block h-[75vh] w-full bg-white"
                  title="Evidencia"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t">
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:opacity-90"
              >
                Abrir
              </a>
              <button
                onClick={() => setPreviewUrl(null)}
                className="rounded-md border px-3 py-2 text-xs font-medium hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EcommerceDetalleModal;
