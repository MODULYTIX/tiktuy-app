// src/shared/components/courier/zona-tarifaria/TableZonaMine.tsx
import { useEffect, useMemo, useState } from "react";
import Paginator from "../../Paginator";

import { fetchMisZonas } from "@/services/courier/zonaTarifaria/zonaTarifaria.api";
import type { ZonaTarifaria } from "@/services/courier/zonaTarifaria/zonaTarifaria.types";
import { getAuthToken } from "@/services/courier/panel_control/panel_control.api";
import Badgex from "@/shared/common/Badgex";
import TableActionx from "@/shared/common/TableActionx";

type Filters = {
  ciudad: string; // UI: ciudad, en BD es campo distrito
  zona: string;
};

type Props = {
  filters: Filters;
  itemsPerPage?: number;
  onEdit?: (zona: ZonaTarifaria) => void;
  /**
   * Devuelve meta datos para armar filtros:
   *  - distritos: lista única de ciudades (campo distrito)
   *  - zonas: lista única de zona_tarifario
   */
  onLoadedMeta?: (meta: { distritos: string[]; zonas: string[] }) => void;
};

export default function TableZonaMine({
  filters,
  itemsPerPage = 8,
  onEdit,
  onLoadedMeta,
}: Props) {
  const [zonas, setZonas] = useState<ZonaTarifaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Cargar todas mis zonas (todas las sedes de mi courier)
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setErr(null);

      try {
        const token = getAuthToken();
        if (!token)
          throw new Error("No se encontró el token de autenticación.");

        const res = await fetchMisZonas(token);
        if (!mounted) return;

        if (!res.ok) {
          setErr(res.error || "Error al cargar zonas tarifarias.");
          setZonas([]);
          return;
        }

        const data = res.data ?? [];
        setZonas(data);
        setCurrentPage(1);

        // Meta para filtros (distritos = ciudades en UI)
        const distritos = Array.from(
          new Set(data.map((z) => z.distrito).filter(Boolean))
        ) as string[];

        const zonasUnique = Array.from(
          new Set(data.map((z) => z.zona_tarifario).filter(Boolean))
        ) as string[];

        onLoadedMeta?.({
          distritos,
          zonas: zonasUnique,
        });
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || "Error al cargar zonas tarifarias.");
        setZonas([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [onLoadedMeta]);

  // Filtrado en memoria por ciudad (distrito) y zona
  const filteredZonas = useMemo(() => {
    const { ciudad, zona } = filters;

    return zonas.filter((z) => {
      let ok = true;

      if (ciudad) {
        ok = ok && z.distrito === ciudad; // distrito en BD = ciudad en UI
      }
      if (zona) {
        ok = ok && z.zona_tarifario === zona;
      }

      return ok;
    });
  }, [zonas, filters]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredZonas.length / itemsPerPage)),
    [filteredZonas.length, itemsPerPage]
  );

  const currentZonas = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredZonas.slice(start, start + itemsPerPage);
  }, [filteredZonas, currentPage, itemsPerPage]);

  function toNumber(n: unknown): number {
    if (typeof n === "number") return n;
    if (typeof n === "string") {
      const v = parseFloat(n);
      return Number.isFinite(v) ? v : 0;
    }
    return 0;
  }

  function formatMoney(nLike: unknown) {
    const n = toNumber(nLike);
    return n.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  if (loading) {
    return (
      <div className="w-full rounded-md border border-gray30 bg-white p-6 text-[12px] text-gray-600 shadow-default">
        Cargando zonas tarifarias…
      </div>
    );
  }

  if (err) {
    return (
      <div className="w-full rounded-md border border-red-200 bg-red-50 p-6 text-[12px] text-red-700 shadow-default">
        {err}
      </div>
    );
  }

  if (filteredZonas.length === 0) {
    return (
      <div className="w-full rounded-md border border-gray30 bg-white p-6 text-[12px] text-gray-600 shadow-default">
        No hay zonas tarifarias que coincidan con los filtros seleccionados.
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-md border border-gray30 bg-white shadow-default">
      <section className="flex-1 overflow-auto">
        <div className="overflow-x-auto bg-white">
          <table className="min-w-full table-fixed rounded-t-md border-b border-gray30 bg-white text-[12px]">
            <colgroup>
              <col className="w-[26%]" /> {/* Distrito */}
              <col className="w-[18%]" /> {/* Zona */}
              <col className="w-[18%]" /> {/* Tarifa Cliente */}
              <col className="w-[18%]" /> {/* Pago Motorizado */}
              <col className="w-[12%]" /> {/* Estado */}
              <col className="w-[8%]" /> {/* Acciones */}
            </colgroup>

            <thead className="bg-[#E5E7EB]">
              <tr className="font-roboto font-medium text-gray70">
                <th className="px-4 py-3 text-left">Distrito</th>
                <th className="px-4 py-3 text-left">Zona</th>
                <th className="px-4 py-3 text-left">Tarifa de Courier</th>
                <th className="px-4 py-3 text-left">Pago a Motorizado</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray20">
              {currentZonas.map((z) => {
                const estadoNombre = z.estado?.nombre ?? "—";
                const isActivo =
                  (z.estado?.nombre || "").toLowerCase() === "activo";

                const badgeClasses = isActivo
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-slate-50 text-slate-600 border border-slate-200";

                return (
                  <tr key={z.id} className="transition-colors hover:bg-gray10">
                    <td className="px-4 py-3 text-gray80">{z.distrito}</td>
                    <td className="px-4 py-3 text-gray80">
                      {z.zona_tarifario}
                    </td>
                    <td className="px-4 py-3 text-gray80">
                      S/ {formatMoney(z.tarifa_cliente)}
                    </td>
                    <td className="px-4 py-3 text-gray80">
                      S/ {formatMoney(z.pago_motorizado)}
                    </td>
                    <td className="px-4 py-3">
                      <Badgex className={badgeClasses}>{estadoNombre}</Badgex>
                    </td>
                    <td className="px-4 py-3">
                      <TableActionx
                        variant="edit"
                        title="Editar zona"
                        onClick={() => onEdit?.(z)}
                        size="sm"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {totalPages > 1 && (
        <div className="border-t bg-white px-4 py-3">
          <Paginator
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              if (page >= 1 && page <= totalPages) setCurrentPage(page);
            }}
          />
        </div>
      )}
    </div>
  );
}
