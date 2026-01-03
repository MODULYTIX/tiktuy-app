// src/shared/components/ecommerce/cuadreSaldo/VizualisarPedidos.tsx
import { useMemo, useState, useCallback } from "react";
import type { PedidoDiaItem } from "@/services/ecommerce/cuadreSaldo/cuadreSaldoC.types";
import Buttonx from "@/shared/common/Buttonx";
import TableActionx from "@/shared/common/TableActionx";

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
  const mp = String(metodoPagoDe(p) ?? "")
    .trim()
    .toUpperCase();
  return mp === "DIRECTO_ECOMMERCE";
}
function montoVisual(p: any): number {
  return isDirectEcommerce(p) ? 0 : Number(p?.monto ?? 0);
}

/* ================= Descarga REAL (no abre pestaña) ================= */
const filenameFromUrl = (url: string, fallback = "archivo") => {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").pop() || fallback;
    const clean = decodeURIComponent(last.split("?")[0] || fallback);
    return clean.includes(".") ? clean : `${clean}.png`;
  } catch {
    return `${fallback}.png`;
  }
};

const cloudinaryAttachmentUrl = (url: string) => {
  if (!/res\.cloudinary\.com/i.test(url)) return null;
  if (url.includes("/upload/"))
    return url.replace("/upload/", "/upload/fl_attachment/");
  return null;
};

async function downloadHard(url: string, filename?: string) {
  const name = filename || filenameFromUrl(url, "descarga");

  // 1) Robusto: fetch -> blob -> download
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error("HTTP no OK");

    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(objectUrl);
    return;
  } catch {
    // 2) Fallback Cloudinary: fl_attachment
    const forced = cloudinaryAttachmentUrl(url);
    if (forced) {
      const a = document.createElement("a");
      a.href = forced;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }

    // 3) Último fallback (puede depender del servidor)
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.target = "_self";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
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
    return rows.reduce(
      (acc, r: any) => acc + Number(r?.servicioCourier ?? 0),
      0
    );
  }, [rows]);

  const handleClose = useCallback(() => {
    setPreviewUrl(null);
    onClose();
  }, [onClose]);

  const handleDownload = useCallback(async (url: string, name?: string) => {
    if (!url) return;
    await downloadHard(url, name);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-3 sm:p-4">
      <div className="w-full max-w-6xl max-h-[86vh] rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="bg-slate-50 border-b border-gray-200 px-5 sm:px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center shrink-0">
                  <span className="text-lg leading-none">🧾</span>
                </div>

                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 truncate">
                    {title}
                  </h3>
                  <div className="mt-1 text-xs text-slate-600">
                    Servicio total (courier):{" "}
                    <b className="text-slate-900 tabular-nums">
                      {money(servicioTotalEcommerce)}
                    </b>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-slate-50 text-slate-700 shrink-0"
              aria-label="Cerrar"
              title="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-white px-4 sm:px-6 py-4">
          {/* ✅ Tabla con margen + contenedor redondeado (sin línea negra abajo) */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 sm:px-5 py-3 border-b border-gray-100">
              <div className="text-sm font-bold text-slate-900">Detalle</div>
              <div className="text-xs text-slate-500">
                Evidencia del repartidor por pedido
              </div>
            </div>

            <div className="overflow-auto max-h-[46vh]">
              <table className="w-full text-sm table-fixed">
                <colgroup>
                  <col className="w-[22%]" />
                  <col className="w-[18%]" />
                  <col className="w-[12%]" />
                  <col className="w-[14%]" />
                  <col className="w-[18%]" />
                  <col className="w-[16%]" />
                </colgroup>

                <thead className="sticky top-0 z-10 bg-[#F3F6FA] text-slate-600">
                  <tr className="text-left text-xs font-semibold">
                    <th className="px-4 py-3 border-b border-gray-200">
                      Cliente
                    </th>
                    <th className="px-4 py-3 border-b border-gray-200">
                      Método de pago
                    </th>
                    <th className="px-4 py-3 border-b border-gray-200">
                      Monto
                    </th>
                    <th className="px-4 py-3 border-b border-gray-200">
                      Servicio (courier)
                    </th>
                    <th className="px-4 py-3 border-b border-gray-200">
                      Motivo
                    </th>
                    <th className="px-4 py-3 border-b border-gray-200">
                      Evidencia (repartidor)
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {loading && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        Cargando...
                      </td>
                    </tr>
                  )}

                  {!loading && rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-slate-500"
                      >
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
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="px-4 py-3 text-slate-800">
                            <div className="font-semibold text-slate-900 truncate">
                              {p.cliente}
                            </div>
                            <div className="mt-0.5 text-[11px] text-slate-500">
                              Pedido #{p.id}
                            </div>
                          </td>

                          <td className="px-4 py-3 text-slate-700">
                            {mp ?? "-"}
                          </td>

                          {/* ✅ DIRECTO_ECOMMERCE => 0 (solo visual) */}
                          <td className="px-4 py-3 text-slate-700 tabular-nums">
                            {money(montoVisual(p))}
                          </td>

                          {/* ✅ SOLO courier */}
                          <td className="px-4 py-3 text-slate-700 tabular-nums">
                            {money(Number(p?.servicioCourier ?? 0))}
                          </td>

                          {/* ✅ Motivo */}
                          <td className="px-4 py-3 text-slate-700">
                            {motivo ? (
                              <span className="text-slate-700">{motivo}</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* ✅ Evidencia repartidor */}
                          <td className="px-4 py-3">
                            {!evidenciaRep ? (
                              <span className="text-slate-400">—</span>
                            ) : (
                              <div className="flex flex-wrap items-center gap-2">
                                <TableActionx
                                  variant="view"
                                  title="Ver evidencia"
                                  onClick={() => setPreviewUrl(evidenciaRep)}
                                  size="sm"
                                />

                                <TableActionx
                                  variant="custom"
                                  title="Descargar evidencia"
                                  icon="mdi:download"
                                  colorClassName="bg-sky-100 text-sky-700 ring-1 ring-sky-300 hover:bg-sky-200 hover:ring-sky-400 focus-visible:ring-sky-500"
                                  onClick={() =>
                                    handleDownload(
                                      evidenciaRep,
                                      `evidencia-repartidor-pedido-${p.id}`
                                    )
                                  }
                                  size="sm"
                                />
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Evidencia general (voucher del abono) */}
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 sm:px-5 py-3 border-b border-gray-100">
              <div className="text-sm font-bold text-slate-900">
                Evidencia del abono
              </div>
              <div className="text-xs text-slate-500">
                Voucher registrado para este día
              </div>
            </div>

            <div className="p-4 sm:p-5">
              {!evidenciaGeneral ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-slate-500">
                  — No hay evidencia registrada para este día —
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500 font-semibold">
                      Archivo
                    </div>
                    <div className="mt-1 text-sm text-slate-800 truncate">
                      {evidenciaGeneral}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Buttonx
                      variant="outlined"
                      label="Ver"
                      onClick={() => setPreviewUrl(evidenciaGeneral)}
                    />
                    <Buttonx
                      variant="secondary"
                      label="Descargar"
                      icon="mdi:download"
                      onClick={() =>
                        handleDownload(
                          evidenciaGeneral,
                          `evidencia-abono-${fecha ?? "dia"}`
                        )
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 sm:px-6 py-4 border-t border-gray-200 bg-white">
          <Buttonx
            variant="outlined"
            label="Cerrar"
            icon="mdi:close"
            onClick={handleClose}
          />
        </div>
      </div>

      {/* Lightbox (overlay más suave + descarga real) */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-[2px] p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[86vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 px-5 py-4 bg-slate-50 border-b border-gray-200">
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-slate-900 truncate">
                  Vista previa
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {previewUrl}
                </div>
              </div>

              <button
                onClick={() => setPreviewUrl(null)}
                className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-slate-50"
                aria-label="Cerrar vista previa"
                title="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-auto bg-[#F7F8FA] p-4">
              <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
                {isProbablyImageUrl(previewUrl) ? (
                  <img
                    src={previewUrl}
                    alt="Evidencia"
                    className="block max-h-[70vh] w-full object-contain bg-white"
                  />
                ) : (
                  <iframe
                    src={previewUrl}
                    className="block h-[70vh] w-full bg-white"
                    title="Evidencia"
                  />
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 bg-white border-t border-gray-200">
              <Buttonx
                variant="outlined"
                label="Cerrar"
                icon="mdi:close"
                onClick={() => setPreviewUrl(null)}
              />
              <Buttonx
                variant="secondary"
                label="Descargar"
                icon="mdi:download"
                onClick={() =>
                  handleDownload(
                    previewUrl,
                    filenameFromUrl(previewUrl, "evidencia")
                  )
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
