import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/context";

import Buttonx from "@/shared/common/Buttonx";
import { Selectx } from "@/shared/common/Selectx";
import { Inputx } from "@/shared/common/Inputx";
import Cardx from "@/shared/common/Cards";
import { Skeleton } from "@/shared/components/ui/Skeleton";

import { getCourierIngresosReporte } from "@/services/courier/reporte/reporteCourier.api";
import type { VistaReporte } from "@/services/ecommerce/reportes/ecommerceReportes.types";
import type { CourierIngresosReporteResp } from "@/services/courier/reporte/reporteCourier.types";

import { Icon } from "@iconify/react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

/* =========================
   Helpers
========================= */
const hoyISO = () => new Date().toLocaleDateString('en-CA');

export default function ReporteIngresosC() {
  const { token } = useAuth();

  const [vista, setVista] = useState<VistaReporte>("diario");
  const [desde, setDesde] = useState(hoyISO());
  const [hasta, setHasta] = useState(hoyISO());

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CourierIngresosReporteResp | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* =========================
     Fetch
  ========================= */
  const fetchData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const resp = await getCourierIngresosReporte(token, {
        vista,
        desde: ["diario", "mensual"].includes(vista) ? desde : undefined,
        hasta: vista === "diario" ? hasta : undefined,
      });

      setData(resp);
    } catch (e: any) {
      setError(e.message || "Error al cargar ingresos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista]);

  /* =========================
     KPIs
  ========================= */

  const kpis = useMemo(() => {
    if (!data) {
      return {
        ingresos: 0,
        pedidos: 0,
        netoGanancia: 0,
      };
    }

    const ingresos = data.kpis.ingresosTotales;
    const pedidos = data.kpis.totalPedidos;

    return {
      ingresos,
      pedidos,
      netoGanancia: ingresos - (Number(data.kpis.ingresosRepartidor) || 0),
    };
  }, [data]);

  /* =========================
     Chart data
  ========================= */
  const chartData = useMemo(() => {
    // Evitar stale data
    if (!data || data.filtros?.vista !== vista) return [];

    return data.grafico.labels.map((label, i) => ({
      label,
      ingresos: data.grafico.series[i] ?? 0,
    }));
  }, [data]);

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* ================= FILTROS ================= */}
      <Cardx className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-2">
          {(["diario", "mensual", "anual"] as VistaReporte[]).map(v => (
            <Buttonx
              key={v}
              label={v.charAt(0).toUpperCase() + v.slice(1)}
              variant={vista === v ? "secondary" : "tertiary"}
              onClick={() => setVista(v)}
            />
          ))}
        </div>

        {/* -- DIARIO -- */}
        {vista === "diario" && (
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

        {/* -- MENSUAL -- */}
        {vista === "mensual" && (
          <div className="flex gap-3 items-end">
            <div className="w-[100px]">
              <Selectx
                label="Año"
                value={parseInt(desde.split("-")[0])}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  const mStr = desde.split("-")[1];
                  setDesde(`${y}-${mStr}-02`);
                }}
              >
                {[2026, 2027, 2028, 2029, 2030].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Selectx>
            </div>
            <div className="w-[140px]">
              <Selectx
                label="Mes"
                value={parseInt(desde.split("-")[1]) - 1} // 1-based to 0-based
                onChange={(e) => {
                  const m = Number(e.target.value);
                  const yStr = desde.split("-")[0];
                  const mStr = String(m + 1).padStart(2, '0');
                  setDesde(`${yStr}-${mStr}-02`);
                }}
              >
                {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((mes, i) => (
                  <option key={i} value={i}>{mes}</option>
                ))}
              </Selectx>
            </div>
            <Buttonx
              label="Filtrar"
              icon="mdi:filter"
              variant="secondary"
              onClick={fetchData}
            />
          </div>
        )}

        {/* -- ANUAL -- */}
        {vista === "anual" && (
          <div className="flex gap-3 items-end">
            <div className="w-[100px]">
              <Selectx
                label="Año"
                value={parseInt(desde.split("-")[0])}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  setDesde(`${y}-01-02`);
                }}
              >
                {[2026, 2027, 2028, 2029, 2030].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Selectx>
            </div>
            <Buttonx
              label="Filtrar"
              icon="mdi:filter"
              variant="secondary"
              onClick={fetchData}
            />
          </div>
        )}
      </Cardx>

      {/* ================= LOADING SKELETON ================= */}
      {loading && (
        <>
          {/* KPIs Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Cardx key={i}>
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </Cardx>
            ))}
          </div>
          {/* Chart Skeleton */}
          <Cardx>
            <div className="flex flex-col gap-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-[260px] w-full" />
            </div>
          </Cardx>
        </>
      )}

      {/* ================= CONTENT ================= */}
      {!loading && data && data.filtros?.vista === vista && (
        <>
          {/* ================= KPIs ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

            <Cardx>
              <div className="flex items-center gap-2 text-gray60 text-xs mb-1">
                <Icon icon="mdi:cash-multiple" />
                Ingresos Totales
              </div>
              <p className="text-2xl font-semibold">
                S/ {kpis.ingresos.toFixed(2)}
              </p>
            </Cardx>

            <Cardx>
              <div className="flex items-center gap-2 text-gray60 text-xs mb-1">
                <Icon icon="mdi:package-variant" />
                Total Pedidos
              </div>
              <p className="text-2xl font-semibold">
                {kpis.pedidos}
              </p>
            </Cardx>

            <Cardx>
              <div className="flex items-center gap-2 text-gray60 text-xs mb-1">
                <Icon icon="mdi:chart-line" />
                Neto Ganancia
              </div>
              <p className="text-2xl font-semibold">
                S/ {kpis.netoGanancia.toFixed(2)}
              </p>
            </Cardx>

            <Cardx>
              <div className="flex items-center gap-2 text-gray60 text-xs mb-1">
                <Icon icon="mdi:calendar-range" />
                Período
              </div>
              <p className="text-sm font-medium capitalize">
                {vista}
              </p>
              {vista === "diario" && (
                <p className="text-xs text-gray60">
                  {desde} → {hasta}
                </p>
              )}
              {(vista === "mensual" || vista === "anual") && (
                <p className="text-xs text-gray60">
                  Ref: {desde}
                </p>
              )}
            </Cardx>

          </div>

          {/* ================= GRÁFICO ================= */}
          {chartData.length > 0 && (
            <Cardx>
              <div className="flex items-center gap-2 mb-4">
                <Icon icon="mdi:finance" className="text-indigo-500" />
                <p className="text-sm font-medium">Evolución de ingresos</p>
              </div>

              <div className="w-full h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value) =>
                        typeof value === "number"
                          ? `S/ ${value.toFixed(2)}`
                          : "S/ 0.00"
                      }
                      contentStyle={{ borderRadius: '8px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="ingresos"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Cardx>
          )}
        </>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
