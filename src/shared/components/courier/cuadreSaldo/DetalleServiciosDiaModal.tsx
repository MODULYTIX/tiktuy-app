// src/shared/components/courier/cuadreSaldo/DetalleServiciosDiaModal.tsx
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";

import Tittlex from "@/shared/common/Tittlex";
import Buttonx from "@/shared/common/Buttonx";

// ✅ tus componentes
import ImageUploadx from "@/shared/common/ImageUploadx";
import ImagePreviewModalx from "@/shared/common/ImagePreviewModalx";

export type DetalleServicioPedidoItem = {
  id: number;
  fechaEntrega: string | Date | null;
  cliente: string;
  distrito?: string | null;
  metodoPago?: string | null;

  monto: number;

  // (pueden venir 0 aunque haya default en otros campos)
  servicioRepartidor: number;
  servicioCourier: number;
  motivo?: string | null;

  pagoEvidenciaUrl?: string | null;

  // ✅ compat posibles (no rompen si no existen)
  servicioSugerido?: number | null;
  servicioEfectivo?: number | null;
  servicioCourierEfectivo?: number | null;

  servicio_repartidor?: number | null;
  servicio_courier?: number | null;
  servicio_sugerido?: number | null;
  servicio_efectivo?: number | null;
  servicio_courier_efectivo?: number | null;

  estado?: string | null;
  estadoPedido?: string | null;
  estado_pedido?: string | null;
  status?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  fecha: string; // YYYY-MM-DD
  sedeNombre?: string;
  motorizadoNombre?: string;
  items: DetalleServicioPedidoItem[];
  loading?: boolean;
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

/** normaliza método de pago para comparaciones */
const normMetodoPago = (v: unknown) =>
  String(v ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

/** ✅ Etiqueta visual (NO toca lógica) */
const metodoPagoLabel = (metodoPago: unknown) => {
  const m = normMetodoPago(metodoPago);

  // ✅ si no hay método => Pedido rechazado
  if (!m) return "Pedido rechazado";

  if (m === "DIRECTO_ECOMMERCE") return "Pago Digital al Ecommerce";
  if (m === "BILLETERA") return "Pago Digital al Courier";
  if (m === "EFECTIVO") return "Efectivo";

  return String(metodoPago ?? "Pedido rechazado");
};

/* ===================== ✅ FIX SERVICIOS (igual que CuadreSaldoTable) ===================== */

const isMetodoPagoNullOEmpty = (p: any) => {
  const raw = p?.metodoPago ?? p?.metodo_pago ?? null;
  return raw === null || String(raw).trim() === "";
};

const numOrNull = (v: any): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const numOr0 = (v: any): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * ✅ En detalle: mostrar servicios NORMAL siempre (aunque sea rechazado)
 * - Motorizado: servicioEfectivo -> servicioSugerido -> 0
 * - Courier: servicioCourierEfectivo -> servicioCourier -> 0
 * - "editado" se marca si viene servicioRepartidor/servicioCourier (camel o snake) no-null
 */
const getRepEdit = (p: any) =>
  numOrNull(p?.servicioRepartidor ?? p?.servicio_repartidor ?? null);

const getRepValueNormal = (p: any) =>
  numOr0(
    p?.servicioEfectivo ??
    p?.servicio_efectivo ??
    p?.servicioSugerido ??
    p?.servicio_sugerido ??
    0
  );

const getCourEdit = (p: any) =>
  numOrNull(p?.servicioCourier ?? p?.servicio_courier ?? null);

const getCourValueNormal = (p: any) =>
  numOr0(
    p?.servicioCourierEfectivo ??
    p?.servicio_courier_efectivo ??
    p?.servicioCourier ??
    p?.servicio_courier ??
    0
  );

function calcServicioRep(p: any): { value: number; edited: boolean } {
  const editedVal = getRepEdit(p);
  // ✅ si hay editado, muestro editado; si no, muestro el normal (sin forzar 0 por rechazado)
  if (editedVal != null) return { value: editedVal, edited: true };
  return { value: getRepValueNormal(p), edited: false };
}

function calcServicioCour(p: any): { value: number; edited: boolean } {
  const editedVal = getCourEdit(p);
  if (editedVal != null) return { value: editedVal, edited: true };
  return { value: getCourValueNormal(p), edited: false };
}

/** ✅ Monto visual: si no hay método de pago => 0 */
const montoVisual = (p: any) => (isMetodoPagoNullOEmpty(p) ? 0 : numOr0(p?.monto ?? 0));

/* ===================== evidencia helpers ===================== */

// ✅ soporta url absoluta y relativa
const isProbablyImageUrl = (url: string) => {
  const clean = String(url || "").trim();
  if (!clean) return false;

  const guessExt = (path: string) => {
    const ext = (path.split(".").pop() || "").toLowerCase().split("?")[0];
    return ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext);
  };

  try {
    const u = new URL(clean, window.location.origin);
    return guessExt(u.pathname);
  } catch {
    return guessExt(clean);
  }
};

const isPdfUrl = (url: string) => {
  const clean = String(url || "").trim();
  if (!clean) return false;
  const guessExt = (path: string) =>
    (path.split(".").pop() || "").toLowerCase().split("?")[0] === "pdf";

  try {
    const u = new URL(clean, window.location.origin);
    return guessExt(u.pathname);
  } catch {
    return guessExt(clean);
  }
};

function Chip({
  icon,
  label,
  tone = "neutral",
}: {
  icon: string;
  label: string;
  tone?: "neutral" | "dark";
}) {
  const cls =
    tone === "dark"
      ? "bg-gray90 text-white border-gray90"
      : "bg-gray10 text-gray80 border-gray20";
  return (
    <span
      className={[
        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-semibold border",
        cls,
      ].join(" ")}
    >
      <Icon icon={icon} width={16} height={16} />
      <span className="truncate">{label}</span>
    </span>
  );
}

function MetricCard({
  title,
  value,
  icon,
  tone = "neutral",
  subtitle,
  badge,
}: {
  title: string;
  value: string;
  icon: string;
  subtitle?: string;
  tone?: "neutral" | "soft";
  badge?: string | null;
}) {
  return (
    <div
      className={[
        "rounded-xl border border-gray30 p-4 shadow-sm",
        tone === "soft" ? "bg-gray10" : "bg-white",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[12px] text-gray60">{title}</div>
          <div className="mt-1 flex items-center gap-2">
            <div className="text-[18px] font-semibold text-gray90">{value}</div>
            {badge ? (
              <span className="rounded-full bg-gray20 px-2 py-0.5 text-[11px] font-semibold text-gray80">
                {badge}
              </span>
            ) : null}
          </div>
          {subtitle ? (
            <div className="mt-1 text-[12px] text-gray60">{subtitle}</div>
          ) : null}
        </div>
        <span className="inline-flex w-9 h-9 items-center justify-center rounded-lg bg-white border border-gray20 text-gray70">
          <Icon icon={icon} width={18} height={18} />
        </span>
      </div>
    </div>
  );
}

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

  const servicios = useMemo(() => {
    const rep = calcServicioRep(pedido);
    const cour = calcServicioCour(pedido);
    return { rep, cour };
  }, [pedido]);

  const totals = useMemo(() => {
    const monto = montoVisual(pedido);
    const rep = servicios.rep.value;
    const cour = servicios.cour.value;

    return {
      monto,
      servicioRepartidor: rep,
      servicioCourier: cour,
      servicioTotal: rep + cour,
      neto: monto - cour, // ✅ SOLO resta el servicio del courier
    };
  }, [pedido, servicios]);


  if (!open) return null;

  const title = "DETALLE DEL CUADRE";
  const subTitle = `Detalle del pedido • ${toDMY(fecha)}`;

  const hasEvidencia = Boolean((pedido as any)?.pagoEvidenciaUrl);
  const evidenciaUrl = String((pedido as any)?.pagoEvidenciaUrl ?? "").trim();

  const netoTone =
    totals.neto < 0
      ? "text-red-600"
      : totals.neto === 0
        ? "text-gray70"
        : "text-gray90";

  const handleViewEvidence = (url: string) => {
    const clean = String(url || "").trim();
    if (!clean) return;
    if (isProbablyImageUrl(clean)) setPreviewUrl(clean);
    else window.open(clean, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={[
          "absolute right-0 top-0 h-full w-[460px] max-w-[95vw]",
          "bg-white shadow-2xl border-l border-gray30",
          "overflow-hidden flex flex-col animate-slide-in-right",
        ].join(" ")}
        aria-modal="true"
        role="dialog"
      >
        {/* HEADER */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray20">
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-start justify-between gap-3">
              <Tittlex
                variant="modal"
                icon="mdi:clipboard-text-outline"
                title={title}
                description={subTitle}
              />

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-md hover:bg-gray10 text-gray70"
                aria-label="Cerrar"
                title="Cerrar"
              >
                <Icon icon="mdi:close" width={20} height={20} />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {pedido?.id ? (
                <Chip
                  icon="mdi:package-variant-closed"
                  label={`Pedido #${pedido.id}`}
                  tone="dark"
                />
              ) : null}
              <Chip icon="mdi:calendar-month-outline" label={toDMY(fecha)} />
              {sedeNombre ? (
                <Chip icon="mdi:storefront-outline" label={sedeNombre} />
              ) : null}
              {motorizadoNombre ? (
                <Chip icon="mdi:motorbike" label={motorizadoNombre} />
              ) : null}
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="relative flex-1 overflow-y-auto px-5 py-5">
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 text-[12px] text-gray70">
              <div className="flex items-center gap-2">
                <Icon
                  icon="line-md:loading-twotone-loop"
                  width={18}
                  height={18}
                  className="animate-spin"
                />
                Cargando...
              </div>
            </div>
          )}

          {!loading && !pedido ? (
            <div className="rounded-xl border border-gray30 bg-gray10 p-4 text-[12px] text-gray70">
              {pedidoId
                ? "No se encontró información para el pedido seleccionado."
                : "No hay información para mostrar."}
            </div>
          ) : (
            <>
              {/* Cliente */}
              <div className="rounded-2xl border border-gray30 bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray10 border-b border-gray20 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray80 font-semibold text-[12px]">
                    <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-white border border-gray20">
                      <Icon icon="mdi:account-outline" width={18} height={18} />
                    </span>
                    Datos del cliente
                  </div>

                  <span className="text-[12px] text-gray60">
                    {`Pago: ${metodoPagoLabel((pedido as any)?.metodoPago)}`}
                  </span>

                </div>

                <div className="p-4">
                  <div className="text-[12px] text-gray60">Cliente</div>
                  <div className="mt-0.5 text-[16px] font-semibold text-gray90 truncate">
                    {(pedido as any)?.cliente ?? "-"}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-gray20 bg-white p-3">
                      <div className="text-[12px] text-gray60">Distrito</div>
                      <div className="mt-1 text-[13px] font-semibold text-gray90 truncate">
                        {(pedido as any)?.distrito ?? "-"}
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray20 bg-white p-3">
                      <div className="text-[12px] text-gray60">
                        Método de pago
                      </div>
                      <div className="mt-1 text-[13px] font-semibold text-gray90 truncate">
                        {metodoPagoLabel((pedido as any)?.metodoPago)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Métricas */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <MetricCard
                  title="Total"
                  value={formatPEN(totals.monto)}
                  icon="mdi:cash-multiple"
                  tone="soft"
                />
                <MetricCard
                  title="Fecha"
                  value={toDMY(fecha)}
                  icon="mdi:calendar-check-outline"
                  subtitle="Fecha de cuadre / entrega"
                  tone="soft"
                />

                <MetricCard
                  title="Servicio Motorizado"
                  value={formatPEN(totals.servicioRepartidor)}
                  icon="mdi:motorbike"
                  tone="neutral"
                  badge={servicios.rep.edited ? "editado" : null}
                />
                <MetricCard
                  title="Servicio Courier"
                  value={formatPEN(totals.servicioCourier)}
                  icon="mdi:truck-outline"
                  tone="neutral"
                  badge={servicios.cour.edited ? "editado" : null}
                />
              </div>

              {/* Neto + Motivo */}
              <div className="mt-3 rounded-2xl border border-gray30 bg-white shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[12px] text-gray60">Neto</div>
                      <div
                        className={[
                          "mt-1 text-[18px] font-semibold",
                          netoTone,
                        ].join(" ")}
                      >
                        {formatPEN(totals.neto)}
                      </div>
                    </div>


                  </div>

                  <div className="mt-4 rounded-xl border border-gray20 bg-gray10 p-3">
                    <div className="text-[12px] text-gray60">Motivo</div>
                    <div className="mt-1 text-[13px] font-medium text-gray90">
                      {(pedido as any)?.motivo ? (pedido as any).motivo : "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Evidencia */}
              <div className="mt-4 rounded-2xl border border-gray30 bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray10 border-b border-gray20 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray80 font-semibold text-[12px]">
                    <Icon
                      icon="mdi:receipt-text-outline"
                      width={18}
                      height={18}
                    />
                    Evidencia de pago
                  </div>

                  {!hasEvidencia ? (
                    <span className="text-[12px] text-gray60">No registrada</span>
                  ) : (
                    <span className="text-[12px] font-semibold text-emerald-700">
                      Registrada
                    </span>
                  )}
                </div>

                <div className="p-4">
                  {!hasEvidencia ? (
                    <div className="rounded-xl border-2 border-dashed border-gray30 bg-gray10 px-4 py-4 text-[12px] text-gray70">
                      <div className="flex items-start gap-3">
                        <span className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-white border border-gray20">
                          <Icon
                            icon="mdi:file-alert-outline"
                            width={18}
                            height={18}
                          />
                        </span>
                        <div className="leading-relaxed">
                          <div className="font-semibold text-gray80">
                            Este pedido no tiene evidencia.
                          </div>
                          <div className="text-gray60">
                            Si corresponde, se registrará al momento del cobro.
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-gray20 bg-white p-3">
                      <ImageUploadx
                        label="Evidencia"
                        mode="view"
                        value={evidenciaUrl}
                        accept="image/*,.pdf"
                        helperText={isPdfUrl(evidenciaUrl) ? "PDF" : "JPG, PNG"}
                        onView={handleViewEvidence}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="h-3" />
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="sticky bottom-0 z-10 bg-white border-t border-gray20 px-5 py-4">
          <div className="flex items-center justify-start gap-3">
            <Buttonx variant="outlined" label="Cerrar" onClick={onClose} />
          </div>
        </div>
      </aside>

      {/* Preview SOLO para imágenes */}
      <ImagePreviewModalx
        open={Boolean(previewUrl)}
        onClose={() => setPreviewUrl(null)}
        url={previewUrl ?? ""}
        title={`Evidencia de pago • Pedido #${pedido?.id ?? "—"}`}
      />
    </div>
  );
}
