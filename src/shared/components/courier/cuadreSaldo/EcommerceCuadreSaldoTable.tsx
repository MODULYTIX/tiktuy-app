import React, { useEffect, useMemo, useState } from "react";
import {
  listEcommercesCourier,
  getEcommerceResumen,
  getEcommercePedidosDia,
  abonarEcommerceFechas,
} from "@/services/courier/cuadre_saldo/cuadreSaldoE.api";
import type {
  EcommerceItem,
  ResumenDia,
  PedidoDiaItem,
  AbonoEstado,
} from "@/services/courier/cuadre_saldo/cuadreSaldoE.types";

import ConfirmAbonoModal from "./ConfirmAbonoModal";
import EcommerceDetalleModal from "./EcommerceDetalleModal";

import { Selectx, SelectxDate } from "@/shared/common/Selectx";
import Buttonx from "@/shared/common/Buttonx";

const formatPEN = (v: number) =>
  `S/. ${Number(v || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const pad2 = (n: number) => String(n).padStart(2, "0");
const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const toDMY = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/** Normalizadores */
const montoDe = (i: any) => Number(i?.monto ?? i?.monto_recaudar ?? 0);
const servicioDe = (i: any) => {
  const sc = Number(
    i?.servicioCourier ?? i?.servicio_courier ?? i?.servicioCourierEfectivo ?? 0
  );
  const sr = Number(
    i?.servicioRepartidor ?? i?.servicio_repartidor ?? i?.servicioRepartidorEfectivo ?? 0
  );
  if (sc || sr) return sc + sr;
  if (i?.servicioTotal != null) return Number(i.servicioTotal);
  if (i?.servicio_total != null) return Number(i.servicio_total);
  return 0;
};

type Props = { token: string };
type ResumenRow = ResumenDia & { estado?: AbonoEstado };

const EcommerceCuadreSaldoTable: React.FC<Props> = ({ token }) => {
  const [ecommerces, setEcommerces] = useState<EcommerceItem[]>([]);
  const [ecoId, setEcoId] = useState<number | "">("");
  const [desde, setDesde] = useState<string>(todayLocal()); // ⬅️ hoy
  const [hasta, setHasta] = useState<string>(todayLocal()); // ⬅️ hoy

  const [rows, setRows] = useState<ResumenRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedFechas, setSelectedFechas] = useState<string[]>([]);

  const [openDetalle, setOpenDetalle] = useState(false);
  const [detalleFecha, setDetalleFecha] = useState<string>("");
  const [detalleItems, setDetalleItems] = useState<PedidoDiaItem[]>([]);
  const [detalleLoading, setDetalleLoading] = useState(false);

  const [openConfirm, setOpenConfirm] = useState(false);
  const [confirmFechas, setConfirmFechas] = useState<string[]>([]);
  const [confirmCobrado, setConfirmCobrado] = useState(0);
  const [confirmServicio, setConfirmServicio] = useState(0);
  const [confirmCount, setConfirmCount] = useState(0);

  const ecommerce = useMemo(
    () =>
      ecommerces.find((e) => e.id === (typeof ecoId === "number" ? ecoId : -1)),
    [ecoId, ecommerces]
  );

  useEffect(() => {
    (async () => {
      try {
        const list = await listEcommercesCourier(token);
        setEcommerces(list);
      } catch (e: any) {
        setError(e?.message ?? "No se pudo cargar ecommerces");
      }
    })();
  }, [token]);

  const loadResumen = async () => {
    if (!ecoId || typeof ecoId !== "number") {
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getEcommerceResumen(token, {
        ecommerceId: ecoId,
        desde,
        hasta,
      });
      const baseRows: ResumenRow[] = (data ?? []) as ResumenRow[];

      setRows(baseRows);
      setSelectedFechas([]);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar el resumen");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ecoId || typeof ecoId !== "number") return;
    if (!desde || !hasta) return;
    void loadResumen();
  }, [ecoId, desde, hasta]);

  const toggleFecha = (fecha: string) =>
    setSelectedFechas((prev) =>
      prev.includes(fecha) ? prev.filter((f) => f !== fecha) : [...prev, fecha]
    );

  const toggleAllFechas = () => {
    if (selectedFechas.length === rows.length) setSelectedFechas([]);
    else setSelectedFechas(rows.map((r) => r.fecha));
  };

  const openDia = async (fecha: string) => {
    if (!ecoId || typeof ecoId !== "number") return;
    setDetalleFecha(fecha);
    setOpenDetalle(true);
    setDetalleLoading(true);
    try {
      const arr = await getEcommercePedidosDia(token, ecoId, fecha);
      const list = Array.isArray(arr) ? arr : (arr as any)?.items ?? [];
      setDetalleItems(list as any[]);
    } catch (e: any) {
      alert(e?.message ?? "No se pudo cargar el detalle");
      setOpenDetalle(false);
    } finally {
      setDetalleLoading(false);
    }
  };

  const prepararAbonoMultiFecha = async () => {
    if (!ecoId || typeof ecoId !== "number" || selectedFechas.length === 0) return;
    try {
      setLoading(true);
      const porFecha = await Promise.all(
        selectedFechas.map(async (f) => {
          const r = await getEcommercePedidosDia(token, ecoId, f);
          return (Array.isArray(r) ? r : (r as any)?.items ?? []) as any[];
        })
      );
      const todos = porFecha.flat();

      setConfirmFechas(selectedFechas.slice().sort());
      setConfirmCobrado(todos.reduce((acc, i) => acc + montoDe(i), 0));
      setConfirmServicio(todos.reduce((acc, i) => acc + servicioDe(i), 0));
      setConfirmCount(todos.length);
      setOpenConfirm(true);
    } catch (e: any) {
      alert(e?.message ?? "No se pudo preparar el abono");
    } finally {
      setLoading(false);
    }
  };

  const totalDetalleServicio = useMemo(
    () => detalleItems.reduce((acc, i) => acc + servicioDe(i), 0),
    [detalleItems]
  );

  const abrirConfirmDetalle = () => {
    const todos = detalleItems;
    setConfirmFechas([detalleFecha]);
    setConfirmCobrado(todos.reduce((acc, i) => acc + montoDe(i), 0));
    setConfirmServicio(todos.reduce((acc, i) => acc + servicioDe(i), 0));
    setConfirmCount(todos.length);
    setOpenConfirm(true);
  };

  const confirmarAbono = async (voucherFile: File | null) => {
    try {
      if (!ecoId || typeof ecoId !== "number" || isNaN(ecoId)) {
        alert("Selecciona un ecommerce válido antes de confirmar el abono.");
        return;
      }
      if (!confirmFechas.length) {
        alert("Debes seleccionar al menos una fecha para abonar.");
        return;
      }
      if (!voucherFile) {
        alert("Debes subir una imagen del voucher antes de confirmar.");
        return;
      }

      setLoading(true);

      const formData = new FormData();
      formData.append("ecommerceId", String(ecoId));
      confirmFechas.forEach((f) => formData.append("fechas[]", f));
      formData.append("estado", "Por Validar");
      formData.append("voucher", voucherFile, voucherFile.name);

      const resp = await abonarEcommerceFechas(token, formData, true);

      const fechasMarcadas = (resp?.fechas ?? confirmFechas).map((f) =>
        f.slice(0, 10)
      );

      setRows((prev) =>
        prev.map((r) =>
          fechasMarcadas.includes(r.fecha)
            ? { ...r, estado: "Por Validar" as AbonoEstado }
            : r
        )
      );

      setOpenConfirm(false);
      setConfirmFechas([]);
      setConfirmCobrado(0);
      setConfirmServicio(0);
      setConfirmCount(0);

      alert("✅ Abono enviado correctamente con voucher.");
      await loadResumen(); // 🔄 recarga tabla actualizada
    } catch (e: any) {
      console.error("Error al confirmar abono:", e);
      alert(e?.message ?? "No se pudo procesar el abono.");
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    const hoy = todayLocal();
    setEcoId("");
    setDesde(hoy);
    setHasta(hoy);
    setRows([]);
    setSelectedFechas([]);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Barra superior */}
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div className="text-lg font-semibold">Ecommerce</div>
        <button
          onClick={prepararAbonoMultiFecha}
          disabled={selectedFechas.length === 0 || loading}
          className={[
            "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium",
            selectedFechas.length === 0 || loading
              ? "bg-blue-200 text-white cursor-not-allowed"
              : "bg-blue-600 text-white hover:opacity-90",
          ].join(" ")}
          title="Abonar Ecommerce (fechas seleccionadas)"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 8v8M8 12h8" />
          </svg>
          Abonar Ecommerce
        </button>
      </div>

      {/* Filtros (modelo unificado + auto-búsqueda) */}
      <div className="bg-white p-5 rounded shadow-default border-b-4 border-gray90 flex items-end gap-4">
        <Selectx
          id="f-ecommerce"
          label="Ecommerce"
          value={ecoId === "" ? "" : String(ecoId)}
          onChange={(e) =>
            setEcoId(e.target.value === "" ? "" : Number(e.target.value))
          }
          placeholder="Seleccionar ecommerce"
          className="w-full"
        >
          <option value="">— Seleccionar ecommerce —</option>
          {ecommerces.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </Selectx>

        <SelectxDate
          id="f-fecha-inicio"
          label="Fecha Inicio"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
          placeholder="dd/mm/aaaa"
          className="w-full"
        />

        <SelectxDate
          id="f-fecha-fin"
          label="Fecha Fin"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
          placeholder="dd/mm/aaaa"
          className="w-full"
        />

        <Buttonx
          label="Limpiar Filtros"
          icon="mynaui:delete"
          variant="outlined"
          onClick={limpiarFiltros}
          disabled={false}
        />
      </div>

      {error && <div className="px-4 pb-2 text-sm text-red-600">{error}</div>}

      {/* Tabla resumen */}
      <div className="relative border-gray70">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 text-sm">
            Cargando...
          </div>
        )}

        <table className="w-full text-sm table-auto bg-white shadow-md rounded-md overflow-hidden">
          <thead className="bg-[#E5E7EB] text-gray-600">
            <tr className="text-left">
              <th className="p-4">
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selectedFechas.length === rows.length}
                  onChange={toggleAllFechas}
                  aria-label="Seleccionar todo"
                  className="h-4 w-4 accent-blue-600"
                />
              </th>
              <th className="p-4 font-semibold">Fec. Entrega</th>
              <th className="p-4 font-semibold">Cobrado</th>
              <th className="p-4 font-semibold">Servicio total</th>
              <th className="p-4 font-semibold">Neto</th>
              <th className="p-4 font-semibold">Estado</th>
              <th className="p-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  Sin resultados para el filtro seleccionado.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const checked = selectedFechas.includes(r.fecha);
                const estado = r.estado ?? "Por Validar";
                const pillCls =
                  estado === "Validado"
                    ? "bg-gray-900 text-white"
                    : estado === "Sin Validar"
                      ? "bg-gray-100 text-gray-800 border border-gray-200"
                      : "bg-blue-100 text-blue-900 border border-blue-200";
                return (
                  <tr key={r.fecha} className="hover:bg-gray-50">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleFecha(r.fecha)}
                        aria-label={`Seleccionar ${r.fecha}`}
                        className="h-4 w-4 accent-blue-600"
                      />
                    </td>
                    <td className="p-4">{toDMY(r.fecha)}</td>
                    <td className="p-4">{formatPEN(r.cobrado)}</td>
                    <td className="p-4">{formatPEN(r.servicio)}</td>
                    <td className="p-4">{formatPEN(r.neto)}</td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold inline-block ${pillCls}`}
                      >
                        {estado}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => openDia(r.fecha)}
                          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                          title="Ver pedidos del día"
                        >
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          Ver
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* modales */}
      <EcommerceDetalleModal
        open={openDetalle}
        fecha={detalleFecha}
        ecommerceNombre={ecommerce?.nombre ?? ""}
        items={detalleItems}
        loading={detalleLoading}
        onClose={() => setOpenDetalle(false)}
        onAbonarDia={abrirConfirmDetalle}
        totalServicio={totalDetalleServicio}
      />

      <ConfirmAbonoModal
        open={openConfirm}
        ecommerceNombre={ecommerce?.nombre ?? ""}
        ciudad={ecommerce?.ciudad}
        fechas={confirmFechas}
        pedidosCount={confirmCount}
        cobradoTotal={confirmCobrado}
        servicioTotal={confirmServicio}
        onCancel={() => setOpenConfirm(false)}
        onConfirm={confirmarAbono}
      />
    </div>
  );
};

export default EcommerceCuadreSaldoTable;
