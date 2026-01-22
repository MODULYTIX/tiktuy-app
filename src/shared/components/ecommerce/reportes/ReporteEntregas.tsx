import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/context";
import Buttonx from "@/shared/common/Buttonx";
import Cardx from "@/shared/common/Cards";

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

  // Filtro de Courier
  const [courierId, setCourierId] = useState<string>("todos");
  const [couriers, setCouriers] = useState<{ label: string; value: string }[]>([]);

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
     Datos seguros
  ========================= */
  const courier = useMemo(() => data?.couriersRanking?.[0], [data]);
  const motorizado = useMemo(() => data?.motorizados?.[0], [data]);

  // Cargar lista de couriers para el filtro
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

  /* =========================
     CHART DATA (Fill Gaps)
  ========================= */
  const chartData = useMemo(() => {
    // Evitar proyección de datos de otra vista mientras carga la nueva
    if (!data?.evolucion || data.filtros?.vista !== vista) return [];

    if (vista === "anual") {
      const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      // Inicializar con 0
      const fullYear = months.map(label => ({
        label,
        "Entregados": 0,
        "Rechazados": 0
      }));

      // Llenar con datos reales
      data.evolucion.forEach(d => {
        const monthIndex = Number(d.label) - 1; // Backend envía 1..12
        if (monthIndex >= 0 && monthIndex < 12) {
          fullYear[monthIndex]["Entregados"] = d.entregados;
          fullYear[monthIndex]["Rechazados"] = d.rechazados;
        }
      });
      return fullYear;
    }

    if (vista === "mensual") {
      // Calcular cuantos días tiene el mes seleccionado
      const [yStr, mStr] = desde.split("-");
      const year = Number(yStr);
      const month = Number(mStr); // 1-based from input type="date" string usually, but 'desde' is ISO.
      // actually 'desde' is "YYYY-MM-DD".

      const daysInMonth = new Date(year, month, 0).getDate(); // month is 1-based, so this gets last day of that month

      // Inicializar array de días
      const fullMonth = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        return {
          label: String(day),
          "Entregados": 0,
          "Rechazados": 0
        };
      });

      // Llenar con datos reales
      data.evolucion.forEach(d => {
        const dayIndex = Number(d.label) - 1; // Backend envía día del mes
        if (dayIndex >= 0 && dayIndex < daysInMonth) {
          fullMonth[dayIndex]["Entregados"] = d.entregados;
          fullMonth[dayIndex]["Rechazados"] = d.rechazados;
        }
      });
      return fullMonth;
    }

    return [];
  }, [data, vista, desde]);


  return (
    <div className="flex flex-col gap-6">
      {/* ================= FILTROS ================= */}
      <Cardx className="flex flex-wrap gap-4 items-center">
        {/* Selector de Vista */}
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

        {/* Fechas (Solo diario) */}
        {vista === "diario" && (
          <div className="flex gap-3 items-end">
            <div className="w-full sm:w-[150px]">
              <SelectxDate
                label="Desde"
                value={desde}
                onChange={e => setDesde(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-[150px]">
              <SelectxDate
                label="Hasta"
                value={hasta}
                onChange={e => setHasta(e.target.value)}
                className="w-full"
              />
            </div>
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
          </div>
        )}

        {/* Filtro Courier */}
        <div className="w-full md:w-auto min-w-[180px]">
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

        <div>
          <Buttonx
            label="Filtrar"
            icon="mdi:filter-outline"
            variant="secondary"
            onClick={fetchData}
          />
        </div>
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
              <Skeleton className="h-[400px] w-full" />
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

          {/* ================= CHARTS ================= */}
          <Cardx>
            {vista === 'diario' && (
              <div className="flex items-center gap-2 mb-4">
                <Icon icon="mdi:chart-donut" className="text-indigo-500" />
                <p className="text-sm font-medium">Estado de entregas</p>
              </div>
            )}

            {vista === "anual" ? (
              <div className="w-full h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                    <Legend />
                    <Bar dataKey="Entregados" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Rechazados" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : vista === "mensual" ? (
              // VISTA MENSUAL: Vertical Bar Chart + Daily Evolution
              <div className="w-full flex flex-col gap-8 mt-4">
                <div className="w-full h-[300px]">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2 ml-4">Evolución Diaria</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px' }} />
                      <Legend />
                      <Bar dataKey="Entregados" stackId="a" fill="#22c55e" />
                      <Bar dataKey="Rechazados" stackId="a" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              // VISTA DIARIO: Donut Only
              <div className="flex flex-col items-center justify-center w-full">
                <div className="w-full h-[300px] max-w-[500px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="label"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={5}
                      >
                        {donutData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </Cardx>

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
        </>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
