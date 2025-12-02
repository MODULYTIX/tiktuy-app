import { useEffect, useMemo, useState } from "react";
import { FaRegEdit } from "react-icons/fa";
import Paginator from "../../Paginator";
import { fetchMisZonas } from "@/services/courier/zonaTarifaria/zonaTarifaria.api";
import type { ZonaTarifaria } from "@/services/courier/zonaTarifaria/zonaTarifaria.types";
import { getAuthToken } from "@/services/courier/panel_control/panel_control.api";
import Badgex from "@/shared/common/Badgex";

type Filters = {
  distrito?: string;
  zona?: string;
};

type Props = {
  itemsPerPage?: number;
  onEdit?: (zona: ZonaTarifaria) => void;
  filters?: Filters;
  onLoadedMeta?: (meta: { distritos: string[]; zonas: string[] }) => void;
};

export default function TableZonaMine({
  itemsPerPage = 6,
  onEdit,
  filters,
  onLoadedMeta,
}: Props) {
  const [zonas, setZonas] = useState<ZonaTarifaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let mounted = true;
    (async () => {
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

        // meta para los filtros
        const distritos = Array.from(
          new Set(
            data
              .map((z) => (z.distrito ?? "").toString().trim())
              .filter(Boolean)
          )
        ).sort((a, b) => a.localeCompare(b, "es"));
        const zonasVals = Array.from(
          new Set(
            data
              .map((z) => (z.zona_tarifario ?? "").toString().trim())
              .filter(Boolean)
          )
        ).sort((a, b) => a.localeCompare(b, "es"));
        onLoadedMeta?.({ distritos, zonas: zonasVals });
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || "Error al cargar zonas tarifarias.");
        setZonas([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [onLoadedMeta]);

  // Filtros
  const filteredZonas = useMemo(() => {
    const d = (filters?.distrito ?? "").trim().toLowerCase();
    const zf = (filters?.zona ?? "").trim().toLowerCase();
    if (!d && !zf) return zonas;

    return zonas.filter((z) => {
      const distrito = (z.distrito ?? "").toString().trim().toLowerCase();
      const zonaTar = (z.zona_tarifario ?? "").toString().trim().toLowerCase();
      const okD = d ? distrito === d : true;
      const okZ = zf ? zonaTar === zf : true;
      return okD && okZ;
    });
  }, [zonas, filters?.distrito, filters?.zona]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters?.distrito, filters?.zona]);

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

  if (loading)
    return (
      <div className="w-full bg-white rounded-md shadow-default p-6 text-[12px] text-gray-600">
        Cargando zonas tarifarias…
      </div>
    );
  if (err)
    return (
      <div className="w-full bg-white rounded-md shadow-default p-6 text-[12px] text-red-700">
        {err}
      </div>
    );
  if (zonas.length === 0)
    return (
      <div className="w-full bg-white rounded-md shadow-default p-6 text-[12px] text-gray-600">
        No hay zonas tarifarias registradas.
      </div>
    );

  return (
    <div className="bg-white rounded-md overflow-hidden shadow-default">
      <section className="flex-1 overflow-auto">
        <div className="overflow-x-auto bg-white">
          <table className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30 rounded-t-md">
            <colgroup>
              <col className="w-[28%]" />
              <col className="w-[12%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
            </colgroup>

            <thead className="bg-[#E5E7EB]">
              <tr className="text-gray70 font-roboto font-medium">
                <th className="px-4 py-3 text-left">DISTRITO</th>
                <th className="px-4 py-3 text-left">ZONA</th>
                <th className="px-4 py-3 text-left">TARIFA CLIENTE</th>
                <th className="px-4 py-3 text-left">PAGO MOTORIZADO</th>
                <th className="px-4 py-3 text-center">ESTADO</th>
                <th className="px-4 py-3 text-center">ACCIONES</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray20">
              {currentZonas.map((z) => (
                <tr key={z.id} className="hover:bg-gray10 transition-colors">
                  <td className="px-4 py-3 text-gray70 font-[400]">
                    {z.distrito || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray70 font-[400]">
                    {z.zona_tarifario || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray70 font-[400]">
                    S/ {formatMoney(z.tarifa_cliente)}
                  </td>
                  <td className="px-4 py-3 text-gray70 font-[400]">
                    S/ {formatMoney(z.pago_motorizado)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badgex
                      className={
                        (z.estado?.nombre || "").toLowerCase() === "activo"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }
                    >
                      {z.estado?.nombre ?? "—"}
                    </Badgex>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      <button
                        className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700"
                        onClick={() => onEdit?.(z)}
                        title="Editar zona"
                        aria-label={`Editar ${z.distrito ?? ""} ${
                          z.zona_tarifario ?? ""
                        }`}
                      >
                        <FaRegEdit />
                        <span className="sr-only">Editar</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {currentZonas.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-gray70 italic"
                    colSpan={6}
                  >
                    No hay resultados para los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Barra inferior/paginación estilo guardado */}
        {totalPages > 1 && (
          <Paginator
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              if (page >= 1 && page <= totalPages) setCurrentPage(page);
            }}
            appearance="grayRounded"
            showArrows
            containerClassName="flex items-center justify-end gap-2 border-b-[4px] border-gray90 py-3 px-3 mt-2"
          />
        )}
      </section>
    </div>
  );
}
