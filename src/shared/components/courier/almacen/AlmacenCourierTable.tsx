// shared/components/courier/almacen/AlmacenCourierTable.tsx
import { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import type { AlmacenamientoCourier } from "@/services/courier/almacen/almacenCourier.type";

type Props = {
  items: AlmacenamientoCourier[];
  loading: boolean;
  error?: string;
  onView: (row: AlmacenamientoCourier) => void;
  onEdit: (row: AlmacenamientoCourier) => void;
};

const PAGE_SIZE = 5;

function formatDate(iso?: string) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return iso;
  }
}

export default function AlmacenCourierTable({
  items,
  loading,
  error,
  onEdit,
}: Props) {
  const [page, setPage] = useState(1);

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
      if (start > 1) { pages.unshift("..."); pages.unshift(1); }
      if (end < totalPages) { pages.push("..."); pages.push(totalPages); }
    }
    return pages;
  }, [totalPages, page]);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    setPage(p);
  };

  return (
    <div className="">
      <div className="bg-white rounded-md overflow-hidden shadow-default border border-gray30">
        <section className="flex-1 overflow-auto">
          <div className="overflow-x-auto bg-white">
            <table className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30 rounded-t-md">
              <colgroup>
                <col className="w-[20%]" /> {/* Nom. Almacén */}
                <col className="w-[15%]" /> {/* Depto */}
                <col className="w-[15%]" /> {/* Ciudad */}
                <col className="w-[25%]" /> {/* Dirección */}
                <col className="w-[15%]" /> {/* F. Creación */}
                <col className="w-[10%]" /> {/* Acciones */}
              </colgroup>

              <thead className="bg-[#E5E7EB]">
                <tr className="text-gray70 font-roboto font-medium">
                  <th className="px-4 py-3 text-left">Nom. Almacén</th>
                  <th className="px-4 py-3 text-left">Departamento</th>
                  <th className="px-4 py-3 text-left">Ciudad</th>
                  <th className="px-4 py-3 text-left">Dirección</th>
                  <th className="px-4 py-3 text-left">F. Creación</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray20">
                {loading ? (
                  Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                    <tr
                      key={`sk-${idx}`}
                      className="[&>td]:px-4 [&>td]:py-3 [&>td]:h-12 animate-pulse"
                    >
                      {Array.from({ length: 6 }).map((__, i) => (
                        <td key={`sk-${idx}-${i}`}>
                          <div className="h-4 bg-gray20 rounded w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-4 text-center text-red-600 italic"
                    >
                      {error}
                    </td>
                  </tr>
                ) : currentData.length > 0 ? (
                  <>
                    {currentData.map((a) => (
                      <tr key={a.uuid} className="hover:bg-gray10 transition-colors">
                        <td className="h-12 px-4 py-3 text-gray70 font-[400]">{a.nombre_almacen}</td>
                        <td className="h-12 px-4 py-3 text-gray70 font-[400]">{a.departamento}</td>
                        <td className="h-12 px-4 py-3 text-gray70 font-[400]">{a.ciudad}</td>
                        <td className="h-12 px-4 py-3 text-gray70 font-[400]">{a.direccion}</td>
                        <td className="h-12 px-4 py-3 text-gray70 font-[400]">{formatDate(a.fecha_registro)}</td>
                        <td className="h-12 px-4 py-3">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => onEdit(a)}
                              className="text-amber-600 hover:text-amber-800 transition-colors"
                              title="Editar"
                            >
                              <Icon icon="uil:edit" width="18" height="18" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Relleno hasta 5 filas con misma altura */}
                    {Array.from({ length: Math.max(0, PAGE_SIZE - currentData.length) }).map((_, idx) => (
                      <tr key={`empty-${idx}`} className="hover:bg-transparent">
                        {Array.from({ length: 6 }).map((__, i) => (
                          <td key={i} className="h-12 px-4 py-3">&nbsp;</td>
                        ))}
                      </tr>
                    ))}
                  </>
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-4 text-center text-gray70 italic"
                    >
                      No hay almacenes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginador */}
          <div className="flex items-center justify-end gap-2 border-b-[4px] border-gray90 py-3 px-3 mt-2">
            <button
              onClick={() => goToPage(page - 1)}
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
                  onClick={() => goToPage(p)}
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
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
            >
              &gt;
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
