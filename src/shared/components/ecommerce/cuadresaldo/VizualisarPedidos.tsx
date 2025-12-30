// src/shared/components/ecommerce/cuadreSaldo/VizualisarPedidos.tsx
import { useMemo, useState } from "react";
import type { PedidoDiaItem } from "@/services/ecommerce/cuadreSaldo/cuadreSaldoC.types";

/**
 * ✅ Compat para:
 * - metodoPago / metodo_pago
 * - evidencia (voucher del abono)
 * - evidenciaRepartidor (pago_evidencia_url)
 * - motivoRepartidor (servicio_repartidor_motivo)
 */
type Row = PedidoDiaItem & {
  metodoPago?: string | null;
  metodo_pago?: string | null;

  evidencia?: string | null; // voucher del abono (abono_evidencia_url)

  // ✅ NUEVO (repartidor)
  evidenciaRepartidor?: string | null; // pago_evidencia_url
  motivoRepartidor?: string | null; // servicio_repartidor_motivo
};

type Props = {
  open: boolean;
  onClose(): void;
  fecha?: string; // YYYY-MM-DD
  rows: Row[];
  loading?: boolean;
};

const money = (n: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
    n || 0
  );

const isProbablyImageUrl = (url: string) => {
  try {
    const u = new URL(url);
    const ext = (u.pathname.split(".").pop() || "").toLowerCase();
    return ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext);
  } catch {
    return false;
  }
};

const formatDMY = (ymd?: string) => {
  if (!ymd) return "";
  const dt = new Date(`${ymd}T00:00:00`);
  return isNaN(dt.getTime())
    ? ymd
    : dt.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
};

/* ✅ DIRECTO_ECOMMERCE (solo visual) */
function metodoPagoDe(p: any): string | null {
  return (p?.metodoPago ?? p?.metodo_pago ?? null) as any;
}
function isDirectEcommerce(p: any): boolean {
  const mp = String(metodoPagoDe(p) ?? "").trim().toUpperCase();
  return mp === "DIRECTO_ECOMMERCE";
}
function montoVisual(p: any): number {
  return isDirectEcommerce(p) ? 0 : Number(p?.monto ?? 0);
}

export default function VizualisarPedidos({
  open,
  onClose,
  fecha,
  rows,
  loading,
}: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const title = useMemo(() => `Pedidos del día ${formatDMY(fecha)}`, [fecha]);

  // voucher del abono (general): primera evidencia no-nula encontrada
  const evidenciaGeneral = useMemo<string | null>(() => {
    for (const r of rows) {
      const ev = (r as any).evidencia ?? null;
      if (ev) return ev;
    }
    return null;
  }, [rows]);

  // ✅ Servicio total (para ecommerce) = SOLO servicio courier
  const servicioTotalEcommerce = useMemo(() => {
    return rows.reduce((acc, r: any) => acc + Number(r?.servicioCourier ?? 0), 0);
  }, [rows]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-6xl rounded-2xl bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <div className="text-xs text-gray-500 mt-1">
              Servicio total (courier): <b>{money(servicioTotalEcommerce)}</b>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-2 hover:bg-gray-100"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Tabla */}
        <div className="p-0 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr className="text-left">
                <th className="p-3">Cliente</th>
                <th className="p-3">Método de pago</th>
                <th className="p-3">Monto</th>
                <th className="p-3">Servicio (courier)</th>
                <th className="p-3">Motivo</th>
                <th className="p-3">Evidencia (repartidor)</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              )}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    Sin pedidos
                  </td>
                </tr>
              )}

              {!loading &&
                rows.map((p: any) => {
                  const mp = metodoPagoDe(p);
                  const motivo = String(p?.motivoRepartidor ?? "").trim();
                  const evidenciaRep = (p?.evidenciaRepartidor ?? null) as
                    | string
                    | null;

                  return (
                    <tr key={p.id} className="border-t">
                      <td className="p-3">{p.cliente}</td>
                      <td className="p-3">{mp ?? "-"}</td>

                      {/* ✅ DIRECTO_ECOMMERCE => 0 (solo visual) */}
                      <td className="p-3">{money(montoVisual(p))}</td>

                      {/* ✅ SOLO courier */}
                      <td className="p-3">{money(Number(p?.servicioCourier ?? 0))}</td>

                      {/* ✅ Motivo */}
                      <td className="p-3">
                        {motivo ? (
                          <span className="text-gray-700">{motivo}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* ✅ Evidencia repartidor */}
                      <td className="p-3">
                        {!evidenciaRep ? (
                          <span className="text-gray-400">—</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewUrl(evidenciaRep)}
                              className="rounded-md border px-3 py-2 text-xs font-medium hover:bg-gray-50"
                              title="Ver evidencia"
                            >
                              Ver
                            </button>
                            <a
                              href={evidenciaRep}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="rounded-md bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:opacity-90"
                              title="Descargar evidencia"
                            >
                              Descargar
                            </a>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Evidencia general (voucher del abono) */}
        <div className="px-6 py-4 border-t">
          <div className="mb-2 text-sm font-semibold text-gray-700">
            Evidencia del abono
          </div>

          {!evidenciaGeneral ? (
            <div className="rounded-lg border bg-gray-50 px-4 py-3 text-sm text-gray-500">
              — No hay evidencia registrada para este día —
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div className="text-sm truncate max-w-[70%]">
                <span className="text-gray-600">Archivo:</span>{" "}
                <span className="font-medium truncate inline-block align-bottom max-w-[60ch]">
                  {evidenciaGeneral}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewUrl(evidenciaGeneral)}
                  className="rounded-md border px-3 py-2 text-xs font-medium hover:bg-gray-50"
                  title="Ver evidencia"
                >
                  Ver
                </button>
                <a
                  href={evidenciaGeneral}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="rounded-md bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:opacity-90"
                  title="Descargar evidencia"
                >
                  Descargar
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t">
          <button
            onClick={onClose}
            className="rounded-md border px-4 py-2 hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative w-full max-w-3xl rounded-xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="text-sm font-medium truncate">Vista previa</div>
              <button
                onClick={() => setPreviewUrl(null)}
                className="rounded-md p-2 hover:bg-gray-100"
                aria-label="Cerrar vista previa"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[75vh] overflow-auto">
              {isProbablyImageUrl(previewUrl) ? (
                <img
                  src={previewUrl}
                  alt="Evidencia"
                  className="block max-h-[75vh] w-full object-contain bg-gray-50"
                />
              ) : (
                <iframe
                  src={previewUrl}
                  className="block h-[75vh] w-full bg-gray-50"
                  title="Evidencia"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t">
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="rounded-md bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:opacity-90"
                title="Descargar evidencia"
              >
                Descargar
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
}
