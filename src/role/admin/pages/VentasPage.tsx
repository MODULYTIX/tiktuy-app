import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

import Tittlex from "@/shared/common/Tittlex";
import Buttonx from "@/shared/common/Buttonx";
import { Selectx, SelectxDate } from "@/shared/common/Selectx";

import { useAuth } from "@/auth/context";

import {
  getAdminVentasDashboard,
  getAdminCobranzaCouriers,
  downloadPdfCobranza,
  getAdminAllCouriers,
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
  return new Date().toLocaleDateString('en-CA');
}

export default function VentasPage() {
  const { token } = useAuth();

  const [vista, setVista] = useState<'diario' | 'mensual' | 'anual'>('diario');
  const [desde, setDesde] = useState(getFirstDayOfMonth());
  const [hasta, setHasta] = useState(getToday());

  // Precio: Estado activo y valor
  const [precio, setPrecio] = useState<number>(() => {
    const saved = localStorage.getItem("admin_ventas_precio");
    return saved ? parseFloat(saved) : 1;
  });
  const [editPrecio, setEditPrecio] = useState(false); // Toggle de edición

  const [courierId, setCourierId] = useState<string>("");

  // Estados de data
  const [dashboardData, setDashboardData] = useState<VentasDiariasResponse | null>(null);
  const [cobranzaData, setCobranzaData] = useState<CobranzaCouriersResponse | null>(null);

  // Lista de couriers del endpoint
  const [allCouriers, setAllCouriers] = useState<any[]>([]);

  // Loading / Error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [pdfLoadingId, setPdfLoadingId] = useState<number | null>(null);

  // Helper para cambio de vista
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

  // Cargar listas
  useEffect(() => {
    if (!token) return;
    getAdminAllCouriers(token)
      .then(res => setAllCouriers(res))
      .catch(err => console.error(err));
  }, [token]);

  // Cargar datos
  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      // Si el modo edición está activo, no recargamos necesariamente hasta que guarde
      // Pero el usuario dijo "dependiendo de eso cambiar pdf". 
      // Si hacemos click en icono, guardamos precio.

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
    } catch (err: any) {
      setError(err?.message || "Error al cargar datos de ventas.");
    } finally {
      setLoading(false);
    }
  };

  // Recargar al cambiar filtros básicos (o al montar)
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, vista, courierId, desde, hasta]);

  const handleFiltrar = () => {
    loadData();
  };

  // Toggle Edición Precio
  const togglePrecioEdit = () => {
    if (editPrecio) {
      // Guardar (recargar data con nuevo precio) y persistir
      localStorage.setItem("admin_ventas_precio", String(precio));
      loadData();
    }
    setEditPrecio(!editPrecio);
  };

  const handleDownloadPdf = async (cId: number) => {
    if (!token) return;
    try {
      setPdfLoadingId(cId);
      const filtros: AdminVentasFiltros = {
        desde,
        hasta,
        precio: precio > 0 ? precio : 1,
        courierId: cId ? Number(cId) : undefined,
      };
      await downloadPdfCobranza(token, cId, filtros);
    } catch (e: any) {
      alert(e?.message || "Error al descargar PDF");
    } finally {
      setPdfLoadingId(null);
    }
  };

  // Totales
  const totalPedidos = dashboardData?.totales.totalPedidos ?? 0;
  const totalCobrar = dashboardData?.totales.totalCobrar ?? 0;
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
      <div className="bg-white p-5 rounded-md shadow-default border-t border-gray-100 flex flex-col md:flex-row gap-4 items-end flex-wrap">

        {/* Selector de Vista */}
        <div className="flex bg-slate-50 p-1 rounded-lg">
          {(["diario", "mensual", "anual"] as const).map(v => (
            <button
              key={v}
              onClick={() => handleVistaChange(v)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${vista === v
                ? "bg-white text-gray-800 shadow-sm border border-gray-100"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {/* --- DIARIO --- */}
        {vista === 'diario' && (
          <>
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
          </>
        )}

        {/* --- MENSUAL --- */}
        {vista === 'mensual' && (
          <>
            <div className="w-full md:w-32">
              <Selectx
                label="Año"
                value={parseInt(desde.split("-")[0])}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  const m = parseInt(desde.split("-")[1]) - 1;
                  const f0 = new Date(y, m, 1);
                  const f1 = new Date(y, m + 1, 0);
                  setDesde(f0.toISOString().split('T')[0]);
                  setHasta(f1.toISOString().split('T')[0]);
                }}
                labelVariant="left"
              >
                {[2026, 2027, 2028, 2029, 2030].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Selectx>
            </div>
            <div className="w-full md:w-40">
              <Selectx
                label="Mes"
                value={parseInt(desde.split("-")[1]) - 1}
                onChange={(e) => {
                  const m = Number(e.target.value);
                  const y = parseInt(desde.split("-")[0]);
                  const f0 = new Date(y, m, 1);
                  const f1 = new Date(y, m + 1, 0);
                  setDesde(f0.toISOString().split('T')[0]);
                  setHasta(f1.toISOString().split('T')[0]);
                }}
                labelVariant="left"
              >
                {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((mes, i) => (
                  <option key={i} value={i}>{mes}</option>
                ))}
              </Selectx>
            </div>
          </>
        )}

        {/* --- ANUAL --- */}
        {vista === 'anual' && (
          <div className="w-full md:w-32">
            <Selectx
              label="Año"
              value={parseInt(desde.split("-")[0])}
              onChange={(e) => {
                const y = Number(e.target.value);
                const f0 = new Date(y, 0, 1);
                const f1 = new Date(y, 11, 31);
                setDesde(f0.toISOString().split('T')[0]);
                setHasta(f1.toISOString().split('T')[0]);
              }}
              labelVariant="left"
            >
              {[2026, 2027, 2028, 2029, 2030].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Selectx>
          </div>
        )}

        <div className="w-full md:w-56">
          <Selectx
            label="Courier"
            value={courierId}
            onChange={(e) => setCourierId(e.target.value)}
            labelVariant="left"
          >
            <option value="">Todos</option>
            {allCouriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre_comercial || c.nombre || "Courier"}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Pedidos Totales */}
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

        {/* Card 2: Precio por Pedido (Editable) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">Precio por Pedido</p>
              <div className="flex items-center gap-2 mt-1">
                {editPrecio ? (
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={precio}
                    onChange={e => setPrecio(parseFloat(e.target.value) || 0)}
                    className="text-2xl font-bold text-gray-900 w-24 border-b-2 border-blue-500 focus:outline-none bg-transparent"
                    autoFocus
                  />
                ) : (
                  <h3 className="text-3xl font-bold text-gray-900">
                    S/. {precio.toFixed(2)}
                  </h3>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {editPrecio ? "Presiona check para recalcular" : "Costo por entrega"}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
              <Icon icon="mdi:tag-outline" className="text-2xl" />
            </div>
          </div>
          {/* Botón de Edición flotante en esquina superior derecha (o al lado del titulo) */}
          <button
            onClick={togglePrecioEdit}
            className="absolute top-3 right-3 text-gray-400 hover:text-blue-600 p-1 transition-colors"
            title={editPrecio ? "Guardar y Recalcular" : "Editar Precio"}
          >
            <Icon icon={editPrecio ? "mdi:check-circle" : "mdi:pencil-outline"} className="text-xl" />
          </button>
        </div>

        {/* Card 3: Total a Cobrar (Backend calculated) */}
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
