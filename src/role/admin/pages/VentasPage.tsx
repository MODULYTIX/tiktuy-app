import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import Tittlex from "@/shared/common/Tittlex";
import Buttonx from "@/shared/common/Buttonx";
import { Selectx, SelectxDate } from "@/shared/common/Selectx";


import { useAuth } from "@/auth/context";

import {
  getAdminVentasDashboard,
  getAdminCobranzaCouriers,
  downloadPdfCobranza,
} from "@/services/admin/ventas/admin-ventas.api";

import type {
  VentasDiariasResponse,
  CobranzaCouriersResponse,
  AdminVentasFiltros,
} from "@/services/admin/ventas/admin-ventas.types";

/* Helper para fecha por defecto (primer día del mes actual) */
function getFirstDayOfMonth() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1)
    .toISOString()
    .split("T")[0];
}
/* Helper para hoy */
function getToday() {
  return new Date().toISOString().split("T")[0];
}

export default function VentasPage() {
  const { token } = useAuth();

  // Filtros
  const [desde, setDesde] = useState(getFirstDayOfMonth());
  const [hasta, setHasta] = useState(getToday());
  // El precio se fija internamente en 1 ya que el input visual se retiró
  const [precio] = useState<number>(1);
  const [courierId, setCourierId] = useState<string>("");

  // Estados de data
  const [dashboardData, setDashboardData] = useState<VentasDiariasResponse | null>(null);
  const [cobranzaData, setCobranzaData] = useState<CobranzaCouriersResponse | null>(null);
  // Lista acumulada de couriers para el dropdown
  const [allCouriers, setAllCouriers] = useState<any[]>([]);


  // Loading / Error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [pdfLoadingId, setPdfLoadingId] = useState<number | null>(null);

  // Cargar datos
  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const filtros: AdminVentasFiltros = {
        desde: desde || undefined,
        hasta: hasta || undefined,
        precio: precio > 0 ? precio : 1,
        courierId: courierId ? Number(courierId) : undefined,
      };

      const [dash, cob] = await Promise.all([
        getAdminVentasDashboard(token, filtros),
        getAdminCobranzaCouriers(token, filtros),
      ]);

      setDashboardData(dash);
      setCobranzaData(cob);

      if (!courierId && cob.data) {
        setAllCouriers(cob.data);
      }
    } catch (err: any) {
      setError(err?.message || "Error al cargar datos de ventas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
  // Nota: Podríamos agregar [desde, hasta, precio] si queremos auto-fetch, 
  // pero usaremos botón "Filtrar" para evitar muchas llamadas mientras escribe.

  const handleFiltrar = () => {
    loadData();
  };

  const handleDownloadPdf = async (courierId: number) => {
    if (!token) return;
    try {
      setPdfLoadingId(courierId);
      const filtros: AdminVentasFiltros = {
        desde,
        hasta,
        precio: precio > 0 ? precio : 1,
        courierId: courierId ? Number(courierId) : undefined,
      };
      await downloadPdfCobranza(token, courierId, filtros);
    } catch (e: any) {
      alert(e?.message || "Error al descargar PDF");
    } finally {
      setPdfLoadingId(null);
    }
  };

  // Totales
  const totalPedidos = dashboardData?.totales.totalPedidos ?? 0;
  const totalCobrar = dashboardData?.totales.totalCobrar ?? 0;
  const chartData = dashboardData?.detalle_diario ?? [];

  const couriersList = cobranzaData?.data ?? [];

  return (
    <section className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <Tittlex
          title="Ventas"
          description="Resumen de ventas y cobranza por Courier"
        />
      </div>

      {/* FILTROS */}
      <div className="bg-white p-5 rounded-md shadow-default border-t border-gray-100 flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full md:w-40">
          <SelectxDate
            label="Desde"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            labelVariant="left"
          />
        </div>
        <div className="w-full md:w-40">
          <SelectxDate
            label="Hasta"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            labelVariant="left"
          />
        </div>

        <div className="w-full md:w-56">
          <Selectx
            label="Courier"
            value={courierId}
            onChange={(e) => setCourierId(e.target.value)}
            labelVariant="left"
          >
            <option value="">Todos</option>
            {allCouriers.map((c) => (
              <option key={c.courier_id} value={c.courier_id}>
                {c.courier_nombre}
              </option>
            ))}
          </Selectx>
        </div>


        <Buttonx
          label={loading ? "Cargando..." : "Filtrar"}
          onClick={handleFiltrar}
          disabled={loading}
          icon="mdi:filter-outline"
        />
      </div>

      {
        error && (
          <div className="bg-red-50 text-red-600 p-4 rounded border border-red-200">
            {error}
          </div>
        )
      }

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Pedidos Totales</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">
              {totalPedidos}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Icon icon="mdi:shopping-outline" className="text-2xl" />
          </div>
        </div>
        {/* Card 2 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Total a Cobrar</p>
            <h3 className="text-3xl font-bold text-emerald-600 mt-1">
              S/. {totalCobrar.toFixed(2)}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Icon icon="mdi:cash-multiple" className="text-2xl" />
          </div>
        </div>
      </div>

      {/* GRAFICO VENTAS DIARIAS */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Ventas Diarias
        </h3>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="fecha"
                tick={{ fontSize: 12, fill: "#6B7280" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6B7280" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `S/.${val}`}
              />
              <Tooltip
                cursor={{ fill: "#F3F4F6" }}
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
              />
              <Bar
                dataKey="monto_cobrar"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
                name="Cobranza (S/.)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABLA POR COURIER */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Cobranza por Courier
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Courier</th>
                <th className="px-6 py-3">RUC</th>
                <th className="px-6 py-3 text-center">Pedidos Entregados</th>
                <th className="px-6 py-3 text-right">Monto a Pagar</th>
                <th className="px-6 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {couriersList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No se encontraron registros para este rango.
                  </td>
                </tr>
              ) : (
                couriersList.map((item) => (
                  <tr key={item.courier_id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {item.courier_nombre}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {item.ruc || "—"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-blue-50 text-blue-700 py-1 px-3 rounded-full text-xs font-semibold">
                        {item.pedidos_entregados}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900 font-bold">
                      S/. {item.monto_a_pagar.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 flex justify-center">
                      <Buttonx
                        label={pdfLoadingId === item.courier_id ? "..." : "PDF"}
                        variant="outlined"
                        icon={pdfLoadingId === item.courier_id ? undefined : "mdi:file-pdf-box"}
                        onClick={() => handleDownloadPdf(item.courier_id)}
                        disabled={pdfLoadingId === item.courier_id}
                        className="px-3! py-1! text-xs"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section >
  );
}
