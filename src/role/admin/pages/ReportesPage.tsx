import { useEffect, useState } from "react";
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
  Legend
} from "recharts";

import Tittlex from "@/shared/common/Tittlex";
import Buttonx from "@/shared/common/Buttonx";
import { Selectx, SelectxDate } from "@/shared/common/Selectx";
import { useAuth } from "@/auth/context";

import {
  getAdminDashboardGraficos,
} from "@/services/admin/reportes/adminReportes.api";
import { getAdminCobranzaCouriers } from "@/services/admin/ventas/admin-ventas.api";

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
  return new Date().toLocaleDateString('en-CA');
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919'];

export default function ReportesPage() {
  const { token } = useAuth();

  // Filtros
  const [vista, setVista] = useState<'diario' | 'mensual' | 'anual'>('diario');
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
  const handleVistaChange = (v: 'diario' | 'mensual' | 'anual') => {
    setVista(v);
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth();

    if (v === 'mensual') {
      const f0 = new Date(y, m, 1);
      const f1 = new Date(y, m + 1, 0);
      setDesde(f0.toISOString().split('T')[0]);
      setHasta(f1.toISOString().split('T')[0]);
    } else if (v === 'anual') {
      const f0 = new Date(y, 0, 1);
      const f1 = new Date(y, 11, 31);
      setDesde(f0.toISOString().split('T')[0]);
      setHasta(f1.toISOString().split('T')[0]);
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
      .then(res => {
        if (res.data) setAllCouriers(res.data);
      })
      .catch(err => console.error("Error loading couriers list", err));
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
        precio
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
  }, [token, vista, courierId, desde, hasta]); // Auto-refresh filters

  /* --- RENDER HELPERS --- */
  const kpis = data?.kpis;
  const graficos = data?.graficos;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg">
          <p className="font-bold text-gray-700 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <section className="flex flex-col gap-6 pb-10">
      <div>
        <Tittlex
          title="Reportes Avanzados"
          description="Análisis gráfico de rendimiento, estados y ganancias."
        />
      </div>

      {/* FILTROS */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col xl:flex-row gap-4 items-end flex-wrap">

        {/* VISTA */}
        <div className="flex bg-slate-50 p-1 rounded-lg self-start xl:self-end">
          {(["diario", "mensual", "anual"] as const).map(v => (
            <button
              key={v}
              onClick={() => handleVistaChange(v)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${vista === v
                ? "bg-white text-gray-800 shadow-sm border border-gray-100"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {/* FECHAS */}
        {vista === 'diario' && (
          <>
            <div className="w-full md:w-36">
              <SelectxDate label="Desde" value={desde} onChange={e => setDesde(e.target.value)} labelVariant="left" />
            </div>
            <div className="w-full md:w-36">
              <SelectxDate label="Hasta" value={hasta} onChange={e => setHasta(e.target.value)} labelVariant="left" />
            </div>
          </>
        )}
        {vista === 'mensual' && (
          <>
            <div className="w-full md:w-28">
              <Selectx label="Año" value={parseInt(desde.split("-")[0])} onChange={e => {
                const y = Number(e.target.value);
                const m = parseInt(desde.split("-")[1]) - 1;
                const f0 = new Date(y, m, 1);
                const f1 = new Date(y, m + 1, 0);
                setDesde(f0.toISOString().split('T')[0]);
                setHasta(f1.toISOString().split('T')[0]);
              }} labelVariant="left">
                {[2025, 2026, 2027, 2028, 2029, 2030].map(y => <option key={y} value={y}>{y}</option>)}
              </Selectx>
            </div>
            <div className="w-full md:w-36">
              <Selectx label="Mes" value={parseInt(desde.split("-")[1]) - 1} onChange={e => {
                const m = Number(e.target.value);
                const y = parseInt(desde.split("-")[0]);
                const f0 = new Date(y, m, 1);
                const f1 = new Date(y, m + 1, 0);
                setDesde(f0.toISOString().split('T')[0]);
                setHasta(f1.toISOString().split('T')[0]);
              }} labelVariant="left">
                {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((mes, i) => <option key={i} value={i}>{mes}</option>)}
              </Selectx>
            </div>
          </>
        )}
        {vista === 'anual' && (
          <div className="w-full md:w-32">
            <Selectx label="Año" value={parseInt(desde.split("-")[0])} onChange={e => {
              const y = Number(e.target.value);
              const f0 = new Date(y, 0, 1);
              const f1 = new Date(y, 11, 31);
              setDesde(f0.toISOString().split('T')[0]);
              setHasta(f1.toISOString().split('T')[0]);
            }} labelVariant="left">
              {[2025, 2026, 2027, 2028, 2029, 2030].map(y => <option key={y} value={y}>{y}</option>)}
            </Selectx>
          </div>
        )}

        {/* COURIER */}
        <div className="w-full md:w-48">
          <Selectx label="Courier" value={courierId} onChange={e => setCourierId(e.target.value)} labelVariant="left">
            <option value="">Todos</option>
            {allCouriers.map(c => (
              <option key={c.courier_id} value={c.courier_id}>{c.courier_nombre}</option>
            ))}
          </Selectx>
        </div>

        {/* PRECIO (Recalculo Ganancia) */}
        <div className="w-full md:w-32 flex flex-col justify-end">
          <label className="text-[10px] text-gray-500 font-bold uppercase mb-1">Precio Ref. (S/.)</label>
          <input
            type="number" step="0.1" min="0"
            value={precio}
            onChange={e => setPrecio(Number(e.target.value))}
            onBlur={() => loadData()} // Recarga al salir
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>

        <Buttonx label={loading ? "..." : "Actualizar"} onClick={() => loadData()} disabled={loading} icon="mdi:refresh" />
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded border border-red-200">{error}</div>}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Pedidos" value={kpis?.totalPedidos} icon="mdi:package-variant-closed" color="blue" />
        <KpiCard label="Entregados" value={kpis?.entregados} icon="mdi:check-circle-outline" color="emerald" />
        <KpiCard label="Anulados" value={kpis?.anulados} icon="mdi:close-circle-outline" color="red" />
        <KpiCard label="Ganancia Est." value={kpis ? `S/. ${kpis.gananciaTotal}` : '-'} sub="Basado en Precio Ref." icon="mdi:cash-multiple" color="amber" />
      </div>

      {/* GRAFICOS FILA 1: EVOLUCION + DISTRIBUCION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* EVOLUCION */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Icon icon="mdi:chart-timeline-variant" className="text-blue-600" />
            Evolución de Entregas
          </h3>
          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graficos?.evolucion || []}>
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
                <Area type="monotone" dataKey="cantidad" name="Total Pedidos" stroke="#3B82F6" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} />
                <Area type="monotone" dataKey="entregados" name="Entregados" stroke="#10B981" fillOpacity={1} fill="url(#colorEntregas)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DISTRIBUCION */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Icon icon="mdi:chart-pie" className="text-purple-600" />
            Estados
          </h3>
          <div className="w-full h-[320px]">
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
                  {(graficos?.distribucion || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* GRAFICO FILA 2: RANKING */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Icon icon="mdi:trophy-outline" className="text-amber-500" />
          Top Couriers (Por entregas)
        </h3>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={graficos?.ranking || []} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="courier" type="category" width={120} tick={{ fontSize: 11, fontWeight: 600 }} />
              <Tooltip cursor={{ fill: '#F9FAFB' }} content={<CustomTooltip />} />
              <Bar dataKey="entregados" name="Pedidos Entregados" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </section>
  );
}

// Subcomponente KPI
function KpiCard({ label, value, icon, color, sub }: any) {
  // Map colors to tailwind classes roughly
  const bgMap: any = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  const textMap: any = {
    blue: 'text-blue-900',
    emerald: 'text-emerald-900',
    red: 'text-red-900',
    amber: 'text-amber-900',
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bgMap[color] || bgMap.blue}`}>
        <Icon icon={icon} className="text-2xl" />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <div className="flex items-baseline gap-2">
          <h3 className={`text-2xl font-bold ${textMap[color] || 'text-gray-900'}`}>
            {value !== undefined ? value : '-'}
          </h3>
        </div>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
