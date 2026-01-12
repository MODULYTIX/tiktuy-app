import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/context";
import Buttonx from "@/shared/common/Buttonx";
import Cardx from "@/shared/common/Cards";

import { getEntregasReporte } from "@/services/ecommerce/reportes/ecommerceReportes.api";
import type {
  EntregasReporteResp,
  VistaReporte,
} from "@/services/ecommerce/reportes/ecommerceReportes.types";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Icon } from "@iconify/react";
import { SelectxDate } from "@/shared/common/Selectx";

/* =========================
   Helpers – FECHA LOCAL (✔ CORRECTO)
========================= */
const hoyISO = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const COLORS = ["#22c55e", "#ef4444", "#f97316", "#eab308", "#6366f1"];

export default function ReporteEntregas() {
  const { token } = useAuth();

  const [vista, setVista] = useState<VistaReporte>("diario");
  const [desde, setDesde] = useState(hoyISO());
  const [hasta, setHasta] = useState(hoyISO());

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EntregasReporteResp | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* =========================
     Fetch
  ========================= */
  const fetchData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const resp = await getEntregasReporte(token, {
        vista,
        desde: vista === "diario" ? desde : undefined,
        hasta: vista === "diario" ? hasta : undefined,
      });

      setData(resp);
    } catch (e: any) {
      setError(e?.message || "Error al cargar entregas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      return { total: 0, entregados: 0, problematicos: 0, tasaEntrega: 0 };
    }

    const total = Number(data.kpis?.totalPedidos ?? 0);

    let entregados = Number(data.kpis?.entregados ?? 0);

    if (!entregados && Array.isArray(data.donut)) {
      entregados =
        Number(
          data.donut.find(d => d.label === "Pedidos Entregados")?.value ?? 0
        ) || 0;
    }

    const problematicos = Math.max(0, total - entregados);
    const tasaEntrega = total > 0 ? (entregados / total) * 100 : 0;

    return { total, entregados, problematicos, tasaEntrega };
  }, [data]);

  const donutData = useMemo(() => data?.donut ?? [], [data]);

  return (
    <div className="flex flex-col gap-6">
      {/* ================= FILTROS ================= */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-end gap-4">
        {/* Selector de Vista */}
        <div className="flex bg-slate-50 p-1 rounded-lg">
          {(["diario", "mensual", "anual"] as VistaReporte[]).map(v => (
            <button
              key={v}
              onClick={() => setVista(v)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${vista === v
                  ? "bg-white text-gray-800 shadow-sm border border-gray-100"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {/* Fechas (Solo diario) */}
        {vista === "diario" && (
          <>
            <div className="w-full sm:w-[180px] min-w-[150px]">
              <SelectxDate
                label="Desde"
                value={desde}
                onChange={e => setDesde(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="w-full sm:w-[180px] min-w-[150px]">
              <SelectxDate
                label="Hasta"
                value={hasta}
                onChange={e => setHasta(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="pb-0.5">
              <Buttonx
                label="Filtrar"
                icon="mdi:filter-outline"
                variant="outlined"
                onClick={fetchData}
                className="border-slate-200 text-slate-600 hover:bg-slate-50"
              />
            </div>
          </>
        )}
      </div>

      {/* ================= KPIs ================= */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Cardx>
            <p className="text-xs text-gray60">Total Pedidos</p>
            <p className="text-2xl font-semibold">{kpis.total}</p>
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
      {data && donutData.length > 0 && (
        <Cardx>
          <p className="text-sm text-gray60 mb-4">Estado de entregas</p>

          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {donutData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>

                <Tooltip formatter={v => `${Number(v ?? 0)} pedidos`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Cardx>
      )}

      {/* ================= RESUMEN ================= */}
      {(courier || motorizado) && (
        <Cardx className="bg-gray10 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courier && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs text-gray60 flex items-center gap-1">
                  <Icon icon="mdi:truck-delivery" /> Courier
                </p>
                <span className="px-6 py-1.5 rounded-full bg-gray30 text-sm font-semibold">
                  {courier.courier}
                </span>
              </div>
            )}

            {motorizado && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs text-gray60 flex items-center gap-1">
                  <Icon icon="mdi:motorbike" /> Motorizado
                </p>
                <span className="px-6 py-1.5 rounded-full bg-gray30 text-sm font-semibold">
                  {motorizado.motorizado}
                </span>
              </div>
            )}
          </div>
        </Cardx>
      )}
    </div>
  );
}
