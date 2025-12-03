// src/shared/components/courier/movimiento/TableMovimientoCourier.tsx
import { useEffect, useMemo, useState } from "react";
import { FaEye, FaCheck } from "react-icons/fa";
import { useAuth } from "@/auth/context/useAuth";

import {
  fetchCourierMovimientos,
} from "@/services/courier/movimiento/movimientoCourier.api";

import type {
  CourierMovimientoItem,
  CourierMovimientosResponse,
} from "@/services/courier/movimiento/movimientoCourier.type";

import type { MovimientoCourierFilters } from "../../movimiento/MovimientoFilterCourier";

// Modales
import ValidarMovimientoCourierModal from "./ValidarMovimientoCourierModal";
import DetallesMovimientoCourierModal from "./MovimientoCourierModal";
import Badgex from "@/shared/common/Badgex";

interface Props {
  filters: MovimientoCourierFilters;
}

export default function TableMovimientoCourier({ filters }: Props) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<CourierMovimientoItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // paginación local
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // estado modal
  const [openModal, setOpenModal] = useState(false);
  const [modalUuid, setModalUuid] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"ver" | "validar">("ver");

  const load = () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    fetchCourierMovimientos(token, { page: 1, limit: 500 })
      .then((res: CourierMovimientosResponse) => {
        setItems(res.items || []);
      })
      .catch((e) => setError(e?.message || "Error al obtener movimientos"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // reset a primera página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.estado, filters.fecha, filters.q]);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const fechaStr = filters.fecha; // YYYY-MM-DD
    const estadoSel = filters.estado.trim().toLowerCase();

    return items.filter((it) => {
      const byEstado = estadoSel
        ? (it.estado?.nombre || "").toLowerCase() === estadoSel
        : true;

      const byFecha = fechaStr
        ? new Date(it.fecha_movimiento).toISOString().slice(0, 10) === fechaStr
        : true;

      const textHaystack = [
        it.descripcion || "",
        it.almacen_origen?.nombre_almacen || "",
        it.almacen_destino?.nombre_almacen || "",
      ]
        .join(" ")
        .toLowerCase();

      const byQ = q ? textHaystack.includes(q) : true;

      return byEstado && byFecha && byQ;
    });
  }, [items, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentMovimientos = filtered.slice(indexOfFirst, indexOfLast);

  // badge estado
  const renderEstado = (estado?: string) => {
  const name = (estado || "").toLowerCase();

  if (name === "validado")
    return (
      <Badgex className="bg-green-100 text-green-700">
        Validado
      </Badgex>
    );

  if (name === "proceso" || name === "en proceso")
    return (
      <Badgex className="bg-yellow-100 text-yellow-700">
        Proceso
      </Badgex>
    );

  if (name === "observado")
    return (
      <Badgex className="bg-red-100 text-red-700">
        Observado
      </Badgex>
    );

  return (
    <Badgex className="bg-blue-100 text-blue-700">
      {estado || "-"}
    </Badgex>
  );
};



  const fmtFecha = (iso: string) =>
    new Intl.DateTimeFormat("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(iso));

  const codigoFromUuid = (uuid: string) =>
    uuid ? uuid.slice(0, 8).toUpperCase() : "-";

  const openView = (uuid: string) => {
    setModalUuid(uuid);
    setModalMode("ver");
    setOpenModal(true);
  };

  const openValidate = (uuid: string) => {
    setModalUuid(uuid);
    setModalMode("validar");
    setOpenModal(true);
  };

  // paginador
  const pagerItems = useMemo(() => {
    const maxButtons = 5;
    const pages: (number | string)[] = [];

    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);

      if (currentPage <= 3) {
        start = 1;
        end = maxButtons;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - (maxButtons - 1);
        end = totalPages;
      }

      for (let i = start; i <= end; i++) pages.push(i);
      if (start > 1) {
        pages.unshift("...");
        pages.unshift(1);
      }
      if (end < totalPages) {
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  }, [currentPage, totalPages]);

  const visibleCount = Math.max(1, currentMovimientos.length);
  const emptyRows = Math.max(0, itemsPerPage - visibleCount);

  return (
    <>
      <div className="bg-white rounded-md overflow-hidden shadow-default">
        {loading && (
          <div className="px-4 py-3 text-sm text-gray-500">
            Cargando movimientos…
          </div>
        )}
        {error && !loading && (
          <div className="px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {!loading && !error && (
          <section className="flex-1 overflow-auto">
            <div className="overflow-x-auto bg-white">
              <table className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30 rounded-t-md">
                <colgroup>
                  <col className="w-[12%]" />
                  <col className="w-[18%]" />
                  <col className="w-[18%]" />
                  <col className="w-[28%]" />
                  <col className="w-[12%]" />
                  <col className="w-[6%]" />
                  <col className="w-[6%]" />
                </colgroup>

                <thead className="bg-[#E5E7EB]">
                  <tr className="text-gray70 font-roboto font-medium">
                    <th className="px-4 py-3 text-left">CÓDIGO</th>
                    <th className="px-4 py-3 text-left">DESDE</th>
                    <th className="px-4 py-3 text-left">HACIA</th>
                    <th className="px-4 py-3 text-left">DESCRIPCIÓN</th>
                    <th className="px-4 py-3 text-left">FEC. GENERACIÓN</th>
                    <th className="px-4 py-3 text-center">ESTADO</th>
                    <th className="px-4 py-3 text-center">ACCIONES</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray20">
                  {currentMovimientos.map((mov) => (
                    <tr
                      key={mov.id}
                      className="hover:bg-gray10 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray70 font-[400]">
                        {codigoFromUuid(mov.uuid)}
                      </td>
                      <td className="px-4 py-3 text-gray70 font-[400]">
                        {mov.almacen_origen?.nombre_almacen || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray70 font-[400]">
                        {mov.almacen_destino?.nombre_almacen || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray70 font-[400]">
                        {mov.descripcion || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray70 font-[400]">
                        {fmtFecha(mov.fecha_movimiento)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {renderEstado(mov.estado?.nombre)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-3">
                          {(mov.estado?.nombre || "").toLowerCase() ===
                            "proceso" && (
                            <button
                              className="text-green-600 hover:text-green-700"
                              title="Validar"
                              onClick={() => openValidate(mov.uuid)}
                              aria-label={`Validar ${codigoFromUuid(
                                mov.uuid
                              )}`}
                            >
                              <FaCheck />
                            </button>
                          )}
                          <button
                            className="text-blue-600 hover:text-blue-800"
                            title="Ver detalle"
                            onClick={() => openView(mov.uuid)}
                            aria-label={`Ver ${codigoFromUuid(mov.uuid)}`}
                          >
                            <FaEye />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {emptyRows > 0 &&
                    Array.from({ length: emptyRows }).map((_, idx) => (
                      <tr key={`empty-${idx}`} className="hover:bg-transparent">
                        {Array.from({ length: 7 }).map((__, i) => (
                          <td key={i} className="px-4 py-3">
                            &nbsp;
                          </td>
                        ))}
                      </tr>
                    ))}

                  {currentMovimientos.length === 0 && (
                    <tr>
                      <td
                        className="px-4 py-6 text-center text-gray70 italic"
                        colSpan={7}
                      >
                        No hay resultados para los filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filtered.length > 0 && (
              <div className="flex items-center justify-end gap-2 border-b-[4px] border-gray90 py-3 px-3 mt-2">
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.max(1, p - 1))
                  }
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
                >
                  &lt;
                </button>

                {pagerItems.map((p, i) =>
                  typeof p === "string" ? (
                    <span key={`dots-${i}`} className="px-2 text-gray70">
                      {p}
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      aria-current={
                        currentPage === p ? "page" : undefined
                      }
                      className={[
                        "w-8 h-8 flex items-center justify-center rounded",
                        currentPage === p
                          ? "bg-gray90 text-white"
                          : "bg-gray10 text-gray70 hover:bg-gray20",
                      ].join(" ")}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(totalPages, p + 1)
                    )
                  }
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
                >
                  &gt;
                </button>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Modales */}
      {openModal && modalUuid && modalMode === "validar" && (
        <ValidarMovimientoCourierModal
          open={openModal}
          uuid={modalUuid}
          onClose={() => setOpenModal(false)}
          onValidated={() => {
            setOpenModal(false);
            load();
          }}
        />
      )}

      {openModal && modalUuid && modalMode === "ver" && (
        <DetallesMovimientoCourierModal
          open={openModal}
          uuid={modalUuid}
          onClose={() => setOpenModal(false)}
        />
      )}
    </>
  );
}
