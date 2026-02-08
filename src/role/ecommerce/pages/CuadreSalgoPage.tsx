import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

import CuadreAbonosTable from "@/shared/components/ecommerce/cuadresaldo/CuadreAbonosTable";
// import AbonoDetailView from "@/shared/components/ecommerce/cuadresaldo/AbonoDetailView"; // Replaced by CuadreSaldoTable logic
import CuadreSaldoTable from "@/shared/components/ecommerce/cuadresaldo/CuadreSaldoTable";
import CuadreAbonoValidar from "@/shared/components/ecommerce/cuadresaldo/CuadreAbonoValidar";
import VizualisarPedidos from "@/shared/components/ecommerce/cuadresaldo/VizualisarPedidos";
import ImagePreviewModalx from "@/shared/common/ImagePreviewModalx";

import {
  listCouriersMine,
  listAbonosMine,
  listPedidosPorAbono,
  validarAbonoMine,
  getResumenDiasPorAbono,
} from "@/services/ecommerce/cuadreSaldo/cuadreSaldoC.api";

import type {
  AbonoResumenItem,
  PedidoAbonoItem,
} from "@/services/ecommerce/cuadreSaldo/cuadreSaldoC.types";

import Tittlex from "@/shared/common/Tittlex";
import { Selectx, SelectxDate } from "@/shared/common/Selectx";
import Buttonx from "@/shared/common/Buttonx";

/* ================= Helpers ================= */
const pad2 = (n: number) => String(n).padStart(2, "0");
const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
const getToken = () => localStorage.getItem("token") ?? "";

type ViewMode = "list" | "detail";

/* ================= Page ================= */
const CuadreSaldoPage: React.FC = () => {
  const token = getToken();

  // Filtros
  const [couriers, setCouriers] = useState<{ id: number; nombre: string }[]>([]);
  const [courierId, setCourierId] = useState<number | "">("");
  const [estadoFilter, setEstadoFilter] = useState<"Todos" | "Por Validar" | "Validado">("Todos");
  const [desde, setDesde] = useState<string>(todayLocal());
  const [hasta, setHasta] = useState<string>(todayLocal());

  // Data
  const [loading, setLoading] = useState(false);
  const [abonos, setAbonos] = useState<AbonoResumenItem[]>([]);

  // View State
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedAbono, setSelectedAbono] = useState<AbonoResumenItem | null>(null);

  // Detail Data
  const [pedidosDetail, setPedidosDetail] = useState<PedidoAbonoItem[]>([]);
  const [rows, setRows] = useState<any[]>([]); // Data for CuadreSaldoTable in Detail view
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [abonoDetalle, setAbonoDetalle] = useState<{ fecha: string; monto: number }[] | null>(null);

  // Validation Modal
  const [openValidar, setOpenValidar] = useState(false);
  const [validating, setValidating] = useState(false);

  // Voucher Preview
  const [showVoucher, setShowVoucher] = useState(false);

  /* ====== cargar couriers ====== */
  useEffect(() => {
    if (!token) return;
    listCouriersMine(token)
      .then((data) => setCouriers(data))
      .catch((e) => console.error(e));
  }, [token]);

  /* ====== Utils ====== */
  const calculateDetalle = (dias: any[]) => {
    if (!dias || dias.length === 0) return null;

    const fmt = (s: string) => {
      const parts = s.split("-"); // yyyy-mm-dd
      if (parts.length < 3) return s;
      return `${parts[2]}-${parts[1]}`; // dd-mm
    };

    // Sorting by date desc (newest first)
    const sorted = [...dias].sort((a, b) => b.fecha.localeCompare(a.fecha));

    return sorted.map((d: any) => ({
      fecha: fmt(d.fecha),
      monto: d.totalNeto ?? d.neto ?? 0
    }));
  };

  /* ====== buscar abonos ====== */
  const buscar = async () => {
    if (!token || courierId === "") return;

    setLoading(true);
    try {
      const data = await listAbonosMine(token, {
        courierId: Number(courierId),
        estado: estadoFilter !== "Todos" ? getEstadoFilter(estadoFilter) : undefined,
        desde,
        hasta,
      });

      // Mapeo local si el backend no filtra exacto
      const filtered = data.filter((item) => {
        if (estadoFilter === "Todos") return true;
        return item.estado === estadoFilter;
      });

      setAbonos(filtered);
    } catch (e) {
      console.error(e);
      setAbonos([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper para convertir el string de UI al del API si difieren
  const getEstadoFilter = (e: string): any => e;

  // Auto-búsqueda al cambiar filtros
  useEffect(() => {
    if (!token) return;
    if (!courierId) return;
    buscar();
  }, [courierId, estadoFilter, desde, hasta, token]);

  /* ====== Handlers ====== */
  const handleViewAbono = async (abono: AbonoResumenItem) => {
    setSelectedAbono(abono);
    setViewMode("detail");
    setAbonoDetalle(null);

    // Cargar resumen por dia del abono
    setLoadingDetail(true);
    try {
      if (!token) return;

      // 1. Cargar Pedidos flat (para ver detalle luego)
      const dataPedidos = await listPedidosPorAbono(token, abono.id);
      setPedidosDetail(dataPedidos);

      // 2. Cargar Resumen dias (para la tabla visual)
      const dataResumen = await getResumenDiasPorAbono(token, abono.id);
      setRows(dataResumen);
      setAbonoDetalle(calculateDetalle(dataResumen));

    } catch (e) {
      console.error(e);
      setPedidosDetail([]);
      setRows([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedAbono(null);
    setPedidosDetail([]);
    setRows([]);
    // Opcional: refrescar lista al volver
    // buscar(); 
  };

  const handleLimpiarFiltros = () => {
    const hoy = todayLocal();
    setCourierId("");
    setDesde(hoy);
    setHasta(hoy);
    setEstadoFilter("Todos");
    setAbonos([]);
    setViewMode("list");
  };

  const handleOpenValidar = () => {
    setOpenValidar(true);
    // Si estamos en detalle y tenemos rows, calculamos el rango on-the-fly si no está set
    if (viewMode === "detail" && rows.length > 0 && !abonoDetalle) {
      setAbonoDetalle(calculateDetalle(rows));
    }
  };

  const handleValidateAbono = async (abono: AbonoResumenItem) => {
    setSelectedAbono(abono);
    setOpenValidar(true);
    setAbonoDetalle(null); // Limpiar previo

    // Si clicamos validar desde la lista, cargamos fechas en background para mostrar el rango
    try {
      if (!token) return;
      const dataResumen = await getResumenDiasPorAbono(token, abono.id);
      setAbonoDetalle(calculateDetalle(dataResumen));
    } catch (e) {
      console.error("Error cargando fechas para validar", e);
    }
  };

  const handleConfirmValidar = async () => {
    if (!selectedAbono || !token) return;

    setValidating(true);
    try {
      await validarAbonoMine(token, selectedAbono.id);

      // Éxito
      setOpenValidar(false);

      // Actualizar estado local del abono seleccionado
      const updatedAbono = { ...selectedAbono, estado: "Validado" };
      setSelectedAbono(updatedAbono);

      // Actualizar en la lista también
      setAbonos(prev => prev.map(a => a.id === selectedAbono.id ? { ...a, estado: "Validado" } : a));

    } catch (e) {
      console.error(e);
      alert("Error al validar el abono");
    } finally {
      setValidating(false);
    }
  };

  /* ====== Handlers Detail Table ====== */
  const [openVer, setOpenVer] = useState(false);
  const [verFecha, setVerFecha] = useState<string | undefined>();
  const [verRows, setVerRows] = useState<any[]>([]); // Pedidos filtered

  const handleViewPedidosDia = (date: string) => {
    setVerFecha(date);
    // Filter loaded orders by date
    // date form CuadreSaldoTable is YYYY-MM-DD
    // pedido.fechaEntrega from API is usually ISO string
    const filtered = pedidosDetail.filter(p => {
      if (!p.fechaEntrega) return false;
      return String(p.fechaEntrega).startsWith(date);
    });

    // Map to PedidoDiaItem structure expected by VizualisarPedidos
    const mapped = filtered.map(p => ({
      ...p,
      // Ensure compatibility if needed
      metodo_pago: p.metodoPago
    }));

    setVerRows(mapped);
    setOpenVer(true);
  };

  // Render
  return (
    <div className="mt-8 flex flex-col gap-5">
      {/* Header General */}
      {viewMode === "list" && (
        <div className="flex justify-between items-end">
          <Tittlex
            title="Cuadre de Saldo"
            description="Monitorea tus abonos y liquidaciones"
          />
        </div>
      )}

      {/* Header Detail */}
      {viewMode === "detail" && selectedAbono && (
        <div className="flex justify-between items-start bg-white p-4 rounded shadow-default mb-4 border-l-4 border-blue-500">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button onClick={handleBackToList} className="text-gray-500 hover:text-blue-600">
                <Icon icon="mdi:arrow-left" className="text-2xl" />
              </button>
              <h2 className="text-lg font-bold text-gray-800">
                Abono {selectedAbono.codigo || `#${selectedAbono.id}`}
              </h2>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${selectedAbono.estado === 'Validado' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                {selectedAbono.estado}
              </span>
            </div>
            <p className="text-sm text-gray-500 ml-8">
              Fecha: {new Date(selectedAbono.fechaCreacion).toLocaleDateString()}
            </p>
          </div>

          <div className="flex gap-2">
            {/* Show Voucher Button */}
            {selectedAbono.evidenciaUrl && (
              <button
                onClick={() => setShowVoucher(true)}
                className="flex items-center gap-2 font-roboto text-sm h-10 w-auto px-3 py-2 justify-center rounded-md bg-blue-50 text-blue-600  hover:bg-blue-100 font-medium transition-colors"
              >
                <Icon icon="mdi:file-image-outline" className="text-lg" />
                Ver Voucher
              </button>
            )}

            {/* Validate Button */}
            {selectedAbono.estado === "Por Validar" && (
              <Buttonx
                label="Validar Abono"
                icon="mdi:check-bold"
                variant="secondary"
                onClick={handleOpenValidar}
              />
            )}
          </div>
        </div>
      )}

      {/* Filtros Container */}
      {viewMode === "list" && (
        <div className="bg-white p-5 rounded shadow-default border-b-4 border-gray90 flex items-end gap-4">
          <Selectx
            id="f-courier"
            label="Courier"
            value={courierId === "" ? "" : String(courierId)}
            onChange={(e) => {
              setCourierId(e.target.value === "" ? "" : Number(e.target.value));
            }}
            placeholder="Seleccionar courier"
            className="w-full"
          >
            <option value="">— Seleccionar —</option>
            {couriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Selectx>

          <Selectx
            id="f-estado"
            label="Estado"
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value as any)}
            className="w-full"
          >
            <option value="Todos">Todos</option>
            <option value="Por Validar">Por Validar</option>
            <option value="Validado">Validado</option>
            <option value="Sin Validar">Sin Validar</option>
          </Selectx>

          <SelectxDate
            id="f-fecha-inicio"
            label="Fecha Inicio"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="w-full"
          />

          <SelectxDate
            id="f-fecha-fin"
            label="Fecha Fin"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="w-full"
          />

          <Buttonx
            label="Limpiar Filtros"
            icon="mynaui:delete"
            variant="outlined"
            onClick={handleLimpiarFiltros}
            disabled={false}
          />
        </div>
      )}

      {/* Content */}
      <div className="mt-2">
        {viewMode === "list" ? (
          <CuadreAbonosTable
            abonos={abonos}
            loading={loading}
            onViewAbono={handleViewAbono}
            onValidateAbono={handleValidateAbono}
          />
        ) : (
          /* Reusing CuadreSaldoTable for Detail View */
          <CuadreSaldoTable
            rows={rows as any}
            loading={loadingDetail}
            selected={[]} // No selection/checkbox needed in this view per request
            onToggle={() => { }}
            onView={handleViewPedidosDia}
            totalAmount={selectedAbono?.totalNeto ?? selectedAbono?.montoNeto ?? selectedAbono?.montoTotal}
          />
        )}
      </div>

      {/* Modal Validation */}
      <CuadreAbonoValidar
        open={openValidar}
        onClose={() => setOpenValidar(false)}
        abono={selectedAbono}
        onConfirm={handleConfirmValidar}
        submitting={validating}
        courierName={couriers.find(c => c.id === Number(courierId))?.nombre}
        detalles={abonoDetalle}
      />

      {/* Modal Ver Pedidos (Reused) */}
      <VizualisarPedidos
        open={openVer}
        onClose={() => setOpenVer(false)}
        fecha={verFecha}
        rows={verRows as any}
        loading={false}
      />

      {/* Modal Preview Voucher */}
      <ImagePreviewModalx
        open={showVoucher}
        onClose={() => setShowVoucher(false)}
        url={selectedAbono?.evidenciaUrl || undefined}
        title="Voucher del Abono"
      />
    </div>
  );
};

export default CuadreSaldoPage;
