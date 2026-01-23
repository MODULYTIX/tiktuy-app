import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

import Tittlex from "@/shared/common/Tittlex";
import Buttonx from "@/shared/common/Buttonx";
import TableActionx from "@/shared/common/TableActionx";
import { Selectx } from "@/shared/common/Selectx";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import CuadreSaldoValidate from "@/shared/components/admin/cuadre-saldo/Cuadre-SaldoModalValidate";

import { useAuth } from "@/auth/context";

import {
  getAdminVentasDashboard,
  getAdminCobranzaCouriers,
  downloadPdfCobranza,
  getAdminAllCouriers,
  validateCobranza,
} from "@/services/admin/ventas/admin-cuadreSaldo.api";

import type {
  VentasDiariasResponse,
  CobranzaCouriersResponse,
  AdminVentasFiltros,
} from "@/services/admin/ventas/admin-cuadreSaldo.types";

/* Helper para fecha por defecto (primer día del mes actual) */
function getFirstDayOfMonth() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1)
    .toISOString()
    .split("T")[0];
}
/* Helper para último día del mes actual */
function getLastDayOfMonth() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
}

export default function CuadreSaldoPage() {
  const { token } = useAuth();

  // Siempre mensual
  const [desde, setDesde] = useState(getFirstDayOfMonth());
  const [hasta, setHasta] = useState(getLastDayOfMonth());

  // Precio: Estado activo y valor
  const [precio, setPrecio] = useState<number>(() => {
    const saved = localStorage.getItem("admin_ventas_precio");
    return saved ? parseFloat(saved) : 1;
  });
  const [editPrecio, setEditPrecio] = useState(false);

  const [courierId, setCourierId] = useState<string>("");

  // Estados de data
  const [dashboardData, setDashboardData] =
    useState<VentasDiariasResponse | null>(null);
  const [cobranzaData, setCobranzaData] =
    useState<CobranzaCouriersResponse | null>(null);

  // Lista de couriers del endpoint
  const [allCouriers, setAllCouriers] = useState<any[]>([]);

  // Loading / Error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [pdfLoadingId, setPdfLoadingId] = useState<number | null>(null);

  // Modal State
  const [modalVal, setModalVal] = useState<{
    open: boolean;
    id?: number;
    nombre?: string;
    monto?: number;
  }>({ open: false });

  // ====== Estilo modelo (mismo que reportes) ======
  const WRAP_MODEL =
    "bg-white p-4 sm:p-5 rounded shadow-default border-b-4 border-gray90 min-w-0 flex flex-row items-end gap-3";
  const CARD_MODEL =
    "bg-white p-4 sm:p-5 rounded shadow-default border-b-4 border-gray90 border-0 min-w-0";
  const TABLE_MODEL =
    "bg-white rounded shadow-default border-b-4 border-gray90 border-0 overflow-hidden min-w-0";

  // Cargar listas
  useEffect(() => {
    if (!token) return;
    getAdminAllCouriers(token)
      .then((res) => setAllCouriers(res))
      .catch((err) => console.error(err));
  }, [token]);

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
  }, [token, courierId, desde, hasta]);

  const handleFiltrar = () => {
    loadData();
  };

  // Toggle Edición Precio
  const togglePrecioEdit = () => {
    if (editPrecio) {
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

  // Abrir modal de validacion
  const openValidateModal = (
    id: number,
    nombre: string,
    monto: number
  ) => {
    setModalVal({ open: true, id, nombre, monto });
  };

  // Confirmar validación (llamado desde el modal)
  const onConfirmValidate = async () => {
    if (!token || !modalVal.id) return;
    try {
      await validateCobranza(token, {
        courierId: modalVal.id,
        desde,
        hasta,
        precio: precio > 0 ? precio : 1,
      });
      // Recargar datos
      loadData();
    } catch (e: any) {
      alert(e?.message || "Error al validar cobranza");
    }
  };

  // Totales
  const totalPedidos = courierId ? (dashboardData?.totales.totalPedidos ?? 0) : 0;
  const totalCobrar = courierId ? (dashboardData?.totales.totalCobrar ?? 0) : 0;
  const couriersList = cobranzaData?.data ?? [];

  return (
    <section className="mt-6 flex flex-col gap-6 min-w-0">
      {/* Header */}
      <div>
        <Tittlex
          title="Cuadre de saldos"
          description="Resumen mensual de pedidos por Courier"
        />
      </div>

      {/* ================= FILTROS Mensuales ================= */}
      <div className={WRAP_MODEL}>
        <div className="flex flex-row sm:flex-row sm:flex-wrap gap-3 items-end min-w-0">



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
        </div>

        <div className="w-full sm:w-auto sm:min-w-[220px] sm:max-w-[300px] min-w-0">
          <Selectx
            label="Courier"
            value={courierId}
            onChange={(e) => setCourierId(e.target.value)}
            className="w-full"
          >
            <option value="">Todos</option>
            {allCouriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre_comercial || c.nombre || "Courier"}
              </option>
            ))}
          </Selectx>
        </div>

        <div className="w-full sm:w-auto shrink-0 ">
          <Buttonx
            label={loading ? "Cargando..." : "Filtrar"}
            onClick={handleFiltrar}
            disabled={loading}
            icon="mdi:filter"
            variant="secondary"
            className="w-full sm:w-auto"
          />
        </div>
      </div>
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded border border-red-200 text-sm">
          {error}
        </div>
      )}

      {/* ================= KPI CARDS ================= */}
      {loading && !dashboardData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0">
          {[1, 2, 3].map((k) => (
            <div key={k} className={CARD_MODEL}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-24 mt-3" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0">
          {/* Card 1: Pedidos Totales */}
          <div className={CARD_MODEL}>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-gray60 font-medium">
                  Pedidos Totales
                </p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">
                  {totalPedidos}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Icon icon="mdi:shopping-outline" className="text-2xl" />
              </div>
            </div>
          </div>

          {/* Card 2: Precio por Pedido (Editable) */}
          <div className={CARD_MODEL}>
            <div className="flex items-start justify-between gap-4">
              {/* Texto */}
              <div className="min-w-0">
                <p className="text-xs text-gray60 font-medium">
                  Precio por Pedido
                </p>

                <div className="flex items-center gap-2 mt-1">
                  {editPrecio ? (
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      value={precio}
                      onChange={(e) =>
                        setPrecio(parseFloat(e.target.value) || 0)
                      }
                      className="text-2xl font-bold text-gray-900 w-28 border-b-2 border-blue-500 focus:outline-none bg-transparent"
                      autoFocus
                    />
                  ) : (
                    <h3 className="text-3xl font-bold text-gray-900">
                      S/. {precio.toFixed(2)}
                    </h3>
                  )}
                </div>

                <p className="text-[11px] text-gray60 mt-1">
                  {editPrecio
                    ? "Presiona check para recalcular"
                    : "Costo por entrega"}
                </p>
              </div>

              {/* Acciones + Icono (derecha) */}
              <div className="flex items-center gap-2 shrink-0 flex-row">
                {/* Botón Editar/Guardar (reubicado) */}
                <button
                  onClick={togglePrecioEdit}
                  type="button"
                  className={[
                    "w-11 h-11 rounded-full border border-gray20 flex items-center justify-center transition-colors",
                    editPrecio
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-gray10 text-gray70 hover:bg-gray20",
                  ].join(" ")}
                  title={editPrecio ? "Guardar y Recalcular" : "Editar Precio"}
                >
                  <Icon
                    icon={editPrecio ? "mdi:check" : "mdi:pencil-outline"}
                    className="text-xl"
                  />
                </button>

                {/* Icono morado */}
                <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                  <Icon icon="mdi:tag-outline" className="text-2xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Total a Cobrar */}
          <div className={CARD_MODEL}>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-gray60 font-medium">
                  Total a Cobrar
                </p>
                <h3 className="text-3xl font-bold text-emerald-600 mt-1">
                  S/. {totalCobrar.toFixed(2)}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <Icon icon="mdi:cash-multiple" className="text-2xl" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TABLA POR COURIER ================= */}
      <div className={TABLE_MODEL}>
        <div className="px-4 sm:px-5 py-4 border-b border-gray20">
          <h3 className="text-sm font-semibold text-gray-900">
            Cobranza por Courier
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray10 text-gray70 font-medium border-b border-gray20">
              <tr>
                <th className="px-4 sm:px-5 py-3">Courier</th>
                <th className="px-4 sm:px-5 py-3">RUC</th>
                <th className="px-4 sm:px-5 py-3 text-center">Entregas</th>
                <th className="px-4 sm:px-5 py-3 text-right">Monto</th>
                <th className="px-4 sm:px-5 py-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray20">
              {!courierId ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 sm:px-5 py-10 text-center text-gray60"
                  >
                    Seleccione un courier para ver el detalle.
                  </td>
                </tr>
              ) : couriersList.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 sm:px-5 py-10 text-center text-gray60"
                  >
                    No se encontraron registros para este rango.
                  </td>
                </tr>
              ) : (
                couriersList.map((item) => {
                  const isValidado = ['Admin Validado', 'Validado'].includes(item.estado_cobranza);
                  return (
                    <tr
                      key={item.courier_id}
                      className="hover:bg-gray10 transition"
                    >
                      <td className="px-4 sm:px-5 py-4 text-gray-900 font-medium">
                        {item.courier_nombre}
                      </td>
                      <td className="px-4 sm:px-5 py-4 text-gray70">
                        {item.ruc || "—"}
                      </td>

                      <td className="px-4 sm:px-5 py-4 text-center">
                        <span className="bg-gray10 text-gray70 py-1 px-3 rounded-full text-xs font-semibold">
                          {item.pedidos_entregados}
                        </span>
                      </td>
                      <td className="px-4 sm:px-5 py-4 text-right text-gray-900 font-bold">
                        S/. {item.monto_a_pagar.toFixed(2)}
                      </td>
                      <td className="px-4 sm:px-5 py-4 flex justify-center gap-2 items-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Validar / Validado */}
                          {isValidado ? (
                            <TableActionx
                              variant="custom"
                              icon="mdi:lock-check-outline"
                              colorClassName="bg-red-100 text-red-700 ring-1 ring-red-300 hover:bg-red-200 hover:ring-red-400 focus-visible:ring-red-500 cursor-not-allowed"
                              title="Validado (Bloqueado)"
                              onClick={() => { }}
                              size="sm"
                              disabled
                            />
                          ) : (
                            <TableActionx
                              variant="custom"
                              icon="mdi:check-decagram-outline"
                              colorClassName="bg-green-100 text-green-700 ring-1 ring-green-300 hover:bg-green-200 hover:ring-green-400 focus-visible:ring-green-500"
                              title="Validar Cobranza"
                              onClick={() => openValidateModal(item.courier_id, item.courier_nombre, item.monto_a_pagar)}
                              size="sm"
                            />
                          )}

                          <TableActionx
                            variant="export"
                            title="Ver PDF"
                            icon="carbon:generate-pdf"
                            colorClassName="bg-primary text-white ring-1 ring-primary hover:bg-primary/80 hover:ring-primary focus-visible:ring-primary"
                            onClick={() => handleDownloadPdf(item.courier_id)}
                            disabled={pdfLoadingId === item.courier_id}
                            size="sm"
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <CuadreSaldoValidate
        open={modalVal.open}
        onClose={() => setModalVal({ ...modalVal, open: false })}
        onConfirm={onConfirmValidate}
        courierNombre={modalVal.nombre}
        monto={modalVal.monto}
      />
    </section>
  );
}
