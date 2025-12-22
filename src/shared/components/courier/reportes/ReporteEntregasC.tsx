import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/context";

import Buttonx from "@/shared/common/Buttonx";
import { Inputx } from "@/shared/common/Inputx";
import Cardx from "@/shared/common/Cards";

import { getCourierEntregasReporte } from "@/services/courier/reporte/reporteCourier.api";
import type { VistaReporte } from "@/services/ecommerce/reportes/ecommerceReportes.types";
import type {
  CourierEntregasReporteResp,
  CourierEntregaDonutItem,
  CourierMotorizadoItem,
} from "@/services/courier/reporte/reporteCourier.types";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Icon } from "@iconify/react";

/* ========================= */
const hoyISO = () => new Date().toISOString().slice(0, 10);

const COLORS = [
  "#22c55e",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#6366f1",
];

export default function ReporteEntregasC() {
  const { token } = useAuth();

  const [vista, setVista] = useState<VistaReporte>("diario");
  const [desde, setDesde] = useState(hoyISO());
  const [hasta, setHasta] = useState(hoyISO());

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CourierEntregasReporteResp | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* =========================
     Fetch
  ========================= */
  const fetchData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const resp = await getCourierEntregasReporte(token, {
        vista,
        desde: vista === "diario" ? desde : undefined,
        hasta: vista === "diario" ? hasta : undefined,
      });

      setData(resp);
    } catch (e: any) {
      setError(e.message || "Error al cargar entregas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista]);

  /* =========================
     Derived data
  ========================= */
  const donutData: CourierEntregaDonutItem[] = useMemo(
    () => data?.donut ?? [],
    [data]
  );

  const motorizados: CourierMotorizadoItem[] = useMemo(
    () => data?.motorizados ?? [],
    [data]
  );

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* ================= FILTROS ================= */}
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

      {/* ================= DONUT ================= */}
      {data && (
        <Cardx>
          <div className="flex items-center gap-2 mb-4">
            <Icon icon="mdi:chart-donut" className="text-indigo-500" />
            <p className="text-sm font-medium">Estado de entregas</p>
          </div>

          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={60}
                  outerRadius={100}
                >
                  {donutData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Cardx>
      )}

      {/* ================= MOTORIZADOS ================= */}
      {motorizados.length > 0 && (
        <Cardx>
          <div className="flex items-center gap-2 mb-3">
            <Icon icon="mdi:motorbike" className="text-indigo-500" />
            <p className="text-sm font-medium">Motorizados</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {motorizados.map(m => (
              <span
                key={m.motorizadoId}
                className="px-4 py-1.5 rounded-full bg-gray10 text-sm font-medium"
              >
                {m.motorizado}
              </span>
            ))}
          </div>
        </Cardx>
      )}

      {loading && <p className="text-sm text-gray60">Cargando…</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
