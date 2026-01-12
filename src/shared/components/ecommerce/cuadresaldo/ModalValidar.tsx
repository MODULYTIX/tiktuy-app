import Buttonx from "@/shared/common/Buttonx";
import { useMemo, useState } from "react";

type Props = {
  open: boolean;
  onClose(): void;
  fechas: string[]; // seleccionadas
  totalCobrado: number;
  totalServicio: number;

  // Monto que fue pagado directo a ecommerce (digital)
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

function formatFechasLabel(fechas: string[]) {
  if (!fechas?.length) return "-";
  if (fechas.length === 1) return fechas[0];
  return `${fechas.length} fechas`;
}

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

  // Cobrado visible = totalCobrado - totalDirectoEcommerce
  const cobradoVisible = useMemo(
    () => clamp0(Number(totalCobrado) - Number(totalDirectoEcommerce)),
    [totalCobrado, totalDirectoEcommerce]
  );

  // Neto visible = todos los pagos (incluye directo) - servicio
  const netoVisible = useMemo(
    () => clamp0(Number(totalCobrado) - Number(totalServicio)),
    [totalCobrado, totalServicio]
  );


  if (!open) return null;

  const handleClose = () => {
    if (saving) return;
    setAgree(false);
    onClose();
  };

  const handleConfirm = async () => {
    if (!agree || saving) return;
    setSaving(true);
    try {
      await onConfirm();
      handleClose();
    } finally {
      setSaving(false);
      setAgree(false);
    }
  };

  const fechasLabel = formatFechasLabel(fechas);
  const showDirecto = Number(totalDirectoEcommerce) > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="validar-abono-title"
      aria-describedby="validar-abono-desc"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="px-6 pt-6 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M20 7L10 17l-5-5"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h3
            id="validar-abono-title"
            className="text-lg font-bold text-gray90"
          >
            Confirmar recepción
          </h3>
          <p id="validar-abono-desc" className="mt-1 text-sm text-gray-600">
            Verifica los montos y confirma que la transferencia fue recibida.
          </p>
        </div>

        {/* Resumen */}
        <div className="px-6 mt-4">
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="text-sm font-semibold text-gray90">
                Resumen del ingreso
              </div>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-900 border border-blue-100">
                Por validar
              </span>
            </div>

            <div className="px-4 py-4">
              <div className="text-[12px] text-gray60">Neto a registrar</div>
              <div className="mt-0.5 text-2xl font-bold text-gray90 tabular-nums">
                {money(netoVisible)}
              </div>

              {/* Desglose */}
              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <div className="text-gray60">Cobrado total</div>
                <div className="text-right font-medium text-gray80 tabular-nums">
                  {money(cobradoVisible)}
                </div>

                {showDirecto && (
                  <>
                    <div className="text-gray60">Directo ecommerce</div>
                    <div className="text-right text-gray80 tabular-nums">
                      {money(totalDirectoEcommerce)}
                    </div>
                  </>
                )}

                <div className="text-gray60">Servicio total</div>
                <div className="text-right text-gray80 tabular-nums">
                  {money(totalServicio)}
                </div>
              </div>

              {/* Info extra */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-2 text-xs text-gray60">
                  <div className="truncate">
                    <span className="text-gray50">Origen: </span>
                    <span className="text-gray70">{courierNombre ?? "-"}</span>
                  </div>
                  <div className="text-right truncate">
                    <span className="text-gray50">Fechas: </span>
                    <span className="text-gray70">{fechasLabel}</span>
                  </div>

                  <div className="truncate">
                    <span className="text-gray50">Ciudad: </span>
                    <span className="text-gray70">{ciudad ?? "-"}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray50">Estado: </span>
                    <span className="text-gray70">Por validar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmación */}
        <div className="px-6 mt-4">
          <label className="flex gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 cursor-pointer select-none">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-emerald-600"
              checked={agree}
              disabled={saving}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <div className="min-w-0">
              <div className="text-sm text-gray80">
                Confirmo que revisé el monto y recibí la transferencia
              </div>
              <div className="mt-1 text-xs text-gray60">
                Obligatorio para habilitar{" "}
                <span className="font-medium">Validar</span>.
              </div>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <Buttonx
            type="button"
            onClick={handleClose}
            disabled={saving}
            variant="outlined"
            label="Cancelar"
          />

          <Buttonx
            type="button"
            onClick={handleConfirm}
            disabled={!agree || saving}
            variant="secondary"
            icon={saving ? "mdi:reload" : undefined}
            label={saving ? "Validando…" : "Validar y registrar"}
            className={saving ? "[&>span>svg]:animate-spin" : ""}
          />
        </div>
      </div>
    </div>
  );
}
