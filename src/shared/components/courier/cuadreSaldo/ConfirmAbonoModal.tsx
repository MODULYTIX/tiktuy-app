import React, { useEffect, useState } from "react";
import Buttonx from "@/shared/common/Buttonx";
import { Icon } from "@iconify/react";

/* ================= helpers ================= */
const formatPEN = (v: number) =>
  `S/. ${Number(v || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const toDMY = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export type ConfirmAbonoModalProps = {
  open: boolean;
  ecommerceNombre: string;
  ciudad?: string | null;
  fechas?: string[];
  pedidosCount: number;
  cobradoTotal: number;
  servicioTotal: number;
  onCancel: () => void;
  onConfirm: (voucherFile: File | null) => void;
};

const ConfirmAbonoModal: React.FC<ConfirmAbonoModalProps> = ({
  open,
  ecommerceNombre,
  ciudad,
  fechas = [],
  pedidosCount,
  cobradoTotal,
  servicioTotal,
  onCancel,
  onConfirm,
}) => {
  const [checked, setChecked] = useState(false);
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setChecked(false);
      setVoucherFile(null);
      setPreviewUrl(null);
    }
  }, [open]);

  if (!open) return null;

  const neto = Math.max(0, Number(cobradoTotal) - Number(servicioTotal));

  const fechasLabel = (() => {
    if (!fechas.length) return "—";
    const list = fechas.slice().sort().map(toDMY);
    return list.length <= 3
      ? list.join(", ")
      : `${list.slice(0, 3).join(", ")} (+${list.length - 3} más)`;
  })();

  /* ==== acciones del archivo ==== */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVoucherFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveFile = () => {
    setVoucherFile(null);
    setPreviewUrl(null);
  };

  const handleDownloadFile = () => {
    if (voucherFile && previewUrl) {
      const a = document.createElement("a");
      a.href = previewUrl;
      a.download = voucherFile.name;
      a.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="px-6 pt-7 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M9 12.5l2 2 4.5-4.5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h3 className="text-center text-xl sm:text-2xl font-bold tracking-wide text-gray90">
            CONFIRMAR ABONO
          </h3>
          <p className="mt-1 text-center text-[13px] text-gray-600">
            Valida el abono al ecommerce y registra el ingreso en el sistema
          </p>
        </div>

        {/* RESUMEN */}
        <div className="mx-6 mt-5 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <div className="text-sm font-semibold text-gray80">Resumen</div>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-900 border border-blue-100">
              Por confirmar
            </span>
          </div>

          <div className="px-5 py-4">
            {/* Neto protagonista */}
            <div className="flex items-end justify-between gap-4 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
              <div className="min-w-0">
                <div className="text-[12px] text-gray60">Neto a abonar</div>
                <div className="mt-0.5 text-2xl font-bold text-gray90 tabular-nums">
                  {formatPEN(neto)}
                </div>
              </div>
              <div className="text-right text-xs text-gray60">
                {fechas.length <= 1 ? "Fecha" : "Fechas"}:{" "}
                <span className="text-gray80 font-medium">{fechasLabel}</span>
              </div>
            </div>

            {/* Detalle */}
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="text-gray60">Ecommerce</div>
              <div className="text-right font-medium text-gray80 truncate">
                {ecommerceNombre}
              </div>

              {ciudad && (
                <>
                  <div className="text-gray60">Ciudad</div>
                  <div className="text-right text-gray80 truncate">
                    {ciudad}
                  </div>
                </>
              )}

              <div className="text-gray60">Pedidos seleccionados</div>
              <div className="text-right font-medium text-gray80 tabular-nums">
                {pedidosCount}
              </div>

              <div className="text-gray60">Cobrado total</div>
              <div className="text-right text-gray80 tabular-nums">
                {formatPEN(cobradoTotal)}
              </div>

              <div className="text-gray60">Servicio total</div>
              <div className="text-right text-gray80 tabular-nums">
                {formatPEN(servicioTotal)}
              </div>
            </div>
          </div>
        </div>

        {/* SUBIR VOUCHER */}
        <div className="mx-6 mt-5">
          <label className="block text-sm font-semibold text-gray80 mb-2">
            Voucher / Evidencia de pago
          </label>

          {!voucherFile ? (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-3 text-sm text-gray70 hover:bg-gray-50">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 16V4m0 12l4-4m-4 4l-4-4M4 20h16"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Adjuntar imagen
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm text-gray80">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 2v6h6"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="truncate max-w-[260px]">
                    {voucherFile.name}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray60">
                  Archivo adjunto. Puedes verlo, descargarlo o eliminarlo.
                </div>
              </div>

              <div className="flex items-center gap-2">
                {previewUrl && (
                  <button
                    type="button"
                    onClick={() => window.open(previewUrl, "_blank")}
                    title="Ver"
                    className="h-9 w-9 rounded-lg border border-gray-200 bg-white text-gray70 hover:bg-gray-50 hover:text-gray90 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  >
                    <span className="sr-only">Ver</span>
                    <Icon
                      icon="mdi:eye-outline"
                      className="mx-auto text-[18px]"
                    />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDownloadFile}
                  title="Descargar"
                  className="h-9 w-9 rounded-lg border border-gray-200 bg-white text-gray70 hover:bg-gray-50 hover:text-gray90 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  <span className="sr-only">Descargar</span>
                  <Icon
                    icon="mdi:download-outline"
                    className="mx-auto text-[18px]"
                  />
                </button>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  title="Eliminar"
                  className="h-9 w-9 rounded-lg border border-gray-200 bg-white text-gray70 hover:bg-gray-50 hover:text-gray90 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  <span className="sr-only">Eliminar</span>
                  <Icon
                    icon="mdi:trash-can-outline"
                    className="mx-auto text-[18px]"
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CHECK */}
        <div className="mx-6 mt-5">
          <label className="flex cursor-pointer select-none gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-emerald-600"
            />
            <div className="min-w-0">
              <div className="text-sm text-gray80">
                Confirmo que verifiqué e hice la transferencia
              </div>
              <div className="mt-1 text-xs text-gray60">
                Requerido para habilitar{" "}
                <span className="font-medium">Confirmar</span>.
              </div>
            </div>
          </label>
        </div>

        {/* FOOTER */}
        <div className="mt-6 flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <Buttonx
            type="button"
            onClick={onCancel}
            variant="outlined"
            label="Cancelar"
          />

          <Buttonx
            type="button"
            onClick={() => onConfirm(voucherFile)}
            disabled={!checked || !voucherFile}
            variant="secondary"
            label="✓ Confirmar"
          />
        </div>
      </div>
    </div>
  );
};

export default ConfirmAbonoModal;
