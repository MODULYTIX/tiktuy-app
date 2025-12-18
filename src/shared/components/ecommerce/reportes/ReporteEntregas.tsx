import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/auth/context';
import Buttonx from '@/shared/common/Buttonx';
import { Inputx } from '@/shared/common/Inputx';
import Cardx from '@/shared/common/Cards';

import { getEntregasReporte } from '@/services/ecommerce/reportes/ecommerceReportes.api';
import type {
    EntregasReporteResp,
    VistaReporte,
} from '@/services/ecommerce/reportes/ecommerceReportes.types';

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { Icon } from '@iconify/react';

/* =========================
   Helpers
========================= */
const hoyISO = () => new Date().toISOString().slice(0, 10);

const COLORS = [
    '#22c55e',
    '#ef4444',
    '#f97316',
    '#eab308',
    '#6366f1',
];

export default function ReporteEntregas() {
    const { token } = useAuth();

    const [vista, setVista] = useState<VistaReporte>('diario');
    const [desde, setDesde] = useState(hoyISO());
    const [hasta, setHasta] = useState(hoyISO());

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<EntregasReporteResp | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        if (!token) return;

        try {
            setLoading(true);
            setError(null);

            const resp = await getEntregasReporte(token, {
                vista,
                desde: vista === 'diario' ? desde : undefined,
                hasta: vista === 'diario' ? hasta : undefined,
            });

            setData(resp);
        } catch (e: any) {
            setError(e.message || 'Error al cargar entregas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, [vista]);

    /* =========================
       Datos seguros
    ========================= */
    const courier = useMemo(() => data?.couriers?.[0], [data]);
    const motorizado = useMemo(() => data?.motorizados?.[0], [data]);

    /* =========================
       KPIs derivados
    ========================= */
    const kpis = useMemo(() => {
        if (!data) {
            return { entregados: 0, problematicos: 0, tasaEntrega: 0 };
        }

        const entregados =
            data.donut.find(d => d.label === 'Pedidos Entregados')?.value ?? 0;

        const total = data.kpis.totalPedidos;

        return {
            entregados,
            problematicos: total - entregados,
            tasaEntrega: total > 0 ? (entregados / total) * 100 : 0,
        };
    }, [data]);

    return (
        <div className="mt-6 flex flex-col gap-6">

            {/* ================= FILTROS ================= */}
            <Cardx className="flex flex-wrap gap-4 items-center">
                <div className="flex gap-2">
                    {(['diario', 'mensual', 'anual'] as VistaReporte[]).map(v => (
                        <Buttonx
                            key={v}
                            label={v.charAt(0).toUpperCase() + v.slice(1)}
                            variant={vista === v ? 'secondary' : 'tertiary'}
                            onClick={() => setVista(v)}
                        />
                    ))}
                </div>

                {vista === 'diario' && (
                    <div className="flex gap-3 items-end">
                        <Inputx
                            type="date"
                            label="Desde"
                            value={desde}
                            onChange={e => setDesde(e.target.value)}
                        />
                        <Inputx
                            type="date"
                            label="Hasta"
                            value={hasta}
                            onChange={e => setHasta(e.target.value)}
                        />
                        <Buttonx
                            label="Filtrar"
                            icon="mdi:filter"
                            variant="secondary"
                            onClick={fetchData}
                        />
                    </div>
                )}
            </Cardx>

            {/* ================= KPIs ================= */}
            {data && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <Cardx>
                        <p className="text-xs text-gray60">Total Pedidos</p>
                        <p className="text-2xl font-semibold">{data.kpis.totalPedidos}</p>
                    </Cardx>

                    <Cardx>
                        <p className="text-xs text-gray60">Pedidos Entregados</p>
                        <p className="text-2xl font-semibold text-green-600">
                            {kpis.entregados}
                        </p>
                    </Cardx>

                    <Cardx>
                        <p className="text-xs text-gray60">% Entregados</p>
                        <p className="text-2xl font-semibold">
                            {kpis.tasaEntrega.toFixed(1)}%
                        </p>
                    </Cardx>

                    <Cardx>
                        <p className="text-xs text-gray60">Pedidos con Problema</p>
                        <p className="text-2xl font-semibold text-red-500">
                            {kpis.problematicos}
                        </p>
                    </Cardx>
                </div>
            )}

            {loading && <p className="text-sm text-gray60">Cargando…</p>}
            {error && <p className="text-sm text-red-500">{error}</p>}

            {/* ================= DONUT ================= */}
            {data && (
                <Cardx>
                    <p className="text-sm text-gray60 mb-4">Estado de entregas</p>

                    <div className="w-full h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.donut}
                                    dataKey="value"
                                    nameKey="label"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={2}
                                >
                                    {data.donut.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>

                                <Tooltip formatter={(v?: number) => `${v ?? 0} pedidos`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Cardx>
            )}

            {/* ================= RESUMEN COURIER / MOTORIZADO ================= */}
            {(courier || motorizado) && (
                <Cardx className="bg-gray10 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* ===== COURIER ===== */}
                        {courier && (
                            <div className="flex flex-col items-center justify-center gap-2">
                                <p className="text-xs text-gray60 flex items-center gap-1">
                                    <Icon icon="mdi:truck-delivery" />
                                    Courier
                                </p>

                                <span className="px-6 py-1.5 rounded-full bg-gray30 text-sm font-semibold">
                                    {courier.courier}
                                </span>
                            </div>
                        )}

                        {/* ===== MOTORIZADO ===== */}
                        {motorizado && (
                            <div className="flex flex-col items-center justify-center gap-2">
                                <p className="text-xs text-gray60 flex items-center gap-1">
                                    <Icon icon="mdi:motorbike" />
                                    Motorizado
                                </p>

                                <span className="px-6 py-1.5 rounded-full bg-gray30 text-sm font-semibold">
                                    {motorizado.motorizado}
                                </span>
                            </div>
                        )}

                    </div>
                </Cardx>
            )}

    </div >
  );
}
