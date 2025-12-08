import { useEffect, useMemo, useState } from "react";
import { FaEye } from "react-icons/fa";
import { useAuth } from "@/auth/context";
import { fetchMovimientos } from "@/services/ecommerce/almacenamiento/almacenamiento.api";
import type { MovimientoAlmacen } from "@/services/ecommerce/almacenamiento/almacenamiento.types";
import VerMovimientoRealizadoModal from "./VerMovimientoRealizadoModal";
import { useNotification } from "@/shared/context/notificacionesDeskop/useNotification";
import ValidarMovimientoModal from "./modal/MovimientoValidacionModal";
import { Icon } from "@iconify/react/dist/iconify.js";
import Badgex from "@/shared/common/Badgex";

const PAGE_SIZE = 6;

export default function MovimientoValidacionTable() {
  const { token } = useAuth();
  const { notify } = useNotification();

  const [movimientos, setMovimientos] = useState<MovimientoAlmacen[]>([]);
  const [loading, setLoading] = useState(false);

  // modal "ver"
  const [verOpen, setVerOpen] = useState(false);
  const [verUuid, setVerUuid] = useState<string | null>(null);

  // modal "validar"
  const [validarOpen, setValidarOpen] = useState(false);
  const [movAValidar, setMovAValidar] = useState<MovimientoAlmacen | null>(
    null
  );

  // paginación local
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!token) return;

    const ac = new AbortController();
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const resp = await fetchMovimientos(token);
        if (!alive || ac.signal.aborted) return;

        // Normaliza aquí por si el client no lo hace
        const list = Array.isArray(resp)
          ? resp
          : Array.isArray((resp as any)?.data)
          ? (resp as any).data
          : [];
        setMovimientos(list);
      } catch (err) {
        console.error(err);
        // No incluyas notify en deps; úsalo aquí sin meterlo en el array
        // (si tu linter se queja, desactiva la regla para esta línea)
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }, [token]); 

  // Alias de compatibilidad: "Activo" → "Proceso"
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

  // actualizar el ítem en la tabla cuando el modal devuelva el movimiento cerrado
  const mergeMovimientoActualizado = (up: MovimientoAlmacen) => {
    setMovimientos((prev) => prev.map((m) => (m.uuid === up.uuid ? up : m)));
    // cerrar modal
    setValidarOpen(false);
    setMovAValidar(null);
  };

  const sorted = useMemo(
    () =>
      [...movimientos].sort((a, b) =>
        new Date((a?.fecha_movimiento as unknown as string) ?? 0).getTime() <
        new Date((b?.fecha_movimiento as unknown as string) ?? 0).getTime()
          ? 1
          : -1
      ),
    [movimientos]
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const current = sorted.slice(start, start + PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // paginador estilo base (ventana de 5 con elipsis)
  const pagerItems = useMemo(() => {
    const maxButtons = 5;
    const pages: (number | string)[] = [];
    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, page - 2);
      let end = Math.min(totalPages, page + 2);
      if (page <= 3) {
        start = 1;
        end = maxButtons;
      } else if (page >= totalPages - 2) {
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
  }, [page, totalPages]);

  // altura constante
  const visibleCount = Math.max(1, current.length);
  const emptyRows = Math.max(0, PAGE_SIZE - visibleCount);

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
                const puedeValidar =
                  estadoNorm === "proceso" || estadoNorm === "en proceso";

                return (
                  <tr
                    key={m.uuid}
                    className="hover:bg-gray10 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray70 font-[400]">
                      {m.uuid.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-gray70 font-[400]">
                      {m.almacen_origen?.nombre_almacen || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray70 font-[400]">
                      {m.almacen_destino?.nombre_almacen || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray70 font-[400]">
                      {m.descripcion || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray70 font-[400]">
                      {fmtFecha(m.fecha_movimiento as unknown as string)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {renderEstado(m.estado)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-3">
                        {/* Ver */}
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => handleVerClick(m)}
                          title="Ver detalle"
                          aria-label={`Ver ${m.uuid}`}
                        >
                          <FaEye />
                        </button>

                        {/* Validar: mostrar SOLO si está en Proceso, como un checkbox sin marcar */}
                        {puedeValidar && (
                          <button
                            className="text-emerald-600 hover:text-emerald-800"
                            onClick={() => handleAbrirValidar(m)}
                            title="Validar movimiento"
                            aria-label={`Validar ${m.uuid}`}
                          >
                            <Icon icon="ci:check-big" width="18" height="18" />{" "}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Relleno */}
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
          <div className="flex items-center justify-end gap-2 border-b-[4px] border-gray90 py-3 px-3 mt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
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
                  onClick={() => setPage(p)}
                  aria-current={page === p ? "page" : undefined}
                  className={[
                    "w-8 h-8 flex items-center justify-center rounded",
                    page === p
                      ? "bg-gray90 text-white"
                      : "bg-gray10 text-gray70 hover:bg-gray20",
                  ].join(" ")}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
            >
              &gt;
            </button>
          </div>
        )}
      </section>

      {/* Modal de VER */}
      <VerMovimientoRealizadoModal
        open={verOpen}
        onClose={() => {
          setVerOpen(false);
          setVerUuid(null);
        }}
        uuid={verUuid ?? ""}
      />

      {/* Modal de VALIDAR */}
      <ValidarMovimientoModal
        open={validarOpen}
        onClose={() => {
          setValidarOpen(false);
          setMovAValidar(null);
        }}
        movimiento={movAValidar}
        onValidated={mergeMovimientoActualizado}
      />
    </div>
  );
}
