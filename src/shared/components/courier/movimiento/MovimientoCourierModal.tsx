// src/shared/components/courier/movimiento/DetallesMovimientoCourierModal.tsx
import { useEffect, useRef, useState } from "react";
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

import truckLoop from "@/assets/video/delivery-truck.mp4";
import AlmacenDesde from "@/assets/images/almacen_desde.webp";
import AlmacenHacia from "@/assets/images/almacen_hacia.webp";

type BaseProps = { open: boolean; onClose: () => void };
type Props = BaseProps & {
  uuid: string;
  /** Si es "validar" muestra Observaciones + Adjuntar y botón Validar */
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

  // default gris
  let label = estadoRaw || "—";
  let classes = "bg-gray-100 text-gray-600";

  if (e.startsWith("vali")) {
    // ✅ Validado
    label = "Validado";
    classes = "bg-[#EAF8EF] text-[#139A43]";
  } else if (e.includes("proceso") || e.startsWith("proc")) {
    // 🟨 Proceso
    label = "Proceso";
    classes = "bg-[#FFF7D6] text-[#B98900]";
  } else if (e.startsWith("obser")) {
    // 🟥 Observado
    label = "Observado";
    classes = "bg-[#FFE3E3] text-[#D64040]";
  }

  return { label, classes };
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

  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<CourierMovimientoDetalle | null>(null);
  const [, setError] = useState<string | null>(null);

  // validación
  const [observaciones, setObservaciones] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const canValidate =
    mode === "validar" &&
    (detail?.estado?.nombre || "").toLowerCase().includes("proceso");

  useEffect(() => {
    if (!open || !uuid || !token) return;
    let mounted = true;
    setLoading(true);
    setError(null);
    setDetail(null);

    fetchCourierMovimientoDetalle(uuid, token)
      .then((d) => mounted && setDetail(d))
      .catch((e: any) =>
        mounted && setError(e?.message || "Error al obtener movimiento")
      )
      .finally(() => mounted && setLoading(false));

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
  const fechaGeneracion = fechaLegible((data as any)?.fecha_movimiento);
  const fecha_validacion = fechaLegible(
    (data as any)?.fecha_validacion || (data as any)?.meta?.fecha_validacion
  );

  // días transcurridos
  let diasTranscurridos: string | null = null;
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
        Math.round(
          (v.getTime() - g.getTime()) / (1000 * 60 * 60 * 24)
        )
      );
      diasTranscurridos = diff.toString().padStart(2, "0");
    }
  } catch {
    diasTranscurridos = null;
  }

  const handlePick = () => inputRef.current?.click();

  const handleValidate = async () => {
    if (!token || !data) return;
    try {
      setLoading(true);
      await validarCourierMovimiento(uuid, token, {
        observaciones: observaciones.trim() || undefined,
        evidencia: file || undefined,
      });
      notify("Movimiento marcado como Observado.", "success");
      onValidated?.();
      onClose();
    } catch (e: any) {
      notify(e?.message || "Error al validar el movimiento", "error");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Contenido CENTRADO tipo modal */}
      <div className="relative z-10 flex max-h-full items-center justify-center p-4">
        <div className="w-full max-w-[1500px] bg-white rounded-sm shadow-xl overflow-hidden max-h-[92vh]">
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-5">
            <div className="flex items-center gap-2">
              <Icon
                icon="icon-park-outline:cycle-movement"
                width="24"
                height="24"
                className="text-primary"
              />
              <h2 className="text-2xl font-bold tracking-tight text-primary">
                {mode === "validar"
                  ? "VALIDAR MOVIMIENTO"
                  : "DETALLES DEL MOVIMIENTO"}
              </h2>
            </div>
            <button
              aria-label="Cerrar"
              onClick={onClose}
              className="p-2 rounded hover:bg-gray-100"
            >
              <HiX className="h-5 w-5" />
            </button>
          </div>

          {/* Subheader: Código + Estado (estilo Figma) */}
          <div className="flex items-center justify-between px-6 pb-2">
            {/* Código */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 font-semibold">Código :</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {codigo || "—"}
              </span>

              {!!codigo && (
                <button
                  type="button"
                  className="ml-1 p-1 rounded hover:bg-slate-100 text-slate-400"
                  onClick={() => navigator.clipboard?.writeText(codigo)}
                  title="Copiar código"
                >
                  <Icon icon="uiw:copy" width="12" height="12" />
                </button>
              )}
            </div>

            {/* Estado : [Pill grande] */}
            {(() => {
              const { label, classes } = estadoPillUI(estado);
              return (
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 font-bold text-[12px] leading-none">
                    Estado :
                  </span>
                  <span
                    className={[
                      "inline-flex items-center rounded-[16px] px-6 py-2",
                      "text-[12px] font-bold leading-none",
                      classes,
                    ].join(" ")}
                  >
                    {label}
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Body */}
          <div className="overflow-y-auto px-6 space-y-4 pb-6">
            {/* Descripción */}
            <div>
              <div className="text-slate-800 font-semibold">Descripción</div>
              <p className="text-slate-600 mt-1">
                {toText(
                  (data as any)?.descripcion ||
                    "Movimiento hecho para reabastecer el stock en el almacén destino."
                )}
              </p>
            </div>

            {/* GRID principal 5/7 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Izquierda: tarjeta con 3 DIVS (Desde / Carrito / Hacia) */}
              <div className="lg:col-span-5">
                <div className="border rounded-sm h-auto bg-white border-gray-400">
                  <div className="px-8 py-6">
                    {/* === Tres columnas, cada una centrada horizontal y vertical === */}
                    <div className="grid grid-cols-3 gap-10 place-items-center min-h-[300px]">
                      {/* DESDE */}
                      <div className="text-center">
                        <div className="text-slate-500 font-semibold mb-2">
                          Desde
                        </div>
                        <div className="mx-auto w-[160px] h-[160px]">
                          <img
                            src={AlmacenDesde}
                            alt="Almacén desde"
                            className="object-contain w-full h-full"
                          />
                        </div>
                        <div className="mt-2 text-[20px] font-semibold text-slate-800">
                          {nombreAlmacen((data as any)?.almacen_origen) ||
                            "Almacén Origen"}
                        </div>
                        <div className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#E7F0FF] px-3 py-2">
                          <span className="text-[#2153A3] text-[12px] font-semibold">
                            Fecha de Generación
                          </span>
                        </div>
                        <div className="mt-3 text-slate-600 text-[14px]">
                          {fechaGeneracion || "—"}
                        </div>
                      </div>

                      {/* CARRITO (centro) */}
                      <div className="w-full h-full flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 flex items-center justify-center">
                          {/* Usa tu video del carrito */}
                          <video
                            src={truckLoop}
                            className="w-16 h-16 rounded-md"
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="auto"
                          />
                        </div>
                        <div className="mt-3 text-gray-600 text-[14px]">
                          Tiempo transcurrido
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[14px] text-gray-700">
                          <HiClock className="w-4 h-4" />
                          <span>
                            {diasTranscurridos
                              ? `${diasTranscurridos} día${
                                  diasTranscurridos === "01" ? "" : "s"
                                }`
                              : "—"}
                          </span>
                        </div>
                      </div>

                      {/* HACIA */}
                      <div className="text-center">
                        <div className="text-slate-500 font-semibold mb-2">
                          Hacia
                        </div>
                        <div className="mx-auto w-[160px] h-[160px]">
                          <img
                            src={AlmacenHacia}
                            alt="Almacén hacia"
                            className="object-contain w-full h-full"
                          />
                        </div>
                        <div className="mt-2 text-[20px] font-semibold text-slate-800">
                          {nombreAlmacen((data as any)?.almacen_destino) ||
                            "Almacén Destino"}
                        </div>
                        <div className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#FFF1BF] px-3 py-2">
                          <span className="text-[#B98900] text-[12px] font-semibold">
                            Fecha de Validación
                          </span>
                        </div>
                        <div className="mt-3 text-slate-600 text-[14px]">
                          {fecha_validacion || "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tarjeta inferior vacía */}
                <div className="mt-6 mb-4 border rounded-sm bg-white border-gray-400">
                  <div className="p-10 text-center text-slate-400">
                    <p>Sin datos que mostrar, no hay</p>
                    <p>descripción ni archivo adjuntado.</p>
                  </div>
                </div>
              </div>

              {/* Derecha: Tabla de detalle */}
              <div className="lg:col-span-7">
                <div className="h-full border rounded-sm overflow-hidden bg-white border-gray-400">
                  <table className="items-start w-full text-sm ">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
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
                    <tbody>
                      {(data?.productos ?? []).length > 0 ? (
                        data!.productos.map((dp: any, idx: number) => (
                          <tr
                            key={dp.id ?? idx}
                            className="border-t"
                          >
                            <td className="p-3">
                              {toText(
                                dp.producto?.codigo_identificacion ?? ""
                              )}
                            </td>
                            <td className="p-3">
                              {toText(dp.producto?.nombre_producto ?? "")}
                            </td>
                            <td className="p-3 text-slate-600">
                              {toText(dp.producto?.descripcion ?? "")}
                            </td>
                            <td className="p-3 text-right">
                              {Number(dp.cantidad_validada ?? 0)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            className="p-6 text-center text-slate-500 italic"
                            colSpan={4}
                          >
                            Sin ítems en este movimiento.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Sección de validación (opcional) */}
                {canValidate && (
                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800">
                        Observaciones
                      </label>
                      <textarea
                        rows={3}
                        value={observaciones}
                        onChange={(e) =>
                          setObservaciones(e.target.value)
                        }
                        placeholder="Ejem. Algunos productos vinieron con pequeños golpes."
                        className="w-full border rounded-lg px-3 py-2 text-sm resize-none bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800">
                        Adjuntar evidencia
                      </label>
                      <div className="flex items-center justify-between gap-3 border-2 border-dashed rounded-lg px-4 py-4 border-gray-300">
                        <div className="text-xs text-gray-500">
                          Seleccione un archivo, arrástrelo o suéltelo.{" "}
                          <span className="text-gray-400">
                            JPG, PNG o PDF
                          </span>
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
                          <button
                            type="button"
                            onClick={handlePick}
                            className="px-3 py-2 text-sm rounded border hover:bg-gray-100"
                          >
                            Seleccione archivo
                          </button>
                          {file && (
                            <span className="text-xs text-gray-600 truncate max-w-[180px]">
                              {file.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer (sólo si validar) */}
          {canValidate && (
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleValidate}
                disabled={loading}
                className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800 disabled:opacity-60"
              >
                {loading ? "Enviando…" : "Validar"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
