import { useEffect, useState } from "react";
import { useAuth } from "@/auth/context";

import Buttonx from "@/shared/common/Buttonx";
import { Inputx } from "@/shared/common/Inputx";
import Cardx from "@/shared/common/Cards";

import { getCourierIngresosReporte } from "@/services/courier/reporte/reporteCourier.api";
import type { VistaReporte } from "@/services/ecommerce/reportes/ecommerceReportes.types";

/* =========================
   Helpers
========================= */
const hoyISO = () => new Date().toISOString().slice(0, 10);

export default function ReporteIngresosC() {
  const { token } = useAuth();

  const [vista, setVista] = useState<VistaReporte>("diario");
  const [desde, setDesde] = useState(hoyISO());
  const [hasta, setHasta] = useState(hoyISO());

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const resp = await getCourierIngresosReporte(token, {
        vista,
        desde: vista === "diario" ? desde : undefined,
        hasta: vista === "diario" ? hasta : undefined,
      });

      setData(resp);
    } catch (e: any) {
      setError(e.message || "Error al cargar ingresos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [vista]);

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* FILTROS */}
      <Cardx className="flex flex-wrap gap-4 items-center">
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

        {vista === "diario" && (
          <div className="flex gap-3 items-end">
            <Inputx
              type="date"
              label="Desde"
              value={desde}
              onChange={e => setDesde(e.target.value)}
            />
            <Inputx
              type="date"
              label="Hasta"
              value={hasta}
              onChange={e => setHasta(e.target.value)}
            />
            <Buttonx
              label="Filtrar"
              icon="mdi:filter"
              variant="secondary"
              onClick={fetchData}
            />
          </div>
        )}
      </Cardx>

      {/* KPIs */}
      {data && (
        <Cardx>
          <p className="text-xs text-gray60">Ingresos Totales</p>
          <p className="text-3xl font-semibold">
            S/ {data.kpis.ingresosTotales.toFixed(2)}
          </p>
        </Cardx>
      )}

      {loading && <p className="text-sm text-gray60">Cargando…</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
