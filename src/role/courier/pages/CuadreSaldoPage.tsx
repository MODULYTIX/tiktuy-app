// src/pages/courier/cuadre-saldo/CuadreSaldoPage.tsx
import React, { useEffect, useState } from "react";
import type { PropsWithChildren } from "react";

import RepartidorTable from "@/shared/components/courier/cuadreSaldo/CuadreSaldoTable";
import EcommerceCuadreSaldoTable from "@/shared/components/courier/cuadreSaldo/EcommerceCuadreSaldoTable";

import { listMotorizados } from "@/services/courier/cuadre_saldo/cuadreSaldo.api";
import type { MotorizadoItem } from "@/services/courier/cuadre_saldo/cuadreSaldo.types";

// ⬇️ Importa tus componentes de entrada estilizados (ajusta la ruta)
import { Selectx, SelectxDate } from "@/shared/common/Selectx";
import Buttonx from "@/shared/common/Buttonx";
import Tittlex from "@/shared/common/Tittlex";

/* ============== Iconos ============== */
const StoreIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 6h16l-1 5a4 4 0 01-4 3H9a4 4 0 01-4-3L4 6zm1 11a1 1 0 001 1h3v-4H5v3zm10 1h3a1 1 0 001-1v-3h-4v4zM9 18h6v-4H9v4z" />
  </svg>
);
const BikeIcon = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <circle cx="6.5" cy="17.5" r="3.5" strokeWidth="1.5" />
    <circle cx="17.5" cy="17.5" r="3.5" strokeWidth="1.5" />
    <path d="M6.5 17.5L10 9h4l3.5 8.5M13 9l-3 8.5" strokeWidth="1.5" />
  </svg>
);

/* ============== Helpers ============== */
const pad2 = (n: number) => String(n).padStart(2, "0");
const toYMD = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const todayLocal = () => toYMD(new Date());
const getToken = () => localStorage.getItem("token") ?? "";

/* ============== Toggle genérico ============== */
type ToggleBtnProps = PropsWithChildren<{
  active?: boolean;
  onClick?: () => void;
}>;
const ToggleBtn = ({ active, onClick, children }: ToggleBtnProps) => (
  <button
    onClick={onClick}
    className={[
      "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm",
      active ? "bg-gray-900 text-white border-gray-900" : "hover:bg-gray-50",
    ].join(" ")}
  >
    {children}
  </button>
);

/* ============== Página ============== */
type Tab = "ECOMMERCE" | "REPARTIDOR";

const CuadreSaldoPage: React.FC = () => {
  const token = getToken();

  const [tab, setTab] = useState<Tab>("ECOMMERCE");

  // Repartidor: filtros
  const [motorizadoId, setMotorizadoId] = useState<number | "">("");
  const [motorizados, setMotorizados] = useState<MotorizadoItem[]>([]);
  const [loadingMotorizados, setLoadingMotorizados] = useState(false);

  // Fechas por defecto = HOY
  const [repDesde, setRepDesde] = useState<string>(todayLocal());
  const [repHasta, setRepHasta] = useState<string>(todayLocal());

  // cargar motorizados del courier autenticado
  useEffect(() => {
    const run = async () => {
      try {
        setLoadingMotorizados(true);
        const data = await listMotorizados(token);
        setMotorizados(data);
      } catch {
        // opcional: mostrar toast
      } finally {
        setLoadingMotorizados(false);
      }
    };
    if (token) void run();
  }, [token]);

  const limpiarRep = () => {
    const hoy = todayLocal();
    setMotorizadoId("");
    setRepDesde(hoy);
    setRepHasta(hoy);
  };

  return (
    <div className="flex flex-col gap 5 pt-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Tittlex
          title="Cuadre de Saldo"
          description="Monitorea lo recaudado en el día"
        />

        <div className="flex items-center gap-2">
          <Buttonx
            label="Ecommerce"
            icon="mynaui:store"
            variant={tab === "ECOMMERCE" ? "secondary" : "tertiary"}
            onClick={() => setTab("ECOMMERCE")}
          />

          <Buttonx
            label="Repartidor"
            icon="mynaui:bike"
            variant={tab === "REPARTIDOR" ? "secondary" : "tertiary"}
            onClick={() => setTab("REPARTIDOR")}
          />
        </div>
      </div>

      {/* Contenido por pestaña */}
      {tab === "ECOMMERCE" ? (
        // El componente ya incluye sus propios filtros, detalle y abono
        <EcommerceCuadreSaldoTable token={token} />
      ) : (
        <>
          {/* Filtros Repartidor (modelo unificado + auto-render de la tabla) */}
          <div className="text-lg font-semibold mb-5">Repartidor</div>

          <div className="bg-white p-5 rounded shadow-default border-b-4 border-gray90 flex items-end gap-4">
            <Selectx
              id="f-motorizado"
              label="Motorizado"
              value={motorizadoId === "" ? "" : String(motorizadoId)}
              onChange={(e) =>
                setMotorizadoId(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              placeholder={
                loadingMotorizados ? "Cargando..." : "Seleccionar motorizado"
              }
            >
              <option value="">— Seleccionar motorizado —</option>
              {motorizados.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </Selectx>

            <SelectxDate
              id="f-rep-fecha-inicio"
              label="Fecha Inicio"
              value={repDesde}
              onChange={(e) => setRepDesde(e.target.value)}
              placeholder="dd/mm/aaaa"
            />

            <SelectxDate
              id="f-rep-fecha-fin"
              label="Fecha Fin"
              value={repHasta}
              onChange={(e) => setRepHasta(e.target.value)}
              placeholder="dd/mm/aaaa"
            />

            <Buttonx
              label="Limpiar Filtros"
              icon="mynaui:delete"
              variant="outlined"
              onClick={limpiarRep}
              disabled={false}
            />
          </div>

          {/* Tabla Repartidor (se muestra automáticamente al elegir motorizado) */}
          {token && motorizadoId !== "" ? (
            <RepartidorTable
              token={token}
              motorizadoId={Number(motorizadoId)}
              desde={repDesde}
              hasta={repHasta}
            />
          ) : (
            <div className="mt-5 rounded-xl border border-dashed p-6 text-sm text-gray-600">
              Selecciona un <b>motorizado</b> y (opcional) ajusta el rango de
              fechas para ver los pedidos.
              <br />
              Por defecto, la fecha es <b>hoy</b>.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CuadreSaldoPage;
