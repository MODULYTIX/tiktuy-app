import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/context";
import Buttonx from "@/shared/common/Buttonx";
import Cardx from "@/shared/common/Cards";

import { getIngresosReporte } from "@/services/ecommerce/reportes/ecommerceReportes.api";
import type {
  IngresosReporteResp,
  VistaReporte,
} from "@/services/ecommerce/reportes/ecommerceReportes.types";

import IngresosLineChart from "./IngresosLineChart";
import { SelectxDate } from "@/shared/common/Selectx";

/* =========================
   Helpers
========================= */
const hoyISO = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};
const currency = (n: number) => `S/ ${n.toFixed(2)}`;

export default function ReporteIngresos() {
  const { token } = useAuth();

  const [vista, setVista] = useState<VistaReporte>("diario");
  const [desde, setDesde] = useState(hoyISO());
  const [hasta, setHasta] = useState(hoyISO());

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IngresosReporteResp | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const resp = await getIngresosReporte(token, {
        vista,
        desde: vista === "diario" ? desde : undefined,
        hasta: vista === "diario" ? hasta : undefined,
      });

      setData(resp);
    } catch (e: any) {
      setError(e?.message || "Error al cargar reporte");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista]);

  /* =========================
     KPIs derivados (alineados)
  ========================= */
  const kpis = useMemo(() => {
    if (!data) {
      return {
        totalPedidos: 0,
        ingresoPromPedido: 0,
        ingresoPromDia: 0,
      };
    }

    const totalPedidos = Number(data.kpis.totalPedidos ?? 0);
    const ingresosTotales = Number(data.kpis.ingresosTotales ?? 0);
    const dias = data.tabla.length || 1;

    return {
      totalPedidos,
      ingresoPromPedido:
        totalPedidos > 0 ? ingresosTotales / totalPedidos : 0,
      ingresoPromDia: ingresosTotales / dias,
    };
  }, [data]);

  return (
    <div className="flex flex-col gap-6">
      {/* ================= FILTROS ================= */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-end gap-4">
        {/* Selector de Vista (Diario/Mensual/Anual) */}
        <div className="flex bg-slate-50 p-1 rounded-lg">
          {(["diario", "mensual", "anual"] as VistaReporte[]).map((v) => (
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
            <div className="w-full md:w-auto min-w-[150px]">
              <SelectxDate
                label="Desde"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full md:w-auto min-w-[150px]">
              <SelectxDate
                label="Hasta"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
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
            <p className="text-xs text-gray60">Ingresos Totales</p>
            <p className="text-2xl font-semibold mt-1">
              {currency(data.kpis.ingresosTotales)}
            </p>
          </Cardx>

          <Cardx>
            <p className="text-xs text-gray60">Total Pedidos</p>
            <p className="text-2xl font-semibold mt-1">
              {kpis.totalPedidos}
            </p>
          </Cardx>

          <Cardx>
            <p className="text-xs text-gray60">Ingreso / Pedido</p>
            <p className="text-2xl font-semibold mt-1">
              {currency(kpis.ingresoPromPedido)}
            </p>
          </Cardx>

          <Cardx>
            <p className="text-xs text-gray60">Ingreso / Día</p>
            <p className="text-2xl font-semibold mt-1">
              {currency(kpis.ingresoPromDia)}
            </p>
          </Cardx>
        </div>
      )}

      {loading && <p className="text-sm text-gray60">Cargando…</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* ================= GRÁFICO + TABLA ================= */}
      {data && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ===== GRÁFICO ===== */}
          <Cardx className="xl:col-span-2">
            <p className="text-sm text-gray60 mb-3">Evolución de ingresos</p>

            <IngresosLineChart
              labels={data.grafico.labels}
              series={data.grafico.series}
            />
          </Cardx>

          {/* ===== TABLA ===== */}
          <Cardx>
            <p className="text-sm text-gray60 mb-3">Detalle por fecha</p>
            <div className="max-h-[320px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-gray30 text-gray60">
                    <th className="py-2 text-left">Fecha</th>
                    <th className="py-2 text-right">Ingresos</th>
                    <th className="py-2 text-right">Pedidos</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tabla.map((row) => (
                    <tr key={row.fecha} className="border-b border-gray20">
                      <td className="py-2">{row.fecha}</td>
                      <td className="py-2 text-right font-medium">
                        {currency(row.ingresos)}
                      </td>
                      <td className="py-2 text-right">
                        {row.totalPedidos}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Cardx>

        </div>
      )}
    </div>
  );
}
