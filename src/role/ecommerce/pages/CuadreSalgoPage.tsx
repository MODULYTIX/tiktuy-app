import React, { useEffect, useMemo, useState } from "react";

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

/* ================= Helpers ================= */
const pad2 = (n: number) => String(n).padStart(2, "0");
const toYMD = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const getToken = () => localStorage.getItem("token") ?? "";

function defaultMonthRange() {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { desde: toYMD(first), hasta: toYMD(last) };
}

/* ================= Page ================= */
const CuadreSaldoPage: React.FC = () => {
  const token = getToken();
  const defaults = useMemo(defaultMonthRange, []);

  const [couriers, setCouriers] = useState<{ id: number; nombre: string }[]>([]);
  const [courierId, setCourierId] = useState<number | "">("");
  const [desde, setDesde] = useState(defaults.desde);
  const [hasta, setHasta] = useState(defaults.hasta);

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ResumenDia[]>([]);
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

  /* ====== buscar resumen ====== */
  const buscar = async () => {
    if (!token || courierId === "") return;
    setLoading(true);
    try {
      // 🔑 ahora lista tanto "Por Validar" como "Validado"
      const data = await getResumen(token, {
        courierId: Number(courierId),
        desde,
        hasta,
        soloPorValidar: true,
      });
      setRows(data);
      setSelected([]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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
      // 🔑 igual aquí: lista los pedidos "Por Validar" y "Validado"
      const data = await getPedidosDia(token, Number(courierId), date, true);
      setVerRows(data);
    } catch (e) {
      console.error(e);
    } finally {
      setVerLoading(false);
    }
  };

  const totals = useMemo(() => {
    const set = new Set(selected);
    let cob = 0,
      serv = 0;
    rows.forEach((r) => {
      if (set.has(r.fecha)) {
        cob += r.cobrado || 0;
        serv += r.servicio || 0;
      }
    });
    return { cobrado: cob, servicio: serv };
  }, [selected, rows]);

  const confirmarValidacion = async () => {
    if (!token || courierId === "" || selected.length === 0) return;
    // Optimistic UI: marcamos como validado en el front
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
      await buscar(); // refrescar con datos reales
    } catch (e) {
      console.error(e);
    }
  };

  const limpiarFiltros = () => {
    setCourierId("");
    setDesde("");
    setHasta("");
    setRows([]);
    setSelected([]);
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Cuadre de Saldo</h1>
        <p className="mt-1 text-gray-600">Monitorea lo recaudado en el día</p>
      </div>

      {/* Filtros */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Courier
            </label>
            <select
              className="w-full rounded-xl border px-3 py-2 outline-none"
              value={courierId === "" ? "" : String(courierId)}
              onChange={(e) =>
                setCourierId(e.target.value === "" ? "" : Number(e.target.value))
              }
            >
              <option value="">Selecciona courier</option>
              {couriers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Fecha Fin
            </label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 outline-none"
            />
          </div>

          <div className="flex items-end justify-between gap-2">
            <button
              onClick={buscar}
              className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Aplicar Filtros
            </button>
            <button
              onClick={limpiarFiltros}
              className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {selected.length > 0
            ? `${selected.length} fecha(s) seleccionada(s)`
            : "—"}
        </div>
        <button
          disabled={selected.length === 0}
          onClick={() => setOpenValidar(true)}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Validar ({selected.length})
        </button>
      </div>

      <CuadreSaldoTable
        rows={rows}
        loading={loading}
        selected={selected}
        onToggle={toggleFecha}
        onView={verPedidos}
      />

      {/* Modal ver pedidos */}
      <VizualisarPedidos
        open={openVer}
        onClose={() => setOpenVer(false)}
        fecha={verFecha}
        rows={verRows}
        loading={verLoading}
      />

      {/* Modal validar */}
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
