import React, { useMemo, useState } from "react";
import type { PedidoDiaItem } from "@/services/courier/cuadre_saldo/cuadreSaldoE.types";
import Buttonx from "@/shared/common/Buttonx";

type Props = {
  open: boolean;
  fecha: string;
  ecommerceNombre: string;
  items: PedidoDiaItem[];
  loading: boolean;
  onClose: () => void;
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

/** normaliza método de pago para comparaciones / UI */
const normMetodoPago = (v: unknown) =>
  String(v ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

/** ✅ Etiqueta visual para método de pago (NO afecta lógica) */
const metodoPagoLabel = (metodoPago: unknown) => {
  const m = normMetodoPago(metodoPago);

  // ✅ si no hay método => Pedido rechazado
  if (!m) return "Pedido rechazado";

  if (m === "DIRECTO_ECOMMERCE") return "Pago Digital al Ecommerce";
  if (m === "BILLETERA") return "Pago Digital al Courier";
  if (m === "EFECTIVO") return "Efectivo";

  return String(metodoPago ?? "Pedido rechazado");
};

/** Detecta si el pedido está rechazado (según nombre de estado del BE) */
const isRejected = (it: any) => {
  const estado = String(
    it?.estadoNombre ??
    it?.estado_nombre ??
    it?.estado ??
    ""
  ).toLowerCase();

  return estado.includes("rechaz");
};


// ✅ monto visual:
// - DIRECTO_ECOMMERCE => 0 (solo UI)
// - Pedido rechazado => 0
function montoVisual(it: any): number {
  const mp = normMetodoPago(it?.metodoPago ?? it?.metodo_pago);

  // ✅ Caso 1: método vacío → Pedido rechazado visual
  if (!mp) return 0;

  // ✅ Caso 2: pago directo ecommerce
  if (mp === "DIRECTO_ECOMMERCE") return 0;

  // ✅ Caso 3: estado rechazado explícito (por si acaso)
  if (isRejected(it)) return 0;

  return Number(it?.monto ?? 0);
}


/**
 * ✅ Rechazados: solo listar cuando el courier ya editó o abonó al repartidor.
 */
function canShowRejected(it: any): boolean {
  if (!isRejected(it)) return true;

  const abonado = Boolean(it?.abonado);
  const servicioRepartidor =
    it?.servicioRepartidor ?? it?.servicio_repartidor ?? null;

  const motivo =
    it?.motivo ??
    it?.servicioRepartidorMotivo ??
    it?.servicio_repartidor_motivo ??
    null;

  return (
    abonado ||
    servicioRepartidor != null ||
    (typeof motivo === "string" && motivo.trim() !== "")
  );
}

/**
 * ✅ Determina el estado del abono ecommerce por pedido
 * Reglas:
 * - Si viene el nombre del estado desde BE: usarlo
 * - Si no viene, fallback: si hay evidencia de abono => asumimos Por Validar/Validado
 * - Si no hay evidencia => Sin Validar
 */
const isProbablyImageUrl = (url: string) => {
  try {
    const u = new URL(url);
    const ext = (u.pathname.split(".").pop() || "").toLowerCase();
    return ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext);
  } catch {
    return false;
  }
};

const fileNameFromUrl = (url: string) => {
  try {
    const u = new URL(url);
    const base = u.pathname.split("/").pop() || "evidencia";
    const clean = base.split("?")[0].split("#")[0];
    return clean || "evidencia";
  } catch {
    const base = String(url).split("?")[0].split("#")[0].split("/").pop();
    return base || "evidencia";
  }
};

const EcommerceDetalleModal: React.FC<Props> = ({
  open,
  fecha,
  ecommerceNombre,
  items,
  loading,
  onClose,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);



  // ✅ descarga real
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // ✅ Filtrado final: rechazados solo si courier ya editó o abonó
  const visibleItems = useMemo(
    () => items.filter((it: any) => canShowRejected(it)),
    [items]
  );
  const totalMontoVisible = useMemo(
    () =>
      visibleItems.reduce(
        (acc, it: any) => acc + montoVisual(it),
        0
      ),
    [visibleItems]
  );

  const totalServicioCourierDia = useMemo(
    () =>
      visibleItems.reduce(
        (acc, it: any) => acc + Number(it?.servicioCourier ?? 0),
        0
      ),
    [visibleItems]
  );

  const closeAll = () => {
    setPreviewUrl(null);
    setDownloadError(null);
    setDownloading(false);
    onClose();
  };

  const handleClosePreview = () => {
    setPreviewUrl(null);
    setDownloadError(null);
    setDownloading(false);
  };

  const handleDownloadEvidence = async () => {
    if (!previewUrl || downloading) return;

    setDownloading(true);
    setDownloadError(null);

    try {
      const res = await fetch(previewUrl, { mode: "cors" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileNameFromUrl(previewUrl);
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => URL.revokeObjectURL(blobUrl), 800);
    } catch (e) {
      console.error("No se pudo descargar evidencia:", e);
      setDownloadError(
        "No se pudo descargar. Puede ser por permisos (CORS) del servidor."
      );
    } finally {
      setDownloading(false);
    }
  };
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-3 sm:p-4">
      {/* Modal principal */}
      <div className="w-[1200px] max-w-[96vw] max-h-[82vh] sm:max-h-[84vh] rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="bg-slate-50 border-b border-gray-200 px-5 sm:px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center shrink-0">
                  <span className="text-slate-700 text-lg leading-none">🧾</span>
                </div>

                <div className="min-w-0">
                  <div className="text-base md:text-lg font-extrabold tracking-tight text-slate-900 truncate">
                    Pedidos del día
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-[12px] text-slate-700">
                      <span className="text-slate-500 font-semibold">
                        Fecha:
                      </span>
                      <span className="font-bold tabular-nums">
                        {toDMY(fecha)}
                      </span>
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-[12px] text-slate-700 max-w-[520px]">
                      <span className="text-slate-500 font-semibold">
                        Ecommerce:
                      </span>
                      <span className="font-bold truncate">
                        {ecommerceNombre}
                      </span>
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-[11px] font-semibold text-emerald-800">
                      solo courier
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* close */}
            <button
              onClick={closeAll}
              className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-slate-50 text-slate-700 shrink-0"
              aria-label="Cerrar"
              title="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-[#F7F8FA] px-4 sm:px-6 py-4">
          <div className="min-h-0 flex flex-col gap-3">
            {/* Resumen + CTA */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      Resumen
                    </div>
                    <div className="text-xs text-slate-500">
                      Totales del día
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5">
                    <div className="text-xs font-semibold text-slate-500">
                      Pedidos (visibles)
                    </div>
                    <div className="mt-1 text-lg font-extrabold tabular-nums text-slate-900">
                      {String(visibleItems.length).padStart(2, "0")}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5">
                    <div className="text-xs font-semibold text-slate-500">
                      Servicio total
                    </div>
                    <div className="mt-1 text-lg font-extrabold tabular-nums text-slate-900">
                      {formatPEN(totalServicioCourierDia)}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      Solo <b>servicio courier</b>.
                    </div>
                  </div>

                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3.5">
                    <div className="text-xs font-semibold text-emerald-800">
                      Estado
                    </div>
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white border border-emerald-200 px-3 py-2 text-[11px] font-bold text-emerald-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Listo para revisión
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla */}
            <div className="mt-1 bg-white rounded-2xl overflow-hidden shadow-default border border-gray30 relative">
              {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 text-sm">
                  Cargando...
                </div>
              )}

              <section className="flex-1 overflow-auto max-h-[280px] sm:max-h-[320px] md:max-h-[380px] lg:max-h-[420px]">
                <div className="overflow-x-auto bg-white">
                  <table className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30 rounded-t-md">
                    <colgroup>
                      <col className="w-[26%]" /> {/* Cliente */}
                      <col className="w-[16%]" /> {/* Método */}
                      <col className="w-[14%]" /> {/* Monto */}
                      <col className="w-[14%]" /> {/* Servicio courier */}
                      <col className="w-[20%]" /> {/* Motivo */}
                      <col className="w-[10%]" /> {/* Evidencia */}
                    </colgroup>


                    <thead className="bg-[#E5E7EB]">
                      <tr className="text-gray70 font-roboto font-medium">
                        <th className="px-4 py-3 text-left">Cliente</th>
                        <th className="px-4 py-3 text-left">Método de Pago / Estado</th>
                        <th className="px-4 py-3 text-left">Monto</th>
                        <th className="px-4 py-3 text-left">Servicio courier</th>
                        <th className="px-4 py-3 text-left">Motivo</th>
                        <th className="px-4 py-3 text-left">Evidencia</th>

                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray20">
                      {visibleItems.length === 0 ? (
                        <tr className="hover:bg-transparent">
                          <td
                            colSpan={6}
                            className="px-4 py-8 text-center text-gray70 italic"
                          >
                            Sin pedidos
                          </td>
                        </tr>
                      ) : (
                        visibleItems.map((it: any) => {
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
                            <tr
                              key={it.id}
                              className="hover:bg-gray10 transition-colors"
                            >
                              <td className="px-4 py-3 text-gray70">
                                <div className="font-medium text-gray80">
                                  {it.cliente}
                                </div>
                                <div className="mt-0.5 text-[11px] text-gray-500">
                                  Pedido #{it.id}
                                </div>
                              </td>

                              {/* ✅ método con label */}
                              <td className="px-4 py-3 text-gray70">
                                {metodoPagoLabel(it.metodoPago)}
                              </td>

                              {/* ✅ monto 0 si rechazado o DIRECTO_ECOMMERCE */}
                              <td className={`px-4 py-3 ${isRejected(it) ? "text-gray-400 italic" : "text-gray70"}`}>
                                {formatPEN(montoVisual(it))}
                              </td>


                              <td className="px-4 py-3 text-gray70">
                                {formatPEN(Number(it.servicioCourier ?? 0))}
                              </td>

                              <td className="px-4 py-3 text-gray70">
                                <div className="line-clamp-2">
                                  {motivo || "-"}
                                </div>
                              </td>

                              <td className="px-4 py-3">
                                {!evidenciaUrl ? (
                                  <span className="text-gray-400">—</span>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <Buttonx
                                      variant="outlined"
                                      label="Ver"
                                      icon="mdi:eye-outline"
                                      onClick={() => {
                                        setDownloadError(null);
                                        setPreviewUrl(String(evidenciaUrl));
                                      }}
                                      className="!h-7 !px-2 !text-[11px]"
                                      title="Ver evidencia"
                                    />
                                  </div>
                                )}
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
          </div>
        </div>
      </div>

      {/* Lightbox Evidencia */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4"
          onClick={handleClosePreview}
        >
          <div
            className="relative w-full max-w-4xl max-h-[86vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-gray-200">
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 truncate">
                  Vista previa de evidencia
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {previewUrl}
                </div>
              </div>

              <button
                onClick={handleClosePreview}
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
                    className="block max-h-[70vh] w-full object-contain"
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

            <div className="flex flex-wrap items-center justify-end gap-2 px-5 py-4 bg-white border-t border-gray-200">
              <Buttonx
                variant="secondary"
                label={downloading ? "Descargando..." : "Descargar"}
                icon={
                  downloading ? "line-md:loading-twotone-loop" : "mdi:download"
                }
                onClick={handleDownloadEvidence}
                disabled={downloading}
                className={downloading ? "[&_svg]:animate-spin" : ""}
                title="Descargar evidencia"
              />

              <Buttonx
                variant="outlined"
                label="Cerrar"
                icon="mdi:close"
                onClick={handleClosePreview}
              />

              {downloadError ? (
                <div className="w-full text-[12px] text-rose-600 mt-1">
                  {downloadError}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EcommerceDetalleModal;
