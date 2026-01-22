import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/context";
import Buttonx from "@/shared/common/Buttonx";
import Cardx from "@/shared/common/Cards";
import { Selectx, SelectxDate } from "@/shared/common/Selectx";
import { Skeleton } from "@/shared/components/ui/Skeleton";

import { getIngresosReporte, listCouriers } from "@/services/ecommerce/reportes/ecommerceReportes.api";
import type { IngresosReporteResp, VistaReporte } from "@/services/ecommerce/reportes/ecommerceReportes.types";
import IngresosLineChart from "./IngresosLineChart";

const currency = (n: number) => `S/ ${n.toFixed(2)}`;

const hoyISO = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export default function ReporteIngresos() {
  const { token } = useAuth();

  const [vista, setVista] = useState<VistaReporte>("diario");
  const [desde, setDesde] = useState(hoyISO());
  const [hasta, setHasta] = useState(hoyISO());

  const [courierId, setCourierId] = useState<string>("todos");
  const [couriers, setCouriers] = useState<{ label: string; value: string }[]>([]);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IngresosReporteResp | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cargar lista de couriers
  useEffect(() => {
    if (!token) return;

    listCouriers(token)
      .then((res) => {
        setCouriers([
          { label: "Todos", value: "todos" },
          ...res.map((c: any) => ({ label: c.nombre, value: String(c.id) })),
        ]);
      })
      .catch((err) => console.error("Error loading couriers", err));
  }, [token]);

  const fetchData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const resp = await getIngresosReporte(token, {
        vista,
        desde: vista === "diario" ? desde : undefined,
        hasta: vista === "diario" ? hasta : undefined,
        // Enviar courierId si no es "todos"
        courierId: courierId !== "todos" ? Number(courierId) : undefined,
      });

      setData(resp);
    } catch (e: any) {
      setError(e?.message || "Error al cargar reporte");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista, courierId]); // Recargar cuando cambia vista o courier

  /* =========================
     KPIs 
  ========================= */
  const kpis = useMemo(() => {
    if (!data) {
      return {
        totalPedidos: 0,
        ingresosTotales: 0,
        servicioCourier: 0,
        gananciaNeta: 0,
      };
    }

    // Valores directos del backend (ya calculados)
    return {
      totalPedidos: Number(data.kpis.totalPedidos ?? 0),
      ingresosTotales: Number(data.kpis.ingresosTotales ?? 0),
      servicioCourier: Number(data.kpis.servicioCourier ?? 0),
      gananciaNeta: Number(data.kpis.gananciaNeta ?? 0),
    };
  }, [data]);

  return (
    <div className="flex flex-col gap-6">
      {/* ================= FILTROS ================= */}
      <Cardx className="flex flex-wrap gap-4 items-center">
        {/* Selector de Vista */}
        <div className="flex gap-2">
          {(["diario", "mensual", "anual"] as VistaReporte[]).map(v => (
            <Buttonx
              key={v}
              label={v.charAt(0).toUpperCase() + v.slice(1)}
              variant={vista === v ? "secondary" : "tertiary"}
              onClick={() => setVista(v)}
            />
          ))}
        </div>

        {/* Fechas (Solo diario) */}
        {vista === "diario" && (
          <div className="flex gap-3 items-end">
            <div className="w-full md:w-[150px]">
              <SelectxDate
                label="Desde"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full md:w-[150px]">
              <SelectxDate
                label="Hasta"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* -- MENSUAL -- */}
        {vista === "mensual" && (
          <div className="flex gap-3 items-end">
            <div className="w-[100px]">
              <Selectx
                label="Año"
                value={parseInt(desde.split("-")[0])}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  const mStr = desde.split("-")[1];
                  setDesde(`${y}-${mStr}-02`);
                }}
              >
                {[2026, 2027, 2028, 2029, 2030].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Selectx>
            </div>
            <div className="w-[140px]">
              <Selectx
                label="Mes"
                value={parseInt(desde.split("-")[1]) - 1} // 1-based to 0-based
                onChange={(e) => {
                  const m = Number(e.target.value);
                  const yStr = desde.split("-")[0];
                  const mStr = String(m + 1).padStart(2, '0');
                  setDesde(`${yStr}-${mStr}-02`);
                }}
              >
                {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((mes, i) => (
                  <option key={i} value={i}>{mes}</option>
                ))}
              </Selectx>
            </div>
          </div>
        )}

        {/* -- ANUAL -- */}
        {vista === "anual" && (
          <div className="flex gap-3 items-end">
            <div className="w-[100px]">
              <Selectx
                label="Año"
                value={parseInt(desde.split("-")[0])}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  setDesde(`${y}-01-02`);
                }}
              >
                {[2026, 2027, 2028, 2029, 2030].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Selectx>
            </div>
          </div>
        )}

        {/* Filtro Courier */}
        <div className="w-full md:w-auto min-w-[180px]">
          <Selectx
            label="Courier"
            value={courierId}
            onChange={(e) => setCourierId(e.target.value)}
            className="w-full"
          >
            {couriers.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Selectx>
        </div>

        <div>
          <Buttonx
            label="Filtrar"
            icon="mdi:filter-outline"
            variant="secondary"
            onClick={fetchData}
          />
        </div>
      </Cardx>

      {/* ================= LOADING SKELETON ================= */}
      {loading && (
        <>
          {/* KPIs Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Cardx key={i}>
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </Cardx>
            ))}
          </div>
          {/* Chart/Table Skeleton */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Cardx className="xl:col-span-2">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-[300px] w-full" />
            </Cardx>
            <Cardx>
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-[300px] w-full" />
            </Cardx>
          </div>
        </>
      )}

      {/* ================= DATA CONTENT ================= */}
      {!loading && data && data.filtros?.vista === vista && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Cardx>
              <p className="text-xs text-gray60">Ingresos Totales</p>
              <p className="text-2xl font-semibold mt-1">
                {currency(kpis.ingresosTotales)}
              </p>
            </Cardx>

            <Cardx>
              <p className="text-xs text-gray60">Total Pedidos</p>
              <p className="text-2xl font-semibold mt-1">
                {kpis.totalPedidos}
              </p>
            </Cardx>

            <Cardx>
              <p className="text-xs text-gray60">Servicio Total</p>
              <p className="text-2xl font-semibold mt-1">
                - {currency(kpis.servicioCourier)}
              </p>
            </Cardx>

            <Cardx>
              <p className="text-xs text-gray60">Ganancia Neta</p>
              <p className="text-2xl font-semibold mt-1 ">
                {currency(kpis.gananciaNeta)}
              </p>
            </Cardx>
          </div>

          {/* GRÁFICO + TABLA */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* GRÁFICO */}
            <Cardx className="xl:col-span-2">
              <p className="text-sm text-gray60 mb-3">Evolución de ingresos</p>
              <IngresosLineChart
                labels={data.grafico.labels}
                series={data.grafico.series}
              />
            </Cardx>

            {/* TABLA */}
            <Cardx>
              <p className="text-sm text-gray60 mb-3">Detalle por fecha</p>
              <div className="max-h-[320px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-gray30 text-gray60">
                      <th className="py-2 text-left">Fecha</th>
                      <th className="py-2 text-right">Ingresos</th>
                      <th className="py-2 text-right">Pedidos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tabla.map((row) => (
                      <tr key={row.fecha} className="border-b border-gray20">
                        <td className="py-2">{row.fecha}</td>
                        <td className="py-2 text-right font-medium">
                          {currency(row.ingresos)}
                        </td>
                        <td className="py-2 text-right">
                          {row.totalPedidos}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Cardx>
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
