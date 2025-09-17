// src/pages/courier/cuadre-saldo/CuadreSaldoPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";

import RepartidorTable from "@/shared/components/courier/cuadreSaldo/CuadreSaldoTable";
import EcommerceCuadreSaldoTable from "@/shared/components/courier/cuadreSaldo/EcommerceCuadreSaldoTable";

import { listMotorizados } from "@/services/courier/cuadre_saldo/cuadreSaldo.api";
import type { MotorizadoItem } from "@/services/courier/cuadre_saldo/cuadreSaldo.types";

/* ============== Iconos ============== */
const StoreIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 6h16l-1 5a4 4 0 01-4 3H9a4 4 0 01-4-3L4 6zm1 11a1 1 0 001 1h3v-4H5v3zm10 1h3a1 1 0 001-1v-3h-4v4zM9 18h6v-4H9v4z" />
  </svg>
);
const BikeIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="6.5" cy="17.5" r="3.5" strokeWidth="1.5" />
    <circle cx="17.5" cy="17.5" r="3.5" strokeWidth="1.5" />
    <path d="M6.5 17.5L10 9h4l3.5 8.5M13 9l-3 8.5" strokeWidth="1.5" />
  </svg>
);
const BroomIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M15 3l6 6M3 21l6-6m10-6l-7 7M4 16l4 4" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/* ============== Helpers ============== */
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

<<<<<<< HEAD
/* ============== Toggle genérico ============== */
type ToggleBtnProps = PropsWithChildren<{
  active?: boolean;
  onClick?: () => void;
}>;
const ToggleBtn = ({ active, onClick, children }: ToggleBtnProps) => (
=======
/* ============== Botón toggle ============== */
type ToggleBtnProps = {
  active?: boolean;
  onClick?: () => void;
  children?: React.ReactNode; // <- agrega children explícitamente
};

const ToggleBtn: React.FC<ToggleBtnProps> = ({ active, onClick, children }) => (
>>>>>>> 0205d70a6e0b7717578f20b22dc3c6331c7f466d
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

<<<<<<< HEAD
=======
/* ============== Stub de tabla Ecommerce (reemplázala por tu tabla real) ============== */
const EcommerceTableStub: React.FC = () => (
  <div className="rounded-xl border border-dashed p-6 text-sm text-gray-600">
    Conecta aquí tu <b>tabla de Ecommerce</b> (filtros ya preparados abajo).
    Si ya la tienes, impórtala y reemplaza <code>EcommerceTableStub</code>.
  </div>
);

>>>>>>> 0205d70a6e0b7717578f20b22dc3c6331c7f466d
/* ============== Página ============== */
type Tab = "ECOMMERCE" | "REPARTIDOR";

const CuadreSaldoPage: React.FC = () => {
  const token = getToken();
  const defaults = useMemo(defaultMonthRange, []);

  const [tab, setTab] = useState<Tab>("ECOMMERCE");

  // Repartidor: filtros
  const [motorizadoId, setMotorizadoId] = useState<number | "">("");
  const [motorizados, setMotorizados] = useState<MotorizadoItem[]>([]);
  const [loadingMotorizados, setLoadingMotorizados] = useState(false);

  const [repDesde, setRepDesde] = useState(defaults.desde);
  const [repHasta, setRepHasta] = useState(defaults.hasta);
  const [repApplied, setRepApplied] = useState<{
    motorizadoId?: number;
    desde?: string;
    hasta?: string;
  }>({ motorizadoId: undefined, desde: defaults.desde, hasta: defaults.hasta });

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

  const aplicarRep = () =>
    setRepApplied({
      motorizadoId: motorizadoId === "" ? undefined : Number(motorizadoId),
      desde: repDesde || undefined,
      hasta: repHasta || undefined,
    });

  const limpiarRep = () => {
    setMotorizadoId("");
    setRepDesde("");
    setRepHasta("");
    setRepApplied({ motorizadoId: undefined, desde: undefined, hasta: undefined });
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cuadre de Saldo</h1>
          <p className="mt-1 text-gray-600">Monitorea lo recaudado en el día</p>
        </div>

        <div className="flex items-center gap-2">
          <ToggleBtn active={tab === "ECOMMERCE"} onClick={() => setTab("ECOMMERCE")}>
            <StoreIcon /> Ecommerce
          </ToggleBtn>
          <ToggleBtn active={tab === "REPARTIDOR"} onClick={() => setTab("REPARTIDOR")}>
            <BikeIcon /> Repartidor
          </ToggleBtn>
        </div>
      </div>

      {/* Contenido por pestaña */}
      {tab === "ECOMMERCE" ? (
<<<<<<< HEAD
        // El componente ya incluye sus propios filtros, detalle y abono
        <EcommerceCuadreSaldoTable token={token} />
=======
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 text-sm font-semibold text-gray-700">
            Ecommerce — Visualiza lo abonado
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Ecommerce</label>
              <select
                className="w-full rounded-xl border px-3 py-2 outline-none"
                value={eco}
                onChange={(e) => setEco(e.target.value)}
              >
                <option value="">Seleccionar ecommerce</option>
                <option value="TechLine">TechLine</option>
                <option value="Casa&Moda">Casa&Moda</option>
                <option value="BookWorld">BookWorld</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Estado</label>
              <select
                className="w-full rounded-xl border px-3 py-2 outline-none"
                value={ecoEstado}
                onChange={(e) => setEcoEstado(e.target.value)}
              >
                <option value="">Seleccionar estado</option>
                <option value="VALIDADO">Validado</option>
                <option value="POR_VALIDAR">Por Validar</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Fecha Inicio</label>
              <input
                type="date"
                value={ecoDesde}
                onChange={(e) => setEcoDesde(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Fecha Fin</label>
              <input
                type="date"
                value={ecoHasta}
                onChange={(e) => setEcoHasta(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 outline-none"
              />
            </div>

            <div className="flex items-end justify-between gap-2">
              <button className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                <CoinIcon /> Abonar Ecommerce
              </button>
              <button
                onClick={limpiarEco}
                className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
              >
                <BroomIcon /> Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
>>>>>>> 0205d70a6e0b7717578f20b22dc3c6331c7f466d
      ) : (
        <>
          {/* Filtros Repartidor */}
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 text-sm font-semibold text-gray-700">
              Repartidor — Visualiza lo abonado
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Motorizado</label>
                <select
                  className="w-full rounded-xl border px-3 py-2 outline-none"
                  value={motorizadoId === "" ? "" : String(motorizadoId)}
                  onChange={(e) =>
                    setMotorizadoId(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  disabled={loadingMotorizados}
                >
                  <option value="">{loadingMotorizados ? "Cargando..." : "Todos"}</option>
                  {motorizados.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Fecha Inicio</label>
                <input
                  type="date"
                  value={repDesde}
                  onChange={(e) => setRepDesde(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Fecha Fin</label>
                <input
                  type="date"
                  value={repHasta}
                  onChange={(e) => setRepHasta(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 outline-none"
                />
              </div>
              <div className="flex items-end justify-between gap-2">
                <button
                  onClick={aplicarRep}
                  className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Aplicar Filtros
                </button>
                <button
                  onClick={limpiarRep}
                  className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
                >
                  <BroomIcon /> Limpiar Filtros
                </button>
              </div>
            </div>
          </div>

<<<<<<< HEAD
          {/* Tabla Repartidor */}
          {token && repApplied.motorizadoId ? (
            <RepartidorTable
              token={token}
              motorizadoId={repApplied.motorizadoId}
              desde={repApplied.desde}
              hasta={repApplied.hasta}
            />
          ) : (
            <div className="rounded-xl border border-dashed p-6 text-sm text-gray-600">
              Selecciona un <b>motorizado</b> y el rango de fechas para ver los pedidos.
=======
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">ID Motorizado</label>
              <input
                type="number"
                min={1}
                value={motorizadoId}
                onChange={(e) =>
                  setMotorizadoId(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full rounded-xl border px-3 py-2 outline-none"
                placeholder="Ej: 12"
              />
>>>>>>> 0205d70a6e0b7717578f20b22dc3c6331c7f466d
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CuadreSaldoPage;
