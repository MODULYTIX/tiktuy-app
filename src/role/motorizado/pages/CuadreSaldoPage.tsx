// src/pages/repartidor/cuadresaldo/CuadreSaldoPage.tsx
import React, { useMemo, useState, useEffect } from "react";
import { Icon } from "@iconify/react";

import CuadreSaldoTable from "@/shared/components/repartidor/cuadresaldo/CuadreSaldoTable";
import Buttonx from "@/shared/common/Buttonx";
import { SelectxDate } from "@/shared/common/Selectx";
import Tittlex from "@/shared/common/Tittlex";

const pad2 = (n: number) => String(n).padStart(2, "0");
const toYMD = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const getToken = () => localStorage.getItem("token") ?? "";

function defaultMonthRange() {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { desde: toYMD(first), hasta: toYMD(last) };
}

function normalizeRange(desde?: string, hasta?: string) {
  if (desde && hasta && desde > hasta) return { desde: hasta, hasta: desde };
  return { desde: desde || undefined, hasta: hasta || undefined };
}

/* ===================== Modal confirmación (masivo) ===================== */

const Checkbox = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    type="checkbox"
    className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900"
    {...props}
  />
);

type ConfirmValidateAllModalProps = {
  open: boolean;
  selectedCount: number;
  checked: boolean;
  busy: boolean;
  onToggleChecked: (v: boolean) => void;
  onClose: () => void;
  onConfirm: () => void;
};

const ConfirmValidateAllModal: React.FC<ConfirmValidateAllModalProps> = ({
  open,
  selectedCount,
  checked,
  busy,
  onToggleChecked,
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl border border-gray30">
        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center ring-1 ring-emerald-200">
            <Icon icon="mdi:clipboard-check-outline" width={22} height={22} />
          </div>

          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray90">
              Confirmar validación
            </h3>
            <p className="text-sm text-gray-600">
              Vas a validar{" "}
              <span className="font-semibold">{selectedCount}</span>{" "}
              seleccionados en la tabla.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Cerrar"
            title="Cerrar"
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray30 bg-white text-gray70 hover:bg-gray10 disabled:opacity-60"
          >
            <Icon icon="mdi:close" width={18} height={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-start gap-2">
              <Icon
                icon="mdi:information-outline"
                width={18}
                height={18}
                className="mt-0.5 text-emerald-700"
              />
              <div className="text-[12px] text-emerald-900">
                <div className="font-semibold">Antes de continuar</div>
                <div className="text-emerald-800/90">
                  Se marcarán como <b>Validado</b> los registros seleccionados.
                  Verifica que la selección sea correcta.
                </div>
              </div>
            </div>
          </div>

          {/* Resumen rápido */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray30 bg-white p-3">
              <div className="text-[11px] text-gray-500">Seleccionados</div>
              <div className="text-[14px] font-semibold text-gray90">
                {selectedCount}
              </div>
            </div>

            <div className="rounded-xl border border-gray30 bg-white p-3">
              <div className="text-[11px] text-gray-500">Acción</div>
              <div className="text-[14px] font-semibold text-gray90">
                Validar
              </div>
            </div>
          </div>

          {/* Checkbox de seguridad */}
          <label className="flex items-start gap-3 rounded-xl border border-gray30 bg-gray10 p-3 cursor-pointer select-none">
            <Checkbox
              checked={checked}
              onChange={(e) => onToggleChecked(e.target.checked)}
              disabled={busy}
            />
            <div className="text-[12px] text-gray80">
              Confirmo que deseo validar{" "}
              <b>{selectedCount}</b> seleccionados.
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 bg-white">
          <Buttonx
            label="Cancelar"
            variant="tertiary"
            onClick={onClose}
            disabled={busy}
          />

          <Buttonx
            label={busy ? "Validando…" : "Sí, validar"}
            variant="secondary"
            icon="mdi:clipboard-check-outline"
            onClick={onConfirm}
            disabled={!checked || busy || selectedCount <= 0}
          />
        </div>
      </div>
    </div>
  );
};

/* ===================== Page ===================== */

const CuadreSaldoPage: React.FC = () => {
  const token = getToken();
  const defaults = useMemo(defaultMonthRange, []);

  // filtros del formulario (inputs controlados)
  const [formDesde, setFormDesde] = useState(defaults.desde);
  const [formHasta, setFormHasta] = useState(defaults.hasta);

  // filtros aplicados (los que usa la tabla)
  const [appliedDesde, setAppliedDesde] = useState<string | undefined>(
    defaults.desde
  );
  const [appliedHasta, setAppliedHasta] = useState<string | undefined>(
    defaults.hasta
  );

  // señal para validar lote desde el header (la tabla escucha cambios)
  const [validateSignal, setValidateSignal] = useState(0);

  // ✅ conteo de seleccionados (viene desde la tabla)
  const [selectedCount, setSelectedCount] = useState(0);

  // ✅ Modal confirmación masiva
  const [validateAllOpen, setValidateAllOpen] = useState(false);
  const [validateAllChecked, setValidateAllChecked] = useState(false);
  const [validateAllBusy, setValidateAllBusy] = useState(false);

  const canValidate = selectedCount > 0 && !validateAllBusy;

  const openValidateAll = () => {
    if (!canValidate) return;
    setValidateAllChecked(false);
    setValidateAllOpen(true);
  };

  const closeValidateAll = () => {
    if (validateAllBusy) return;
    setValidateAllOpen(false);
    setValidateAllChecked(false);
  };

  const confirmValidateAll = async () => {
    if (!validateAllChecked) return;
    if (selectedCount <= 0) return;

    try {
      setValidateAllBusy(true);

      // 🔥 dispara validación de seleccionados en la tabla
      setValidateSignal((s) => s + 1);

      // cerramos modal
      setValidateAllOpen(false);
      setValidateAllChecked(false);
    } finally {
      setValidateAllBusy(false);
    }
  };

  // Auto-aplicar filtros al cambiar fechas
  useEffect(() => {
    const { desde, hasta } = normalizeRange(
      formDesde || undefined,
      formHasta || undefined
    );
    setAppliedDesde(desde);
    setAppliedHasta(hasta);
  }, [formDesde, formHasta]);

  return (
    <section className="mt-4 md:mt-8 px-3 sm:px-4 lg:px-0 w-full min-w-0">
      {/* ===== Header responsive ===== */}
      <div className="w-full min-w-0 mb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <Tittlex
            title="Cuadre de Saldo"
            description="Monitoreo de lo recaudado por día"
            className="min-w-0"
          />

          {/* Acción (desktop a la derecha) */}
          <div className="hidden sm:flex items-center justify-end">
            <Buttonx
              label="Validar Pago"
              icon="mdi:clipboard-check-outline"
              variant="secondary"
              onClick={openValidateAll}
              disabled={!canValidate}
              title={
                selectedCount <= 0
                  ? "Selecciona al menos un registro"
                  : `Validar ${selectedCount}`
              }
            />
          </div>
        </div>

        {/* Acción (mobile abajo centrado) */}
        <div className="sm:hidden mt-2 flex justify-center">
          <Buttonx
            label="Validar Pago"
            icon="mdi:clipboard-check-outline"
            variant="secondary"
            onClick={openValidateAll}
            disabled={!canValidate}
            title={
              selectedCount <= 0
                ? "Selecciona al menos un registro"
                : `Validar ${selectedCount}`
            }
            className="w-full max-w-[260px] justify-center whitespace-nowrap"
          />
        </div>
      </div>

      {/* ===== Filtros ===== */}
      <div className="bg-white p-4 sm:p-5 rounded shadow-default border-b-4 border-gray90 mb-5 w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 items-end min-w-0">
          <div className="w-full sm:w-auto max-w-[320px] flex-1 min-w-[220px]">
            <SelectxDate
              label="Fecha Inicio"
              value={formDesde}
              onChange={(e) =>
                setFormDesde((e.target as HTMLInputElement).value)
              }
              placeholder="dd/mm/aaaa"
              className="w-full"
            />
          </div>

          <div className="w-full sm:w-auto max-w-[320px] flex-1 min-w-[220px]">
            <SelectxDate
              label="Fecha Fin"
              value={formHasta}
              onChange={(e) =>
                setFormHasta((e.target as HTMLInputElement).value)
              }
              placeholder="dd/mm/aaaa"
              className="w-full"
            />
          </div>

          <div className="w-full sm:w-auto shrink-0">
            <Buttonx
              label="Limpiar Filtros"
              icon="mynaui:delete"
              variant="outlined"
              onClick={() => {
                setFormDesde("");
                setFormHasta("");
              }}
            />
          </div>
        </div>
      </div>

      {/* ===== Tabla ===== */}
      <div className="w-full min-w-0">
        <CuadreSaldoTable
          token={token}
          desde={appliedDesde}
          hasta={appliedHasta}
          triggerValidate={validateSignal}
          onSelectionCountChange={setSelectedCount} // ✅ conteo desde tabla
        />
      </div>

      {/* ===== Modal confirmación masiva ===== */}
      <ConfirmValidateAllModal
        open={validateAllOpen}
        selectedCount={selectedCount}
        checked={validateAllChecked}
        busy={validateAllBusy}
        onToggleChecked={setValidateAllChecked}
        onClose={closeValidateAll}
        onConfirm={confirmValidateAll}
      />
    </section>
  );
};

export default CuadreSaldoPage;
