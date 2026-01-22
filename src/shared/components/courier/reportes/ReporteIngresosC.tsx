import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/context";

import Buttonx from "@/shared/common/Buttonx";
import { Selectx } from "@/shared/common/Selectx";
import { Inputx } from "@/shared/common/Inputx";
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
const hoyISO = () => new Date().toLocaleDateString("en-CA");

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
    if (!data || data.filtros?.vista !== vista) return [];
    return data.grafico.labels.map((label, i) => ({
      label,
      ingresos: data.grafico.series[i] ?? 0,
    }));
  }, [data, vista]);

  const chartStats = useMemo(() => {
    if (!chartData.length) return { total: 0, avg: 0, max: 0 };
    const vals = chartData.map((x) => Number(x.ingresos) || 0);
    const total = vals.reduce((a, b) => a + b, 0);
    const max = Math.max(...vals);
    const avg = total / Math.max(1, vals.length);
    return { total, avg, max };
  }, [chartData]);

  // ====== Estilo modelo (como tus otros reportes) ======
  const WRAP_MODEL =
    "bg-white p-4 sm:p-5 rounded shadow-default border-b-4 border-gray90 min-w-0";
  const CARD_MODEL =
    "bg-white p-4 sm:p-5 rounded shadow-default border-b-4 border-gray90 border-0 min-w-0";

  const vistas: VistaReporte[] = ["diario", "mensual", "anual"];

  return (
    <div className="mt-5 flex flex-col gap-6 min-w-0">
      {/* ================= FILTROS (separados) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4 min-w-0">
        {/* ===== Card: Periodo (Segmented control) ===== */}
        <div className={WRAP_MODEL}>
          <div className="flex items-center gap-2 mb-3">
            <Icon icon="mdi:calendar-clock" className="text-gray70" />
            <p className="text-sm font-semibold text-gray-900">Periodo</p>
          </div>

          {/* Segmented control */}
          <div className="inline-flex rounded-xl bg-gray10 p-1">
            {vistas.map((v) => {
              const active = vista === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVista(v)}
                  className={[
                    "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                    active
                      ? "bg-gray90 text-white shadow-sm"
                      : "text-gray70 hover:bg-gray20",
                  ].join(" ")}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-gray60 mt-3">
            Elige cómo quieres ver el reporte.
          </p>
        </div>

        {/* ===== Card: Filtros específicos (pegado a la izquierda) ===== */}
        <div className={WRAP_MODEL}>
          <div className="flex items-center gap-2 mb-3">
            <Icon icon="mdi:filter-variant" className="text-gray70" />
            <p className="text-sm font-semibold text-gray-900">Filtros</p>
          </div>

          {/* -- DIARIO -- */}
          {vista === "diario" && (
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 items-end min-w-0">
              <div className="w-full sm:w-auto sm:min-w-[220px] sm:max-w-[260px] min-w-0">
                <Inputx
                  type="date"
                  label="Desde"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="w-full sm:w-auto sm:min-w-[220px] sm:max-w-[260px] min-w-0">
                <Inputx
                  type="date"
                  label="Hasta"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="w-full sm:w-auto shrink-0">
                <Buttonx
                  label="Filtrar"
                  icon="mdi:filter"
                  variant="secondary"
                  onClick={fetchData}
                  className="w-full sm:w-auto"
                />
              </div>
            </div>
          )}

          {/* -- MENSUAL -- */}
          {vista === "mensual" && (
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 items-end min-w-0">
              <div className="w-full sm:w-[140px] min-w-0">
                <Selectx
                  label="Año"
                  value={parseInt(desde.split("-")[0])}
                  onChange={(e) => {
                    const y = Number(e.target.value);
                    const mStr = desde.split("-")[1];
                    setDesde(`${y}-${mStr}-02`);
                  }}
                  className="w-full"
                >
                  {[2026, 2027, 2028, 2029, 2030].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Selectx>
              </div>

              <div className="w-full sm:w-[190px] min-w-0">
                <Selectx
                  label="Mes"
                  value={parseInt(desde.split("-")[1]) - 1}
                  onChange={(e) => {
                    const m = Number(e.target.value);
                    const yStr = desde.split("-")[0];
                    const mStr = String(m + 1).padStart(2, "0");
                    setDesde(`${yStr}-${mStr}-02`);
                  }}
                  className="w-full"
                >
                  {[
                    "Enero",
                    "Febrero",
                    "Marzo",
                    "Abril",
                    "Mayo",
                    "Junio",
                    "Julio",
                    "Agosto",
                    "Septiembre",
                    "Octubre",
                    "Noviembre",
                    "Diciembre",
                  ].map((mes, i) => (
                    <option key={i} value={i}>
                      {mes}
                    </option>
                  ))}
                </Selectx>
              </div>

              <div className="w-full sm:w-auto shrink-0">
                <Buttonx
                  label="Filtrar"
                  icon="mdi:filter"
                  variant="secondary"
                  onClick={fetchData}
                  className="w-full sm:w-auto"
                />
              </div>
            </div>
          )}

          {/* -- ANUAL -- */}
          {vista === "anual" && (
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 items-end min-w-0">
              <div className="w-full sm:w-[140px] min-w-0">
                <Selectx
                  label="Año"
                  value={parseInt(desde.split("-")[0])}
                  onChange={(e) => {
                    const y = Number(e.target.value);
                    setDesde(`${y}-01-02`);
                  }}
                  className="w-full"
                >
                  {[2026, 2027, 2028, 2029, 2030].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Selectx>
              </div>

              <div className="w-full sm:w-auto shrink-0">
                <Buttonx
                  label="Filtrar"
                  icon="mdi:filter"
                  variant="secondary"
                  onClick={fetchData}
                  className="w-full sm:w-auto"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= LOADING SKELETON ================= */}
      {loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 min-w-0">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={CARD_MODEL}>
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))}
          </div>

          <div className={CARD_MODEL}>
            <div className="flex flex-col gap-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-[320px] w-full" />
            </div>
          </div>
        </>
      )}

      {/* ================= CONTENT ================= */}
      {!loading && data && data.filtros?.vista === vista && (
        <>
          {/* ================= KPIs ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 min-w-0">
            <div className={CARD_MODEL}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
                  <Icon icon="mdi:cash-multiple" className="text-lg" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray60 mb-1">Ingresos Totales</p>
                  <p className="text-xl font-bold text-gray-900">
                    S/ {kpis.ingresos.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className={CARD_MODEL}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 shrink-0">
                  <Icon icon="mdi:package-variant" className="text-lg" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray60 mb-1">Total Pedidos</p>
                  <p className="text-xl font-bold text-gray-900">{kpis.pedidos}</p>
                </div>
              </div>
            </div>

            <div className={CARD_MODEL}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-amber-800 shrink-0">
                  <Icon icon="mdi:chart-line" className="text-lg" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray60 mb-1">Neto Ganancia</p>
                  <p className="text-xl font-bold text-gray-900">
                    S/ {kpis.netoGanancia.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className={CARD_MODEL}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-gray-700 shrink-0">
                  <Icon icon="mdi:calendar-range" className="text-lg" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray60 mb-1">Período</p>
                  <p className="text-sm font-semibold capitalize text-gray-900">
                    {vista}
                  </p>
                  {vista === "diario" && (
                    <p className="text-[11px] text-gray60 truncate">
                      {desde} → {hasta}
                    </p>
                  )}
                  {(vista === "mensual" || vista === "anual") && (
                    <p className="text-[11px] text-gray60 truncate">Ref: {desde}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ================= GRÁFICO ================= */}
          <div className={CARD_MODEL}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:finance" className="text-indigo-500" />
                <p className="text-sm font-semibold text-gray-900">
                  Evolución de ingresos
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-[11px] text-gray60">
                <span className="bg-gray10 rounded px-2 py-1">
                  Total:{" "}
                  <span className="font-semibold text-gray-900">
                    S/ {chartStats.total.toFixed(2)}
                  </span>
                </span>
                <span className="bg-gray10 rounded px-2 py-1">
                  Prom.:{" "}
                  <span className="font-semibold text-gray-900">
                    S/ {chartStats.avg.toFixed(2)}
                  </span>
                </span>
                <span className="bg-gray10 rounded px-2 py-1">
                  Máx.:{" "}
                  <span className="font-semibold text-gray-900">
                    S/ {chartStats.max.toFixed(2)}
                  </span>
                </span>
              </div>
            </div>

            {chartData.length > 0 ? (
              <div className="w-full h-[320px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value) =>
                        typeof value === "number"
                          ? `S/ ${value.toFixed(2)}`
                          : "S/ 0.00"
                      }
                      contentStyle={{ borderRadius: "10px" }}
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
            ) : (
              <div className="h-[320px] flex flex-col items-center justify-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gray10 flex items-center justify-center text-gray70">
                  <Icon icon="mdi:chart-line" className="text-xl" />
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  No hay datos para este período
                </p>
                <p className="text-xs text-gray60 max-w-[520px]">
                  Prueba cambiando el rango de fechas o la vista (Diario / Mensual /
                  Anual).
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded border border-red-200 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
