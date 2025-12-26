import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { HiClock, HiX } from "react-icons/hi";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useAuth } from "@/auth/context";
import type {
  AlmacenRef,
  EstadoRef,
  MovimientoDetalle,
  MovimientoItem,
} from "@/services/ecommerce/movimiento/movimiento.types";
import { fetchMovimientoDetalle } from "@/services/ecommerce/movimiento/movimiento.api";

import truckLoop from "@/assets/video/delivery-truck.mp4";
import AlmacenDesde from "@/assets/images/almacen_desde.webp";
import AlmacenHacia from "@/assets/images/almacen_hacia.webp";

/** ---------------- Props: soporta uuid (fetch interno) o data directa ---------------- */
type BaseProps = { open: boolean; onClose: () => void };
type PropsWithUuid = BaseProps & { uuid: string; data?: undefined };
type PropsWithData = BaseProps & {
  data: MovimientoDetalle | null;
  uuid?: undefined;
};
type Props = PropsWithUuid | PropsWithData;

/** ---------------- Helpers ---------------- */
const toText = (v: unknown) => (v == null ? "" : String(v));

const nombreAlmacen = (ref?: AlmacenRef | number | string | null) =>
  !ref && ref !== 0
    ? ""
    : typeof ref === "object"
    ? toText(
        (ref as any)?.nombre_almacen ?? (ref as any)?.nombre ?? (ref as any)?.id
      )
    : toText(ref);

const nombreEstado = (ref?: EstadoRef | string | null) =>
  !ref
    ? ""
    : typeof ref === "object"
    ? toText((ref as any)?.nombre ?? (ref as any)?.id)
    : toText(ref);

const fechaLegible = (iso?: string, sep: string = " - ") => {
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
  let dot = "bg-slate-400";

  if (e.startsWith("vali")) {
    label = "Validado";
    classes = "bg-emerald-50 text-emerald-700 border border-emerald-200";
    dot = "bg-emerald-500";
  } else if (e.includes("proceso") || e.startsWith("proc")) {
    label = "Proceso";
    classes = "bg-amber-50 text-amber-800 border border-amber-200";
    dot = "bg-amber-500";
  } else if (e.startsWith("obser")) {
    label = "Observado";
    classes = "bg-rose-50 text-rose-700 border border-rose-200";
    dot = "bg-rose-500";
  }

  return { label, classes, dot };
}

/** ---------------- Modal ---------------- */
export default function VerMovimientoRealizadoModal(props: Props) {
  const { open, onClose } = props;
  const { token } = useAuth();

  // Estado interno cuando trabajamos con uuid
  const [detail, setDetail] = useState<MovimientoDetalle | null>(null);
  const [loading, setLoading] = useState(false);

  // Resolver la fuente del detalle (data directa o la que obtengamos por fetch)
  const data = useMemo<MovimientoDetalle | null>(() => {
    if ("data" in props) return props.data ?? null;
    return detail;
  }, [props, detail]);

  const uuid = "uuid" in props ? props.uuid : undefined;

  // Fetch cuando nos pasan uuid
  useEffect(() => {
    if (!open) return;

    if (uuid) {
      if (!token) {
        setLoading(false);
        setDetail(null);
        return;
      }

      setLoading(true);
      setDetail(null);

      fetchMovimientoDetalle(token, uuid)
        .then((d) => setDetail(d))
        .catch((e) => {
          console.error("Error al obtener movimiento:", e);
          setDetail(null);
        })
        .finally(() => setLoading(false));
    } else {
      setDetail(null);
      setLoading(false);
    }
  }, [open, token, uuid]);

  if (!open) return null;

  // Placeholder sin datos
  if (!data) {
    return createPortal(
      <div className="fixed inset-0 z-50">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
          onClick={onClose}
        />
        <div className="relative z-10 flex max-h-full items-center justify-center p-4">
          <div className="w-full max-w-[1360px] h-[92vh] overflow-hidden rounded-2xl border border-gray-200 shadow-2xl bg-white flex flex-col">
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
                      Detalles del movimiento
                    </h2>
                    <div className="mt-1 text-sm text-slate-600">
                      {loading ? "Cargando…" : "Sin datos"}
                    </div>
                  </div>
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

            <div className="flex-1 min-h-0 bg-[#F7F8FA] px-6 py-5">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-slate-600">
                {loading ? "Cargando movimiento…" : "Sin datos disponibles."}
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  const codigo = toText((data as any)?.codigo ?? (data as any)?.id ?? "");
  const estado = nombreEstado((data as any)?.estado);
  const { label: estadoLabel, classes: estadoCls, dot: estadoDot } =
    estadoPillUI(estado);

  const fechaGeneracion = fechaLegible(
    (data as any)?.meta?.fecha_generacion ?? (data as any)?.fecha
  );
  const fecha_validacion = fechaLegible(
    (data as any)?.meta?.fecha_validacion ?? (data as any)?.fecha
  );

  const descripcionRaw = toText((data as any)?.descripcion ?? "");
  const descripcion =
    descripcionRaw.trim().length > 0
      ? descripcionRaw
      : "Movimiento hecho para reabastecer el stock en el almacén destino.";

  let diasTranscurridos: string | null = null;
  try {
    const g = (data as any)?.meta?.fecha_generacion
      ? new Date((data as any).meta.fecha_generacion)
      : null;
    const v = (data as any)?.meta?.fecha_validacion
      ? new Date((data as any).meta.fecha_validacion)
      : null;
    if (g && v && !isNaN(g.getTime()) && !isNaN(v.getTime())) {
      const diff = Math.max(
        0,
        Math.round((v.getTime() - g.getTime()) / (1000 * 60 * 60 * 24))
      );
      diasTranscurridos = diff.toString().padStart(2, "0");
    }
  } catch {
    diasTranscurridos = null;
  }

  const items: MovimientoItem[] = Array.isArray((data as any)?.items)
    ? ((data as any).items as MovimientoItem[]).filter(Boolean)
    : [];

  const totalItems = items.length;

  const totalCantidad = items.reduce(
    (acc: number, it: any) => acc + Number(it?.cantidad_validada ?? 0),
    0
  );

  const origenName =
    nombreAlmacen((data as any)?.almacen_origen) || "Almacén Origen";
  const destinoName =
    nombreAlmacen((data as any)?.almacen_destino) || "Almacén Destino";

  const evidenciaUrl = toText((data as any)?.evidencia_url ?? "");

  const handleCopyCode = async () => {
    if (!codigo) return;
    try {
      await navigator.clipboard?.writeText(codigo);
    } catch (e) {
      console.warn("No se pudo copiar el código:", e);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-full items-center justify-center p-4">
        <div className="w-full max-w-[1360px] h-[92vh] overflow-hidden rounded-2xl border border-gray-200 shadow-2xl bg-white flex flex-col">
          {/* HEADER */}
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
                    Detalles del movimiento
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

                    {fecha_validacion ? (
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
                          {fecha_validacion}
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
                      className={["w-2 h-2 rounded-full", estadoDot].join(" ")}
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

          {/* BODY */}
          <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden bg-[#F7F8FA] px-6 py-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch lg:h-full min-h-0">
              {/* IZQUIERDA */}
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
                            ? `${diasTranscurridos} día${
                                diasTranscurridos === "01" ? "" : "s"
                              }`
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ✅ FIX: scroll interno en izquierda cuando el alto no alcanza */}
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
                            className="object-contain w-[76px] h-[76px] sm:w-[90px] sm:h-[90px]"
                            alt="Almacén desde"
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

                    {/* CONECTOR */}
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
                            className="object-contain w-[76px] h-[76px] sm:w-[90px] sm:h-[90px]"
                            alt="Almacén hacia"
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
                            {fecha_validacion || "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* /scroll container */}
                </div>
              </div>

              {/* DERECHA (igual que ya lo tenías funcionando) */}
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
                            {String(totalItems).padStart(2, "0")}
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
                          <th className="p-3 text-left font-semibold w-[72px]">
                            Img
                          </th>
                          <th className="p-3 text-left font-semibold">Código</th>
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
                        {items.length > 0 ? (
                          items.map((it, idx) => (
                            <tr
                              key={`${it.producto_uuid ?? it.producto_id ?? idx}`}
                              className="hover:bg-slate-50 transition-colors"
                            >
                              <td className="p-3">
                                <div className="w-12 h-12 rounded-xl border border-gray-200 bg-white overflow-hidden flex items-center justify-center">
                                  {it.imagen_url ? (
                                    <img
                                      src={it.imagen_url}
                                      alt={toText(it.nombre_producto ?? "Imagen")}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (
                                          e.currentTarget as HTMLImageElement
                                        ).style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <Icon
                                      icon="mdi:image-outline"
                                      width="22"
                                      height="22"
                                      className="text-slate-400"
                                    />
                                  )}
                                </div>
                              </td>

                              <td className="p-3 text-slate-700">
                                {toText(it.codigo_identificacion ?? "—")}
                              </td>

                              <td className="p-3">
                                <div className="font-semibold text-slate-900">
                                  {toText(it.nombre_producto ?? "—")}
                                </div>
                              </td>

                              <td className="p-3 text-slate-600">
                                {toText(it.descripcion ?? "—")}
                              </td>

                              <td className="p-3 text-right">
                                <span className="inline-flex items-center justify-center min-w-[44px] rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-800 tabular-nums">
                                  {String(Number(it.cantidad_validada ?? 0)).padStart(
                                    2,
                                    "0"
                                  )}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              className="p-8 text-center text-slate-500"
                              colSpan={5}
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

                {/* ADJUNTOS */}
                <div className="flex-1 min-h-0 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                        <Icon
                          icon="mdi:paperclip"
                          width="18"
                          height="18"
                          className="text-slate-700"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          Adjuntos y observaciones
                        </div>
                        <div className="text-xs text-slate-500">
                          {evidenciaUrl
                            ? "Archivo adjunto disponible"
                            : "No hay datos adicionales registrados"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 p-5 overflow-y-auto">
                    {evidenciaUrl ? (
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
                            <Icon
                              icon="mdi:file-outline"
                              width="20"
                              height="20"
                              className="text-slate-600"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-800 truncate">
                              Evidencia del movimiento
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              {evidenciaUrl}
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
                          <Icon icon="mdi:open-in-new" width="16" height="16" />
                          Abrir
                        </a>
                      </div>
                    ) : (
                      <div className="h-full rounded-xl bg-slate-50 border border-slate-200 p-6 text-center flex flex-col items-center justify-center">
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
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* /RIGHT */}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
