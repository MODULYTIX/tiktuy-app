// src/shared/components/ecommerce/movimientos/ValidarMovimientoModal.tsx
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";

import { useAuth } from "@/auth/context";
import { useNotification } from "@/shared/context/notificacionesDeskop/useNotification";
import { validarMovimiento } from "@/services/ecommerce/almacenamiento/almacenamiento.api";
import type { MovimientoAlmacen } from "@/services/ecommerce/almacenamiento/almacenamiento.types";

import Tittlex from "@/shared/common/Tittlex";
import Buttonx from "@/shared/common/Buttonx";
import { InputxTextarea } from "@/shared/common/Inputx";

type Props = {
  open: boolean;
  onClose: () => void;
  movimiento: MovimientoAlmacen | null;
  onValidated?: (mov: MovimientoAlmacen) => void;
};

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
    } catch (err) {
      console.error(err);
      notify("No se pudo validar el movimiento.", "error");
    } finally {
      setLoading(false);
    }
  };

  const estadoRaw = movimiento.estado?.nombre || "-";
  const headerEstado = estadoRaw.charAt(0).toUpperCase() + estadoRaw.slice(1);
  const estadoLower = estadoRaw.toLowerCase();

  const estadoChip =
    estadoLower.includes("valid")
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : enProceso
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-rose-50 text-rose-700 border-rose-200";

  const codeShort = movimiento.uuid.slice(0, 12).toUpperCase();
  const descriptionText = `Código: ${codeShort} • Estado: ${headerEstado || "-"}`;

  return (
    <div
      // ✅ FULL ALTO PANTALLA
      className="w-[700px] h-[100dvh] max-h-[100dvh] bg-white shadow-xl flex flex-col overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* =========================
          HEADER FIJO (sin scroll)
         ========================= */}
      <div className="px-5 pt-5 pb-4 flex flex-col gap-4 border-b border-gray-100">
        <Tittlex
          variant="modal"
          icon="solar:check-square-linear"
          title="VALIDAR MOVIMIENTO"
          description={descriptionText}
        />

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700">
            <Icon icon="mdi:barcode-scan" className="text-base" />
            <span className="font-semibold">{codeShort}</span>
          </span>

          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${estadoChip}`}
          >
            <span className="h-2 w-2 rounded-full bg-current opacity-70" />
            <span className="font-semibold">{headerEstado || "-"}</span>
          </span>

          {!enProceso && (
            <span className="text-xs text-gray-500">
              Este movimiento ya no está en proceso.
            </span>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">Descripción</p>
              <p className="mt-1 text-sm text-gray-700 break-words">
                {movimiento.descripcion || "—"}
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
              <Icon icon="mdi:information-outline" className="text-gray-700" />
              <p className="text-xs text-gray-700">
                Ajusta cantidades si hay diferencias y deja una observación.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          ✅ BODY SCROLLEABLE si el contenido se desborda
         ================================================== */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 flex flex-col gap-5">
        {/* TABLA: alto fijo + scroll interno */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden flex-none">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">
              Productos del movimiento
            </p>
            <p className="text-xs text-gray-500">
              {movimiento.productos.length} ítem(s)
            </p>
          </div>

          {/* ✅ ALTO FIJO (más grande) + SCROLL INTERNO */}
          <div className="relative h-[400px] overflow-y-auto overscroll-contain">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col className="w-[16%]" />
                <col className="w-[34%]" />
                <col className="w-[26%]" />
                <col className="w-[24%]" />
              </colgroup>

              <thead className="sticky top-0 z-10 bg-gray-50 text-gray-700 border-b border-gray-200">
                <tr className="h-11">
                  <th className="px-4 text-left font-semibold text-xs uppercase tracking-wide">
                    Código
                  </th>
                  <th className="px-4 text-left font-semibold text-xs uppercase tracking-wide">
                    Producto
                  </th>
                  <th className="px-4 text-left font-semibold text-xs uppercase tracking-wide">
                    Descripción
                  </th>
                  <th className="px-4 text-center font-semibold text-xs uppercase tracking-wide">
                    Cantidad
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {movimiento.productos.map((det) => {
                  const max = det.cantidad ?? 0;
                  const val = cantidades[det.producto.id] ?? max;

                  return (
                    <tr
                      key={det.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-gray-900">
                        {det.producto?.codigo_identificacion ?? "—"}
                      </td>

                      <td className="px-4 py-4 text-gray-900">
                        <div
                          className="truncate"
                          title={det.producto?.nombre_producto || ""}
                        >
                          {det.producto?.nombre_producto || "—"}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-gray-700">
                        <div
                          className="truncate"
                          title={(det.producto as any)?.descripcion || ""}
                        >
                          {(det.producto as any)?.descripcion || "—"}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-center items-center gap-2">
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
                            disabled={!enProceso}
                            className={[
                              "w-[60px] h-9 rounded-lg border px-1 text-center text-sm",
                              "bg-white text-gray-900 shadow-sm",
                              "focus:outline-none focus:ring-2 focus:ring-[#1b1b77]/30 focus:border-[#1b1b77]/40",
                              "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
                            ].join(" ")}
                          />
                          <span className="text-sm text-gray-500">/ {max}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {movimiento.productos.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-gray-500 italic"
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
        <InputxTextarea
          label="Observaciones"
          name="observaciones"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Ejem. Algunos productos vinieron con pequeños golpes."
          autoResize
          minRows={3}
          maxRows={6}
          disabled={!enProceso}
        />

        {/* Evidencia */}
        <div className="flex-none">
          <p className="text-sm font-medium text-gray-800 mb-2">
            Adjuntar evidencia
          </p>

          <div className="border border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-between gap-3">
            <div className="text-sm text-gray-600 min-w-0">
              {archivo ? (
                <span className="font-medium break-words">{archivo.name}</span>
              ) : (
                <>Seleccione un archivo (JPG, PNG o PDF)</>
              )}
            </div>

            <label className="shrink-0 inline-flex items-center gap-2 px-3 py-2 border rounded-md text-sm cursor-pointer hover:bg-gray-50">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                className="hidden"
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                disabled={!enProceso}
              />
              <span>Seleccionar archivo</span>
            </label>
          </div>
        </div>
      </div>

      {/* Footer fijo */}
      <div className="border-t border-gray-200 bg-white px-5 py-4">
        <div className="flex items-center justify-start gap-4">
          <Buttonx
            variant="quartery"
            onClick={handleValidar}
            disabled={!puedeValidar || loading}
            label={loading ? "Validando..." : "Validar"}
            icon={loading ? "line-md:loading-twotone-loop" : undefined}
            className={`px-4 text-sm ${loading ? "[&_svg]:animate-spin" : ""}`}
          />

          <Buttonx
            variant="outlinedw"
            onClick={onClose}
            label="Cancelar"
            className="px-4 text-sm border"
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
}
