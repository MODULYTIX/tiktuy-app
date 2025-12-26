// src/shared/components/courier/pedido/ReprogramarPedidoModal.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";

import Buttonx from "@/shared/common/Buttonx";
import Tittlex from "@/shared/common/Tittlex";
import { SelectxDate } from "@/shared/common/Selectx";
import { InputxTextarea } from "@/shared/common/Inputx";

type Props = {
  open: boolean;
  loading?: boolean;
  pedidoCodigo?: string;
  fechaActual?: string | null; // puede venir "YYYY-MM-DD" o ISO
  onClose: () => void;
  onConfirm: (data: {
    fecha_entrega_programada: string; // YYYY-MM-DD
    observacion?: string;
  }) => Promise<void> | void;
};

/* ✅ FIX FECHA: mostrar SIEMPRE en Perú */
const fmtPE = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function formatFechaPE(fecha: string | null | undefined) {
  if (!fecha) return "—";

  // Si viene "YYYY-MM-DD", NO usar new Date(fecha) (UTC -> -1 día)
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return fmtPE.format(new Date(`${fecha}T12:00:00-05:00`));
  }

  return fmtPE.format(new Date(fecha));
}

export default function ReprogramarPedidoModal({
  open,
  loading = false,
  pedidoCodigo,
  fechaActual,
  onClose,
  onConfirm,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  const [fechaNueva, setFechaNueva] = useState<string>("");
  const [observacion, setObservacion] = useState<string>("");
  const [error, setError] = useState<string>("");

  /* 🔁 Reset al abrir */
  useEffect(() => {
    if (open) {
      setFechaNueva("");
      setObservacion("");
      setError("");
    }
  }, [open]);

  /* cerrar al click fuera */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  const fechaActualLabel = useMemo(
    () => formatFechaPE(fechaActual),
    [fechaActual]
  );

  if (!open) return null;

  const handleConfirm = async () => {
    setError("");

    if (!fechaNueva) {
      setError("Debes seleccionar una nueva fecha de entrega");
      return;
    }

    try {
      await onConfirm({
        fecha_entrega_programada: fechaNueva,
        observacion: observacion.trim() || undefined,
      });
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Error al reprogramar el pedido");
    }
  };
  console.log("fechaNueva", fechaActualLabel);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div className="flex-1 bg-black/40" />

      {/* Drawer */}
      <div
        ref={panelRef}
        className="w-[520px] h-full bg-white shadow-default flex flex-col animate-slide-in-right"
      >
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray20 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <Tittlex
              variant="modal"
              title="REPROGRAMAR PEDIDO"
              icon="mdi:calendar-edit"
            />

            {pedidoCodigo && (
              <div className="flex flex-col items-end gap-1">
                <span className="text-[11px] text-gray-500">Pedido</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-gray10 px-3 py-1 text-[11px] font-semibold text-gray-700 ring-1 ring-gray20">
                  <Icon
                    icon="mdi:barcode-scan"
                    className="text-base text-gray-500"
                  />
                  {pedidoCodigo}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {/* Fecha actual */}
          <div className="flex items-start justify-between gap-3 mb-6">
            <div>
              <div className="text-xs text-gray-500">Fecha actual</div>
              <div className="text-sm font-semibold text-gray-900">
                {fechaActualLabel}
              </div>
            </div>

            <div className="w-10 h-10 rounded-full bg-amber-50 ring-1 ring-amber-100 flex items-center justify-center">
              <Icon
                icon="mdi:calendar-clock"
                className="text-xl text-amber-700"
              />
            </div>
          </div>

          {/* === FORM REPROGRAMACIÓN === */}
          <div className="flex flex-col gap-6">
            {/* Nueva fecha */}
            <div className="rounded-md border border-gray20 bg-gray10 p-4">
              <SelectxDate
                label="Nueva fecha de entrega"
                value={fechaNueva}
                onChange={(e) => setFechaNueva(e.target.value)}
                disabled={loading}
                labelVariant="left"
              />
            </div>

            {/* Observación */}
            <div className="flex flex-col gap-1">
              <InputxTextarea
                label="Observación (opcional)"
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Motivo de la reprogramación"
                rows={4}
                minRows={4}
                maxRows={6}
                disabled={loading}
              />

              <div className="flex items-start gap-1 text-[11px] text-gray-500">
                <Icon
                  icon="mdi:information-outline"
                  className="text-sm mt-[1px]"
                />
                <span>
                  Este comentario ayuda a auditoría y seguimiento.
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-md bg-red-50 ring-1 ring-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray20 px-5 py-4">
          <div className="flex justify-start gap-3">
            <Buttonx
              variant="secondary"
              label={loading ? "Guardando..." : "Reprogramar"}
              onClick={handleConfirm}
              disabled={loading}
              icon="mdi:calendar-check"
            />
            <Buttonx
              variant="outlined"
              label="Cancelar"
              onClick={onClose}
              disabled={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
