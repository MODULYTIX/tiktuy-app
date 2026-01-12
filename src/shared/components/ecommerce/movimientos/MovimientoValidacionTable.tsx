// src/shared/components/ecommerce/movimientos/MovimientoValidacionTable.tsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/context";
import {
  fetchMovimientos,
  fetchAlmacenesEcommerCourier,
} from "@/services/ecommerce/almacenamiento/almacenamiento.api";
import type {
  MovimientoAlmacen,
  Almacenamiento,
} from "@/services/ecommerce/almacenamiento/almacenamiento.types";
import VerMovimientoRealizadoModal from "./VerMovimientoRealizadoModal";
import { useNotification } from "@/shared/context/notificacionesDeskop/useNotification";
import ValidarMovimientoModal from "./modal/MovimientoValidacionModal";
import Badgex from "@/shared/common/Badgex";
import type { MovimientoEcommerceFilters } from "./MoviminentoValidadoFilter";
import ModalSlideRight from "@/shared/common/ModalSlideRight";
import TableActionx from "@/shared/common/TableActionx";

const PAGE_SIZE = 6;

interface Props {
  filters: MovimientoEcommerceFilters;
  refreshTrigger?: number;
}

export default function MovimientoValidacionTable({ filters, refreshTrigger = 0 }: Props) {
  const { token } = useAuth();
  const { notify } = useNotification();

  const [movimientos, setMovimientos] = useState<MovimientoAlmacen[]>([]);
  const [loading, setLoading] = useState(false);

  // Diccionarios para saber qué almacén es mío (Ecommerce) y cuál es Courier
  const [idsEcommerce, setIdsEcommerce] = useState<Set<number>>(new Set());
  const [idsCourier, setIdsCourier] = useState<Set<number>>(new Set());

  // modal "ver" (NO TOCAR)
  const [verOpen, setVerOpen] = useState(false);
  const [verUuid, setVerUuid] = useState<string | null>(null);

  // modal "validar" (SLIDE RIGHT)
  const [validarOpen, setValidarOpen] = useState(false);
  const [movAValidar, setMovAValidar] = useState<MovimientoAlmacen | null>(
    null
  );

  // paginación
  const [page, setPage] = useState(1);

  // Close helper validar
  const closeValidar = () => {
    setValidarOpen(false);
    setMovAValidar(null);
  };

  useEffect(() => {
    if (!token) return;

    const ac = new AbortController();
    let alive = true;

    (async () => {
      try {
        setLoading(true);

        const [respMovs, respAlms] = await Promise.all([
          fetchMovimientos(token),
          fetchAlmacenesEcommerCourier(token).catch(() => null),
        ]);

        if (!alive || ac.signal.aborted) return;

        // 1. Movimientos
        const list = Array.isArray(respMovs)
          ? respMovs
          : Array.isArray((respMovs as any)?.data)
            ? (respMovs as any).data
            : [];
        setMovimientos(list);

        // 2. Almacenes -> Roles
        if (respAlms) {
          const ecomIds = new Set(respAlms.ecommerce.map((a: Almacenamiento) => a.id));
          const courIds = new Set(respAlms.courier.map((a: Almacenamiento) => a.id));
          setIdsEcommerce(ecomIds);
          setIdsCourier(courIds);
        }

      } catch (err) {
        console.error(err);
        notify("No se pudieron cargar los movimientos.", "error");
        setMovimientos([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      ac.abort();
    };
  }, [token, notify, refreshTrigger]);

  // Alias: Activo → Proceso
  const normalizeEstado = (nombre?: string) => {
    if (!nombre) return "-";
    if (nombre.toLowerCase() === "activo") return "Proceso";
    return nombre;
  };

  const renderEstado = (estado?: { nombre?: string }) => {
    const nombreNorm = normalizeEstado(estado?.nombre);
    const k = nombreNorm.toLowerCase();

    if (k === "validado") {
      return <Badgex className="bg-gray90 text-white">{nombreNorm}</Badgex>;
    }
    if (k === "proceso" || k === "en proceso") {
      return (
        <Badgex className="bg-yellow-100 text-yellow-700">{nombreNorm}</Badgex>
      );
    }
    if (k === "observado") {
      return <Badgex className="bg-red-100 text-red-700">{nombreNorm}</Badgex>;
    }
    return <Badgex className="bg-gray30 text-gray80">{nombreNorm}</Badgex>;
  };

  const fmtFecha = (iso?: string) =>
    iso
      ? new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(iso))
      : "-";

  const handleVerClick = (mov: MovimientoAlmacen) => {
    setVerUuid(mov.uuid);
    setVerOpen(true);
  };

  const handleAbrirValidar = (mov: MovimientoAlmacen) => {
    const estado = normalizeEstado(mov.estado?.nombre).toLowerCase();
    if (estado !== "proceso" && estado !== "en proceso") return;
    setMovAValidar(mov);
    setValidarOpen(true);
  };

  const mergeMovimientoActualizado = (up: MovimientoAlmacen) => {
    setMovimientos((prev) => prev.map((m) => (m.uuid === up.uuid ? up : m)));
    closeValidar();
  };

  // FILTROS
  const filtrados = useMemo(() => {
    return movimientos.filter((m) => {
      const estadoNorm = normalizeEstado(m.estado?.nombre);

      // por estado
      if (filters.estado && estadoNorm !== filters.estado) return false;

      // por fecha
      if (filters.fecha) {
        const movFecha = (m.fecha_movimiento ?? "").slice(0, 10);
        if (movFecha !== filters.fecha) return false;
      }

      // por texto libre
      if (filters.q) {
        const q = filters.q.toLowerCase();
        const hit =
          m.uuid.toLowerCase().includes(q) ||
          (m.descripcion ?? "").toLowerCase().includes(q) ||
          (m.almacen_origen?.nombre_almacen ?? "").toLowerCase().includes(q) ||
          (m.almacen_destino?.nombre_almacen ?? "").toLowerCase().includes(q);

        if (!hit) return false;
      }

      return true;
    });
  }, [movimientos, filters]);

  // ORDENAR
  const sorted = useMemo(
    () =>
      [...filtrados].sort((a, b) =>
        new Date(a.fecha_movimiento ?? "").getTime() <
          new Date(b.fecha_movimiento ?? "").getTime()
          ? 1
          : -1
      ),
    [filtrados]
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const current = sorted.slice(start, start + PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagerItems = useMemo(() => {
    const maxButtons = 5;
    const pages: (number | string)[] = [];

    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let startP = Math.max(1, page - 2);
      let endP = Math.min(totalPages, page + 2);

      if (page <= 3) {
        startP = 1;
        endP = maxButtons;
      } else if (page >= totalPages - 2) {
        startP = totalPages - (maxButtons - 1);
        endP = totalPages;
      }

      for (let i = startP; i <= endP; i++) pages.push(i);

      if (startP > 1) {
        pages.unshift("...");
        pages.unshift(1);
      }
      if (endP < totalPages) {
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  }, [page, totalPages]);

  const emptyRows = Math.max(0, PAGE_SIZE - current.length);

  return (
    <div className="bg-white rounded-md overflow-hidden shadow-default mt-4">
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
                <th className="px-4 py-3 text-left">FEC. MOVIMIENTO</th>
                <th className="px-4 py-3 text-center">ESTADO</th>
                <th className="px-4 py-3 text-center">ACCIONES</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray20">
              {current.map((m) => {
                const estadoNorm = normalizeEstado(
                  m.estado?.nombre
                ).toLowerCase();

                // Regla de negocio mejorada (via IDs):
                const idOrigen = m.almacen_origen.id;
                const idDestino = m.almacen_destino.id;

                // Es Ecommerce -> Courier si origen es MIO (Ecommerce) y destino es MIO (Courier asociado)
                const isOrigenMyEcom = idsEcommerce.has(idOrigen);
                const isDestinoMyCourier = idsCourier.has(idDestino);

                const esEnvioACourier = isOrigenMyEcom && isDestinoMyCourier;

                const puedeValidar =
                  (estadoNorm === "proceso" || estadoNorm === "en proceso") &&
                  !esEnvioACourier;

                return (
                  <tr
                    key={m.uuid}
                    className="hover:bg-gray10 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray70 font-normal">
                      {m.uuid.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-gray70 font-normal">
                      {m.almacen_origen?.nombre_almacen || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray70 font-normal">
                      {m.almacen_destino?.nombre_almacen || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray70 font-normal">
                      {m.descripcion || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray70 font-normal">
                      {fmtFecha(m.fecha_movimiento)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {renderEstado(m.estado)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-3">
                        {/* Ver */}
                        <TableActionx
                          variant="view"
                          title="Ver detalle"
                          onClick={() => handleVerClick(m)}
                          size="sm"
                        />

                        {/* Validar */}
                        {puedeValidar && (
                          <TableActionx
                            variant="custom"
                            title="Validar movimiento"
                            icon="ci:check-big"
                            colorClassName="bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 hover:bg-emerald-200 hover:ring-emerald-400 focus-visible:ring-emerald-500"
                            onClick={() => handleAbrirValidar(m)}
                            size="sm"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Relleno */}
              {emptyRows > 0 &&
                Array.from({ length: emptyRows }).map((_, idx) => (
                  <tr key={`empty-${idx}`}>
                    {Array.from({ length: 7 }).map((__, i) => (
                      <td key={i} className="px-4 py-3">
                        &nbsp;
                      </td>
                    ))}
                  </tr>
                ))}

              {!loading && current.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-gray70 italic"
                    colSpan={7}
                  >
                    No hay movimientos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginador */}
        {sorted.length > 0 && (
          <div className="flex items-center justify-end gap-2 border-b border-gray90 py-3 px-3 mt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50"
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
                  onClick={() => setPage(p)}
                  className={
                    page === p
                      ? "w-8 h-8 rounded bg-gray90 text-white"
                      : "w-8 h-8 rounded bg-gray10 text-gray70 hover:bg-gray20"
                  }
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50"
            >
              &gt;
            </button>
          </div>
        )}
      </section>

      {/* Modal de VER (NO TOCAR) */}
      <VerMovimientoRealizadoModal
        open={verOpen}
        onClose={() => {
          setVerOpen(false);
          setVerUuid(null);
        }}
        uuid={verUuid ?? ""}
      />

      {/* Modal de VALIDAR (SLIDE RIGHT) */}
      <ModalSlideRight open={validarOpen} onClose={closeValidar}>
        <ValidarMovimientoModal
          open={validarOpen}
          onClose={closeValidar}
          movimiento={movAValidar}
          onValidated={mergeMovimientoActualizado}
        />
      </ModalSlideRight>
    </div>
  );
}
