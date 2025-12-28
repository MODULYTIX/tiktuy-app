// src/shared/components/courier/cuadreSaldo/DetalleServiciosDiaModal.tsx
import { useEffect, useMemo, useState } from "react";

export type DetalleServicioPedidoItem = {
  id: number;
  fechaEntrega: string | Date | null;
  cliente: string;
  distrito?: string | null;
  metodoPago?: string | null;

  // Montos
  monto: number;

  // Servicios (efectivos)
  servicioRepartidor: number;
  servicioCourier: number;
  motivo?: string | null;

  // Evidencia de pago (si existe)
  pagoEvidenciaUrl?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;

  // requerido por tu flujo
  fecha: string; // YYYY-MM-DD

  // opcionales para mostrar
  sedeNombre?: string;
  motorizadoNombre?: string;

  // lista (puede venir todo el día)
  items: DetalleServicioPedidoItem[];
  loading?: boolean;

  // si quieres mostrar SOLO el pedido clickeado
  pedidoId?: number | null;
};

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

const isProbablyImageUrl = (url: string) => {
  try {
    const u = new URL(url);
    const ext = (u.pathname.split(".").pop() || "").toLowerCase();
    return ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext);
  } catch {
    return false;
  }
};

export default function DetalleServiciosDiaModal({
  open,
  onClose,
  fecha,
  sedeNombre,
  motorizadoNombre,
  items,
  loading,
  pedidoId,
}: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setPreviewUrl(null);
  }, [open]);

  // Solo el pedido seleccionado (estilo “Detalle del pedido”)
  const pedido = useMemo(() => {
    if (!pedidoId) return items?.[0] ?? null;
    return items.find((x) => x.id === pedidoId) ?? null;
  }, [items, pedidoId]);

  const totals = useMemo(() => {
    const monto = Number(pedido?.monto ?? 0);
    const rep = Number(pedido?.servicioRepartidor ?? 0);
    const cour = Number(pedido?.servicioCourier ?? 0);
    const servTotal = rep + cour;
    return {
      monto,
      servicioRepartidor: rep,
      servicioCourier: cour,
      servicioTotal: servTotal,
      neto: monto - servTotal,
    };
  }, [pedido]);

  if (!open) return null;

  const title = pedidoId ? "DETALLE DEL CUADRE" : "DETALLE DEL CUADRE";
  const subTitle = `Detalle del pedido • ${toDMY(fecha)}`;

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* drawer */}
      <div className="absolute right-0 top-0 h-full w-[520px] max-w-[92vw] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-[18px] font-semibold tracking-wide text-gray-900">
                {title}
              </div>

              {pedido?.id ? (
                <div className="ml-1 inline-flex items-center rounded-full border bg-gray-50 px-3 py-1 text-[12px] font-semibold text-gray-800">
                  Pedido #{pedido.id}
                </div>
              ) : null}
            </div>

            <div className="mt-1 text-[12px] text-gray-500">{subTitle}</div>

            <div className="mt-2 space-y-1 text-[12px] text-gray-600">
              {sedeNombre ? (
                <div>
                  Sede: <span className="font-semibold text-gray-800">{sedeNombre}</span>
                </div>
              ) : null}
              {motorizadoNombre ? (
                <div>
                  Motorizado:{" "}
                  <span className="font-semibold text-gray-800">{motorizadoNombre}</span>
                </div>
              ) : null}
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-black"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="relative h-[calc(100%-64px)] overflow-auto p-5">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 text-sm">
              Cargando...
            </div>
          )}

          {!loading && !pedido ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              {pedidoId
                ? "No se encontró información para el pedido seleccionado."
                : "No hay información para mostrar."}
            </div>
          ) : (
            <>
              {/* Card: Cliente / Dirección */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                    {/* icon simple */}
                    <span className="text-[16px]">👤</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] text-gray-500">Cliente</div>
                    <div className="truncate text-[14px] font-semibold text-gray-900">
                      {pedido?.cliente ?? "-"}
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[12px] text-gray-500">Distrito</div>
                        <div className="text-[13px] font-semibold text-gray-900">
                          {pedido?.distrito ?? "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[12px] text-gray-500">Método de pago</div>
                        <div className="text-[13px] font-semibold text-gray-900">
                          {pedido?.metodoPago ?? "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cards resumen (como el ejemplo) */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-[12px] text-gray-500">Total</div>
                  <div className="mt-1 text-[18px] font-semibold text-gray-900">
                    {formatPEN(totals.monto)}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-[12px] text-gray-500">Fecha</div>
                  <div className="mt-1 text-[16px] font-semibold text-gray-900">
                    {toDMY(fecha)}
                  </div>
                  <div className="mt-0.5 text-[12px] text-gray-500">
                    Fecha de cuadre / entrega
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-[12px] text-gray-500">Servicio Motorizado</div>
                  <div className="mt-1 text-[16px] font-semibold text-gray-900">
                    {formatPEN(totals.servicioRepartidor)}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-[12px] text-gray-500">Servicio Courier</div>
                  <div className="mt-1 text-[16px] font-semibold text-gray-900">
                    {formatPEN(totals.servicioCourier)}
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[12px] text-gray-500">Neto</div>
                    <div className="mt-0.5 text-[16px] font-semibold text-gray-900">
                      {formatPEN(totals.neto)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] text-gray-500">Servicio total</div>
                    <div className="mt-0.5 text-[14px] font-semibold text-gray-900">
                      {formatPEN(totals.servicioTotal)}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-[12px] text-gray-500">Motivo</div>
                  <div className="mt-0.5 text-[13px] font-medium text-gray-900">
                    {pedido?.motivo ? pedido.motivo : "—"}
                  </div>
                </div>
              </div>

              {/* Evidencia */}
              <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-[14px] font-semibold text-gray-900">
                    Evidencia de pago
                  </div>
                  {!pedido?.pagoEvidenciaUrl ? (
                    <span className="text-[12px] text-gray-400">No registrada</span>
                  ) : (
                    <span className="text-[12px] text-emerald-700 font-semibold">
                      Registrada
                    </span>
                  )}
                </div>

                {!pedido?.pagoEvidenciaUrl ? (
                  <div className="mt-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-[12px] text-gray-500">
                    Este pedido no tiene evidencia.
                  </div>
                ) : (
                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewUrl(pedido.pagoEvidenciaUrl!)}
                        className="rounded-md border px-3 py-2 text-[12px] font-semibold hover:bg-gray-50"
                      >
                        Ver
                      </button>

                      <a
                        href={pedido.pagoEvidenciaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md bg-gray-900 px-3 py-2 text-[12px] font-semibold text-white hover:opacity-90"
                      >
                        Abrir
                      </a>
                    </div>

                    {/* mini preview */}
                    {isProbablyImageUrl(pedido.pagoEvidenciaUrl) && (
                      <button
                        type="button"
                        onClick={() => setPreviewUrl(pedido.pagoEvidenciaUrl!)}
                        className="mt-3 block w-full overflow-hidden rounded-xl border bg-gray-50"
                        title="Abrir vista previa"
                      >
                        <img
                          src={pedido.pagoEvidenciaUrl}
                          alt="Evidencia"
                          className="h-[180px] w-full object-cover"
                        />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-5 flex justify-end">
                <button
                  onClick={onClose}
                  className="rounded-md border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                >
                  Cerrar
                </button>
              </div>
            </>
          )}
        </div>

        {/* Lightbox */}
        {previewUrl && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
            onClick={() => setPreviewUrl(null)}
          >
            <div
              className="relative w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="text-sm font-medium truncate">
                  Vista previa de evidencia
                </div>
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

              <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
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
    </div>
  );
}
