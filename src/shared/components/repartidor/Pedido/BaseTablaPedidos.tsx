import { useEffect, useMemo, useState } from "react";
import type {
  Paginated,
  PedidoListItem,
  ListPedidosHoyQuery,
  ListByEstadoQuery,
} from "@/services/repartidor/pedidos/pedidos.types";

import { Selectx, SelectxDate } from "@/shared/common/Selectx";
import Buttonx from "@/shared/common/Buttonx";
import { SearchInputx } from "@/shared/common/SearchInputx";
import Tittlex from "@/shared/common/Tittlex";
import TableActionx from "@/shared/common/TableActionx";
import Badgex from "@/shared/common/Badgex";

type ViewKind = "hoy" | "pendientes" | "terminados";
type PropsBase = {
  view: ViewKind;
  token: string;
  onVerDetalle?: (pedidoId: number) => void;
  onCambiarEstado?: (pedido: PedidoListItem) => void;
  fetcher: (
    token: string,
    query: ListPedidosHoyQuery | ListByEstadoQuery,
    opts?: { signal?: AbortSignal }
  ) => Promise<Paginated<PedidoListItem>>;
  title: string;
  subtitle: string;
  refreshKey?: number;
};

const PEN = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});
const two = (n: number) => String(n).padStart(2, "0");


function formatDateOnlyFromIso(isoOrYmd?: string | null): string {
  if (!isoOrYmd) return "—";

  const raw = String(isoOrYmd).trim();
  if (!raw) return "—";

  const ymd = raw.slice(0, 10); // "YYYY-MM-DD"

  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    try {
      return new Date(raw).toLocaleDateString("es-PE");
    } catch {
      return "—";
    }
  }

  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

function isoToYMD(iso?: string | null): string {
  if (!iso) return "";
  return String(iso).slice(0, 10);
}

/**
 *  Normaliza value de input date a YYYY-MM-DD (sin TZ).
 * Acepta:
 * - "YYYY-MM-DD" (ideal)
 * - ISO "YYYY-MM-DDTHH:mm..."
 * - "DD/MM/YYYY" (por si tu SelectxDate lo devuelve así)
 */
function normalizeToYMD(v: string): string {
  const s = String(v ?? "").trim();
  if (!s) return "";

  // ya es YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // ISO -> toma yyyy-mm-dd
  const isoYmd = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoYmd)) return isoYmd;

  // dd/mm/yyyy -> yyyy-mm-dd
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [dd, mm, yyyy] = s.split("/");
    return `${yyyy}-${mm}-${dd}`;
  }

  // fallback: no inventamos
  return s;
}

/* ================== BADGE ESTADO (Badgex) ================== */
function EstadoBadge({ estado }: { estado?: string | null }) {
  const raw = String(estado ?? "").trim();
  const s = raw.toLowerCase();

  //  colores: verde / amarillo / rojo
  const cls = s.includes("entregado")
    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
    : s.includes("rechaz") || s.includes("cancel") || s.includes("devuelt")
      ? "bg-red-50 text-red-700 border border-red-200"
      : s.includes("no responde") || s.includes("equivoc")
        ? "bg-amber-50 text-amber-800 border border-amber-200"
        : "bg-amber-50 text-amber-800 border border-amber-200"; // default amarillo (evitamos gris)

  return (
    <Badgex className={cls} title={raw} shape="soft" size="sm">
      {raw || "—"}
    </Badgex>
  );
}

export default function BaseTablaPedidos({
  view,
  token,
  onVerDetalle,
  onCambiarEstado,
  fetcher,
  title,
  subtitle,
  refreshKey,
}: PropsBase) {
  const [page, setPage] = useState(1);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const perPage = view === "terminados" && (desde || hasta) ? 100 : 5;

  const [filtroDistrito, setFiltroDistrito] = useState("");
  const [filtroCantidad, setFiltroCantidad] = useState("");
  const [searchProducto, setSearchProducto] = useState("");

  const [data, setData] = useState<Paginated<PedidoListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setPage(1);
    setFiltroDistrito("");
    setFiltroCantidad("");
    setSearchProducto("");
    setDesde("");
    setHasta("");
  }, [view]);

  // si cambias filtros, vuelve a page 1 (refreshKey NO debe resetear page)
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroDistrito, filtroCantidad, searchProducto, desde, hasta]);

  const qHoy: ListPedidosHoyQuery = useMemo(
    () => ({
      page,
      perPage,
      ...(desde ? { desde } : {}),
      ...(hasta ? { hasta } : {}),
    }),
    [page, perPage, desde, hasta]
  );

  const qEstado: ListByEstadoQuery = useMemo(
    () => ({
      page,
      perPage,
      //  NO mandar fechas al backend en TERMINADOS
      ...(view !== "terminados" && desde ? { desde } : {}),
      ...(view !== "terminados" && hasta ? { hasta } : {}),
      sortBy: "programada",
      order: "asc",
    }),
    [page, perPage, desde, hasta, view]
  );

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      if (!token) {
        setError("No hay token de sesión");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const query = view === "hoy" ? qHoy : qEstado;
        const resp = await fetcher(token, query, { signal: ac.signal });
        setData(resp);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setError(e instanceof Error ? e.message : "Error al cargar pedidos");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [token, view, qHoy, qEstado, fetcher, refreshKey]);

  const itemsBase = data?.items ?? [];
  const distritos = useMemo(
    () =>
      Array.from(
        new Set(itemsBase.map((x) => x.cliente.distrito).filter(Boolean))
      ).sort(),
    [itemsBase]
  );

  const itemsFiltrados = useMemo(() => {
    let arr = [...itemsBase];

    // FILTRO DE FECHA FRONTEND (ANTI-TZ, EXACTO)
    if (desde || hasta) {
      arr = arr.filter((p) => {
        const fechaIso =
          view === "terminados"
            ? p.fecha_entrega_real ?? p.fecha_entrega_programada
            : p.fecha_entrega_programada;

        if (!fechaIso) return false;

        const ymd = isoToYMD(fechaIso);

        if (desde && ymd < desde) return false;
        if (hasta && ymd > hasta) return false;

        return true;
      });
    }

    // Distrito
    if (filtroDistrito) {
      arr = arr.filter((x) => x.cliente.distrito === filtroDistrito);
    }

    // Cantidad
    if (filtroCantidad) {
      const cant = Number(filtroCantidad);
      const byCount = (x: PedidoListItem) =>
        x.items_total_cantidad ??
        x.items?.reduce((s, it) => s + it.cantidad, 0) ??
        0;
      arr = arr.filter((x) => byCount(x) === cant);
    }

    // Buscar producto
    if (searchProducto.trim()) {
      const q = searchProducto.trim().toLowerCase();
      arr = arr.filter((x) =>
        (x.items ?? []).some((it) => it.nombre.toLowerCase().includes(q))
      );
    }

    return arr;
  }, [
    itemsBase,
    view,
    desde,
    hasta,
    filtroDistrito,
    filtroCantidad,
    searchProducto,
  ]);

  const totalItems = data?.totalItems ?? itemsBase.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

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

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    setPage(p);
  };

  return (
    <div className="w-full min-w-0 overflow-visible">
      {/* Encabezado */}
      <Tittlex variant="section" title={title} description={subtitle} />

      <div className="bg-white p-4 sm:p-5 rounded shadow-default border-b-4 border-gray90 my-5 min-w-0">
        <div className="grid gap-4 min-w-0">
          {/* ===== Fila 1 ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end min-w-0">
            {(view === "hoy" ||
              view === "pendientes" ||
              view === "terminados") && (
                <>
                  <div className="min-w-0">
                    <SelectxDate
                      label="Fech. Inicio"
                      value={desde}
                      onChange={(value) => {
                        const ymd = normalizeToYMD(
                          typeof value === "string"
                            ? value
                            : (value as any)?.target?.value
                        );
                        setDesde(ymd);
                      }}
                      className="w-full"
                    />
                  </div>

                  <div className="min-w-0">
                    <SelectxDate
                      label="Fech. Fin"
                      value={hasta}
                      onChange={(value) => {
                        const ymd = normalizeToYMD(
                          typeof value === "string"
                            ? value
                            : (value as any)?.target?.value
                        );
                        setHasta(ymd);
                      }}
                      className="w-full"
                    />
                  </div>
                </>
              )}

            {/* Distrito */}
            <div className="min-w-0">
              <Selectx
                label="Distrito"
                value={filtroDistrito}
                onChange={(e) => setFiltroDistrito(e.target.value)}
                className="w-full"
              >
                <option value="">Seleccionar distrito</option>
                {distritos.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Selectx>
            </div>

            {/* Cantidad */}
            <div className="min-w-0">
              <Selectx
                label="Cantidad"
                value={filtroCantidad}
                onChange={(e) => setFiltroCantidad(e.target.value)}
                className="w-full"
              >
                <option value="">Seleccionar cantidad</option>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {two(n)}
                  </option>
                ))}
              </Selectx>
            </div>
          </div>

          {/* ===== Fila 2 ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end min-w-0">
            <SearchInputx
              value={searchProducto}
              onChange={(e) => setSearchProducto(e.target.value)}
              placeholder="Buscar productos por nombre"
              className="w-full"
            />

            <Buttonx
              label="Limpiar Filtros"
              icon="mynaui:delete"
              variant="outlined"
              onClick={() => {
                setFiltroDistrito("");
                setFiltroCantidad("");
                setSearchProducto("");
                setDesde("");
                setHasta("");
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Estados */}
      {loading && (
        <div className="py-10 text-center text-gray-500">Cargando...</div>
      )}
      {!loading && error && (
        <div className="py-10 text-center text-red-600">{error}</div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-md overflow-hidden shadow-default border border-gray30 min-w-0 relative z-0">
          <div className="relative overflow-x-auto lg:overflow-x-visible bg-white">
            <table className="w-full min-w-[980px] lg:min-w-0 table-auto text-[12px] bg-white border-b border-gray30 rounded-t-md">
              <thead className="bg-[#E5E7EB]">
                <tr className="text-gray70 font-roboto font-medium">
                  <th className="px-4 py-3 whitespace-nowrap">Fec. Entrega</th>
                  <th className="px-4 py-3 whitespace-nowrap">Distrito</th>
                  <th className="px-4 py-3 whitespace-nowrap">Cliente</th>
                  <th className="px-4 py-3 whitespace-nowrap">
                    Dirección de Entrega
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap">
                    Cant. de productos
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap">Monto</th>
                  <th className="px-4 py-3 whitespace-nowrap">Estado</th>

                  <th
                    className="
                      px-4 py-3 text-center whitespace-nowrap w-[120px]
                      sticky right-0 z-20
                      bg-[#E5E7EB] border-l border-gray30
                      lg:static lg:right-auto lg:z-auto
                    "
                  >
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray20">
                {itemsFiltrados.map((p) => {
                  const fecha =
                    view === "terminados"
                      ? p.fecha_entrega_real ?? p.fecha_entrega_programada
                      : p.fecha_entrega_programada;

                  const cant =
                    p.items_total_cantidad ??
                    p.items?.reduce((s, it) => s + it.cantidad, 0) ??
                    0;

                  return (
                    <tr
                      key={p.id}
                      className="group hover:bg-gray10 transition-colors"
                    >
                      <td className="h-12 px-4 py-3 text-gray70 whitespace-nowrap">
                        {formatDateOnlyFromIso(fecha)}
                      </td>
                      <td className="h-12 px-4 py-3 text-gray70">
                        {p.cliente?.distrito ?? "—"}
                      </td>
                      <td className="h-12 px-4 py-3 text-gray70">
                        {p.cliente?.nombre ?? "—"}
                      </td>
                      <td
                        className="h-12 px-4 py-3 text-gray70 truncate max-w-[260px]"
                        title={p.direccion_envio ?? ""}
                      >
                        {p.direccion_envio ?? "—"}
                      </td>
                      <td className="h-12 px-4 py-3 text-gray70 whitespace-nowrap">
                        {two(cant)}
                      </td>
                      <td className="h-12 px-4 py-3 text-gray70 whitespace-nowrap">
                        {PEN.format(Number(p.monto_recaudar || 0))}
                      </td>

                      {/*  ESTADO con Badgex */}
                      <td className="h-12 px-4 py-3 whitespace-nowrap">
                        <EstadoBadge estado={p.estado_nombre as any} />
                      </td>

                      <td
                        className="
                          h-12 px-4 py-3 w-[120px]
                          sticky right-0 z-10
                          bg-white group-hover:bg-gray10
                          border-l border-gray30
                          lg:static lg:right-auto lg:z-auto
                          lg:bg-transparent
                        "
                      >
                        <div className="flex items-center justify-center gap-3">
                          <TableActionx
                            variant="view"
                            title="Ver detalle"
                            onClick={() => onVerDetalle?.(p.id)}
                            size="sm"
                          />

                          {(view === "hoy" || view === "pendientes") && (
                            <TableActionx
                              variant="custom"
                              title="Cambiar estado"
                              icon="mdi:swap-horizontal"
                              colorClassName="bg-amber-100 text-amber-700 ring-1 ring-amber-300 hover:bg-amber-200 hover:ring-amber-400 focus-visible:ring-amber-500"
                              onClick={() => onCambiarEstado?.(p)}
                              size="sm"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!itemsFiltrados.length && (
                  <>
                    <tr className="lg:hidden">
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-gray70 italic"
                      >
                        No hay pedidos para esta etapa.
                      </td>
                      <td className="sticky right-0 z-10 bg-white border-l border-gray30 w-[120px]" />
                    </tr>

                    <tr className="hidden lg:table-row">
                      <td
                        colSpan={8}
                        className="px-4 py-8 text-center text-gray70 italic"
                      >
                        No hay pedidos para esta etapa.
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginador */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 border-b-[4px] border-gray90 py-3 px-3 mt-2">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 1 || loading}
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
                  disabled={loading}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages || loading}
              className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
            >
              &gt;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
