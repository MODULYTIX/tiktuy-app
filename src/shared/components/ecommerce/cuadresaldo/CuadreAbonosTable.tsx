import { useState, useMemo, useEffect } from "react";
import { Icon } from "@iconify/react";
import type { AbonoResumenItem } from "@/services/ecommerce/cuadreSaldo/cuadreSaldoC.types";
import TableActionx from "@/shared/common/TableActionx";

type Props = {
    abonos: AbonoResumenItem[];
    loading: boolean;
    onViewAbono: (abono: AbonoResumenItem) => void;
    onValidateAbono?: (abono: AbonoResumenItem) => void;
};

const money = (n: number) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
        n || 0
    );

const PAGE_SIZE = 5;

// Mensajes sutiles (solo visual)
function HintChip({ icon, label }: { icon: string; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] text-gray70">
            <Icon icon={icon} className="text-[14px] text-gray60" />
            <span className="leading-none">{label}</span>
        </span>
    );
}

function InlineEmptyMessage() {
    return (
        <div className="px-4 py-4">
            <div className="flex items-start gap-3 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-gray-200">
                    <Icon
                        icon="mdi:database-search-outline"
                        className="text-[18px] text-gray60"
                    />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-gray90">
                        No hay registros con estos filtros
                    </div>
                    <div className="mt-0.5 text-xs text-gray60">
                        Prueba cambiando el courier o ampliando el rango de fechas.
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                        <HintChip icon="mdi:truck-outline" label="Cambiar courier" />
                        <HintChip icon="mdi:calendar-range" label="Ampliar fechas" />
                        <HintChip icon="mdi:filter-remove-outline" label="Limpiar filtros" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function InlineLoadingMessage() {
    return (
        <div className="px-4 py-4" aria-live="polite" aria-busy="true">
            <div className="flex items-start gap-3 rounded-md border border-gray-200 bg-white px-4 py-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 border border-gray-200">
                    <Icon
                        icon="mdi:loading"
                        className="text-[18px] text-gray60 animate-spin"
                    />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-gray90">Cargando…</div>
                    <div className="mt-0.5 text-xs text-gray60">
                        Consultando el cuadre según el rango seleccionado.
                    </div>

                    {/* skeleton sutil */}
                    <div className="mt-2 space-y-2">
                        <div className="h-2 w-[62%] rounded bg-gray-200/80 animate-pulse" />
                        <div className="h-2 w-[48%] rounded bg-gray-200/70 animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CuadreAbonosTable({
    abonos,
    loading,
    onViewAbono,
    onValidateAbono,
}: Props) {
    const [page, setPage] = useState(1);

    // paginación
    const totalPages = Math.max(1, Math.ceil(abonos.length / PAGE_SIZE));
    useEffect(() => setPage(1), [abonos]);

    const currentData = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return abonos.slice(start, start + PAGE_SIZE);
    }, [abonos, page]);

    const pagerItems = useMemo(() => {
        const maxButtons = 5;
        const pages: (number | string)[] = [];
        if (totalPages <= maxButtons) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            let start = Math.max(1, page - 2);
            let end = Math.min(totalPages, page + 2);
            if (page <= 3) {
                start = 1;
                end = maxButtons;
            } else if (page >= totalPages - 2) {
                start = totalPages - (maxButtons - 1);
                end = totalPages;
            }
            for (let i = start; i <= end; i++) pages.push(i);
            if (start > 1) {
                pages.unshift("...");
                pages.unshift(1);
            }
            if (end < totalPages) {
                pages.push("...");
                pages.push(totalPages);
            }
        }
        return pages;
    }, [page, totalPages]);

    const emptyRows = Math.max(0, PAGE_SIZE - currentData.length);

    return (
        <div className="overflow-hidden rounded-md shadow-default bg-white">
            {/* Mensajes (sutiles) */}
            {loading && <InlineLoadingMessage />}
            {!loading && abonos.length === 0 && <InlineEmptyMessage />}

            {/* Tabla */}
            {!loading && abonos.length > 0 && (
                <div className="overflow-x-auto bg-white">
                    <table className="min-w-full table-fixed text-sm bg-white border-b border-gray30 rounded-t-md">
                        <colgroup>
                            <col className="w-[20%]" />
                            <col className="w-[20%]" />
                            <col className="w-[25%]" />
                            <col className="w-[35%]" />
                        </colgroup>

                        <thead className="bg-[#E5E7EB]">
                            <tr className="text-gray70 font-roboto font-medium text-left">
                                <th className="px-4 py-3">Codigo</th>
                                <th className="px-4 py-3">Monto</th>
                                <th className="px-4 py-3">Estado</th>
                                <th className="px-4 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray20">
                            {currentData.map((abono) => {
                                const pillClass =
                                    abono.estado === "Validado"
                                        ? "bg-gray-900 text-white"
                                        : abono.estado === "Por Validar"
                                            ? "bg-orange-100 text-orange-700 border border-orange-200"
                                            : "bg-gray-100 text-gray-700 border border-gray-200";

                                const showCheck = abono.estado === "Por Validar";

                                return (
                                    <tr key={abono.id} className="border-t">
                                        <td className="px-4 py-3 text-gray-900 font-medium">
                                            {abono.codigo || `#${abono.id}`}
                                        </td>

                                        <td className="px-4 py-3 text-gray-900 font-semibold">
                                            {money(abono.totalNeto ?? abono.montoNeto ?? abono.montoTotal)}
                                        </td>

                                        <td className="px-4 py-3">
                                            <span className={`px-3 py-1 text-xs rounded-full ${pillClass}`}>
                                                {abono.estado}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Ver detalle */}
                                                <TableActionx
                                                    variant="view"
                                                    title="Ver detalle"
                                                    onClick={() => onViewAbono(abono)}
                                                    size="sm"
                                                />

                                                {/* Validar */}
                                                {showCheck && (
                                                    <TableActionx
                                                        variant="custom"
                                                        title="Validar movimiento"
                                                        icon="ci:check-big"
                                                        colorClassName="bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 hover:bg-emerald-200 hover:ring-emerald-400 focus-visible:ring-emerald-500"
                                                        onClick={() => onValidateAbono?.(abono)}
                                                        size="sm"
                                                    />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {/* Relleno */}
                            {emptyRows > 0 &&
                                Array.from({ length: emptyRows }).map((_, idx) => (
                                    <tr key={`empty-${idx}`} className="hover:bg-transparent">
                                        {Array.from({ length: 4 }).map((__, i) => (
                                            <td key={i} className="px-4 py-3">
                                                &nbsp;
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Paginador */}
            {abonos.length > 0 && (
                <div className="flex items-center justify-end gap-2 border-b border-gray90 py-3 px-3 mt-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
                    >
                        &lt;
                    </button>

                    {pagerItems.map((p, i) =>
                        typeof p === "string" ? (
                            <span key={`dots-${i}`} className="px-2 text-gray70">
                                {p}
                            </span>
                        ) : (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                aria-current={page === p ? "page" : undefined}
                                className={[
                                    "w-8 h-8 flex items-center justify-center rounded",
                                    page === p
                                        ? "bg-gray90 text-white"
                                        : "bg-gray10 text-gray70 hover:bg-gray20",
                                ].join(" ")}
                            >
                                {p}
                            </button>
                        )
                    )}

                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
                    >
                        &gt;
                    </button>
                </div>
            )}
        </div>
    );
}
