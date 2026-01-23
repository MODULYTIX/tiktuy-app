import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import Buttonx from "@/shared/common/Buttonx";

type Props = {
    open: boolean;
    onClose(): void;
    onConfirm(): Promise<void> | void;
    courierNombre?: string;
    monto?: number;
};

const money = (n: number) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
        n || 0
    );

export default function CuadreSaldoValidate({
    open,
    onClose,
    onConfirm,
    courierNombre,
    monto = 0,
}: Props) {
    const [agree, setAgree] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errMsg, setErrMsg] = useState("");

    useEffect(() => {
        if (!open) return;
        setAgree(false);
        setSaving(false);
        setErrMsg("");
    }, [open]);

    if (!open) return null;

    const handleClose = () => {
        if (saving) return;
        onClose();
    };

    const handleConfirm = async () => {
        if (!agree || saving) return;
        setSaving(true);
        setErrMsg("");
        try {
            await onConfirm();
            handleClose();
        } catch (e: any) {
            setErrMsg(e?.message || "Error al validar");
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
                onClick={handleClose}
                aria-hidden
            />

            {/* Modal */}
            <div
                className="absolute left-1/2 top-1/2 w-[92%] max-w-[500px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative px-6 pt-6 pb-5 border-b border-gray20">
                    <div className="flex items-start gap-4 pr-10">
                        {/* Avatar */}
                        <div
                            className="h-12 w-12 rounded-2xl bg-indigo-600 text-white grid place-items-center font-extrabold shrink-0"
                            aria-hidden
                        >
                            {courierNombre?.[0]?.toUpperCase() ?? "C"}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h2
                                id="modal-title"
                                className="text-[18px] font-extrabold text-gray90 leading-tight truncate"
                            >
                                {courierNombre?.toUpperCase()}
                            </h2>

                            <div className="mt-2 flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded-full text-[12px] font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                                    Pendiente
                                </span>
                                <span className="inline-flex items-center gap-1 text-[12px] text-gray60">
                                    Validar Cobro
                                </span>
                            </div>

                            <p className="mt-2 text-[13px] text-gray60 leading-relaxed">
                                Vas a validar el cobro de este courier.
                            </p>
                        </div>
                    </div>

                    {/* Close X */}
                    <button
                        type="button"
                        onClick={handleClose}
                        className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray60 hover:text-gray90 hover:bg-gray10 transition"
                        aria-label="Cerrar"
                        disabled={saving}
                    >
                        <Icon icon="mdi:close" width={20} height={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-6 flex flex-col gap-4">
                    {/* Datos (card) */}
                    <div className="rounded-2xl border border-gray20 bg-gray10 p-4">
                        <p className="text-[13px] font-semibold text-gray80 mb-3 inline-flex items-center gap-2">
                            <Icon
                                icon="mdi:card-account-details-outline"
                                width={18}
                                height={18}
                            />
                            Resumen
                        </p>

                        <div className="flex flex-col gap-1">
                            <span className="text-[12px] text-gray60">Monto a Liquidar</span>
                            <span className="text-2xl font-bold text-gray90 tabular-nums">
                                {money(monto)}
                            </span>
                        </div>
                    </div>

                    {/* Confirmación (card) */}
                    <div className="rounded-2xl border border-gray20 bg-white p-4">
                        <p className="text-[13px] font-semibold text-gray80 mb-2 inline-flex items-center gap-2">
                            <Icon icon="mdi:shield-check-outline" width={18} height={18} />
                            Confirmación
                        </p>

                        <label className="flex items-start gap-3 text-[13px] text-gray80 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={agree}
                                onChange={(e) => setAgree(e.target.checked)}
                                disabled={saving}
                                className="mt-[3px] accent-indigo-600"
                            />
                            <span>
                                Confirmo que he verificado el monto y procedo a congelar la
                                deuda. <br />
                                <span className="text-gray50 text-[11px]">
                                    Esta acción es irreversible.
                                </span>
                            </span>
                        </label>
                    </div>

                    {/* Error */}
                    {errMsg && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
                            {errMsg}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray20 bg-white">
                    <div className="flex items-center justify-end gap-3">
                        <Buttonx
                            type="button"
                            onClick={handleClose}
                            label="Cancelar"
                            variant="tertiary"
                            disabled={saving}
                        />

                        <Buttonx
                            type="button"
                            onClick={handleConfirm}
                            disabled={!agree || saving}
                            variant="secondary"
                            label={saving ? "Validando..." : "Validar"}
                            icon={saving ? "mdi:reload" : "mdi:check-decagram"}
                            className={saving ? "[&>span>svg]:animate-spin" : ""}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
