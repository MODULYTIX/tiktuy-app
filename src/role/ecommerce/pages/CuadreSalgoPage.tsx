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

/* ================= Page ================= */
const CuadreSaldoPage: React.FC = () => {
  const token = getToken();

  const [couriers, setCouriers] = useState<{ id: number; nombre: string }[]>(
    []
  );
  const [courierId, setCourierId] = useState<number | "">("");

  // Fechas en HOY por defecto
  const [desde, setDesde] = useState<string>(todayLocal());
  const [hasta, setHasta] = useState<string>(todayLocal());

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

  // Auto-búsqueda: cada vez que cambie courier/fechas (si hay courier seleccionado)
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
    const hoy = todayLocal();
    setCourierId("");
    setDesde(hoy);
    setHasta(hoy);
    setRows([]);
    setSelected([]);
  };

  return (
    <div className="mt-8 flex flex-col gap-5">
      {/* Header */}
      <div className="flex justify-between items-end">
        <Tittlex
          title="Cuadre de Saldo"
          description="Monitorea lo recaudado en el día"
        />

        <Buttonx
              label={`Validar (${selected.length})`}
              icon="iconoir:new-tab"
              variant="primary"
              onClick={() => setOpenValidar(true)}
              disabled={selected.length === 0}
            />
      </div>

      {/* Filtros (estilo modelo + Selectx) */}
      <div className="bg-white p-5 rounded shadow-default border-b-4 border-gray90 flex items-end gap-4">
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
