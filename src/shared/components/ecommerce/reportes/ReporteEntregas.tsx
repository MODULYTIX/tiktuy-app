import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/context";
import Buttonx from "@/shared/common/Buttonx";

import { getEntregasReporte, listCouriers } from "@/services/ecommerce/reportes/ecommerceReportes.api";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import { Icon } from "@iconify/react";
import { Selectx, SelectxDate } from "@/shared/common/Selectx";
import { Skeleton } from "@/shared/components/ui/Skeleton";

/* =========================
   Helpers – FECHA LOCAL
========================= */
const hoyISO = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const COLORS = ["#22c55e", "#ef4444", "#f97316", "#eab308", "#6366f1"];

const colorByLabel = (label: string) => {
  const s = String(label || "").toLowerCase();
  if (s.includes("entreg")) return "#22c55e"; // green
  if (s.includes("rechaz")) return "#ef4444"; // red
  if (s.includes("anulad")) return "#f97316"; // orange
  if (s.includes("problema")) return "#ef4444";
  return "#6366f1";
};

function EmptyState({
  icon,
  title,
  desc,
  heightClass = "h-[320px]",
}: {
  icon: string;
  title: string;
  desc: string;
  heightClass?: string;
}) {
  return (
    <div className={`${heightClass} flex flex-col items-center justify-center text-center gap-2 px-4`}>
      <div className="w-10 h-10 rounded-full bg-gray10 flex items-center justify-center text-gray70">
        <Icon icon={icon} className="text-xl" />
      </div>
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      <p className="text-xs text-gray60 max-w-[560px]">{desc}</p>
    </div>
  );
}

function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;

  return (
    <div className="bg-white border border-gray20 rounded-xl shadow-default px-3 py-2">
      <div className="text-xs text-gray60">{p.label}</div>
      <div className="text-sm font-bold text-gray-900">{p.value}</div>
    </div>
  );
}

function ChipsLegend(props: any) {
  const items = props?.payload ?? [];
  if (!items.length) return null;

  return (
    <div className="flex flex-wrap justify-center gap-2 mt-2">
      {items.map((it: any, idx: number) => (
        <span
          key={idx}
          className="inline-flex items-center gap-2 text-[11px] text-gray70 bg-gray10 rounded-full px-3 py-1"
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: it.color }} />
          {it.value}
        </span>
      ))}
    </div>
  );
}

export default function ReporteEntregas() {
  const { token } = useAuth();

  const [vista, setVista] = useState<VistaReporte>("diario");
  const [desde, setDesde] = useState(hoyISO());
  const [hasta, setHasta] = useState(hoyISO());

  // Filtro de Courier
  const [courierId, setCourierId] = useState<string>("todos");
  const [couriers, setCouriers] = useState<{ label: string; value: string }[]>([]);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EntregasReporteResp | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ====== Estilo modelo (como Courier) ======
  const WRAP_MODEL =
    "bg-white p-4 sm:p-5 rounded shadow-default border-b-4 border-gray90 min-w-0";
  const CARD_MODEL =
    "bg-white p-4 sm:p-5 rounded shadow-default border-b-4 border-gray90 border-0 min-w-0";

  const vistas: VistaReporte[] = ["diario", "mensual", "anual"];

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
        // ✅ importante: enviar desde también en mensual/anual para que el selector tenga efecto real
        desde: ["diario", "mensual", "anual"].includes(vista) ? desde : undefined,
        hasta: vista === "diario" ? hasta : undefined,
        courierId: courierId !== "todos" ? Number(courierId) : undefined,
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
  }, [vista, courierId]);

  /* =========================
     Cargar lista de couriers
  ========================= */
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

  /* =========================
     Datos seguros (resumen)
  ========================= */
  const courierTop = useMemo(() => data?.couriersRanking?.[0], [data]);
  const motorizadoTop = useMemo(() => data?.motorizados?.[0], [data]);

  /* =========================
     Donut + métricas robustas
  ========================= */
  const donutData = useMemo(() => data?.donut ?? [], [data]);

  const totalDonut = useMemo(() => {
    return donutData.reduce((acc: number, it: any) => acc + (Number(it.value) || 0), 0);
  }, [donutData]);

  const byLabel = useMemo(() => {
    const map = new Map<string, number>();
    donutData.forEach((d: any) => map.set(String(d.label), Number(d.value) || 0));
    return map;
  }, [donutData]);

  const entregados = useMemo(() => {
    return (
      Number(data?.kpis?.entregados ?? 0) ||
      byLabel.get("Pedidos Entregados") ||
      byLabel.get("Entregados") ||
      0
    );
  }, [data, byLabel]);

  const rechazados = useMemo(() => {
    return (
      byLabel.get("Pedidos Rechazados") ||
      byLabel.get("Rechazados") ||
      0
    );
  }, [byLabel]);

  const anulados = useMemo(() => {
    return (
      byLabel.get("Pedidos Anulados") ||
      byLabel.get("Anulados") ||
      0
    );
  }, [byLabel]);

  const total = useMemo(() => {
    const backendTotal = Number(data?.kpis?.totalPedidos ?? 0);
    return backendTotal || totalDonut || 0;
  }, [data, totalDonut]);

  const successRate = useMemo(() => {
    if (!total) return 0;
    return (entregados / total) * 100;
  }, [entregados, total]);

  const hasDonutData = useMemo(() => totalDonut > 0 || total > 0, [totalDonut, total]);

  // Extra (DIARIO): Bar horizontal por estado
  const statusBarData = useMemo(() => {
    if (!donutData?.length) return [];
    return donutData.map((d: any) => ({
      label: String(d.label),
      value: Number(d.value) || 0,
      fill: colorByLabel(String(d.label)),
    }));
  }, [donutData]);

  /* =========================
     CHART DATA (Fill Gaps)
  ========================= */
  const chartData = useMemo(() => {
    if (!data?.evolucion || data.filtros?.vista !== vista) return [];

    if (vista === "anual") {
      const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const fullYear = months.map((label) => ({
        label,
        Entregados: 0,
        Rechazados: 0,
      }));

      data.evolucion.forEach((d: any) => {
        const monthIndex = Number(d.label) - 1; // 1..12
        if (monthIndex >= 0 && monthIndex < 12) {
          fullYear[monthIndex].Entregados = d.entregados || 0;
          fullYear[monthIndex].Rechazados = d.rechazados || 0;
        }
      });

      return fullYear;
    }

    if (vista === "mensual") {
      const [yStr, mStr] = desde.split("-");
      const year = Number(yStr);
      const month = Number(mStr);
      const daysInMonth = new Date(year, month, 0).getDate();

      const fullMonth = Array.from({ length: daysInMonth }, (_, i) => ({
        label: String(i + 1),
        Entregados: 0,
        Rechazados: 0,
      }));

      data.evolucion.forEach((d: any) => {
        const dayIndex = Number(d.label) - 1;
        if (dayIndex >= 0 && dayIndex < daysInMonth) {
          fullMonth[dayIndex].Entregados = d.entregados || 0;
          fullMonth[dayIndex].Rechazados = d.rechazados || 0;
        }
      });

      return fullMonth;
    }

    return [];
  }, [data, vista, desde]);

  return (
    <div className="mt-5 flex flex-col gap-6 min-w-0">
      {/* ================= FILTROS (mismo formato Courier) ================= */}
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

        {/* ===== Card: Filtros ===== */}
        <div className={WRAP_MODEL}>
          <div className="flex items-center gap-2 mb-3">
            <Icon icon="mdi:filter-variant" className="text-gray70" />
            <p className="text-sm font-semibold text-gray-900">Filtros</p>
          </div>

          {/* -- DIARIO -- */}
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
        <div className={CARD_MODEL}>
          <div className="w-full h-[420px] flex flex-col gap-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-full w-full rounded-xl" />
          </div>
        </div>
      )}

      {/* ================= CONTENT ================= */}
      {!loading && data && data.filtros?.vista === vista && (
        <>
          {/* ===== KPIs (como Courier) ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 min-w-0">
            <div className={CARD_MODEL}>
              <div className="flex items-center gap-2 text-xs text-gray60 mb-1">
                <Icon icon="mdi:check-circle" className="text-emerald-600" />
                Entregados
              </div>
              <p className="text-xl font-bold text-gray-900">{entregados}</p>
            </div>

            <div className={CARD_MODEL}>
              <div className="flex items-center gap-2 text-xs text-gray60 mb-1">
                <Icon icon="mdi:close-circle" className="text-red-500" />
                Rechazados
              </div>
              <p className="text-xl font-bold text-gray-900">{rechazados}</p>
            </div>

            <div className={CARD_MODEL}>
              <div className="flex items-center gap-2 text-xs text-gray60 mb-1">
                <Icon icon="mdi:cancel" className="text-orange-500" />
                Anulados
              </div>
              <p className="text-xl font-bold text-gray-900">{anulados}</p>
            </div>

            <div className={CARD_MODEL}>
              <div className="flex items-center gap-2 text-xs text-gray60 mb-1">
                <Icon icon="mdi:counter" className="text-indigo-600" />
                Total
              </div>
              <p className="text-xl font-bold text-gray-900">{total}</p>
            </div>

            <div className={CARD_MODEL}>
              <div className="flex items-center gap-2 text-xs text-gray60 mb-1">
                <Icon icon="mdi:chart-arc" className="text-gray70" />
                % Éxito
              </div>
              <p className="text-xl font-bold text-gray-900">{successRate.toFixed(1)}%</p>
            </div>
          </div>

          {/* ======= DIARIO: Donut + Bar horizontal ======= */}
          {vista === "diario" && (
            <>
              {hasDonutData ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
                  {/* Donut */}
                  <div className={CARD_MODEL}>
                    <div className="flex items-center gap-2 mb-4">
                      <Icon icon="mdi:chart-donut" className="text-indigo-500" />
                      <p className="text-sm font-semibold text-gray-900">Estado de entregas</p>
                    </div>

                    <div className="w-full h-[320px] min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donutData}
                            dataKey="value"
                            nameKey="label"
                            innerRadius={82}
                            outerRadius={114}
                            paddingAngle={5}
                          >
                            {donutData.map((d: any, i: number) => (
                              <Cell
                                key={i}
                                fill={colorByLabel(String(d.label)) || COLORS[i % COLORS.length]}
                                strokeWidth={0}
                              />
                            ))}
                          </Pie>

                          {/* Texto centrado (perfecto) */}
                          <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="fill-gray-900"
                            style={{ fontSize: 22, fontWeight: 800 }}
                          >
                            {total}
                          </text>
                          <text
                            x="50%"
                            y="50%"
                            dy={20}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="fill-gray-500"
                            style={{ fontSize: 12, fontWeight: 600 }}
                          >
                            Total
                          </text>

                          <Tooltip content={<DonutTooltip />} />
                          <Legend content={<ChipsLegend />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Distribución horizontal */}
                  <div className={CARD_MODEL}>
                    <div className="flex items-center gap-2 mb-4">
                      <Icon icon="mdi:chart-bar" className="text-indigo-500" />
                      <p className="text-sm font-semibold text-gray-900">
                        Distribución por estado
                      </p>
                    </div>

                    {statusBarData.length > 0 ? (
                      <>
                        <div className="w-full h-[260px] min-w-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={statusBarData}
                              layout="vertical"
                              margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                              <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
                              <YAxis
                                type="category"
                                dataKey="label"
                                tickLine={false}
                                axisLine={false}
                                fontSize={12}
                                width={140}
                              />
                              <Tooltip
                                formatter={(v: any) => [Number(v || 0), "Cantidad"]}
                                contentStyle={{ borderRadius: "10px" }}
                              />
                              <Bar dataKey="value" radius={[8, 8, 8, 8]}>
                                {statusBarData.map((row: any, i: number) => (
                                  <Cell key={i} fill={row.fill} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Bloque éxito */}
                        <div className="mt-2 bg-gray10 rounded-xl p-3">
                          <p className="text-xs text-gray60 mb-1">Tasa de éxito</p>
                          <p className="text-2xl font-extrabold text-gray-900">
                            {successRate.toFixed(1)}%
                          </p>
                          <div className="mt-2 h-2 rounded-full bg-gray20 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${Math.min(100, Math.max(0, successRate))}%` }}
                            />
                          </div>
                          <p className="mt-2 text-[11px] text-gray60">
                            {entregados} de {total} entregas completadas.
                          </p>
                        </div>
                      </>
                    ) : (
                      <EmptyState
                        icon="mdi:chart-bar"
                        title="No hay datos para mostrar"
                        desc="Prueba cambiando el rango o quitando el filtro de courier."
                        heightClass="h-[320px]"
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className={CARD_MODEL}>
                  <EmptyState
                    icon="mdi:chart-donut"
                    title="No hay datos para este rango"
                    desc="Prueba ampliando el rango (Desde/Hasta) o quitando el filtro de courier."
                    heightClass="h-[320px]"
                  />
                </div>
              )}
            </>
          )}

          {/* ======= MENSUAL ======= */}
          {vista === "mensual" && (
            <div className={CARD_MODEL}>
              <div className="flex items-center gap-2 mb-4">
                <Icon icon="mdi:chart-bar" className="text-indigo-500" />
                <p className="text-sm font-semibold text-gray-900">
                  Evolución diaria (mes)
                </p>
              </div>

              {chartData.length > 0 ? (
                <div className="w-full h-[360px] min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} interval={0} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: "10px" }} />
                      <Legend />

                      <Bar
                        dataKey="Entregados"
                        stackId="a"
                        fill={colorByLabel("Entregados")}
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="Rechazados"
                        stackId="a"
                        fill={colorByLabel("Rechazados")}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  icon="mdi:chart-bar"
                  title="No hay datos para este mes"
                  desc="Prueba cambiando el mes/año o quitando el filtro de courier."
                  heightClass="h-[360px]"
                />
              )}
            </div>
          )}

          {/* ======= ANUAL ======= */}
          {vista === "anual" && (
            <div className={CARD_MODEL}>
              <div className="flex items-center gap-2 mb-4">
                <Icon icon="mdi:calendar-range" className="text-indigo-500" />
                <p className="text-sm font-semibold text-gray-900">
                  Resumen anual por mes
                </p>
              </div>

              {chartData.length > 0 ? (
                <div className="w-full h-[380px] min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: "10px" }} />
                      <Legend />

                      <Bar dataKey="Entregados" fill={colorByLabel("Entregados")} radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Rechazados" fill={colorByLabel("Rechazados")} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  icon="mdi:calendar-range"
                  title="No hay datos para este año"
                  desc="Prueba con otro año o verifica si existen entregas en ese periodo."
                  heightClass="h-[380px]"
                />
              )}
            </div>
          )}

          {/* ================= RESUMEN (si existe) ================= */}
          {(courierTop || motorizadoTop) && (
            <div className={CARD_MODEL}>
              <div className="flex items-center gap-2 mb-4">
                <Icon icon="mdi:star-circle" className="text-indigo-500" />
                <p className="text-sm font-semibold text-gray-900">Resumen</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courierTop && (
                  <div className="bg-gray10 rounded-xl p-4 flex flex-col items-center gap-2">
                    <p className="text-xs text-gray60 flex items-center gap-1">
                      <Icon icon="mdi:truck-delivery" /> Courier destacado
                    </p>
                    <span className="px-5 py-1.5 rounded-full bg-white border border-gray20 text-sm font-semibold">
                      {courierTop.courier}
                    </span>
                  </div>
                )}

                {motorizadoTop && (
                  <div className="bg-gray10 rounded-xl p-4 flex flex-col items-center gap-2">
                    <p className="text-xs text-gray60 flex items-center gap-1">
                      <Icon icon="mdi:motorbike" /> Motorizado destacado
                    </p>
                    <span className="px-5 py-1.5 rounded-full bg-white border border-gray20 text-sm font-semibold">
                      {motorizadoTop.motorizado}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
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
