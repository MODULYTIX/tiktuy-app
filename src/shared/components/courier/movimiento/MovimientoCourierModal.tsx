// src/shared/components/courier/movimiento/DetallesMovimientoCourierModal.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HiClock, HiX } from "react-icons/hi";
import { Icon } from "@iconify/react/dist/iconify.js";

import { useAuth } from "@/auth/context/useAuth";
import { useNotification } from "@/shared/context/notificacionesDeskop/useNotification";

import {
  fetchCourierMovimientoDetalle,
  validarCourierMovimiento,
} from "@/services/courier/movimiento/movimientoCourier.api";
import type { CourierMovimientoDetalle } from "@/services/courier/movimiento/movimientoCourier.type";

import Buttonx from "@/shared/common/Buttonx";
import { InputxTextarea } from "@/shared/common/Inputx";

import truckLoop from "@/assets/video/delivery-truck.mp4";
import AlmacenDesde from "@/assets/images/almacen_desde.webp";
import AlmacenHacia from "@/assets/images/almacen_hacia.webp";

type BaseProps = { open: boolean; onClose: () => void };
type Props = BaseProps & {
  uuid: string;
  mode?: "ver" | "validar";
  onValidated?: () => void;
};

/* ---------------- helpers ---------------- */
const toText = (v: unknown) => (v == null ? "" : String(v));

const nombreAlmacen = (ref?: any) =>
  !ref && ref !== 0
    ? ""
    : toText(ref?.nombre_almacen ?? ref?.nombre ?? ref?.id ?? ref);

const fechaLegible = (iso?: string, sep = " - ") => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy}${sep}${hh}:${min}`;
};

function estadoPillUI(estadoRaw: string) {
  const e = (estadoRaw || "").toLowerCase().trim();

  let label = estadoRaw || "—";
  let classes = "bg-slate-100 text-slate-600 border border-slate-200";

  if (e.startsWith("vali")) {
    label = "Validado";
    classes = "bg-emerald-50 text-emerald-700 border border-emerald-200";
  } else if (e.includes("proceso") || e.startsWith("proc")) {
    label = "Proceso";
    classes = "bg-amber-50 text-amber-800 border border-amber-200";
  } else if (e.startsWith("obser")) {
    label = "Observado";
    classes = "bg-rose-50 text-rose-700 border border-rose-200";
  }

  return { label, classes };
}

const clampName = (s: string, fallback: string) => {
  const t = (s || "").trim();
  return t.length ? t : fallback;
};

function nombreArchivoDesdeUrl(url: string) {
  try {
    const last = url.split("/").pop() ?? "";
    return last.split("?")[0];
  } catch {
    return "archivo_adjunto";
  }
}

/* ---------------- componente ---------------- */
export default function DetallesMovimientoCourierModal({
  open,
  uuid,
  mode = "ver",
  onClose,
  onValidated,
}: Props) {
  const { token } = useAuth();
  const { notify } = useNotification();

  const [fetching, setFetching] = useState(false);
  const [detail, setDetail] = useState<CourierMovimientoDetalle | null>(null);
  const [, setError] = useState<string | null>(null);

  // validación
  const [submitting, setSubmitting] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const canValidate =
    mode === "validar" &&
    (detail?.estado?.nombre || "").toLowerCase().includes("proceso");

  useEffect(() => {
    if (!open || !uuid || !token) return;
    let mounted = true;

    setFetching(true);
    setError(null);
    setDetail(null);

    fetchCourierMovimientoDetalle(uuid, token)
      .then((d) => mounted && setDetail(d))
      .catch((e: any) =>
        mounted && setError(e?.message || "Error al obtener movimiento")
      )
      .finally(() => mounted && setFetching(false));

    return () => {
      mounted = false;
    };
  }, [open, uuid, token]);

  if (!open) return null;

  const data = detail;

  const codigo =
    toText((data as any)?.codigo) ||
    toText((data?.uuid || "").slice(0, 10).toUpperCase());

  const estado = toText(data?.estado?.nombre || "");
  const { label: estadoLabel, classes: estadoCls } = estadoPillUI(estado);

  const descripcion = toText(
    (data as any)?.descripcion ||
    "Movimiento hecho para reabastecer el stock en el almacén destino."
  );

  const fechaGeneracion = fechaLegible((data as any)?.fecha_movimiento);
  const fechaValidacion = fechaLegible(
    (data as any)?.fecha_validacion || (data as any)?.meta?.fecha_validacion
  );

  const diasTranscurridos = useMemo(() => {
    try {
      const g = (data as any)?.fecha_movimiento
        ? new Date((data as any).fecha_movimiento)
        : null;
      const v =
        (data as any)?.fecha_validacion
          ? new Date((data as any).fecha_validacion)
          : (data as any)?.meta?.fecha_validacion
            ? new Date((data as any).meta.fecha_validacion)
            : null;

      if (g && v && !isNaN(g.getTime()) && !isNaN(v.getTime())) {
        const diff = Math.max(
          0,
          Math.round((v.getTime() - g.getTime()) / (1000 * 60 * 60 * 24))
        );
        return diff.toString().padStart(2, "0");
      }
      return null;
    } catch {
      return null;
    }
  }, [data]);

  const productos = data?.productos ?? [];
  const totalProductos = productos.length;

  const totalCantidad = useMemo(() => {
    try {
      return (productos ?? []).reduce(
        (acc: number, it: any) => acc + Number(it?.cantidad_validada ?? 0),
        0
      );
    } catch {
      return 0;
    }
  }, [productos]);

  const origenName = clampName(
    nombreAlmacen((data as any)?.almacen_origen),
    "Almacén Origen"
  );
  const destinoName = clampName(
    nombreAlmacen((data as any)?.almacen_destino),
    "Almacén Destino"
  );

  const handlePick = () => inputRef.current?.click();

  const handleCopyCode = async () => {
    if (!codigo) return;
    try {
      await navigator.clipboard?.writeText(codigo);
      notify("Código copiado.", "success");
    } catch { }
  };

  const handleValidate = async () => {
    if (!token || !data) return;
    try {
      setSubmitting(true);
      await validarCourierMovimiento(uuid, token, {
        observaciones: observaciones.trim() || undefined,
        evidencia: file || undefined,
      });
      notify("Movimiento actualizado correctamente.", "success");
      onValidated?.();
      onClose();
    } catch (e: any) {
      notify(e?.message || "Error al validar el movimiento", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 flex max-h-full items-center justify-center p-4">
        <div className="w-full max-w-[1360px] h-[92vh] overflow-hidden rounded-2xl border border-gray-200 shadow-2xl bg-white flex flex-col">
          {/* Header */}
          <div className="bg-slate-50 border-b border-gray-200 px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center shrink-0">
                  <Icon
                    icon="icon-park-outline:cycle-movement"
                    width="22"
                    height="22"
                    className="text-primary"
                  />
                </div>

                <div className="min-w-0">
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight text-primary truncate">
                    {mode === "validar"
                      ? "Validar movimiento"
                      : "Detalles del movimiento"}
                  </h2>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-2">
                      <span className="font-semibold text-slate-500">
                        Código:
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-2.5 py-1 text-slate-700">
                        <span className="font-medium">{codigo || "—"}</span>
                        {!!codigo && (
                          <button
                            type="button"
                            className="p-1 rounded-md hover:bg-slate-100 text-slate-500"
                            onClick={handleCopyCode}
                            title="Copiar código"
                            aria-label="Copiar código"
                          >
                            <Icon icon="uiw:copy" width="13" height="13" />
                          </button>
                        )}
                      </span>
                    </span>

                    {fechaGeneracion ? (
                      <span className="inline-flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-100 px-2.5 py-1 text-blue-700">
                        <Icon
                          icon="mdi:calendar-blank-outline"
                          width="16"
                          height="16"
                        />
                        <span className="font-semibold text-[12px]">
                          Generado:
                        </span>
                        <span className="text-[12px] tabular-nums">
                          {fechaGeneracion}
                        </span>
                      </span>
                    ) : null}

                    {fechaValidacion ? (
                      <span className="inline-flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-100 px-2.5 py-1 text-amber-800">
                        <Icon
                          icon="mdi:calendar-check-outline"
                          width="16"
                          height="16"
                        />
                        <span className="font-semibold text-[12px]">
                          Validación:
                        </span>
                        <span className="text-[12px] tabular-nums">
                          {fechaValidacion}
                        </span>
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 shrink-0">
                <div className="flex flex-col items-end gap-2">
                  <span className="text-[12px] font-semibold text-slate-500">
                    Estado
                  </span>
                  <span
                    className={[
                      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold leading-none",
                      estadoCls,
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "w-2 h-2 rounded-full",
                        estadoLabel === "Validado"
                          ? "bg-emerald-500"
                          : estadoLabel === "Proceso"
                            ? "bg-amber-500"
                            : estadoLabel === "Observado"
                              ? "bg-rose-500"
                              : "bg-slate-400",
                      ].join(" ")}
                    />
                    {estadoLabel}
                  </span>
                </div>

                <button
                  aria-label="Cerrar"
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-slate-50"
                >
                  <HiX className="h-5 w-5 text-slate-700" />
                </button>
              </div>
            </div>

            {/* Descripción */}
            <div className="mt-4 rounded-xl bg-white border border-gray-200 px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                  <Icon
                    icon="mdi:text-box-outline"
                    width="18"
                    height="18"
                    className="text-slate-600"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-800">
                    Descripción
                  </div>
                  <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">
                    {descripcion}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden bg-[#F7F8FA] px-6 py-5">
            {fetching && !detail ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-slate-600">
                <div className="inline-flex items-center gap-2">
                  <Icon
                    icon="line-md:loading-twotone-loop"
                    width="20"
                    height="20"
                  />
                  <span className="font-medium">Cargando movimiento…</span>
                </div>
              </div>
            ) : (
              //  NO forzar h-full en mobile (solo en lg)
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch lg:h-full min-h-0">
                {/* LEFT */}
                <div className="lg:col-span-6 lg:h-full min-h-0">
                  <div className="lg:h-full rounded-2xl border border-gray-200 bg-white shadow-sm flex flex-col overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                            <Icon
                              icon="mdi:map-marker-path"
                              width="18"
                              height="18"
                              className="text-slate-700"
                            />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">
                              Ruta del movimiento
                            </div>
                            <div className="text-xs text-slate-500">
                              Origen → Destino
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 rounded-full bg-slate-50 border border-slate-200 px-3 py-1.5">
                          <HiClock className="w-4 h-4 text-slate-500" />
                          <span className="text-xs font-semibold text-slate-600">
                            Tiempo:
                          </span>
                          <span className="text-xs font-bold tabular-nums text-slate-800">
                            {diasTranscurridos
                              ? `${diasTranscurridos} día${diasTranscurridos === "01" ? "" : "s"
                              }`
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/*  FIX: scroll interno para que SIEMPRE se vean los 3 bloques en laptops */}
                    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 pr-2 flex flex-col gap-4 lg:gap-5">
                      {/* DESDE */}
                      <div className="shrink-0 rounded-2xl bg-slate-50 border border-slate-200 p-4">
                        <div className="text-xs font-semibold text-slate-500">
                          Desde
                        </div>

                        <div className="mt-3 flex flex-col sm:flex-row sm:items-center items-start gap-4 min-w-0">
                          <div className="w-[84px] h-[84px] sm:w-[100px] sm:h-[100px] rounded-2xl bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                            <img
                              src={AlmacenDesde}
                              alt="Almacén desde"
                              className="object-contain w-[76px] h-[76px] sm:w-[90px] sm:h-[90px]"
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="text-[17px] font-extrabold text-slate-900 leading-tight break-words">
                              {origenName}
                            </div>

                            <div className="mt-2.5 inline-flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-1.5">
                              <Icon
                                icon="mdi:calendar-blank-outline"
                                width="16"
                                height="16"
                                className="text-blue-700"
                              />
                              <span className="text-[12px] font-semibold text-blue-700">
                                Generación
                              </span>
                            </div>

                            <div className="mt-1.5 text-[13px] text-slate-600 tabular-nums">
                              {fechaGeneracion || "—"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* CONECTOR / TIEMPO */}
                      <div className="shrink-0 flex items-center justify-center">
                        <div className="shrink-0 w-full rounded-2xl bg-white border border-gray-200 shadow-sm px-4 py-4 sm:px-5 sm:py-5 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
                            <video
                              src={truckLoop}
                              className="w-12 h-12"
                              autoPlay
                              loop
                              muted
                              playsInline
                              preload="auto"
                            />
                          </div>

                          <div className="text-center">
                            <div className="text-xs text-slate-500 font-semibold">
                              Tiempo transcurrido
                            </div>
                            <div className="mt-1 text-base font-extrabold text-slate-900 tabular-nums">
                              {diasTranscurridos ? diasTranscurridos : "—"}
                              <span className="ml-1 text-xs font-semibold text-slate-600">
                                día{diasTranscurridos === "01" ? "" : "s"}
                              </span>
                            </div>
                          </div>

                          {/* ✅ evitar overflow en pantallas chicas */}
                          <Icon
                            icon="mdi:arrow-down"
                            width="26"
                            height="26"
                            className="text-slate-400 hidden sm:block"
                          />
                        </div>
                      </div>

                      {/* HACIA */}
                      <div className="shrink-0 rounded-2xl bg-slate-50 border border-slate-200 p-4">
                        <div className="text-xs font-semibold text-slate-500">
                          Hacia
                        </div>

                        <div className="mt-3 flex flex-col sm:flex-row sm:items-center items-start gap-4 min-w-0">
                          <div className="w-[84px] h-[84px] sm:w-[100px] sm:h-[100px] rounded-2xl bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                            <img
                              src={AlmacenHacia}
                              alt="Almacén hacia"
                              className="object-contain w-[76px] h-[76px] sm:w-[90px] sm:h-[90px]"
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="text-[17px] font-extrabold text-slate-900 leading-tight break-words">
                              {destinoName}
                            </div>

                            <div className="mt-2.5 inline-flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-1.5">
                              <Icon
                                icon="mdi:calendar-check-outline"
                                width="16"
                                height="16"
                                className="text-amber-800"
                              />
                              <span className="text-[12px] font-semibold text-amber-800">
                                Validación
                              </span>
                            </div>

                            <div className="mt-1.5 text-[13px] text-slate-600 tabular-nums">
                              {fechaValidacion || "—"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* /scroll left */}
                  </div>
                </div>

                {/* RIGHT */}
                {/*  50/50 real: flex-col + ambos cards flex-1 */}
                <div className="lg:col-span-6 lg:h-full min-h-0 flex flex-col gap-4">
                  {/* TABLA */}
                  <div className="flex-1 min-h-0 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                            <Icon
                              icon="mdi:format-list-bulleted"
                              width="18"
                              height="18"
                              className="text-slate-700"
                            />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">
                              Productos trasladados
                            </div>
                            <div className="text-xs text-slate-500">
                              Detalle por ítem
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">
                            Ítems:{" "}
                            <span className="font-bold tabular-nums">
                              {String(totalProductos).padStart(2, "0")}
                            </span>
                          </span>
                          <span className="rounded-full bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">
                            Cant.:{" "}
                            <span className="font-bold tabular-nums">
                              {String(totalCantidad).padStart(2, "0")}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto overscroll-contain">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700">
                          <tr>
                            <th className="p-3 text-left font-semibold">
                              Código
                            </th>
                            <th className="p-3 text-left font-semibold">
                              Producto
                            </th>
                            <th className="p-3 text-left font-semibold">
                              Descripción
                            </th>
                            <th className="p-3 text-right font-semibold">
                              Cantidad
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {totalProductos > 0 ? (
                            productos.map((dp: any, idx: number) => (
                              <tr
                                key={dp.id ?? idx}
                                className="hover:bg-slate-50 transition-colors"
                              >
                                <td className="p-3 text-slate-700">
                                  {toText(
                                    dp.producto?.codigo_identificacion ?? "—"
                                  )}
                                </td>
                                <td className="p-3">
                                  <div className="font-semibold text-slate-900">
                                    {toText(
                                      dp.producto?.nombre_producto ?? "—"
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 text-slate-600">
                                  {toText(dp.producto?.descripcion ?? "—")}
                                </td>
                                <td className="p-3 text-right">
                                  <span className="inline-flex items-center justify-center min-w-[44px] rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-800 tabular-nums">
                                    {String(
                                      Number(dp.cantidad_validada ?? 0)
                                    ).padStart(2, "0")}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                className="p-8 text-center text-slate-500"
                                colSpan={4}
                              >
                                <div className="inline-flex flex-col items-center gap-2">
                                  <Icon
                                    icon="mdi:tray-remove"
                                    width="26"
                                    height="26"
                                    className="text-slate-400"
                                  />
                                  <span className="text-sm font-semibold">
                                    Sin ítems en este movimiento
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    No hay productos registrados para mostrar.
                                  </span>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ADJUNTOS / OBSERVACIONES / VALIDACIÓN */}
                  <div className="flex-1 min-h-0 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                          <Icon
                            icon={
                              canValidate
                                ? "mdi:clipboard-check-outline"
                                : "mdi:paperclip"
                            }
                            width="18"
                            height="18"
                            className="text-slate-700"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">
                            {canValidate
                              ? "Validación"
                              : "Adjuntos y observaciones"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {canValidate
                              ? "Registra observaciones y adjunta evidencia"
                              : "No hay datos adicionales registrados"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/*  body con scroll interno para respetar 50/50 */}
                    <div className="flex-1 min-h-0 p-5 overflow-y-auto">
                      {canValidate ? (
                        <div className="space-y-4">
                          <InputxTextarea
                            label="Observaciones"
                            placeholder="Ejem. Algunos productos vinieron con pequeños golpes."
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            minRows={3}
                            maxRows={6}
                          />

                          <div className="rounded-xl border border-dashed border-gray-300 bg-slate-50 p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="text-sm text-slate-700">
                                <div className="font-semibold">
                                  Adjuntar evidencia
                                </div>
                                <div className="text-xs text-slate-500">
                                  JPG, PNG o PDF.
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <input
                                  ref={inputRef}
                                  type="file"
                                  className="hidden"
                                  accept="image/*,.pdf"
                                  onChange={(e) =>
                                    setFile(e.target.files?.[0] || null)
                                  }
                                />

                                <Buttonx
                                  label="Seleccionar archivo"
                                  icon="tabler:upload"
                                  variant="outlined"
                                  onClick={handlePick}
                                />

                                {file ? (
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                                    onClick={() => setFile(null)}
                                    title="Quitar archivo"
                                  >
                                    <Icon
                                      icon="mdi:file-outline"
                                      width="16"
                                      height="16"
                                    />
                                    <span className="max-w-[220px] truncate">
                                      {file.name}
                                    </span>
                                    <Icon
                                      icon="lucide:x"
                                      width="14"
                                      height="14"
                                      className="text-slate-400"
                                    />
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full rounded-xl bg-slate-50 border border-slate-200 p-6 flex flex-col items-center justify-center text-center">
                          {(() => {
                            const evidenciaUrl = (data as any)?.evidencia_url;
                            return evidenciaUrl ? (
                              <div className="w-full rounded-xl bg-white border border-gray-200 p-4 flex items-center justify-between gap-3 shadow-sm">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-gray-200 flex items-center justify-center shrink-0">
                                    <Icon
                                      icon="mdi:file-outline"
                                      width="20"
                                      height="20"
                                      className="text-slate-600"
                                    />
                                  </div>
                                  <div className="min-w-0 text-left">
                                    <div className="text-sm font-semibold text-slate-800 truncate">
                                      Evidencia del movimiento
                                    </div>
                                    <div className="text-xs text-slate-500 truncate">
                                      {nombreArchivoDesdeUrl(evidenciaUrl)}
                                    </div>
                                  </div>
                                </div>

                                <a
                                  href={evidenciaUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shrink-0"
                                  title="Abrir evidencia"
                                >
                                  <Icon
                                    icon="mdi:open-in-new"
                                    width="16"
                                    height="16"
                                  />
                                  Abrir
                                </a>
                              </div>
                            ) : (
                              <>
                                <div className="mx-auto w-12 h-12 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center">
                                  <Icon
                                    icon="mdi:inbox-outline"
                                    width="22"
                                    height="22"
                                    className="text-slate-600"
                                  />
                                </div>
                                <div className="mt-3 text-sm font-semibold text-slate-800">
                                  Sin datos que mostrar
                                </div>
                                <div className="mt-1 text-xs text-slate-500">
                                  No hay descripción adicional ni archivo adjuntado.
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {canValidate && (
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-2">
              <Buttonx
                label="Cancelar"
                icon="mdi:close"
                variant="outlined"
                onClick={onClose}
                disabled={submitting}
              />
              <Buttonx
                label={submitting ? "Enviando…" : "Validar"}
                icon="mdi:check"
                variant="secondary"
                onClick={handleValidate}
                disabled={submitting}
              />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
