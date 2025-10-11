import React, { useEffect, useState } from "react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex flex-col items-center gap-2 px-6 pt-7">
          <div className="rounded-full bg-emerald-50 p-4">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3z"
                fill="#22c55e"
                opacity="0.12"
              />
              <path
                d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3z"
                stroke="#22c55e"
                strokeWidth="1.6"
              />
              <path
                d="M8.3 12.7l2.3 2.3 5-5"
                stroke="#22c55e"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="text-center text-2xl font-semibold tracking-wide">
            CONFIRMAR ABONO
          </h3>
          <p className="mb-2 -mt-1 text-center text-[13px] text-gray-600">
            Valida el abono al ecommerce y registra el ingreso en el sistema
          </p>
        </div>

        {/* RESUMEN */}
        <div className="mx-6 mt-2 rounded-xl border">
          <div className="border-b px-5 py-3 text-sm font-semibold text-gray-700">
            Resumen
          </div>
          <div className="grid grid-cols-2 items-center gap-2 px-5 py-4 text-sm">
            <div className="text-gray-600">Ecommerce</div>
            <div className="text-right font-medium">{ecommerceNombre}</div>

            <div className="text-gray-600">
              {fechas.length <= 1 ? "Fecha" : "Fechas"}
            </div>
            <div className="text-right">{fechasLabel}</div>

            {ciudad && (
              <>
                <div className="text-gray-600">Ciudad</div>
                <div className="text-right">{ciudad}</div>
              </>
            )}

            <div className="text-gray-600">Pedidos seleccionados</div>
            <div className="text-right font-medium">{pedidosCount}</div>

            <div className="text-gray-600">Cobrado total</div>
            <div className="text-right">{formatPEN(cobradoTotal)}</div>

            <div className="text-gray-600">
              Servicio total (courier + motorizado)
            </div>
            <div className="text-right">{formatPEN(servicioTotal)}</div>

            <div className="text-gray-600 font-semibold">Neto a abonar</div>
            <div className="text-right text-lg font-semibold">
              {formatPEN(neto)}
            </div>
          </div>
        </div>

        {/* SUBIR VOUCHER */}
        <div className="mx-6 mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Voucher / Evidencia de pago:
          </label>

          {!voucherFile ? (
            <label className="flex cursor-pointer items-center justify-center rounded-md border border-gray-300 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50">
              <svg
                className="mr-2 h-5 w-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <path d="M12 16V4m0 12l4-4m-4 4l-4-4M4 20h16" />
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
            <div className="flex items-center justify-between rounded-md border px-4 py-2 bg-gray-50">
              <div className="flex items-center text-sm text-gray-700 truncate">
                <svg
                  className="mr-2 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12v8m0-8l-4 4m4-4l4 4M12 4v8" />
                </svg>
                <span className="truncate max-w-[180px]">
                  {voucherFile.name}
                </span>
              </div>
              <div className="flex gap-2">
                {previewUrl && (
                  <button
                    onClick={() => window.open(previewUrl, "_blank")}
                    title="Ver"
                    className="rounded bg-gray-800 p-1.5 text-white hover:opacity-90"
                  >
                    👁️
                  </button>
                )}
                <button
                  onClick={handleDownloadFile}
                  title="Descargar"
                  className="rounded bg-gray-800 p-1.5 text-white hover:opacity-90"
                >
                  ⬇️
                </button>
                <button
                  onClick={handleRemoveFile}
                  title="Eliminar"
                  className="rounded bg-gray-800 p-1.5 text-white hover:opacity-90"
                >
                  🗑️
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CHECK Y BOTONES */}
        <label className="mx-6 mt-4 flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="h-4 w-4"
          />
          Confirmo que verifiqué e hice la transferencia
        </label>

        <div className="mt-5 flex items-center justify-end gap-2 border-t px-6 py-4">
          <button
            onClick={onCancel}
            className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(voucherFile)}
            disabled={!checked || !voucherFile}
            className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${
              checked && voucherFile
                ? "bg-emerald-600 hover:opacity-90"
                : "bg-emerald-300 cursor-not-allowed"
            }`}
          >
            ✓ Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmAbonoModal;
  