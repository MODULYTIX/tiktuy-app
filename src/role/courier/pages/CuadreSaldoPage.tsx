// src/pages/courier/cuadre-saldo/CuadreSaldoPage.tsx
import React, { useEffect, useRef, useState } from "react";

import RepartidorTable from "@/shared/components/courier/cuadreSaldo/CuadreSaldoTable";
import EcommerceCuadreSaldoTable from "@/shared/components/courier/cuadreSaldo/EcommerceCuadreSaldoTable";

import { listMotorizados } from "@/services/courier/cuadre_saldo/cuadreSaldo.api";
import type { MotorizadoItem } from "@/services/courier/cuadre_saldo/cuadreSaldo.types";

import { Selectx, SelectxDate } from "@/shared/common/Selectx";
import Buttonx from "@/shared/common/Buttonx";
import Tittlex from "@/shared/common/Tittlex";

/* ============== Helpers ============== */
const pad2 = (n: number) => String(n).padStart(2, "0");
const toYMD = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const todayLocal = () => toYMD(new Date());
const getToken = () => localStorage.getItem("token") ?? "";

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

  // estado para controlar botón "Abonar seleccionados" (desde el table)
  const [repSelCount, setRepSelCount] = useState(0);
  const [repSelLoading, setRepSelLoading] = useState(false);
  const [repCanAbonar, setRepCanAbonar] = useState(false);

  // referencia a acciones expuestas por CuadreSaldoTable
  const repActionsRef = useRef<{ openAbonarSeleccionados: () => void } | null>(
    null
  );

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
      <div className="mb-5 flex items-end justify-between pb-5 border-b border-gray30">
        <Tittlex
          title="Cuadre de Saldo"
          description="Monitorea lo recaudado en el día"
        />

        <div className="flex items-end gap-3">
          <Buttonx
            label="Ecommerce"
            icon="mynaui:store"
            variant={tab === "ECOMMERCE" ? "secondary" : "tertiary"}
            onClick={() => setTab("ECOMMERCE")}
          />

          <span className="w-[1px] h-10 bg-gray40" />

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
        <EcommerceCuadreSaldoTable token={token} />
      ) : (
        <>
          {/* Título + botón alineado a la derecha */}
          <div className="mb-5 flex items-center justify-between">
            <div className="text-lg font-semibold">Repartidor</div>

            <Buttonx
              icon="iconoir:new-tab"
              label="Abonar seleccionados"
              variant="secondary"
              onClick={() => repActionsRef.current?.openAbonarSeleccionados()}
              disabled={!repCanAbonar || repSelLoading || repSelCount === 0}
            />
          </div>

          {/* Filtros Repartidor */}
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

          {/* Tabla Repartidor */}
          {token && (
            <RepartidorTable
              token={token}
              motorizadoId={motorizadoId === "" ? undefined : Number(motorizadoId)}
              desde={repDesde}
              hasta={repHasta}
              // recibe updates de selección y loading
              onSelectionChange={(info) => {
                setRepSelCount(info.selectedCount);
                setRepSelLoading(info.loading);
                setRepCanAbonar(info.canAbonar);
              }}
              // toma acciones expuestas por el componente
              exposeActions={(actions) => {
                repActionsRef.current = actions;
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default CuadreSaldoPage;
