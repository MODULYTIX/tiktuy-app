import React from "react";
import CuadreSaldoTable from "@/shared/components/repartidor/cuadresaldo/CuadreSaldoTable"; // <-- ajusta la ruta si tu carpeta es distinta

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M6 2a1 1 0 011 1v1h6V3a1 1 0 112 0v1h1a2 2 0 012 2v2H1V6a2 2 0 012-2h1V3a1 1 0 112 0v1z" />
    <path d="M1 9h18v7a2 2 0 01-2 2H3a2 2 0 01-2-2V9z" />
  </svg>
);

const BroomIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      d="M15 3l6 6M3 21l6-6m10-6l-7 7M4 16l4 4" />
  </svg>
);

const CoinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
    <path d="M8 12h8M12 7v10" strokeWidth="1.5" />
  </svg>
);

const CuadreSaldoPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cuadre de Saldo</h1>
          <p className="mt-1 text-gray-600">Monitoreo de lo recaudado en el día</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-white shadow hover:opacity-90">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-black/20">
            <CoinIcon />
          </span>
          Validar Pago
        </button>
      </div>

      {/* Filtros */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Fecha Inicio */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Fecha Inicio</label>
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
              <input
                type="text"
                placeholder="00/00/0000"
                className="w-full bg-transparent outline-none placeholder:text-gray-400"
              />
              <CalendarIcon />
            </div>
          </div>

          {/* Fecha Fin */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Fecha Fin</label>
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
              <input
                type="text"
                placeholder="00/00/0000"
                className="w-full bg-transparent outline-none placeholder:text-gray-400"
              />
              <CalendarIcon />
            </div>
          </div>

          {/* Limpiar Filtros */}
          <div className="flex items-end">
            <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50">
              <BroomIcon />
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <CuadreSaldoTable />
    </div>
  );
};

export default CuadreSaldoPage;
