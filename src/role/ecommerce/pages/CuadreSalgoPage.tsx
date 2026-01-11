import React, { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react"; // Added import

import CuadreSaldoTable from "@/shared/components/ecommerce/cuadresaldo/CuadreSaldoTable";
import VizualisarPedidos from "@/shared/components/ecommerce/cuadresaldo/VizualisarPedidos";
import ValidarAbonoModal from "@/shared/components/ecommerce/cuadresaldo/ModalValidar";

import {
  listCouriersMine,
  getResumen,
  getPedidosDia,
  validarFechas,
} from "@/services/ecommerce/cuadreSaldo/cuadreSaldoC.api";

import type {
  ResumenDia,
  PedidoDiaItem,
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

// Detecta DIRECTO_ECOMMERCE (compat por si viene en distintas claves)
const isDirectoEcommerce = (p: any) => {
  const mp = String(
    p?.metodoPago ?? p?.metodo_pago ?? p?.metodoPagoNombre ?? p?.metodo_pago_nombre ?? ""
  ).toUpperCase();
  return mp === "DIRECTO_ECOMMERCE";
};

const montoPedido = (p: any) =>
  Number(p?.monto ?? p?.monto_recaudar ?? p?.montoRecaudar ?? 0);

type ResumenRowUI = ResumenDia & {
  directoEcommerceMonto?: number;
};

/* ================= Page ================= */
const CuadreSaldoPage: React.FC = () => {
  const token = getToken();

  const [couriers, setCouriers] = useState<{ id: number; nombre: string }[]>([]);
  const [courierId, setCourierId] = useState<number | "">("");

  const [desde, setDesde] = useState<string>(todayLocal());
  const [hasta, setHasta] = useState<string>(todayLocal());

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ResumenRowUI[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  // modal ver pedidos
  const [openVer, setOpenVer] = useState(false);
  const [verFecha, setVerFecha] = useState<string | undefined>();
  const [verRows, setVerRows] = useState<PedidoDiaItem[]>([]);
  const [verLoading, setVerLoading] = useState(false);

  // modal validar
  const [openValidar, setOpenValidar] = useState(false);

  /* ====== cargar couriers ====== */
  useEffect(() => {
    if (!token) return;
    listCouriersMine(token)
      .then((data) => setCouriers(data))
      .catch((e) => console.error(e));
  }, [token]);

  /* ====== buscar resumen + calcular DIRECTO_ECOMMERCE por fecha ====== */
  const buscar = async () => {
    if (!token || courierId === "") return;

    setLoading(true);
    try {
      const data = await getResumen(token, {
        courierId: Number(courierId),
        desde,
        hasta,
        soloPorValidar: true,
      });

      // 1) Traemos el resumen base
      const baseRows: ResumenRowUI[] = (data ?? []).map((r: any) => ({
        ...r,
        directoEcommerceMonto: 0,
      }));

      // 2) Calculamos DIRECTO_ECOMMERCE por cada fecha (solo UI)
      //    OJO: esto hace N requests (una por día mostrado en resumen).
      //    Si luego quieres optimizar, lo ideal es que backend lo envíe en el resumen.
      const fechas = baseRows.map((r) => r.fecha);

      const pares = await Promise.all(
        fechas.map(async (f) => {
          try {
            const pedidos = await getPedidosDia(
              token,
              Number(courierId),
              f,
              true
            );

            const directo = (pedidos ?? []).reduce((acc: number, p: any) => {
              return acc + (isDirectoEcommerce(p) ? montoPedido(p) : 0);
            }, 0);

            return [f, directo] as const;
          } catch {
            return [f, 0] as const;
          }
        })
      );

      const directoByFecha: Record<string, number> = Object.fromEntries(pares);

      // 3) Adjuntamos el campo a cada row (frontend)
      const enriched: ResumenRowUI[] = baseRows.map((r) => ({
        ...r,
        directoEcommerceMonto: Number(directoByFecha[r.fecha] ?? 0),
      }));

      setRows(enriched);
      setSelected([]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Auto-búsqueda
  useEffect(() => {
    if (!token) return;
    if (!courierId) return;
    if (!desde || !hasta) return;
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courierId, desde, hasta, token]);

  /* ====== helpers tabla ====== */
  const toggleFecha = (date: string) => {
    setSelected((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
    );
  };

  const verPedidos = async (date: string) => {
    if (!token || courierId === "") return;

    setVerFecha(date);
    setOpenVer(true);
    setVerLoading(true);

    try {
      const data = await getPedidosDia(token, Number(courierId), date, true);
      setVerRows(data);
    } catch (e) {
      console.error(e);
    } finally {
      setVerLoading(false);
    }
  };

  //    Servicios NO se tocan.
  const totals = useMemo(() => {
    const set = new Set(selected);
    let cobVisible = 0;
    let serv = 0;

    rows.forEach((r) => {
      if (!set.has(r.fecha)) return;

      const directo = Number((r as any).directoEcommerceMonto ?? 0);
      const cobradoReal = Number(r.cobrado ?? 0);

      cobVisible += Math.max(0, cobradoReal - directo);
      serv += Number(r.servicio ?? 0);
    });

    return { cobrado: cobVisible, servicio: serv };
  }, [selected, rows]);

  const confirmarValidacion = async () => {
    if (!token || courierId === "" || selected.length === 0) return;

    // Optimistic UI
    setRows((prev) =>
      prev.map((r) =>
        selected.includes(r.fecha) ? { ...r, estado: "Validado" } : r
      )
    );

    try {
      await validarFechas(token, {
        courierId: Number(courierId),
        fechas: selected,
      });

      setSelected([]);
      await buscar();
    } catch (e) {
      console.error(e);
    }
  };

  const limpiarFiltros = () => {
    const hoy = todayLocal();
    setCourierId("");
    setDesde(hoy);
    setHasta(hoy);
    setRows([]);
    setSelected([]);
  };

  /* ====== Stats Calculation used for Live Summary ====== */
  // Use 'totals' if something is selected, otherwise calculate based on all displayed rows.
  const displayTotals = useMemo(() => {
    if (selected.length > 0) return totals;

    // Fallback: Calculate for ALL rows currently visible (if nothing selected)
    let cobVisible = 0;
    let serv = 0;
    rows.forEach((r) => {
      const directo = Number((r as any).directoEcommerceMonto ?? 0);
      const cobradoReal = Number(r.cobrado ?? 0);
      cobVisible += Math.max(0, cobradoReal - directo);
      serv += Number(r.servicio ?? 0);
    });
    return { cobrado: cobVisible, servicio: serv };
  }, [selected.length, totals, rows]);


  return (
    <div className="mt-8 flex flex-col gap-6 font-sans text-slate-600">

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <Tittlex
          title="Cuadre de Saldo"
          description="Gestión y monitoreo de recaudación diaria"
        />

        <div className="flex gap-3">
          {/* Action Buttons could go here */}
          <Buttonx
            label={`Validar (${selected.length})`}
            icon="iconoir:check-circle"
            variant="primary" // Changed to primary for better focus
            className={`${selected.length === 0 ? 'opacity-50' : 'shadow-lg shadow-indigo-200'}`}
            onClick={() => setOpenValidar(true)}
            disabled={selected.length === 0}
          />
        </div>
      </div>

      {/* Live Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
            <Icon icon="mdi:cash-multiple" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Cobrado {selected.length > 0 ? '(Selec.)' : '(Total)'}</p>
            <p className="text-xl font-bold text-slate-800">
              S/ {displayTotals.cobrado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
            <Icon icon="mdi:hand-coin-outline" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Servicio {selected.length > 0 ? '(Selec.)' : '(Total)'}</p>
            <p className="text-xl font-bold text-slate-800">
              S/ {displayTotals.servicio.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Placeholder for future stat or info */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 border-dashed flex items-center justify-center text-slate-400 text-sm">
          <span className="flex items-center gap-2">
            <Icon icon="mdi:information-outline" />
            Selecciona fechas para validar
          </span>
        </div>
      </div>


      {/* Filter Bar (Clean Glass Style) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-end gap-4 overflow-x-auto">
        <div className="flex-1 min-w-[200px]">
          <Selectx
            id="f-courier"
            label="Courier"
            value={courierId === "" ? "" : String(courierId)}
            onChange={(e) =>
              setCourierId(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder="Seleccionar courier"
            className="w-full"
          >
            <option value="">— Seleccionar courier —</option>
            {couriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Selectx>
        </div>

        <div className="w-full md:w-auto min-w-[150px]">
          <SelectxDate
            id="f-fecha-inicio"
            label="Desde"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            placeholder="dd/mm/aaaa"
            className="w-full"
          />
        </div>

        <div className="w-full md:w-auto min-w-[150px]">
          <SelectxDate
            id="f-fecha-fin"
            label="Hasta"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            placeholder="dd/mm/aaaa"
            className="w-full"
          />
        </div>

        <div className="pb-0.5">
          <Buttonx
            label="Limpiar"
            icon="mynaui:delete"
            variant="outlined"
            onClick={limpiarFiltros}
            disabled={!courierId && !rows.length}
            className="border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <CuadreSaldoTable
          rows={rows as any}
          loading={loading}
          selected={selected}
          onToggle={toggleFecha}
          onView={verPedidos}
        />
      </div>

      {/* Modals */}
      <VizualisarPedidos
        open={openVer}
        onClose={() => setOpenVer(false)}
        fecha={verFecha}
        rows={verRows as any}
        loading={verLoading}
      />

      <ValidarAbonoModal
        open={openValidar}
        onClose={() => setOpenValidar(false)}
        fechas={selected}
        totalCobrado={totals.cobrado}
        totalServicio={totals.servicio}
        courierNombre={
          couriers.find((c) => c.id === Number(courierId))?.nombre ?? undefined
        }
        onConfirm={confirmarValidacion}
      />
    </div>
  );
};

export default CuadreSaldoPage;
