import { Icon } from "@iconify/react";
import Buttonx from "@/shared/common/Buttonx";
import type { AbonoResumenItem } from "@/services/ecommerce/cuadreSaldo/cuadreSaldoC.types";

const money = (n: number) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
        n || 0
    );

type Props = {
    open: boolean;
    onClose: () => void;
    abono: AbonoResumenItem | null;
    onConfirm: () => void;
    submitting?: boolean;
    courierName?: string;
};

export default function AbonoValidationModal({
    open,
    onClose,
    abono,
    onConfirm,
    submitting,
    courierName,
}: Props) {
    if (!open || !abono) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <Icon icon="mdi:close" className="text-2xl" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col items-center gap-6">
                    <div className="flex gap-4 w-full">
                        {/* Voucher Image Section */}
                        <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center p-2 min-h-[300px]">
                            {abono.evidenciaUrl ? (
                                <img
                                    src={abono.evidenciaUrl}
                                    alt="Voucher Abono"
                                    className="max-h-[400px] object-contain rounded"
                                />
                            ) : (
                                <div className="text-gray-400 flex flex-col items-center">
                                    <Icon icon="mdi:image-off-outline" className="text-4xl mb-2" />
                                    <span>Sin evidencia adjunta</span>
                                </div>
                            )}
                        </div>

                        {/* Opcional: Si quisieras poner la tabla de excel al lado como en la imagen,
                podría ir aqui. Por ahora no tengo data de excel, asi que solo muestro voucher */}
                    </div>

                    <div className="text-center max-w-md">
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                            Confirmación de Abono
                        </h3>
                        <p className="text-gray-600 mb-1">
                            Está confirmado que recibió la transferencia{" "}
                            <strong className="text-gray-900">{money(abono.montoTotal)}</strong>{" "}
                            de <strong className="text-gray-900">“{courierName || "Courier"}”</strong>
                        </p>
                        <p className="text-gray-500 text-sm">¿Está de acuerdo?</p>
                    </div>

                    <div className="w-full max-w-xs">
                        <Buttonx
                            label={submitting ? "Validando..." : "Validar"}
                            onClick={onConfirm}
                            variant="primary" // Azul fuerte
                            className="w-full justify-center text-lg py-3 h-auto"
                            disabled={submitting}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
