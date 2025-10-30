// src/pages/repartidor/cuadresaldo/CuadreSaldoPage.tsx
import React, { useMemo, useState, useEffect } from "react";
import CuadreSaldoTable from "@/shared/components/repartidor/cuadresaldo/CuadreSaldoTable";
import Buttonx from "@/shared/common/Buttonx";
import { SelectxDate } from "@/shared/common/Selectx";

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

// Normaliza el rango: si ambas fechas existen y desde>hasta, las invierte.
// Si alguna está vacía, retorna undefined para que la tabla lo trate como "sin filtro".
function normalizeRange(desde?: string, hasta?: string) {
  if (desde && hasta && desde > hasta) return { desde: hasta, hasta: desde };
  return { desde: desde || undefined, hasta: hasta || undefined };
}

const CuadreSaldoPage: React.FC = () => {
  const token = getToken();
  const defaults = useMemo(defaultMonthRange, []);

  // filtros del formulario (inputs controlados)
  const [formDesde, setFormDesde] = useState(defaults.desde);
  const [formHasta, setFormHasta] = useState(defaults.hasta);

  // filtros aplicados (los que usa la tabla)
  const [appliedDesde, setAppliedDesde] = useState<string | undefined>(defaults.desde);
  const [appliedHasta, setAppliedHasta] = useState<string | undefined>(defaults.hasta);

  // señal para validar lote desde el header
  const [validateSignal, setValidateSignal] = useState(0);

  // Auto-aplicar filtros al cambiar fechas (y normalizar el rango)
  useEffect(() => {
    const { desde, hasta } = normalizeRange(formDesde || undefined, formHasta || undefined);
    setAppliedDesde(desde);
    setAppliedHasta(hasta);
  }, [formDesde, formHasta]);

  return (
    <div className="mt-8">
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

      {/* Filtro con tus componentes y estilos base */}
      <div className="bg-white p-5 rounded shadow-default flex flex-wrap gap-4 items-end border-b-4 border-gray90 mb-5">
        {/* Fecha Inicio */}
        <div className="w-full sm:w-auto max-w-[320px] flex-1">
          <SelectxDate
            label="Fecha Inicio"
            value={formDesde}
            onChange={(e) => setFormDesde((e.target as HTMLInputElement).value)}
            placeholder="dd/mm/aaaa"
            className="w-full"
            // Si prefieres etiqueta a la izquierda: labelVariant="left"
          />
        </div>

        {/* Fecha Fin */}
        <div className="w-full sm:w-auto max-w-[320px] flex-1">
          <SelectxDate
            label="Fecha Fin"
            value={formHasta}
            onChange={(e) => setFormHasta((e.target as HTMLInputElement).value)}
            placeholder="dd/mm/aaaa"
            className="w-full"
          />
        </div>

        {/* Limpiar Filtros */}
        <div className="w-full sm:w-auto">
          <Buttonx
            label="Limpiar Filtros"
            icon="mynaui:delete"
            variant="outlined" // usa "primary" si quieres fondo azul
            onClick={() => {
              setFormDesde("");
              setFormHasta("");
              // No hace falta tocar applied*: el useEffect lo pondrá en undefined automáticamente
            }}
          />
        </div>
      </div>

      <CuadreSaldoTable
        token={token}
        desde={appliedDesde}
        hasta={appliedHasta}
        triggerValidate={validateSignal}   // señal para validar seleccionados
      />
    </div>
  );
};

export default CuadreSaldoPage;
