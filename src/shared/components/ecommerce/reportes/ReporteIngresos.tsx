import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/context";

import Buttonx from "@/shared/common/Buttonx";
import { Selectx, SelectxDate } from "@/shared/common/Selectx";
import { Skeleton } from "@/shared/components/ui/Skeleton";

import {
  getIngresosReporte,
  listCouriers,
} from "@/services/ecommerce/reportes/ecommerceReportes.api";
import type {
  IngresosReporteResp,
  VistaReporte,
} from "@/services/ecommerce/reportes/ecommerceReportes.types";
import IngresosLineChart from "./IngresosLineChart";
import { Icon } from "@iconify/react";

const currency = (n: number) => `S/ ${n.toFixed(2)}`;

const hoyISO = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

function EmptyState({
  icon,
  title,
  desc,
  heightClass = "h-[300px]",
}: {
  icon: string;
  title: string;
  desc: string;
  heightClass?: string;
}) {
  return (
    <div
      className={`${heightClass} flex flex-col items-center justify-center text-center gap-2 px-4`}
    >
      <div className="w-10 h-10 rounded-full bg-gray10 flex items-center justify-center text-gray70">
        <Icon icon={icon} className="text-xl" />
      </div>
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      <p className="text-xs text-gray60 max-w-[560px]">{desc}</p>
    </div>
  );
}

export default function ReporteIngresos() {
  const { token } = useAuth();

  const [vista, setVista] = useState<VistaReporte>("diario");
  const [desde, setDesde] = useState(hoyISO());
  const [hasta, setHasta] = useState(hoyISO());

  const [courierId, setCourierId] = useState<string>("todos");
  const [couriers, setCouriers] = useState<{ label: string; value: string }[]>(
    [],
  );

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IngresosReporteResp | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ====== Estilo modelo (como tus otros reportes) ======
  const WRAP_MODEL =
    "bg-white p-4 sm:p-5 rounded shadow-default border-b-4 border-gray90 min-w-0";
  const CARD_MODEL =
    "bg-white p-4 sm:p-5 rounded shadow-default border-b-4 border-gray90 border-0 min-w-0";

  const vistas: VistaReporte[] = ["diario", "mensual", "anual"];

  // Cargar lista de couriers
  useEffect(() => {
    if (!token) return;

    listCouriers(token)
      .then((res) => {
        setCouriers([
          { label: "Todos", value: "todos" },
          ...res.map((c: any) => ({ label: c.nombre, value: String(c.id) })),
        ]);
      })
      .catch((err) => console.error("Error loading couriers", err));
  }, [token]);

  const fetchData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const resp = await getIngresosReporte(token, {
        vista,
        desde: vista === "diario" ? desde : undefined,
        hasta: vista === "diario" ? hasta : undefined,
        // Enviar courierId si no es "todos"
        courierId: courierId !== "todos" ? Number(courierId) : undefined,
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
  }, [vista, courierId]); // Recargar cuando cambia vista o courier

  /* =========================
     KPIs
  ========================= */
  const kpis = useMemo(() => {
    if (!data) {
      return {
        totalPedidos: 0,
        ingresosTotales: 0,
        servicioCourier: 0,
        gananciaNeta: 0,
      };
    }

    return {
      totalPedidos: Number(data.kpis.totalPedidos ?? 0),
      ingresosTotales: Number(data.kpis.ingresosTotales ?? 0),
      servicioCourier: Number(data.kpis.servicioCourier ?? 0),
      gananciaNeta: Number(data.kpis.gananciaNeta ?? 0),
    };
  }, [data]);

  const chartStats = useMemo(() => {
    const series = data?.grafico?.series ?? [];
    if (!series.length) return { total: 0, avg: 0, max: 0 };
    const vals = series.map((x) => Number(x) || 0);
    const total = vals.reduce((a, b) => a + b, 0);
    const max = Math.max(...vals);
    const avg = total / Math.max(1, vals.length);
    return { total, avg, max };
  }, [data]);

  const hasChartData = useMemo(() => {
    const labels = data?.grafico?.labels ?? [];
    const series = data?.grafico?.series ?? [];
    return labels.length > 0 && series.length > 0;
  }, [data]);

  const hasTableData = useMemo(() => {
    return (data?.tabla?.length ?? 0) > 0;
  }, [data]);

  return (
    <div className="mt-5 flex flex-col gap-6 min-w-0">
      {/* ================= FILTROS (separados: Periodo + Filtros) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4 min-w-0">
        {/* ===== Card: Periodo (Segmented control) ===== */}
        <div className={WRAP_MODEL}>
          <div className="flex items-center gap-2 mb-3">
            <Icon icon="mdi:calendar-clock" className="text-gray70" />
            <p className="text-sm font-semibold text-gray-900">Periodo</p>
          </div>

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

        {/* ===== Card: Filtros específicos ===== */}
        <div className={WRAP_MODEL}>
          <div className="flex items-center gap-2 mb-3">
            <Icon icon="mdi:filter-variant" className="text-gray70" />
            <p className="text-sm font-semibold text-gray-900">Filtros</p>
          </div>

          {/* DIARIO */}
          {vista === "diario" && (
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 items-end min-w-0">
              <div className="w-full sm:w-auto sm:min-w-[220px] sm:max-w-[260px] min-w-0">
                <SelectxDate
                  label="Desde"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="w-full sm:w-auto sm:min-w-[220px] sm:max-w-[260px] min-w-0">
                <SelectxDate
                  label="Hasta"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="w-full sm:w-auto sm:min-w-[220px] sm:max-w-[260px] min-w-0">
                <Selectx
                  label="Courier"
                  value={courierId}
                  onChange={(e) => setCourierId(e.target.value)}
                  className="w-full"
                >
                  {couriers.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </Selectx>
              </div>

              <div className="w-full sm:w-auto shrink-0">
                <Buttonx
                  label="Filtrar"
                  icon="mdi:filter-outline"
                  variant="secondary"
                  onClick={fetchData}
                  className="w-full sm:w-auto"
                />
              </div>
            </div>
          )}

          {/* MENSUAL */}
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

              <div className="w-full sm:w-auto sm:min-w-[220px] sm:max-w-[260px] min-w-0">
                <Selectx
                  label="Courier"
                  value={courierId}
                  onChange={(e) => setCourierId(e.target.value)}
                  className="w-full"
                >
                  {couriers.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </Selectx>
              </div>

              <div className="w-full sm:w-auto shrink-0">
                <Buttonx
                  label="Filtrar"
                  icon="mdi:filter-outline"
                  variant="secondary"
                  onClick={fetchData}
                  className="w-full sm:w-auto"
                />
              </div>
            </div>
          )}

          {/* ANUAL */}
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

              <div className="w-full sm:w-auto sm:min-w-[220px] sm:max-w-[260px] min-w-0">
                <Selectx
                  label="Courier"
                  value={courierId}
                  onChange={(e) => setCourierId(e.target.value)}
                  className="w-full"
                >
                  {couriers.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </Selectx>
              </div>

              <div className="w-full sm:w-auto shrink-0">
                <Buttonx
                  label="Filtrar"
                  icon="mdi:filter-outline"
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
          {/* KPIs Skeleton */}
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

          {/* Chart/Table Skeleton */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 min-w-0">
            <div className={`${CARD_MODEL} xl:col-span-2`}>
              <Skeleton className="h-6 w-40 mb-4" />
              <Skeleton className="h-[300px] w-full" />
            </div>
            <div className={CARD_MODEL}>
              <Skeleton className="h-6 w-40 mb-4" />
              <Skeleton className="h-[300px] w-full" />
            </div>
          </div>
        </>
      )}

      {/* ================= DATA CONTENT ================= */}
      {!loading && data && data.filtros?.vista === vista && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 min-w-0">
            <div className={CARD_MODEL}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
                  <Icon icon="mdi:cash-multiple" className="text-lg" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray60 mb-1">Ingresos Totales</p>
                  <p className="text-xl font-bold text-gray-900">
                    {currency(kpis.ingresosTotales)}
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
                  <p className="text-xl font-bold text-gray-900">
                    {kpis.totalPedidos}
                  </p>
                </div>
              </div>
            </div>

            <div className={CARD_MODEL}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-gray-700 shrink-0">
                  <Icon icon="mdi:truck-fast" className="text-lg" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray60 mb-1">Servicio Total</p>
                  <p className="text-xl font-bold text-gray-900">
                    - {currency(kpis.servicioCourier)}
                  </p>
                </div>
              </div>
            </div>

            <div className={CARD_MODEL}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-amber-800 shrink-0">
                  <Icon icon="mdi:finance" className="text-lg" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray60 mb-1">Ganancia Neta</p>
                  <p className="text-xl font-bold text-gray-900">
                    {currency(kpis.gananciaNeta)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* GRÁFICO + TABLA */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 min-w-0">
            {/* GRÁFICO */}
            <div className={`${CARD_MODEL} xl:col-span-2`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:chart-line" className="text-indigo-500" />
                  <p className="text-sm font-semibold text-gray-900">
                    Evolución de ingresos
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-[11px] text-gray60">
                  <span className="bg-gray10 rounded px-2 py-1">
                    Total:{" "}
                    <span className="font-semibold text-gray-900">
                      {currency(chartStats.total)}
                    </span>
                  </span>
                  <span className="bg-gray10 rounded px-2 py-1">
                    Prom.:{" "}
                    <span className="font-semibold text-gray-900">
                      {currency(chartStats.avg)}
                    </span>
                  </span>
                  <span className="bg-gray10 rounded px-2 py-1">
                    Máx.:{" "}
                    <span className="font-semibold text-gray-900">
                      {currency(chartStats.max)}
                    </span>
                  </span>
                </div>
              </div>

              {hasChartData ? (
                <IngresosLineChart
                  labels={data.grafico.labels}
                  series={data.grafico.series}
                />
              ) : (
                <EmptyState
                  icon="mdi:chart-line"
                  title="No hay datos para este período"
                  desc="Prueba cambiando el rango (Diario) o ajustando el courier seleccionado."
                  heightClass="h-[300px]"
                />
              )}
            </div>

            {/* TABLA */}
            <div className={CARD_MODEL}>
              <div className="flex items-center gap-2 mb-4">
                <Icon icon="mdi:table" className="text-indigo-500" />
                <p className="text-sm font-semibold text-gray-900">
                  Detalle por fecha
                </p>
              </div>

              {hasTableData ? (
                <div className="max-h-[320px] overflow-y-auto rounded-xl border border-gray20">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-gray10 text-gray70 border-b border-gray20">
                        <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide">
                          Fecha
                        </th>
                        <th className="py-3 px-3 text-right text-[11px] font-semibold uppercase tracking-wide">
                          Ingresos
                        </th>
                        <th className="py-3 px-3 text-right text-[11px] font-semibold uppercase tracking-wide">
                          Pedidos
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray20">
                      {data.tabla.map((row, idx) => (
                        <tr
                          key={row.fecha}
                          className={[
                            "transition-colors",
                            "hover:bg-gray10/60",
                            idx % 2 === 0 ? "bg-white" : "bg-gray10/20",
                          ].join(" ")}
                        >
                          <td className="py-3 px-3">
                            <span className="font-medium text-gray-900">
                              {row.fecha}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <span className="inline-flex items-center justify-end rounded-lg bg-emerald-50 px-2 py-1 text-[12px] font-semibold text-emerald-700">
                              {currency(row.ingresos)}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <span className="inline-flex items-center justify-center rounded-lg bg-gray10 px-2 py-1 text-[12px] font-semibold text-gray-900 min-w-[44px]">
                              {row.totalPedidos}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon="mdi:table"
                  title="No hay detalle para mostrar"
                  desc="No se encontraron registros en la tabla para este filtro."
                  heightClass="h-[300px]"
                />
              )}
            </div>
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
