// src/shared/components/ecommerce/movimientos/ValidarMovimientoModal.tsx
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { HiX } from "react-icons/hi";

import { useAuth } from "@/auth/context";
import { useNotification } from "@/shared/context/notificacionesDeskop/useNotification";
import { validarMovimiento } from "@/services/ecommerce/almacenamiento/almacenamiento.api";
import type { MovimientoAlmacen } from "@/services/ecommerce/almacenamiento/almacenamiento.types";

import Buttonx from "@/shared/common/Buttonx";
import { InputxTextarea } from "@/shared/common/Inputx";
import ImageUploadx from "@/shared/common/ImageUploadx";

type Props = {
  open: boolean;
  onClose: () => void;
  movimiento: MovimientoAlmacen | null;
  onValidated?: (mov: MovimientoAlmacen) => void;
};

/* ===== helpers UI (solo estilo) ===== */
const estadoChipNode = (estado?: string) => {
  const name = (estado || "").toLowerCase();

  if (name.includes("valid")) {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
        Validado
      </span>
    );
  }
  if (name.includes("observ")) {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
        Observado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-100">
      Proceso
    </span>
  );
};

const fmtFecha = (iso?: string) =>
  iso
    ? new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(iso))
    : "—";

export default function ValidarMovimientoModal({
  open,
  onClose,
  movimiento,
  onValidated,
}: Props) {
  const { token } = useAuth();
  const { notify } = useNotification();

  const enProceso = useMemo(() => {
    const n = (movimiento?.estado?.nombre || "").toLowerCase();
    return n === "proceso" || n === "en proceso" || n === "activo";
  }, [movimiento]);

  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [observaciones, setObservaciones] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !movimiento) return;

    const init: Record<number, number> = {};
    movimiento.productos.forEach((it) => {
      init[it.producto.id] = it.cantidad ?? 0;
      if (typeof it.cantidad_validada === "number") {
        init[it.producto.id] = Math.max(
          0,
          Math.min(it.cantidad, it.cantidad_validada)
        );
      }
    });

    setCantidades(init);
    setObservaciones("");
    setArchivo(null);
  }, [open, movimiento]);

  const handleCantidadChange = (
    productoId: number,
    value: number,
    max: number
  ) => {
    const n = Number.isFinite(value) ? Math.trunc(value) : 0;
    const safe = Math.max(0, Math.min(n, max));
    setCantidades((prev) => ({ ...prev, [productoId]: safe }));
  };

  if (!open || !movimiento) return null;

  const puedeValidar = enProceso && !!token;

  const handleValidar = async () => {
    if (!puedeValidar) return;

    const items = movimiento.productos.map((it) => ({
      producto_id: it.producto.id,
      cantidad_validada:
        typeof cantidades[it.producto.id] === "number"
          ? cantidades[it.producto.id]
          : it.cantidad,
    }));

    const formData = new FormData();
    formData.append("items", JSON.stringify(items));
    formData.append("observaciones", observaciones?.trim() || "");
    if (archivo) formData.append("evidencia", archivo);

    setLoading(true);
    try {
      const actualizado = await validarMovimiento(
        movimiento.uuid,
        token!,
        formData
      );

      notify(
        actualizado?.estado?.nombre?.toLowerCase() === "validado"
          ? "Movimiento validado."
          : "Movimiento observado.",
        "success"
      );

      onValidated?.(actualizado);
      onClose();
    } catch (err) {
      console.error(err);
      notify("No se pudo validar el movimiento.", "error");
    } finally {
      setLoading(false);
    }
  };

  const estadoRaw = movimiento.estado?.nombre || "-";
  const codigo = movimiento.uuid.slice(0, 10).toUpperCase();

  const fechaGen =
    (movimiento as any)?.fecha_movimiento ||
    (movimiento as any)?.fecha_generacion ||
    (movimiento as any)?.created_at ||
    (movimiento as any)?.fecha ||
    "";

  return (
    // ✅ IMPORTANTE: este componente ya NO pinta overlay negro.
    // Se asume que el "contenedor modal/drawer" lo maneja el padre.
    <div
      className="w-[600px] max-w-[95vw] h-[100dvh] bg-white shadow-2xl border-l border-gray-200 flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="shrink-0 bg-slate-50 border-b border-gray-200">
        <div className="flex items-start justify-between px-4 pt-4 pb-3">
          <div className="min-w-0 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center shrink-0">
              <Icon
                icon="solar:check-square-linear"
                width="22"
                height="22"
                className="text-primary"
              />
            </div>

            <div className="min-w-0">
              <h2 className="text-[15px] sm:text-base font-extrabold tracking-tight text-primary uppercase leading-5">
                Validar movimiento
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-[12px] text-slate-700">
                  <span className="text-slate-500 font-semibold">Código:</span>
                  <span className="font-bold tabular-nums">{codigo}</span>
                </span>

                <span className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-[12px] text-slate-700">
                  <span className="text-slate-500 font-semibold">Estado:</span>
                  {estadoChipNode(estadoRaw)}
                </span>

                {loading && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1.5 text-[11px] font-semibold text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                    Procesando…
                  </span>
                )}

                {!enProceso && (
                  <span className="text-[11px] text-slate-500">
                    Este movimiento ya no está en proceso.
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            aria-label="Cerrar"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-slate-100 text-slate-700 shrink-0"
            title="Cerrar"
            disabled={loading}
          >
            <HiX className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Body (scroll) */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-white px-4 pb-4">
        {/* Descripción */}
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900">Descripción</div>
              <p className="text-[13px] text-slate-600 mt-1 leading-relaxed break-words">
                {movimiento.descripcion || "—"}
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 shrink-0">
              <Icon icon="mdi:information-outline" className="text-slate-700" />
              <p className="text-xs text-slate-700">
                Ajusta cantidades si hay diferencias y deja una observación.
              </p>
            </div>
          </div>
        </div>

        {/* Tabla productos */}
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-slate-900">Productos</div>
              <div className="text-xs text-slate-500">
                Ajusta cantidades (máximo según registro)
              </div>
            </div>

            <span className="text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-full px-3 py-1">
              {movimiento.productos.length} ítem(s)
            </span>
          </div>

          <div className="max-h-[42vh] overflow-y-auto overflow-x-hidden">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[96px]" />
                <col />
                <col />
                <col className="w-[148px]" />
              </colgroup>

              <thead className="bg-slate-50 text-slate-600">
                <tr className="text-left">
                  <th className="px-4 py-3 text-[11px] font-semibold">CÓDIGO</th>
                  <th className="px-4 py-3 text-[11px] font-semibold">PRODUCTO</th>
                  <th className="px-4 py-3 text-[11px] font-semibold">DESCRIPCIÓN</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-center">
                    CANTIDAD
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {movimiento.productos.map((det) => {
                  const max = det.cantidad ?? 0;
                  const val = cantidades[det.producto.id] ?? max;

                  return (
                    <tr key={det.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 align-top">
                        <div
                          className="text-[12px] font-semibold text-slate-800 truncate"
                          title={det.producto?.codigo_identificacion || "—"}
                        >
                          {det.producto?.codigo_identificacion ?? "—"}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top min-w-0">
                        <div
                          className="font-semibold text-slate-900 truncate"
                          title={det.producto?.nombre_producto || "—"}
                        >
                          {det.producto?.nombre_producto || "—"}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top min-w-0">
                        <div
                          className="text-[12px] text-slate-600 line-clamp-2"
                          title={(det.producto as any)?.descripcion || "—"}
                        >
                          {(det.producto as any)?.descripcion || "—"}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top">
                        <div className="flex justify-end items-center gap-2 whitespace-nowrap">
                          <input
                            type="number"
                            inputMode="numeric"
                            step={1}
                            min={0}
                            max={max}
                            value={val}
                            onChange={(e) =>
                              handleCantidadChange(
                                det.producto.id,
                                Number(e.target.value),
                                max
                              )
                            }
                            disabled={!enProceso || loading}
                            className="w-[74px] h-9 border border-gray-200 rounded-xl px-2 text-right text-[13px] font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                          <span className="text-[11px] text-slate-500 tabular-nums">
                            / {max}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {movimiento.productos.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-slate-500 italic"
                    >
                      No hay productos para validar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Observaciones */}
        <div className="mt-4">
          <InputxTextarea
            label="Observaciones"
            name="observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ejem. Algunos productos vinieron con pequeños golpes."
            disabled={!enProceso || loading}
            minRows={3}
            maxRows={6}
            autoResize
          />
        </div>

        {/* Evidencia */}
        <div className="mt-4">
          <ImageUploadx
            label="Seleccione un archivo, arrástrelo o suéltelo."
            value={archivo}
            onChange={setArchivo}
            maxSizeMB={5}
            accept="image/*,.pdf"
            disabled={!enProceso || loading}
          />
        </div>

        {/* Footer */}
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white shadow-sm px-4 py-3 flex items-center gap-3">
          <Buttonx
            label={loading ? "Validando…" : "Validar"}
            variant="secondary"
            onClick={handleValidar}
            disabled={!puedeValidar || loading}
            icon={loading ? "mdi:reload" : undefined}
            className={loading ? "[&>span>svg]:animate-spin" : ""}
          />

          <Buttonx
            label="Cancelar"
            variant="outlinedw"
            onClick={onClose}
            disabled={loading}
          />

          <div className="ml-auto text-[11px] text-slate-500">
            {fechaGen ? <>Fec. generación: {fmtFecha(fechaGen)}</> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
