// src/shared/components/courier/cuadreSaldo/EcommerceCuadreSaldoTable.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  listEcommercesCourier,
  getEcommerceResumen,
  getEcommercePedidosDia,
  abonarEcommerceFechas, // usamos el endpoint POR FECHAS para marcar estado -> "Por Validar"
} from "@/services/courier/cuadre_saldo/cuadreSaldoE.api";
import type {
  EcommerceItem,
  ResumenDia,
  PedidoDiaItem,
  AbonoEstado,
} from "@/services/courier/cuadre_saldo/cuadreSaldoE.types";

/* ============== helpers ============== */
const formatPEN = (v: number) =>
  `S/. ${Number(v || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const pad2 = (n: number) => String(n).padStart(2, "0");
const toYMD = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const toDMY = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

function defaultMonthRange() {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { desde: toYMD(first), hasta: toYMD(last) };
}

/** —— Normalizadores robustos (según cómo venga tu API) —— */
const montoDe = (i: any) => Number(i?.monto ?? i?.monto_recaudar ?? 0);

const servicioDe = (i: any) => {
  // Preferir courier + motorizado si existen
  const sc = Number(i?.servicioCourier ?? i?.servicio_courier ?? i?.servicioCourierEfectivo ?? 0);
  const sr = Number(i?.servicioRepartidor ?? i?.servicio_repartidor ?? i?.servicioRepartidorEfectivo ?? 0);
  if (sc || sr) return sc + sr;
  // campos alternativos
  if (i?.servicioTotal != null) return Number(i.servicioTotal);
  if (i?.servicio_total != null) return Number(i.servicio_total);
  return 0;
};

/* ============== Modal Confirmar Abono (muestra cobrado, servicio y neto) ============== */
type ConfirmAbonoModalProps = {
  open: boolean;
  ecommerceNombre: string;
  ciudad?: string | null;
  fechas?: string[];
  pedidosCount: number;
  cobradoTotal: number;
  servicioTotal: number;
  onCancel: () => void;
  onConfirm: () => void;
};

const ConfirmAbonoModal: React.FC<ConfirmAbonoModalProps> = ({
  open,
  ecommerceNombre,
  ciudad,
  fechas = [],
  pedidosCount,
  cobradoTotal,
  servicioTotal,
  onCancel,
  onConfirm,
}) => {
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    if (open) setChecked(false);
  }, [open]);
  if (!open) return null;

  const neto = Math.max(0, Number(cobradoTotal) - Number(servicioTotal));

  const fechasLabel = (() => {
    if (!fechas.length) return "—";
    const list = fechas
      .slice()
      .sort()
      .map((f) => toDMY(f));
    return list.length <= 3 ? list.join(", ") : `${list.slice(0, 3).join(", ")} (+${list.length - 3} más)`;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        {/* header */}
        <div className="flex flex-col items-center gap-2 px-6 pt-7">
          <div className="rounded-full bg-emerald-50 p-4">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
              <path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3z" fill="#22c55e" opacity="0.12" />
              <path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3z" stroke="#22c55e" strokeWidth="1.6" />
              <path d="M8.3 12.7l2.3 2.3 5-5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="text-center text-2xl font-semibold tracking-wide">CONFIRMAR ABONO</h3>
          <p className="mb-2 -mt-1 text-center text-[13px] text-gray-600">
            Valida el abono al ecommerce y registra el ingreso en el sistema
          </p>
        </div>

        {/* resumen */}
        <div className="mx-6 mt-2 rounded-xl border">
          <div className="border-b px-5 py-3 text-sm font-semibold text-gray-700">Resumen</div>
          <div className="grid grid-cols-2 items-center gap-2 px-5 py-4 text-sm">
            <div className="text-gray-600">Ecommerce</div>
            <div className="text-right font-medium">{ecommerceNombre}</div>

            <div className="text-gray-600">{fechas.length <= 1 ? "Fecha" : "Fechas"}</div>
            <div className="text-right">{fechasLabel}</div>

            {ciudad && (
              <>
                <div className="text-gray-600">Ciudad</div>
                <div className="text-right">{ciudad}</div>
              </>
            )}

            <div className="text-gray-600">Pedidos seleccionados</div>
            <div className="text-right font-medium">{pedidosCount}</div>

            <div className="text-gray-600">Cobrado total</div>
            <div className="text-right">{formatPEN(cobradoTotal)}</div>

            <div className="text-gray-600">Servicio total (courier + motorizado)</div>
            <div className="text-right">{formatPEN(servicioTotal)}</div>

            <div className="text-gray-600 font-semibold">Neto a abonar</div>
            <div className="text-right text-lg font-semibold">{formatPEN(neto)}</div>
          </div>
        </div>

        {/* check */}
        <label className="mx-6 mt-4 flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="h-4 w-4"
          />
          Confirmo que verifiqué e hice la transferencia
        </label>

        {/* footer */}
        <div className="mt-5 flex items-center justify-end gap-2 border-t px-6 py-4">
          <button onClick={onCancel} className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!checked}
            className={[
              "rounded-md px-4 py-2 text-sm font-medium",
              checked ? "bg-emerald-600 text-white hover:opacity-90" : "bg-emerald-200 text-white cursor-not-allowed",
            ].join(" ")}
          >
            ✓ Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============== Tabla Ecommerce (resumen + detalle + abono con estado) ============== */
type Props = { token: string };
type ResumenRow = ResumenDia & { estado?: AbonoEstado };

const EcommerceCuadreSaldoTable: React.FC<Props> = ({ token }) => {
  // filtros
  const defaults = useMemo(defaultMonthRange, []);
  const [ecommerces, setEcommerces] = useState<EcommerceItem[]>([]);
  const [ecoId, setEcoId] = useState<number | "">("");
  const [desde, setDesde] = useState(defaults.desde);
  const [hasta, setHasta] = useState(defaults.hasta);

  // resumen
  const [rows, setRows] = useState<ResumenRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // selección (resumen)
  const [selectedFechas, setSelectedFechas] = useState<string[]>([]);

  // detalle
  const [openDetalle, setOpenDetalle] = useState(false);
  const [detalleFecha, setDetalleFecha] = useState<string>("");
  const [detalleItems, setDetalleItems] = useState<PedidoDiaItem[]>([]);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [seleccionPedidos, setSeleccionPedidos] = useState<number[]>([]);

  // confirm modal (común)
  const [openConfirm, setOpenConfirm] = useState(false);
  const [confirmFechas, setConfirmFechas] = useState<string[]>([]);
  const [confirmCobrado, setConfirmCobrado] = useState(0);
  const [confirmServicio, setConfirmServicio] = useState(0);
  const [confirmCount, setConfirmCount] = useState(0);

  const ecommerce = useMemo(
    () => ecommerces.find((e) => e.id === (typeof ecoId === "number" ? ecoId : -1)),
    [ecoId, ecommerces]
  );

  /* ---- cargar ecommerces ---- */
  useEffect(() => {
    (async () => {
      try {
        const list = await listEcommercesCourier(token);
        setEcommerces(list);
        if (!ecoId && list.length) setEcoId(list[0].id);
      } catch (e: any) {
        setError(e?.message ?? "No se pudo cargar ecommerces");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* ---- cargar resumen ---- */
  const loadResumen = async () => {
    if (!ecoId || typeof ecoId !== "number") {
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getEcommerceResumen(token, { ecommerceId: ecoId, desde, hasta });
      setRows((data ?? []) as ResumenRow[]);
      setSelectedFechas([]);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar el resumen");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadResumen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ecoId, desde, hasta]);

  /* ---- selección en resumen ---- */
  const toggleFecha = (fecha: string) =>
    setSelectedFechas((prev) => (prev.includes(fecha) ? prev.filter((f) => f !== fecha) : [...prev, fecha]));

  const toggleAllFechas = () => {
    if (selectedFechas.length === rows.length) setSelectedFechas([]);
    else setSelectedFechas(rows.map((r) => r.fecha));
  };

  /* ---- abrir detalle de un día ---- */
  const openDia = async (fecha: string) => {
    if (!ecoId || typeof ecoId !== "number") return;
    setDetalleFecha(fecha);
    setOpenDetalle(true);
    setDetalleLoading(true);
    setSeleccionPedidos([]);
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

  /* ---- preparar abono (multi-fecha) ---- */
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

  /* ---- preparar abono (detalle: sólo pedidos seleccionados de ese día) ---- */
  const selectableDetalleIds = useMemo(
    () => detalleItems.filter((i: any) => !i.abonado).map((i) => i.id),
    [detalleItems]
  );
  const isAllDetalle = seleccionPedidos.length > 0 && seleccionPedidos.length === selectableDetalleIds.length;
  const toggleAllDetalle = () => setSeleccionPedidos(isAllDetalle ? [] : selectableDetalleIds);
  const toggleOneDetalle = (id: number) =>
    setSeleccionPedidos((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const totalDetalleSelServicio = useMemo(
    () => detalleItems.filter((i) => seleccionPedidos.includes((i as any).id)).reduce((acc, i) => acc + servicioDe(i), 0),
    [detalleItems, seleccionPedidos]
  );
  const totalDetalleSelCobrado = useMemo(
    () => detalleItems.filter((i) => seleccionPedidos.includes((i as any).id)).reduce((acc, i) => acc + montoDe(i), 0),
    [detalleItems, seleccionPedidos]
  );

  const abrirConfirmDetalle = () => {
    if (!seleccionPedidos.length) return;
    const sel = detalleItems.filter((i) => seleccionPedidos.includes((i as any).id));
    setConfirmFechas([detalleFecha]); // el endpoint por fechas marcará el día completo "Por Validar"
    setConfirmCobrado(sel.reduce((acc, i) => acc + montoDe(i), 0));
    setConfirmServicio(sel.reduce((acc, i) => acc + servicioDe(i), 0));
    setConfirmCount(sel.length);
    setOpenConfirm(true);
  };

  /* ---- CONFIRMAR ABONO (por fechas) -> cambia pill a "Por Validar" ---- */
  const confirmarAbono = async () => {
    try {
      setLoading(true);
      if (!ecoId || typeof ecoId !== "number") return;
      if (!confirmFechas.length) return;

      // 1) BE: marca Por Validar por FECHAS (estado visible al ecommerce)
      await abonarEcommerceFechas(token, {
        ecommerceId: ecoId,
        fechas: confirmFechas,
        estado: "Por Validar",
      });

      // 2) Update optimista del estado en la tabla (pill)
      setRows((prev) =>
        prev.map((r) =>
          confirmFechas.includes(r.fecha) ? { ...r, estado: "Por Validar" } : r
        )
      );

      // 3) Cerrar modal y limpiar
      setOpenConfirm(false);
      setConfirmFechas([]);
      setConfirmCobrado(0);
      setConfirmServicio(0);
      setConfirmCount(0);

      // 4) Re-sync por si el BE recalculó totales/estado
      await loadResumen();
    } catch (e: any) {
      alert(e?.message ?? "No se pudo procesar el abono");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* barra superior */}
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
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 8v8M8 12h8" />
          </svg>
          Abonar Ecommerce
        </button>
      </div>

      {/* filtros */}
      <div className="grid grid-cols-1 gap-4 px-4 pb-4 pt-3 md:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Ecommerce</label>
          <select
            className="w-full rounded-xl border px-3 py-2 outline-none"
            value={ecoId}
            onChange={(e) => setEcoId(e.target.value === "" ? "" : Number(e.target.value))}
          >
            {ecommerces.length === 0 && <option value="">—</option>}
            {ecommerces.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Fecha Inicio</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Fecha Fin</label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 outline-none"
          />
        </div>

        <div className="flex items-end justify-end">
          <button
            onClick={loadResumen}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>

      {error && <div className="px-4 pb-2 text-sm text-red-600">{error}</div>}

      {/* tabla resumen */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 text-sm">
            Cargando...
          </div>
        )}

        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="p-4">
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selectedFechas.length === rows.length}
                  onChange={toggleAllFechas}
                  aria-label="Seleccionar todo"
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
                <td colSpan={7} className="p-4 text-gray-500">
                  Sin resultados para el filtro seleccionado.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const checked = selectedFechas.includes(r.fecha);
                const pillCls =
                  r.estado === "Validado"
                    ? "bg-gray-900 text-white"
                    : r.estado === "Sin Validar"
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
                      />
                    </td>
                    <td className="p-4">{toDMY(r.fecha)}</td>
                    <td className="p-4">{formatPEN(r.cobrado)}</td>
                    <td className="p-4">{formatPEN(r.servicio)}</td>
                    <td className="p-4">{formatPEN(r.neto)}</td>
                    <td className="p-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold inline-block ${pillCls}`}>
                        {r.estado ?? "Por Validar"}
                      </span>
                    </td>
                    <td className="p-4">
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

      {/* modal detalle */}
      {openDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
          <div className="w-[960px] max-w-[96vw] rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="text-sm">
                <div className="font-semibold">Pedidos del día • {toDMY(detalleFecha)}</div>
                <div className="text-gray-500">
                  Ecommerce: <b>{ecommerce?.nombre ?? ""}</b>
                </div>
              </div>
              <button onClick={() => setOpenDetalle(false)} className="p-1 text-gray-500 hover:text-black">
                ✕
              </button>
            </div>

            <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Seleccionados: <b>{seleccionPedidos.length}</b> · Servicio: <b>{formatPEN(totalDetalleSelServicio)}</b>
                </div>
                <button
                  className={[
                    "rounded-md px-4 py-2 text-sm font-medium",
                    seleccionPedidos.length === 0 || detalleLoading
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:opacity-90",
                  ].join(" ")}
                  disabled={seleccionPedidos.length === 0 || detalleLoading}
                  onClick={abrirConfirmDetalle}
                >
                  Abonar seleccionados
                </button>
              </div>

              <div className="relative">
                {detalleLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 text-sm">
                    Cargando...
                  </div>
                )}

                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-600">
                    <tr>
                      <th className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={isAllDetalle}
                          onChange={toggleAllDetalle}
                          aria-label="Seleccionar todo"
                        />
                      </th>
                      <th className="px-4 py-2">Cliente</th>
                      <th className="px-4 py-2">Método de pago</th>
                      <th className="px-4 py-2">Monto</th>
                      <th className="px-4 py-2">Servicio (total)</th>
                      <th className="px-4 py-2">Abono</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalleItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                          Sin pedidos
                        </td>
                      </tr>
                    ) : (
                      detalleItems.map((it: any) => {
                        const checked = seleccionPedidos.includes(it.id);
                        const disabled = it.abonado;
                        return (
                          <tr key={it.id} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-2">
                              <input
                                type="checkbox"
                                disabled={disabled}
                                checked={checked}
                                onChange={() => toggleOneDetalle(it.id)}
                              />
                            </td>
                            <td className="px-4 py-2">{it.cliente}</td>
                            <td className="px-4 py-2">{it.metodoPago ?? "-"}</td>
                            <td className="px-4 py-2">{formatPEN(montoDe(it))}</td>
                            <td className="px-4 py-2">{formatPEN(servicioDe(it))}</td>
                            <td className="px-4 py-2">
                              {it.abonado ? (
                                <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                                  Abonado
                                </span>
                              ) : (
                                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                                  Sin abonar
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* modal confirmar (usa fechas) */}
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
