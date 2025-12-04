import { useEffect, useMemo, useState } from "react";
import { FaRegEdit } from "react-icons/fa";
import Paginator from "../../Paginator";

import { fetchZonasBySedePrivado } from "@/services/courier/zonaTarifaria/zonaTarifaria.api";
import type { ZonaTarifaria } from "@/services/courier/zonaTarifaria/zonaTarifaria.types";
import { getAuthToken } from "@/services/courier/panel_control/panel_control.api";

type Props = {
  sedeId: number;          // <-- antes courierId
  itemsPerPage?: number;
  onEdit?: (zona: ZonaTarifaria) => void;
};

export default function TableZonaCourier({
  sedeId,
  itemsPerPage = 6,
  onEdit,
}: Props) {
  const [zonas, setZonas] = useState<ZonaTarifaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const token = getAuthToken();
        if (!token) throw new Error("No se encontró el token de autenticación.");

        const res = await fetchZonasBySedePrivado(sedeId, token);
        if (!mounted) return;
        if (!res.ok) {
          setErr(res.error || "Error al cargar zonas tarifarias.");
          setZonas([]);
          return;
        }
        setZonas(res.data ?? []);
        setCurrentPage(1); // reset paginación al recargar
      } catch (e: any) {
        if (!mounted) return;
        if (e?.name === "AbortError") return;
        setErr(e?.message || "Error al cargar zonas tarifarias.");
        setZonas([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    // Si por alguna razón viene un sedeId inválido, evitamos llamar al backend
    if (sedeId) {
      load();
    } else {
      setZonas([]);
      setLoading(false);
      setErr("Sede no seleccionada.");
    }

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [sedeId]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(zonas.length / itemsPerPage)),
    [zonas.length, itemsPerPage]
  );

  const currentZonas = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return zonas.slice(start, start + itemsPerPage);
  }, [zonas, currentPage, itemsPerPage]);

  /** Convierte DecimalJSON (number | string) a number */
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

  function EstadoPill({ nombre }: { nombre?: string | null }) {
    const text = nombre ?? "—";
    const isActivo = (nombre || "").toLowerCase() === "activo";
    const cls = isActivo
      ? "bg-green-100 text-green-800 border border-green-200"
      : "bg-gray-100 text-gray-700 border border-gray-200";
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs ${cls}`}>{text}</span>
    );
  }

  if (loading) {
    return (
      <div className="w-full bg-white rounded-lg shadow p-6 text-sm text-gray-600">
        Cargando zonas tarifarias…
      </div>
    );
  }

  if (err) {
    return (
      <div className="w-full bg-white rounded-lg shadow p-6 text-sm text-red-700">
        {err}
      </div>
    );
  }

  if (zonas.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg shadow p-6 text-sm text-gray-600">
        No hay zonas tarifarias registradas.
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-sm text-left text-gray-600">
        <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
          <tr>
            <th className="px-4 py-3">Distrito</th>
            <th className="px-4 py-3">Zona</th>
            <th className="px-4 py-3">Tarifa Cliente</th>
            <th className="px-4 py-3">Pago a Motorizado</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {currentZonas.map((z) => (
            <tr key={z.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3">{z.distrito}</td>
              <td className="px-4 py-3">{z.zona_tarifario}</td>
              <td className="px-4 py-3">S/ {formatMoney(z.tarifa_cliente)}</td>
              <td className="px-4 py-3">S/ {formatMoney(z.pago_motorizado)}</td>
              <td className="px-4 py-3">
                <EstadoPill nombre={z.estado?.nombre} />
              </td>
              <td className="px-4 py-3">
                <button
                  className="inline-flex items-center gap-1 text-orange-500 hover:text-orange-700"
                  onClick={() => onEdit?.(z)}
                  title="Editar zona"
                >
                  <FaRegEdit />
                  <span className="sr-only">Editar</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="border-t p-4">
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
