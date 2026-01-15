import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

import Tittlex from "@/shared/common/Tittlex";
import Buttonx from "@/shared/common/Buttonx";
import { Selectx, SelectxDate } from "@/shared/common/Selectx";

import { useAuth } from "@/auth/context";

// API para Reportes
import {
  getAdminResumenCourier,
  getAdminBalanceFinanciero,
} from "@/services/admin/reportes/adminReportes.api";
import type {
  ResumenCourierResponse,
  BalanceFinancieroResponse,
  AdminReportesFiltros,
} from "@/services/admin/reportes/adminReportes.types";

// API para obtener lista de couriers (reusamos la de ventas)
import { getAdminCobranzaCouriers } from "@/services/admin/ventas/admin-ventas.api";

/* Helpers fechas */
function getFirstDayOfMonth() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1)
    .toISOString()
    .split("T")[0];
}
/* Helpers fechas */
function getToday() {
  return new Date().toLocaleDateString('en-CA');
}

export default function ReportesPage() {
  const { token } = useAuth();

  // --- Filtros ---
  const [desde, setDesde] = useState(getFirstDayOfMonth());
  const [hasta, setHasta] = useState(getToday());
  const [courierId, setCourierId] = useState<string>("");

  // --- Data ---
  const [resumenData, setResumenData] = useState<ResumenCourierResponse | null>(null);
  const [balanceData, setBalanceData] = useState<BalanceFinancieroResponse | null>(null);

  // Lista de couriers para el select
  const [allCouriers, setAllCouriers] = useState<any[]>([]);

  // --- UI States ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const filtros: AdminReportesFiltros = {
        desde: desde || undefined,
        hasta: hasta || undefined,
        courierId: courierId ? Number(courierId) : undefined,
      };

      // 1. Cargamos reportes
      const [resResumen, resBalance] = await Promise.all([
        getAdminResumenCourier(token, filtros),
        getAdminBalanceFinanciero(token, filtros),
      ]);

      setResumenData(resResumen);
      setBalanceData(resBalance);

      // 2. Si NO hay filtro de courier, cargamos la lista de couriers para llenar el select
      //    (Usamos la API de ventas solo para obtener el listado, pasando filtros vacíos o básicos)
      if (allCouriers.length === 0) {
        /* 
           Nota: Usamos getAdminCobranzaCouriers como "helper" para sacar la lista.
           Si filtro por precio no afecta la lista de couriers disponibles, enviamos precio=1 por defecto.
        */
        const cob = await getAdminCobranzaCouriers(token, { ...filtros, precio: 1 });
        if (cob.data) {
          setAllCouriers(cob.data);
        }
      }

    } catch (err: any) {
      setError(err?.message || "Error al cargar reportes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleFiltrar = () => {
    loadData();
  };

  // --- Extraction de valores para render ---
  const kpis = resumenData?.kpis;
  const balance = balanceData?.balance;

  return (
    <section className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <Tittlex
          title="Reportes Operativos y Financieros"
          description="Visualiza el rendimiento y balance de los couriers"
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

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded border border-red-200">
          {error}
        </div>
      )}

      {/* 1. SECCION RESUMEN OPERATIVO */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-6">
          <Icon icon="mdi:chart-box-outline" className="text-blue-600 text-xl" />
          <h3 className="text-lg font-semibold text-gray-800">Resumen Operativo</h3>
        </div>

        {!kpis ? (
          <div className="text-gray-400 text-sm">Sin datos para mostrar.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            {/* KPI Tasa Entrega */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col items-center justify-center text-center">
              <span className="text-blue-600 font-medium mb-1">Tasa de Entrega</span>
              <span className="text-3xl font-bold text-blue-800">{kpis.tasaEntrega}</span>
            </div>

            {/* Total Pedidos */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col items-center justify-center text-center">
              <div className="text-gray-500 text-sm font-medium">Total Pedidos</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{kpis.totalPedidos}</div>
            </div>

            {/* Entregados */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex flex-col items-center justify-center text-center">
              <div className="text-green-600 text-sm font-medium">Entregados</div>
              <div className="text-2xl font-bold text-green-700 mt-1">{kpis.entregados}</div>
            </div>

            {/* Anulados */}
            <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex flex-col items-center justify-center text-center">
              <div className="text-red-600 text-sm font-medium">Anulados</div>
              <div className="text-2xl font-bold text-red-700 mt-1">{kpis.anulados}</div>
            </div>

          </div>
        )}
      </div>

      {/* 2. SECCION BALANCE FINANCIERO */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-6 ">
          <Icon icon="mdi:cash-register" className="text-primary text-xl" />
          <h3 className="text-lg font-semibold text-gray-800">Balance Financiero</h3>
        </div>

        {!balance ? (
          <div className="text-gray-400 text-sm">Sin datos financieros.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col p-4 bg-gray-50 rounded-lg border border-gray-200 items-center justify-center text-center">
              <span className="text-gray-500 text-sm">Pedidos que generaron ingreso</span>
              <span className="text-2xl font-bold text-gray-900 mt-2">{balance.pedidosEntregados}</span>
            </div>

            <div className="flex flex-col p-4 bg-emerald-50 rounded-lg border border-emerald-100 md:col-span-2 items-center justify-center text-center">
              <span className="text-emerald-700 text-sm font-medium uppercase tracking-wide">Recaudación Total (Bruto)</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-bold text-emerald-800">S/. {balance.totalRecaudado}</span>
              </div>
              {/* Nota: si tuvieras "ingresosNetos" o comisiones, podrías agregarlos aquí */}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
