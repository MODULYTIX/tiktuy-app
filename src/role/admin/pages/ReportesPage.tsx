import { useEffect, useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

import Tittlex from "@/shared/common/Tittlex";
import Buttonx from "@/shared/common/Buttonx";
import { Selectx, SelectxDate } from "@/shared/common/Selectx";
import { useAuth } from "@/auth/context";

import { getAdminDashboardGraficos } from "@/services/admin/reportes/adminReportes.api";
import { getAdminCobranzaCouriers } from "@/services/admin/ventas/admin-cuadreSaldo.api";

import type {
  DashboardGraficosResponse,
  AdminReportesFiltros,
} from "@/services/admin/reportes/adminReportes.types";

/* Helpers fechas */
function getFirstDayOfMonth() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1)
    .toISOString()
    .split("T")[0];
}
function getToday() {
  return new Date().toLocaleDateString("en-CA");
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AF19FF",
  "#FF1919",
];

export default function ReportesPage() {
  const { token } = useAuth();

  // ====== Estilo modelo (igual que tus reportes) ======
  const WRAP_MODEL =
    "bg-white p-4 sm:p-5 rounded shadow-default border-b-4 border-gray90 min-w-0";
  const CARD_MODEL =
    "bg-white p-4 sm:p-5 rounded shadow-default border-b-4 border-gray90 border-0 min-w-0";

  const vistas = ["diario", "mensual", "anual"] as const;

  // Filtros
  const [vista, setVista] = useState<(typeof vistas)[number]>("diario");
  const [desde, setDesde] = useState(getFirstDayOfMonth());
  const [hasta, setHasta] = useState(getToday());
  const [courierId, setCourierId] = useState<string>("");

  // Precio para cálculo de ganancia (opcional, default 1 en backend)
  const [precio, setPrecio] = useState<number>(1);

  // Data
  const [data, setData] = useState<DashboardGraficosResponse | null>(null);
  const [allCouriers, setAllCouriers] = useState<any[]>([]);

  // UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Helper cambio vista
  const handleVistaChange = (v: (typeof vistas)[number]) => {
    setVista(v);

    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth();

    if (v === "mensual") {
      const f0 = new Date(y, m, 1);
      const f1 = new Date(y, m + 1, 0);
      setDesde(f0.toISOString().split("T")[0]);
      setHasta(f1.toISOString().split("T")[0]);
    } else if (v === "anual") {
      const f0 = new Date(y, 0, 1);
      const f1 = new Date(y, 11, 31);
      setDesde(f0.toISOString().split("T")[0]);
      setHasta(f1.toISOString().split("T")[0]);
    } else {
      setDesde(getFirstDayOfMonth());
      setHasta(getToday());
    }
  };

  // Cargar Lista Couriers
  useEffect(() => {
    if (!token) return;
    // Reusamos endpoint de ventas para lista simple
    getAdminCobranzaCouriers(token, { precio: 1 }) // dummy params
      .then((res) => {
        if (res.data) setAllCouriers(res.data);
      })
      .catch((err) => console.error("Error loading couriers list", err));
  }, [token]);

  // Cargar Dashboard
  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    setError("");

    try {
      const filtros: AdminReportesFiltros = {
        desde: desde || undefined,
        hasta: hasta || undefined,
        courierId: courierId ? Number(courierId) : undefined,
        vista,
        precio,
      };

      const result = await getAdminDashboardGraficos(token, filtros);
      setData(result);
    } catch (err: any) {
      setError(err?.message || "Error cargando gráficos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, vista, courierId, desde, hasta]);

  /* --- PROCESAMIENTO DE DATOS GRAFICO --- */
  const chartData = useMemo(() => {
    if (!data?.graficos?.evolucion) return [];

    const rawData = data.graficos.evolucion;
    const processed: any[] = [];

    // --- VISTA ANUAL: 12 Meses ---
    if (vista === "anual") {
      const months = [
        "Ene",
        "Feb",
        "Mar",
        "Abr",
        "May",
        "Jun",
        "Jul",
        "Ago",
        "Sep",
        "Oct",
        "Nov",
        "Dic",
      ];

      for (let i = 1; i <= 12; i++) {
        const monthItems = rawData.filter((d) => {
          const label = String(d.label);

          // Caso 1: numero (1-12)
          if (!label.includes("-") && !isNaN(Number(label))) {
            return Number(label) === i;
          }

          // Caso 2: fecha (2026-01-05)
          const dateObj = new Date(label.includes("T") ? label : label + "T00:00:00");
          if (!isNaN(dateObj.getTime())) {
            return dateObj.getMonth() + 1 === i;
          }

          return false;
        });

        const cantidadInfo = monthItems.reduce(
          (acc, curr) => ({
            cantidad: acc.cantidad + (Number(curr.cantidad) || 0),
            entregados: acc.entregados + (Number(curr.entregados) || 0),
            ganancia: acc.ganancia + (Number(curr.ganancia) || 0),
          }),
          { cantidad: 0, entregados: 0, ganancia: 0 }
        );

        processed.push({
          label: months[i - 1],
          cantidad: cantidadInfo.cantidad,
          entregados: cantidadInfo.entregados,
          ganancia: cantidadInfo.ganancia,
        });
      }
    } else {
      // --- VISTA DIARIO / MENSUAL: Rango de fechas ---
      const dStart = new Date(`${desde}T00:00:00`);
      const dEnd = new Date(`${hasta}T00:00:00`);

      for (let d = new Date(dStart); d <= dEnd; d.setDate(d.getDate() + 1)) {
        const isoDate = d.toISOString().split("T")[0];

        const found = rawData.find((item) => {
          if (!item.label) return false;

          let itemDate = item.label;
          if (item.label.includes("T")) itemDate = item.label.split("T")[0];

          return itemDate === isoDate;
        });

        processed.push({
          label: d.getDate(),
          fullDate: isoDate,
          cantidad: found?.cantidad || 0,
          entregados: found?.entregados || 0,
          ganancia: found?.ganancia || 0,
        });
      }
    }

    return processed;
  }, [data, vista, desde, hasta]);

  const kpis = data?.kpis;
  const graficos = data?.graficos;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const fullLabel = payload[0].payload.fullDate || label;

      return (
        <div className="bg-white p-3 border border-gray20 shadow-default rounded-xl">
          <p className="font-bold text-gray-700 mb-2">{fullLabel}</p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className="text-sm font-medium"
              style={{ color: entry.color }}
            >
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <section className="mt-8 flex flex-col gap-6 pb-10 min-w-0">
      <div>
        <Tittlex
          title="Reportes Avanzados"
          description="Análisis gráfico de rendimiento, estados y ganancias."
        />
      </div>

      {/* ================= FILTROS (mismo formato que tus reportes) ================= */}
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
                  onClick={() => handleVistaChange(v)}
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

          {/* --- DIARIO --- */}
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
                  <option value="">Todos</option>
                  {allCouriers.map((c) => (
                    <option key={c.courier_id} value={c.courier_id}>
                      {c.courier_nombre}
                    </option>
                  ))}
                </Selectx>
              </div>

              <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[240px] min-w-0">
                <label className="block text-xs font-medium text-gray60 mb-1">
                  Precio Ref. (S/.)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={precio}
                  onChange={(e) => setPrecio(Number(e.target.value))}
                  className="w-full border border-gray20 rounded-md px-3 py-2 focus:outline-none focus:border-gray90 text-sm"
                />
              </div>

              <div className="w-full sm:w-auto shrink-0">
                <Buttonx
                  label={loading ? "..." : "Actualizar"}
                  onClick={loadData}
                  disabled={loading}
                  icon="mdi:refresh"
                  variant="secondary"
                  className="w-full sm:w-auto"
                />
              </div>
            </div>
          )}

          {/* --- MENSUAL --- */}
          {vista === "mensual" && (
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 items-end min-w-0">
              <div className="w-full sm:w-[140px] min-w-0">
                <Selectx
                  label="Año"
                  value={parseInt(desde.split("-")[0])}
                  onChange={(e) => {
                    const y = Number(e.target.value);
                    const m = parseInt(desde.split("-")[1]) - 1;
                    const f0 = new Date(y, m, 1);
                    const f1 = new Date(y, m + 1, 0);
                    setDesde(f0.toISOString().split("T")[0]);
                    setHasta(f1.toISOString().split("T")[0]);
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
                    const y = parseInt(desde.split("-")[0]);
                    const f0 = new Date(y, m, 1);
                    const f1 = new Date(y, m + 1, 0);
                    setDesde(f0.toISOString().split("T")[0]);
                    setHasta(f1.toISOString().split("T")[0]);
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
                  <option value="">Todos</option>
                  {allCouriers.map((c) => (
                    <option key={c.courier_id} value={c.courier_id}>
                      {c.courier_nombre}
                    </option>
                  ))}
                </Selectx>
              </div>

              <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[240px] min-w-0">
                <label className="block text-xs font-medium text-gray60 mb-1">
                  Precio Ref. (S/.)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={precio}
                  onChange={(e) => setPrecio(Number(e.target.value))}
                  className="w-full border border-gray20 rounded-md px-3 py-2 focus:outline-none focus:border-gray90 text-sm"
                />
              </div>

              <div className="w-full sm:w-auto shrink-0">
                <Buttonx
                  label={loading ? "..." : "Actualizar"}
                  onClick={loadData}
                  disabled={loading}
                  icon="mdi:refresh"
                  variant="secondary"
                  className="w-full sm:w-auto"
                />
              </div>
            </div>
          )}

          {/* --- ANUAL --- */}
          {vista === "anual" && (
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 items-end min-w-0">
              <div className="w-full sm:w-[140px] min-w-0">
                <Selectx
                  label="Año"
                  value={parseInt(desde.split("-")[0])}
                  onChange={(e) => {
                    const y = Number(e.target.value);
                    const f0 = new Date(y, 0, 1);
                    const f1 = new Date(y, 11, 31);
                    setDesde(f0.toISOString().split("T")[0]);
                    setHasta(f1.toISOString().split("T")[0]);
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
                  <option value="">Todos</option>
                  {allCouriers.map((c) => (
                    <option key={c.courier_id} value={c.courier_id}>
                      {c.courier_nombre}
                    </option>
                  ))}
                </Selectx>
              </div>

              <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[240px] min-w-0">
                <label className="block text-xs font-medium text-gray60 mb-1">
                  Precio Ref. (S/.)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={precio}
                  onChange={(e) => setPrecio(Number(e.target.value))}
                  className="w-full border border-gray20 rounded-md px-3 py-2 focus:outline-none focus:border-gray90 text-sm"
                />
              </div>

              <div className="w-full sm:w-auto shrink-0">
                <Buttonx
                  label={loading ? "..." : "Actualizar"}
                  onClick={loadData}
                  disabled={loading}
                  icon="mdi:refresh"
                  variant="secondary"
                  className="w-full sm:w-auto"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded border border-red-200">
          {error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
        <KpiCard
          cardClass={CARD_MODEL}
          label="Total Pedidos"
          value={kpis?.totalPedidos}
          icon="mdi:package-variant-closed"
          color="blue"
        />
        <KpiCard
          cardClass={CARD_MODEL}
          label="Entregados"
          value={kpis?.entregados}
          icon="mdi:check-circle-outline"
          color="emerald"
        />
        <KpiCard
          cardClass={CARD_MODEL}
          label="Anulados"
          value={kpis?.anulados}
          icon="mdi:close-circle-outline"
          color="red"
        />
        <KpiCard
          cardClass={CARD_MODEL}
          label="Ganancia Est."
          value={kpis ? `S/. ${kpis.gananciaTotal}` : "-"}
          sub="Basado en Precio Ref."
          icon="mdi:cash-multiple"
          color="amber"
        />
      </div>

      {/* GRAFICOS FILA 1: EVOLUCION + DISTRIBUCION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-w-0">
        {/* EVOLUCION */}
        <div className={[CARD_MODEL, "lg:col-span-2"].join(" ")}>
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Icon icon="mdi:chart-timeline-variant" className="text-blue-600" />
            Evolución de Entregas
          </h3>

          <div className="w-full h-[320px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorEntregas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>

                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />

                <Area
                  type="monotone"
                  dataKey="cantidad"
                  name="Total Pedidos"
                  stroke="#3B82F6"
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="entregados"
                  name="Entregados"
                  stroke="#10B981"
                  fillOpacity={1}
                  fill="url(#colorEntregas)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DISTRIBUCION */}
        <div className={CARD_MODEL}>
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Icon icon="mdi:chart-pie" className="text-purple-600" />
            Estados
          </h3>

          <div className="w-full h-[320px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={graficos?.distribucion || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {(graficos?.distribucion || []).map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* GRAFICO FILA 2: RANKING */}
      <div className={CARD_MODEL}>
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon icon="mdi:trophy-outline" className="text-amber-500" />
          Top Couriers (Por entregas)
        </h3>

        <div className="w-full h-[300px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={graficos?.ranking || []}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" hide />
              <YAxis
                dataKey="courier"
                type="category"
                width={120}
                tick={{ fontSize: 11, fontWeight: 600 }}
              />
              <Tooltip cursor={{ fill: "#F9FAFB" }} content={<CustomTooltip />} />
              <Bar
                dataKey="entregados"
                name="Pedidos Entregados"
                fill="#8B5CF6"
                radius={[0, 4, 4, 0]}
                barSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

// Subcomponente KPI
function KpiCard({ label, value, icon, color, sub, cardClass }: any) {
  const bgMap: any = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-600",
  };

  const textMap: any = {
    blue: "text-blue-900",
    emerald: "text-emerald-900",
    red: "text-red-900",
    amber: "text-amber-900",
  };

  return (
    <div className={[cardClass, "flex items-center gap-4"].join(" ")}>
      <div
        className={[
          "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
          bgMap[color] || bgMap.blue,
        ].join(" ")}
      >
        <Icon icon={icon} className="text-2xl" />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-gray60 font-medium">{label}</p>
        <h3 className={["text-2xl font-bold", textMap[color] || "text-gray-900"].join(" ")}>
          {value !== undefined ? value : "-"}
        </h3>
        {sub && <p className="text-[10px] text-gray60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
