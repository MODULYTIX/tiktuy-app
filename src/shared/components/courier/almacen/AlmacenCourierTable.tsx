// shared/components/courier/almacen/AlmacenCourierTable.tsx
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import type { AlmacenamientoCourier } from "@/services/courier/almacen/almacenCourier.type";
import Badgex from "@/shared/common/Badgex";

type Props = {
  items: AlmacenamientoCourier[];
  loading: boolean;
  error?: string;
  onView?: (row: AlmacenamientoCourier) => void;
  onEdit: (row: AlmacenamientoCourier) => void;
  /** Llamado cuando el estado del representante es "pendiente" y el usuario hace click en Reenviar */
  onResendInvite?: (row: AlmacenamientoCourier) => void;
};

const PAGE_SIZE = 5;

function formatDate(iso?: string) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return iso;
  }
}

/** Deducción best-effort del estado del representante.
 *  Si tu backend ya devuelve un campo explícito, reemplaza esta lógica. */
function getRepresentanteEstado(row: AlmacenamientoCourier): "asignado" | "pendiente" {
  const anyRow = row as any;
  // Si el backend incluye 'representante_usuario_id' o un 'representante' poblado:
  if (anyRow?.representante_usuario_id || anyRow?.representante) return "asignado";
  // Si llega un flag/estado específico úsalo; esto es por compatibilidad:
  if (anyRow?.representante_estado === "asignado") return "asignado";
  return "pendiente";
}

export default function AlmacenCourierTable({
  items,
  loading,
  error,
  onEdit,
  onResendInvite,
}: Props) {
  const [page, setPage] = useState(1);

  // Volver a la primera página cuando llegan nuevos items
  useEffect(() => {
    setPage(1);
  }, [items]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(items.length / PAGE_SIZE)),
    [items.length]
  );

  const currentData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [page, items]);

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
  }, [totalPages, page]);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    setPage(p);
  };

  // columnas sin nodos de texto en <colgroup>
  const colDefs = useMemo(
    () => [
      { key: "nombre", className: "w-[30%]" },   // Nom. Sede (con fecha)
      { key: "depto", className: "w-[17%]" },    // Departamento
      { key: "ciudad", className: "w-[16%]" },   // Ciudad
      { key: "dir", className: "w-[23%]" },      // Dirección
      { key: "rep", className: "w-[9%]" },       // Representante (badge)
      { key: "acc", className: "w-[5%]" },       // Acciones
    ],
    []
  );

  return (
    <div>
      <div className="bg-white rounded-lg overflow-hidden shadow-default border border-gray-200">
        <section className="flex-1 overflow-auto">
          <div className="overflow-x-auto bg-white">
            <table className="min-w-full table-fixed text-[13px] bg-white">
              <colgroup>
                {colDefs.map((c) => (
                  <col key={c.key} className={c.className} />
                ))}
              </colgroup>

              <thead className="bg-[#E5E7EB]">
                <tr className="text-gray-700 font-medium">
                  <th className="px-4 py-3 text-left">Nom. Sede</th>
                  <th className="px-4 py-3 text-left">Departamento</th>
                  <th className="px-4 py-3 text-left">Ciudad</th>
                  <th className="px-4 py-3 text-left">Dirección</th>
                  <th className="px-4 py-3 text-left">Representante</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                    <tr
                      key={`sk-${idx}`}
                      className="[&>td]:px-4 [&>td]:py-4 [&>td]:h-[60px] animate-pulse"
                    >
                      {Array.from({ length: 6 }).map((__, i) => (
                        <td key={`sk-${idx}-${i}`}>
                          <div className="h-4 bg-gray-200/80 rounded w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-red-600 italic"
                    >
                      {error}
                    </td>
                  </tr>
                ) : currentData.length > 0 ? (
                  <>
                    {currentData.map((a) => {
                      const estado = getRepresentanteEstado(a);
                      return (
                        <tr key={a.uuid} className="hover:bg-gray-50 transition-colors">
                          {/* Nom. Sede + Creado */}
                          <td className="h-[64px] px-4 py-3">
                            <div className="text-gray-900 font-semibold">
                              {a.nombre_almacen}
                            </div>
                            <div className="text-[12px] text-gray-500">
                              Creado: {formatDate(a.fecha_registro)}
                            </div>
                          </td>

                          {/* Depto */}
                          <td className="h-[64px] px-4 py-3 text-gray-700">
                            {a.departamento ?? "-"}
                          </td>

                          {/* Ciudad */}
                          <td className="h-[64px] px-4 py-3 text-gray-700">
                            {a.ciudad ?? "-"}
                          </td>

                          {/* Dirección */}
                          <td className="h-[64px] px-4 py-3 text-gray-700">
                            {a.direccion ?? "-"}
                          </td>

                          {/* Representante */}
                          <td className="h-[64px] px-4 py-3">
                            <div className="flex items-center gap-2">
                              {estado === "asignado" ? (
                                <Badgex>Asignado</Badgex>
                              ) : (
                                <>
                                  <span className="inline-block text-[12px] px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
                                    Pendiente
                                  </span>
                                  {onResendInvite && (
                                    <button
                                      type="button"
                                      onClick={() => onResendInvite(a)}
                                      className="text-blue-700 hover:underline text-[12px]"
                                    >
                                      Reenviar
                                      <br />
                                      invitación
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>

                          {/* Acciones */}
                          <td className="h-[64px] px-4 py-3">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => onEdit(a)}
                                className="text-amber-600 hover:text-amber-800 transition-colors"
                                title="Editar"
                                aria-label={`Editar ${a.nombre_almacen}`}
                              >
                                <Icon icon="uil:edit" width="18" height="18" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Relleno hasta 5 filas con misma altura */}
                    {Array.from({
                      length: Math.max(0, PAGE_SIZE - currentData.length),
                    }).map((_, idx) => (
                      <tr key={`empty-${idx}`} className="hover:bg-transparent">
                        {Array.from({ length: 6 }).map((__, i) => (
                          <td key={i} className="h-[64px] px-4 py-3">
                            &nbsp;
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-gray-600 italic"
                    >
                      No hay sedes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginador (estilo similar a tu captura) */}
          <div className="flex items-center justify-end gap-2 py-4 px-3">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className="w-9 h-9 flex items-center justify-center rounded bg-white shadow ring-1 ring-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              aria-label="Página anterior"
            >
              &lt;
            </button>

            {pagerItems.map((p, i) =>
              typeof p === "string" ? (
                <span
                  key={`dots-${i}`}
                  className="px-2 text-gray-500 select-none"
                >
                  {p}
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  aria-current={page === p ? "page" : undefined}
                  className={[
                    "w-9 h-9 flex items-center justify-center rounded shadow ring-1",
                    page === p
                      ? "bg-black text-white ring-black"
                      : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-50",
                  ].join(" ")}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
              className="w-9 h-9 flex items-center justify-center rounded bg-white shadow ring-1 ring-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              aria-label="Página siguiente"
            >
              &gt;
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
