// src/shared/components/courier/movimiento/ValidarMovimientoCourierModal.tsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import { HiX } from "react-icons/hi";

import { useAuth } from "@/auth/context/useAuth";
import { useNotification } from "@/shared/context/notificacionesDeskop/useNotification";

import {
  fetchCourierMovimientoDetalle,
  validarCourierMovimiento,
} from "@/services/courier/movimiento/movimientoCourier.api";
import type { CourierMovimientoDetalle } from "@/services/courier/movimiento/movimientoCourier.type";

import Buttonx from "@/shared/common/Buttonx";
import ImageUploadx from "@/shared/common/ImageUploadx";
import { InputxTextarea } from "@/shared/common/Inputx";

const detalleCache = new Map<string, CourierMovimientoDetalle>();

type Props = {
  open: boolean;
  uuid: string;
  onClose: () => void;
  onValidated?: () => void;
};

const estadoChip = (estado?: string) => {
  const name = (estado || "").toLowerCase();
  if (name.includes("validado"))
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
        Validado
      </span>
    );
  if (name.includes("observado"))
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
        Observado
      </span>
    );
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

export default function ValidarMovimientoCourierModal({
  open,
  uuid,
  onClose,
  onValidated,
}: Props) {
  const { token } = useAuth();
  const { notify } = useNotification();

  const [loading, setLoading] = useState(false);
  const [detalle, setDetalle] = useState<CourierMovimientoDetalle | null>(
    detalleCache.get(uuid) || null
  );
  const [, setError] = useState<string | null>(null);
  const [observaciones, setObservaciones] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [cantidades, setCantidades] = useState<Record<number, number>>({});

  const canValidate = useMemo(
    () =>
      (detalle?.estado?.nombre || "").toLowerCase().includes("proceso") ||
      (detalle?.estado?.nombre || "").toLowerCase() === "activo",
    [detalle?.estado?.nombre]
  );

  // Cargar detalle
  useEffect(() => {
    if (!open || !uuid || !token) return;
    let mounted = true;

    (async () => {
      try {
        setError(null);
        if (!detalleCache.get(uuid)) setLoading(true);

        const data = await fetchCourierMovimientoDetalle(uuid, token);
        if (!mounted) return;

        detalleCache.set(uuid, data);
        setDetalle(data);

        // Inicializar cantidades
        const init: Record<number, number> = {};
        data.productos.forEach((p) => {
          init[p.producto.id] = p.cantidad ?? 0;
        });
        setCantidades(init);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Error al cargar el movimiento");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, uuid, token]);

  const handleCantidadChange = (
    productoId: number,
    value: number,
    max: number
  ) => {
    const n = Number.isFinite(value) ? Math.trunc(value) : 0;
    const safe = Math.max(0, Math.min(n, max));
    setCantidades((prev) => ({ ...prev, [productoId]: safe }));
  };

  const handleValidate = async () => {
    if (!token || !detalle) return;
    try {
      setLoading(true);

      // Verificar si se modificó alguna cantidad
      const editoAlgo = detalle.productos.some(
        (it) => cantidades[it.producto.id] !== it.cantidad
      );
      const obs = observaciones.trim() || undefined;

      // Enviar a backend (observaciones + evidencia)
      await validarCourierMovimiento(uuid, token, {
        observaciones: obs,
        evidencia: file || undefined,
        cantidades,
      });

      if (editoAlgo || obs) {
        notify("Movimiento observado", "error");
      } else {
        notify(
          "Movimiento validado correctamente. Stock actualizado.",
          "success"
        );
      }

      onValidated?.();
      onClose();
    } catch (e: any) {
      notify(e?.message || "Error al validar el movimiento", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const codigo =
    (detalle?.uuid || "").slice(0, 10).toUpperCase() ||
    (detalle as any)?.codigo ||
    "—";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      onClick={onClose}
    >
      {/* ✅ Drawer (600px) */}
      <div
        className="w-[600px] max-w-[95vw] h-full bg-white shadow-2xl border-l border-gray-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 bg-slate-50 border-b border-gray-200">
          <div className="flex items-start justify-between px-4 pt-4 pb-3">
            <div className="min-w-0 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center shrink-0">
                <Icon
                  icon="icon-park-outline:cycle-movement"
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
                    {estadoChip(detalle?.estado?.nombre)}
                  </span>

                  {loading && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1.5 text-[11px] font-semibold text-slate-700">
                      <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                      Cargando…
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
            >
              <HiX className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body (scroll) */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-white px-4 pb-4">
          {/* Descripción */}
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
            <div className="text-sm font-bold text-slate-900">Descripción</div>
            <p className="text-[13px] text-slate-600 mt-1 leading-relaxed">
              {detalle?.descripcion ||
                "Movimiento para reabastecer stock en destino."}
            </p>
          </div>

          {/* Tabla editable */}
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-slate-900">Productos</div>
                <div className="text-xs text-slate-500">
                  Ajusta cantidades (máximo según registro)
                </div>
              </div>

              <span className="text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-full px-3 py-1">
                {detalle?.productos?.length ?? 0} ítems
              </span>
            </div>

            {/* ✅ IMPORTANTE: sin scroll horizontal; truncamos producto */}
            <div className="max-h-[42vh] overflow-y-auto overflow-x-hidden">
              <table className="w-full text-sm table-fixed">
                {/* ✅ fija columnas para que Cantidad nunca se salga */}
                <colgroup>
                  <col className="w-[96px]" />   {/* Código */}
                  <col />                        {/* Producto */}
                  <col className="w-[124px]" />  {/* Cantidad */}
                </colgroup>

                <thead className="bg-slate-50 text-slate-600">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-[11px] font-semibold">
                      Código
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-center">
                      Cantidad
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {detalle?.productos?.map((dp) => {
                    const max = dp.cantidad_validada ?? dp.cantidad ?? 0;
                    const val = cantidades[dp.producto.id] ?? max;

                    return (
                      <tr key={dp.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 align-top">
                          <div
                            className="text-[12px] font-semibold text-slate-800 truncate"
                            title={dp.producto?.codigo_identificacion || "—"}
                          >
                            {dp.producto?.codigo_identificacion || "—"}
                          </div>
                        </td>

                        {/* ✅ aquí aplicamos “…” real */}
                        <td className="px-4 py-3 align-top min-w-0">
                          <div className="min-w-0 pr-2">
                            <div
                              className="font-semibold text-slate-900 truncate"
                              title={dp.producto?.nombre_producto || "—"}
                            >
                              {dp.producto?.nombre_producto || "—"}
                            </div>

                            <div
                              className="mt-0.5 text-[12px] text-slate-500 line-clamp-2"
                              title={dp.producto?.descripcion || "—"}
                            >
                              {dp.producto?.descripcion || "—"}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 align-top">
                          <div className="flex justify-end items-center gap-2 whitespace-nowrap">
                            <input
                              type="number"
                              min={0}
                              max={max}
                              step={1}
                              disabled={!canValidate}
                              value={val}
                              onChange={(e) =>
                                handleCantidadChange(
                                  dp.producto.id,
                                  Number(e.target.value),
                                  max
                                )
                              }
                              className="w-[74px] h-9 border border-gray-200 rounded-xl px-2 text-right text-[13px] font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 disabled:bg-gray-100"
                            />
                            <span className="text-[11px] text-slate-500 tabular-nums">
                              / {max}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Observaciones */}
          <div className="mt-4">
            <InputxTextarea
              label="Observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ejem. Algunos productos llegaron con pequeñas diferencias."
              disabled={!canValidate}
              minRows={3}
              maxRows={5}
            />
          </div>

          {/* Evidencia */}
          <div className="mt-4">
            <ImageUploadx
              label="Seleccione un archivo, arrástrelo o suéltelo."
              value={file}
              onChange={setFile}
              maxSizeMB={5}
              accept="image/*,.pdf"
              disabled={!canValidate}
            />
          </div>

          {/* Footer */}
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white shadow-sm px-4 py-3 flex items-center gap-3">
            <Buttonx
              label={loading ? "Validando…" : "Validar"}
              variant="secondary"
              onClick={handleValidate}
              disabled={!canValidate || loading}
              icon={loading ? "mdi:reload" : undefined}
              className={loading ? "[&>span>svg]:animate-spin" : ""}
            />

            <Buttonx label="Cancelar" variant="outlinedw" onClick={onClose} />

            <div className="ml-auto text-[11px] text-slate-500">
              {detalle?.fecha_movimiento && (
                <>Fec. generación: {fmtFecha(detalle.fecha_movimiento)}</>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
