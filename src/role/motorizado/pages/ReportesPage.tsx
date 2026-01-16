import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

import Tittlex from "@/shared/common/Tittlex";
import Buttonx from "@/shared/common/Buttonx";
import { SelectxDate } from "@/shared/common/Selectx";
import Paginator from "@/shared/components/Paginator";

import { useAuth } from "@/auth/context";
import { getHistorialRepartidor } from "@/services/repartidor/reportes/repartidor-reportes.api";
import type { RepartidorHistorialParams, RepartidorHistorialResponse } from "@/services/repartidor/reportes/repartidor-reportes.types";


/* Helpers fechas */
function getToday() {
  // Usar en-CA para obtener YYYY-MM-DD en hora local, no UTC
  return new Date().toLocaleDateString('en-CA');
}

export default function ReportesPage() {
  const { user, token } = useAuth();

  // --- Filtros ---
  const [desde, setDesde] = useState(getToday());
  const [hasta, setHasta] = useState(getToday());

  // --- Paginación ---
  const [, setPage] = useState(1);
  const [limit,] = useState(6);

  // --- Data ---
  const [data, setData] = useState<RepartidorHistorialResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Estado para el total global calculado
  const [totalGananciaGlobal, setTotalGananciaGlobal] = useState(0);
  const [loadingStats, setLoadingStats] = useState(false);

  // Función para cargar los datos paginados
  const loadData = async (newPage = 1) => {
    if (!token) return;

    // Extraer IDs del perfil del trabajador (motorizado) si existen
    const motorizadoId = user?.perfil_trabajador?.id ?? 5; 
    const courierId = user?.perfil_trabajador?.courier_id ?? 1;

    setLoading(true);
    setError("");
    try {
      const params: RepartidorHistorialParams = {
        courierId: courierId,
        motorizadoId: motorizadoId,
        desde: desde || undefined,
        hasta: hasta || undefined,
        page: newPage,
        limit: limit
      };

      console.log("Llamando API getHistorialRepartidor con:", params);
      const res = await getHistorialRepartidor(params, token);
      console.log("Respuesta API:", res);
      setData(res);
      setPage(newPage);
    } catch (err: any) {
      console.error("Error cargando historial", err);
      setError(err?.message || "Error al cargar historial.");
    } finally {
      setLoading(false);
    }
  };

  // Función separada para calcular el TOTAL global en el rango seleccionado
  // Se llama cuando cambian los filtros (desde/hasta)
  const loadGlobalStats = async () => {
    if (!token) return;
    const motorizadoId = user?.perfil_trabajador?.id ?? 5;
    const courierId = user?.perfil_trabajador?.courier_id ?? 1;

    setLoadingStats(true);
    try {
      // Pedimos un limit alto para traer TODO lo del rango y sumar
      // OJO: Esto es un workaround porque la API no devuelve la suma total.
      const params: RepartidorHistorialParams = {
        courierId,
        motorizadoId,
        desde: desde || undefined,
        hasta: hasta || undefined,
        page: 1,
        limit: 10000 // Traer "todos" (o un número suficientemente grande)
      };

      const res = await getHistorialRepartidor(params, token);

      // Calcular suma total
      const total = res.items.reduce((acc, item) => {
        const val = parseFloat(item.ganancia || "0");
        return acc + (isNaN(val) ? 0 : val);
      }, 0);

      setTotalGananciaGlobal(total);

    } catch (err) {
      console.error("Error calculando estadisticas globales", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadData(1);
    loadGlobalStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  const handleFiltrar = () => {
    loadData(1);
    loadGlobalStats();
  };

  const handlePageChange = (p: number) => {
    loadData(p);
  };

  const items = data?.items ?? [];
  const paginacion = data?.paginacion;

  return (
    <section className="mt-4 md:mt-8 w-full min-w-0 px-3 sm:px-4 lg:px-0 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Tittlex
          title="Mis Reportes"
          description="Consulta tu historial de entregas y pagos."
        />
      </div>

      {/* FILTROS Y KPI */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* KPI: Recaudación / Pago del periodo (GLOBAL) */}
        <div className="lg:w-1/3 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 mb-3 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Icon icon="mdi:cash-multiple" className="text-2xl" />
          </div>
          <p className="text-gray-500 text-sm font-medium">
            {desde === getToday() && hasta === getToday() ? "Ganancia de Hoy" : "Ganancia Total (Rango)"}
          </p>
          <h3 className="text-3xl font-bold text-gray-900 mt-1">
            {loadingStats ? (
              <span className="text-gray-300 text-2xl animate-pulse">...</span>
            ) : (
              `S/. ${totalGananciaGlobal.toFixed(2)}`
            )}
          </h3>
          <span className="text-xs text-gray-400 mt-2">
            {loadingStats ? "Calculando..." : (paginacion?.total ? `Hiciste ${paginacion.total} entregas` : 'Sin registros')}
          </span>
        </div>

        {/* Filtros */}
        <div className="lg:w-2/3 bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full">
            <SelectxDate
              label="Desde"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              labelVariant="left"
            />
          </div>
          <div className="w-full">
            <SelectxDate
              label="Hasta"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              labelVariant="left"
            />
          </div>
          <Buttonx
            label={loading ? "..." : "Filtrar"}
            onClick={handleFiltrar}
            disabled={loading}
            icon="mdi:filter-outline"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded border border-red-200 text-sm">
          {error}
        </div>
      )}

      {/* RESULTADOS: RESPONSIVE TABLE/CARDS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-base font-semibold text-gray-800">Historial de Entregas</h3>
        </div>

        <div className="flex-1">
          {items.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              {loading ? "Cargando..." : "No hay movimientos registrados en este rango."}
            </div>
          ) : (
            <>
              {/* VISTA DESKTOP (TABLA) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-[#E5E7EB] text-gray-600 font-medium border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3">Fecha</th>
                      <th className="px-6 py-3">Código</th>
                      <th className="px-6 py-3">Cliente</th>
                      <th className="px-6 py-3">Recaudado</th>
                      <th className="px-6 py-3">Ganancia</th>
                      <th className="px-6 py-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item) => (
                      <tr key={item.unique_key || item.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                          {new Date(item.fecha_hora).toLocaleDateString()} <span className="text-xs">{new Date(item.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {item.codigo}
                          {item.tipo_registro === 'REPROGRAMACION' && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                              Reprog
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{item.cliente}</div>
                          <div className="text-xs text-gray-400 max-w-[200px] truncate" title={item.direccion}>{item.direccion}</div>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          S/. {item.monto}
                        </td>
                        <td className="px-6 py-4 font-bold text-green-600">
                          S/. {item.ganancia || "0.00"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${item.estado === 'Entregado' ? 'bg-green-100 text-green-800' :
                              item.estado === 'Reprogramado' ? 'bg-yellow-100 text-yellow-800' :
                                item.estado === 'Anulado' || item.estado === 'Rechazado' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'}`}>
                            {item.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* VISTA MOBILE (CARDS) */}
              <div className="md:hidden divide-y divide-gray-100">
                {items.map((item) => (
                  <div key={item.unique_key || item.id} className="p-4 hover:bg-gray-50 transition flex flex-col gap-3">

                    {/* Fila superior: Codigo + Estado */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1">
                          {item.codigo}
                          {item.tipo_registro === 'REPROGRAMACION' && (
                            <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded border border-yellow-200">R</span>
                          )}
                        </h4>
                        <p className="text-[10px] text-gray-400">
                          {formatDate(item.fecha_hora)}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full
                            ${item.estado === 'Entregado' ? 'bg-green-100 text-green-700' :
                          item.estado === 'Reprogramado' ? 'bg-yellow-100 text-yellow-800' :
                            item.estado === 'Anulado' || item.estado === 'Rechazado' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-600'}`}>
                        {item.estado}
                      </span>
                    </div>

                    {/* Detalle Cliente */}
                    <div className="flex gap-3 items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-500">
                        <Icon icon="mdi:account" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{item.cliente}</p>
                        <p className="text-[10px] text-gray-400 line-clamp-1">{item.direccion}</p>
                      </div>
                    </div>

                    {/* Footer: Monto */}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-50 mt-1">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400">Recaudado</span>
                        <span className="text-sm font-bold text-gray-900">S/. {item.monto}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-400">Tu Ganancia</span>
                        <span className="text-sm font-bold text-green-600">S/. {item.ganancia || "0.00"}</span>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer Paginator */}
        {paginacion && paginacion.totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex justify-center bg-gray-50">
            <Paginator
              currentPage={paginacion.page}
              totalPages={paginacion.totalPages}
              onPageChange={handlePageChange}
              showArrows={true}
            />
          </div>
        )}

      </div>

    </section>
  );
}


function formatDate(isoStr: string) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  return d.toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
