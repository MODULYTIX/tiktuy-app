import { useMemo, useState } from "react";

type Props = {
  open: boolean;
  onClose(): void;
  fechas: string[]; // seleccionadas
  totalCobrado: number;
  totalServicio: number;

  /**
   * ✅ SOLO VISUAL:
   * Monto acumulado del día (o rango) que fue pagado como DIRECTO_ECOMMERCE
   * (esto es lo que se debe “ver como 0” en cobrado).
   *
   * Si no lo envías, el modal se comporta igual que antes.
   */
  totalDirectoEcommerce?: number;

  courierNombre?: string;
  ciudad?: string;
  onConfirm(): Promise<void> | void; // llamará a apiValidar
};

const money = (n: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
    n || 0
  );

const clamp0 = (n: number) => (Number.isFinite(n) ? Math.max(0, n) : 0);

export default function ValidarAbonoModal({
  open,
  onClose,
  fechas,
  totalCobrado,
  totalServicio,
  totalDirectoEcommerce = 0,
  courierNombre,
  ciudad,
  onConfirm,
}: Props) {
  const [agree, setAgree] = useState(false);
  const [saving, setSaving] = useState(false);

  // ✅ Cobrado visible: si es DIRECTO_ECOMMERCE, ese monto “se ve como 0”
  const cobradoVisible = useMemo(
    () => clamp0(Number(totalCobrado) - Number(totalDirectoEcommerce)),
    [totalCobrado, totalDirectoEcommerce]
  );

  // ✅ Neto visible = cobrado visible - servicio (SERVICIOS NO SE TOCAN)
  const netoVisible = useMemo(
    () => Number(cobradoVisible) - Number(totalServicio),
    [cobradoVisible, totalServicio]
  );

  if (!open) return null;

  const handleConfirm = async () => {
    if (!agree || saving) return;
    setSaving(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setSaving(false);
      setAgree(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="px-6 pt-6 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
            ✓
          </div>
          <h3 className="text-xl font-bold">CONFIRMAR RECEPCIÓN</h3>
          <p className="mt-1 text-sm text-gray-600">
            Valida la transferencia y registra el ingreso en el sistema
          </p>
        </div>

        <div className="mx-6 my-4 rounded-xl border">
          <div className="grid grid-cols-2 gap-2 px-4 py-3 text-sm">
            {/* ✅ ANTES: totalCobrado  |  AHORA: cobradoVisible */}
            <div className="font-semibold">{money(cobradoVisible)}</div>
            <div className="text-right">{ciudad ?? ""}</div>

            <div className="text-gray-500">Origen: {courierNombre ?? "-"}</div>
            <div className="text-right text-gray-500">
              {fechas.length > 1 ? `${fechas.length} fechas` : fechas[0]}
            </div>

            {/* (opcional) mostramos cuanto fue DIRECTO_ECOMMERCE */}
            {Number(totalDirectoEcommerce) > 0 && (
              <>
                <div className="text-gray-500">Directo ecommerce</div>
                <div className="text-right">{money(totalDirectoEcommerce)}</div>
              </>
            )}

            <div className="text-gray-500">Servicio total</div>
            <div className="text-right">{money(totalServicio)}</div>

            <div className="text-gray-500">Neto</div>
            <div className="text-right font-medium">{money(netoVisible)}</div>

            <div className="text-gray-500">Estado</div>
            <div className="text-right">
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-900 border border-blue-200">
                Por Validar
              </span>
            </div>
          </div>
        </div>

        <label className="mx-6 mb-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-emerald-600"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          Confirmo que verifiqué y recibí la transferencia
        </label>

        <div className="flex justify-end gap-2 px-6 py-4 border-t">
          <button
            onClick={onClose}
            className="rounded-md border px-4 py-2 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!agree || saving}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {saving && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  opacity=".25"
                />
                <path
                  d="M4 12a8 8 0 0 1 8-8"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
              </svg>
            )}
            Validar
          </button>
        </div>
      </div>
    </div>
  );
}
