// src/shared/components/courier/pedido/ReprogramarPedidoModal.tsx
import { useEffect, useMemo, useState } from "react";
import Buttonx from "@/shared/common/Buttonx";

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

  // Si viene "YYYY-MM-DD", NO usar new Date(fecha) (eso es UTC y puede restar 1 día en Perú)
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return fmtPE.format(new Date(`${fecha}T12:00:00-05:00`)); // mediodía Perú (seguro)
  }

  // ISO con Z u otros => formatear en Lima
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
  const [fechaNueva, setFechaNueva] = useState<string>("");
  const [observacion, setObservacion] = useState<string>("");
  const [error, setError] = useState<string>("");

  // 🔁 reset al abrir
  useEffect(() => {
    if (open) {
      setFechaNueva("");
      setObservacion("");
      setError("");
    }
  }, [open]);

  // ✅ Mostrar fecha actual bien (Perú)
  const fechaActualLabel = useMemo(() => formatFechaPE(fechaActual), [fechaActual]);

  if (!open) return null;

  const handleConfirm = async () => {
    setError("");

    if (!fechaNueva) {
      setError("Debes seleccionar una nueva fecha de entrega");
      return;
    }

    try {
      await onConfirm({
        fecha_entrega_programada: fechaNueva, // YYYY-MM-DD (date input ya lo da así)
        observacion: observacion.trim() || undefined,
      });
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Error al reprogramar el pedido");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Reprogramar pedido
          </h2>
          {pedidoCodigo && (
            <p className="text-sm text-gray-500">
              Pedido: <strong>{pedidoCodigo}</strong>
            </p>
          )}
        </div>

        {/* Fecha actual */}
        {fechaActual && (
          <div className="mb-3 text-sm text-gray-600">
            Fecha actual:&nbsp;
            <strong>{fechaActualLabel}</strong>
          </div>
        )}

        {/* Nueva fecha */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nueva fecha de entrega
          </label>
          <input
            type="date"
            value={fechaNueva}
            onChange={(e) => setFechaNueva(e.target.value)}
            disabled={loading}
            className="w-full h-10 border border-gray-300 rounded px-3 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Observación */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observación (opcional)
          </label>
          <textarea
            rows={3}
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            disabled={loading}
            placeholder="Motivo de la reprogramación"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Error */}
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Buttonx
            variant="outlined"
            label="Cancelar"
            onClick={onClose}
            disabled={loading}
          />

          {/* ✅ Botón visible (azul) */}
          <Buttonx
            // si tu Buttonx tiene variant="primary", úsalo:
            // variant="primary"
            variant="outlined"
            label={loading ? "Guardando..." : "Reprogramar"}
            onClick={handleConfirm}
            disabled={loading}
            className="bg-blue-600 text-white border-blue-600 font-semibold
                       hover:bg-blue-700 hover:border-blue-700 shadow-sm"
          />
        </div>
      </div>
    </div>
  );
}
