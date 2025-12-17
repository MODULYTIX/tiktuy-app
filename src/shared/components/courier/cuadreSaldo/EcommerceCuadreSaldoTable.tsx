// src/shared/components/courier/cuadreSaldo/EcommerceCuadreSaldoTable.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  listEcommercesCourier,
  getEcommerceResumen,
  getEcommercePedidosDia,
  abonarEcommerceFechas,
  listCourierSedesCuadre,
} from "@/services/courier/cuadre_saldo/cuadreSaldoE.api";
import type {
  EcommerceItem,
  ResumenDia,
  PedidoDiaItem,
  AbonoEstado,
  SedeCuadreItem,
} from "@/services/courier/cuadre_saldo/cuadreSaldoE.types";

import ConfirmAbonoModal from "./ConfirmAbonoModal";
import EcommerceDetalleModal from "./EcommerceDetalleModal";

import { Selectx, SelectxDate } from "@/shared/common/Selectx";
import Buttonx from "@/shared/common/Buttonx";
import Badgex from "@/shared/common/Badgex";

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
    i?.servicioRepartidor ??
      i?.servicio_repartidor ??
      i?.servicioRepartidorEfectivo ??
      0
  );
  if (sc || sr) return sc + sr;
  if (i?.servicioTotal != null) return Number(i.servicioTotal);
  if (i?.servicio_total != null) return Number(i.servicio_total);
  return 0;
};

type Props = { token: string };
type ResumenRow = ResumenDia & { estado?: AbonoEstado };

const EcommerceCuadreSaldoTable: React.FC<Props> = ({ token }) => {
  // ==== sedes ====
  const [sedes, setSedes] = useState<SedeCuadreItem[]>([]);
  const [sedeId, setSedeId] = useState<number | "">("");
  const [canFilterBySede, setCanFilterBySede] = useState(false);
  const [loadingSedes, setLoadingSedes] = useState(false);
  const [sedesError, setSedesError] = useState<string | null>(null);

  // ==== ecommerce / fechas ====
  const [ecommerces, setEcommerces] = useState<EcommerceItem[]>([]);
  const [ecoId, setEcoId] = useState<number | "">("");
  const [desde, setDesde] = useState<string>(todayLocal());
  const [hasta, setHasta] = useState<string>(todayLocal());

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

  const sedeIdNumber = typeof sedeId === "number" ? sedeId : undefined;

  // ==== cargar sedes para cuadre de saldo ====
  useEffect(() => {
    const run = async () => {
      try {
        setLoadingSedes(true);
        const data = await listCourierSedesCuadre(token);

        setCanFilterBySede(Boolean(data.canFilterBySede));
        setSedes(data.sedes ?? []);

        if (!data.canFilterBySede && data.sedeActualId) {
          setSedeId(data.sedeActualId);
        } else {
          setSedeId("");
        }

        setSedesError(null);
      } catch (e: any) {
        setSedesError(e?.message ?? "No se pudieron cargar las sedes");
      } finally {
        setLoadingSedes(false);
      }
    };

    if (token) void run();
  }, [token]);

  // ==== cargar ecommerces ====
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
        sedeId: sedeIdNumber,
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

  // recarga resumen al cambiar ecommerce, fechas o sede
  useEffect(() => {
    if (!ecoId || typeof ecoId !== "number") return;
    if (!desde || !hasta) return;
    void loadResumen();
  }, [ecoId, desde, hasta, sedeIdNumber]);

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
      const arr = await getEcommercePedidosDia(
        token,
        ecoId,
        fecha,
        sedeIdNumber
      );
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
    if (!ecoId || typeof ecoId !== "number" || selectedFechas.length === 0)
      return;
    try {
      setLoading(true);
      const porFecha = await Promise.all(
        selectedFechas.map(async (f) => {
          const r = await getEcommercePedidosDia(token, ecoId, f, sedeIdNumber);
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
      if (sedeIdNumber != null) {
        formData.append("sedeId", String(sedeIdNumber));
      }
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
      await loadResumen();
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
    setSedeId((prev) =>
      !canFilterBySede && typeof prev === "number" ? prev : ""
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Barra superior */}
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Ecommerce</div>
        <Buttonx
          icon="iconoir:new-tab"
          label="Abonar Ecommerce"
          variant="secondary"
          onClick={prepararAbonoMultiFecha}
          disabled={selectedFechas.length === 0 || loading}
        />
      </div>

      {/* Filtros */}
      <div className="bg-white p-5 rounded shadow-default border-b-4 border-gray90 flex items-end gap-4">
        {/* Sede */}
        <Selectx
          id="f-sede"
          label="Sede"
          value={sedeId === "" ? "" : String(sedeId)}
          onChange={(e) =>
            setSedeId(e.target.value === "" ? "" : Number(e.target.value))
          }
          placeholder={
            loadingSedes
              ? "Cargando sedes..."
              : canFilterBySede
              ? "Todas las sedes"
              : "Sede actual"
          }
          className="w-full"
          disabled={loadingSedes || (!canFilterBySede && sedes.length <= 1)}
        >
          {canFilterBySede && <option value="">— Todas las sedes —</option>}
          {sedes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre_almacen}
              {s.ciudad ? ` (${s.ciudad})` : ""}{" "}
              {s.es_principal ? "· Principal" : ""}
            </option>
          ))}
        </Selectx>

        {/* Ecommerce */}
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

      {sedesError && (
        <div className="px-4 text-xs text-red-600">{sedesError}</div>
      )}
      {error && <div className="px-4 pb-2 text-sm text-red-600">{error}</div>}

      {/* Tabla resumen con estilos del modelo base */}
      <div className="mt-0 bg-white rounded-md overflow-hidden shadow-default border border-gray30 relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 text-sm">
            Cargando...
          </div>
        )}

        <section className="flex-1 overflow-auto">
          <div className="overflow-x-auto bg-white">
            <table className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30 rounded-t-md">
              <colgroup>
                <col className="w-[6%]" />
                <col className="w-[18%]" />
                <col className="w-[18%]" />
                <col className="w-[18%]" />
                <col className="w-[18%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
              </colgroup>

              <thead className="bg-[#E5E7EB]">
                <tr className="text-gray70 font-roboto font-medium">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        rows.length > 0 && selectedFechas.length === rows.length
                      }
                      onChange={toggleAllFechas}
                      aria-label="Seleccionar todo"
                      className="h-4 w-4 accent-blue-600"
                    />
                  </th>
                  <th className="px-4 py-3 text-left">Fec. Entrega</th>
                  <th className="px-4 py-3 text-left">Cobrado</th>
                  <th className="px-4 py-3 text-left">Servicio total</th>
                  <th className="px-4 py-3 text-left">Neto</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray20">
                {rows.length === 0 ? (
                  <tr className="hover:bg-transparent">
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray70 italic"
                    >
                      Sin resultados para el filtro seleccionado.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const checked = selectedFechas.includes(r.fecha);
                    const estado = r.estado ?? "Por Validar";

                    const pillCls =
                      estado === "Validado"
                        ? "bg-gray90 text-white"
                        : estado === "Sin Validar"
                        ? "bg-gray30 text-gray80"
                        : "bg-blue-100 text-blue-900";

                    return (
                      <tr
                        key={r.fecha}
                        className="hover:bg-gray10 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleFecha(r.fecha)}
                            aria-label={`Seleccionar ${r.fecha}`}
                            className="h-4 w-4 accent-blue-600"
                          />
                        </td>
                        <td className="px-4 py-3 text-gray70">
                          {toDMY(r.fecha)}
                        </td>
                        <td className="px-4 py-3 text-gray70">
                          {formatPEN(r.cobrado)}
                        </td>
                        <td className="px-4 py-3 text-gray70">
                          {formatPEN(r.servicio)}
                        </td>
                        <td className="px-4 py-3 text-gray70">
                          {formatPEN(r.neto)}
                        </td>
                        <td className="px-4 py-3">
                          <Badgex className={pillCls}>{estado}</Badgex>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => openDia(r.fecha)}
                              className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-[12px] hover:bg-gray10"
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
        </section>
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
