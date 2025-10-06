// src/shared/components/ecommerce/cuadreSaldo/VizualisarPedidos.tsx
import React, { useMemo, useState } from "react";
import type { PedidoDiaItem } from "@/services/ecommerce/cuadreSaldo/cuadreSaldoC.types";

type Row = PedidoDiaItem & {
  metodoPago?: string | null;   // compat si tu type aún tenía metodo_pago
  metodo_pago?: string | null;  // compat
  evidencia?: string | null;    // evidencia por pedido (usaremos la primera disponible)
};

type Props = {
  open: boolean;
  onClose(): void;
  fecha?: string;       // YYYY-MM-DD
  rows: Row[];
  loading?: boolean;
};

const money = (n: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(n || 0);

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
    : dt.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export default function VizualisarPedidos({ open, onClose, fecha, rows, loading }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const title = useMemo(() => `Pedidos del día ${formatDMY(fecha)}`, [fecha]);

  // Tomamos UNA evidencia “general”: la primera URL no-nula encontrada entre los pedidos del día
  const evidenciaGeneral = useMemo<string | null>(() => {
    for (const r of rows) {
      const ev = (r as any).evidencia ?? null;
      if (ev) return ev;
    }
    return null;
  }, [rows]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-md p-2 hover:bg-gray-100" aria-label="Cerrar">
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
                <th className="p-3">Servicio (total)</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              )}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500">
                    Sin pedidos
                  </td>
                </tr>
              )}

              {!loading &&
                rows.map((p) => {
                  const metodoPago = (p as any).metodoPago ?? (p as any).metodo_pago ?? null;
                  return (
                    <tr key={p.id} className="border-t">
                      <td className="p-3">{p.cliente}</td>
                      <td className="p-3">{metodoPago ?? "-"}</td>
                      <td className="p-3">{money(p.monto)}</td>
                      <td className="p-3">{money(p.servicioTotal)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Evidencia general (debajo de la tabla) */}
        <div className="px-6 py-4 border-t">
          <div className="mb-2 text-sm font-semibold text-gray-700">Evidencia del abono</div>

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
          <button onClick={onClose} className="rounded-md border px-4 py-2 hover:bg-gray-50">
            Cerrar
          </button>
        </div>
      </div>

      {/* Lightbox de previsualización */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative w-full max-w-3xl rounded-xl bg-white shadow-2xl"
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
