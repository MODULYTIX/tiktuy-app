// src/pages/repartidor/cuadresaldo/CuadreSaldoPage.tsx
import React, { useMemo, useState } from "react";
import CuadreSaldoTable from "@/shared/components/repartidor/cuadresaldo/CuadreSaldoTable";

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M6 2a1 1 0 011 1v1h6V3a1 1 0 112 0v1h1a2 2 0 012 2v2H1V6a2 2 0 012-2h1V3a1 1 0 112 0v1z" />
    <path d="M1 9h18v7a2 2 0 01-2 2H3a2 2 0 01-2-2V9z" />
  </svg>
);
const BroomIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M15 3l6 6M3 21l6-6m10-6l-7 7M4 16l4 4" />
  </svg>
);
const CoinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
    <path d="M8 12h8M12 7v10" strokeWidth="1.5" />
  </svg>
);

const pad2 = (n: number) => String(n).padStart(2, "0");
const toYMD = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const getToken = () => localStorage.getItem("token") ?? "";

function defaultMonthRange() {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { desde: toYMD(first), hasta: toYMD(last) };
}

const CuadreSaldoPage: React.FC = () => {
  const token = getToken();
  const defaults = useMemo(defaultMonthRange, []);

  // filtros del formulario
  const [formDesde, setFormDesde] = useState(defaults.desde);
  const [formHasta, setFormHasta] = useState(defaults.hasta);

  // filtros aplicados (los que usa la tabla)
  const [appliedDesde, setAppliedDesde] = useState<string | undefined>(defaults.desde);
  const [appliedHasta, setAppliedHasta] = useState<string | undefined>(defaults.hasta);

  // señal para validar lote desde el header
  const [validateSignal, setValidateSignal] = useState(0);

  const aplicarFiltros = () => {
    setAppliedDesde(formDesde || undefined);
    setAppliedHasta(formHasta || undefined);
  };

  const limpiarFiltros = () => {
    setFormDesde("");
    setFormHasta("");
    setAppliedDesde(undefined);
    setAppliedHasta(undefined);
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cuadre de Saldo</h1>
          <p className="mt-1 text-gray-600">Monitoreo de lo recaudado por día</p>
        </div>
        <button
          onClick={() => setValidateSignal((s) => s + 1)}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-white shadow hover:opacity-90"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-black/20">
            <CoinIcon />
          </span>
          Validar Pago
        </button>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Fecha Inicio</label>
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
              <input type="date" value={formDesde} onChange={(e) => setFormDesde(e.target.value)} className="w-full bg-transparent outline-none" />
              <CalendarIcon />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Fecha Fin</label>
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
              <input type="date" value={formHasta} onChange={(e) => setFormHasta(e.target.value)} className="w-full bg-transparent outline-none" />
              <CalendarIcon />
            </div>
          </div>
          <div className="flex items-end">
            <button onClick={aplicarFiltros} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              Aplicar Filtros
            </button>
          </div>
          <div className="flex items-end">
            <button onClick={limpiarFiltros} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50">
              <BroomIcon />
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      <CuadreSaldoTable
        token={token}
        desde={appliedDesde}
        hasta={appliedHasta}
        triggerValidate={validateSignal}   // <<-- señal para validar seleccionados
      />
    </div>
  );
};

export default CuadreSaldoPage;
