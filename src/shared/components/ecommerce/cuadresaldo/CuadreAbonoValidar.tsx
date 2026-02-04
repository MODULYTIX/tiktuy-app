import { useState } from "react";
import ImageUploadx from "@/shared/common/ImageUploadx";

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
    detalles?: { fecha: string; monto: number }[] | null;
};

export default function CuadreAbonoValidar({
    open,
    onClose,
    abono,
    onConfirm,
    submitting,
    courierName,
    detalles,
}: Props) {
    const [accepted, setAccepted] = useState(false);

    if (!open || !abono) return null;

    const montoMostrar = abono.totalNeto ?? abono.montoNeto ?? abono.montoTotal;
    const hasDetalles = detalles && detalles.length > 0;

    // Si hay detalles, no mostramos fecha label general, sino la lista.
    // Si no hay detalles, mostramos fecha creación.
    const showCreationDate = !hasDetalles;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col relative">
                {/* Close Button top-right absolute */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
                >
                    <Icon icon="mdi:close" className="text-2xl" />
                </button>

                {/* Content */}
                <div className="p-8 flex flex-col items-center gap-8">

                    {/* Images Row */}
                    <div className="flex flex-col md:flex-row gap-6 w-full items-stretch justify-center">
                        {/* Left: Summary/Excel Placeholder */}
                        <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 flex flex-col items-center justify-center p-4 min-h-[300px] shadow-sm">
                            {/* Since we don't have a separate image for the 'excel' part, we show a placeholder or info */}
                            <div className="text-center p-6 bg-white rounded-lg border border-gray-100 shadow-sm w-full max-w-xs">
                                <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Detalle del Abono</h4>
                                <div className="text-3xl font-bold text-gray-900 mb-1">{money(montoMostrar)}</div>
                                <div className="text-sm text-gray-500 mb-4">{abono.cantidadPedidos} pedidos</div>

                                <div className="w-full bg-gray-100 rounded p-3 text-left space-y-2 text-sm text-gray-600">
                                    <div className="flex justify-between">
                                        <span>Código:</span>
                                        <span className="font-medium text-gray-900">{abono.codigo}</span>
                                    </div>

                                    {showCreationDate && (
                                        <div className="flex justify-between">
                                            <span>Fecha Creación:</span>
                                            <span className="font-medium text-gray-900 text-right">{abono.fechaCreacion.slice(0, 10)}</span>
                                        </div>
                                    )}

                                    {hasDetalles && (
                                        <div className="mt-3 border-t border-gray-200 pt-2">
                                            <div className="text-xs font-bold text-gray-500 uppercase mb-1">Montos por fecha</div>
                                            <div className={`flex flex-col gap-1 ${detalles.length > 5 ? 'max-h-[140px] overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
                                                {detalles.map((d, i) => (
                                                    <div key={i} className="flex justify-between text-sm">
                                                        <span className="font-medium text-gray-700">{d.fecha}</span>
                                                        <span className="font-bold text-gray-900">{money(d.monto)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 text-gray-400 text-xs text-center flex items-center gap-1">
                                <Icon icon="mdi:file-excel-outline" className="text-lg" />
                                <span>Resumen del sistema</span>
                            </div>
                        </div>

                        {/* Right: Voucher Evidence */}
                        <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 flex flex-col items-center justify-center p-4 min-h-[300px] shadow-sm relative overflow-hidden">
                            <ImageUploadx
                                label="Evidencia del Abono"
                                value={abono.evidenciaUrl}
                                mode="view"
                                variant="hero"
                                className="w-full h-full"
                            />
                        </div>
                    </div>

                    {/* Confirmation Text */}
                    <div className="text-center max-w-lg mt-2">
                        <p className="text-gray-800 text-base leading-relaxed">
                            Está confirmado que recibió la transferencia <strong className="text-black font-bold text-lg">“{money(montoMostrar)}”</strong> de <strong className="text-black font-bold">“{courierName || "Courier"}”</strong>
                        </p>
                        <p className="text-gray-600 font-medium mt-1">¿Está de acuerdo?</p>
                    </div>

                    {/* Checkbox and Action */}
                    <div className="flex flex-col items-center gap-6 w-full max-w-xs">

                        <label className="flex items-center gap-3 cursor-pointer group select-none">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 bg-white checked:border-primaryDark checked:bg-primaryDark focus:outline-none focus:ring-2 focus:ring-primaryDark/20 transition-all"
                                    checked={accepted}
                                    onChange={(e) => setAccepted(e.target.checked)}
                                />
                                <Icon
                                    icon="mdi:check"
                                    className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity text-sm font-bold"
                                />
                            </div>
                            <span className="text-gray-700 group-hover:text-gray-900 transition-colors">Sí, estoy de acuerdo</span>
                        </label>

                        <Buttonx
                            label={submitting ? "Validando..." : "Validar"}
                            onClick={onConfirm}
                            variant="secondary" // Azul fuerte
                            className={`w-full justify-center text-lg py-3 h-auto rounded-full shadow-lg shadow-blue-500/20 ${!accepted ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                            disabled={!accepted || submitting}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}