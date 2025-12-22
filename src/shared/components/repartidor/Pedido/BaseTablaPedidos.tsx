import { useEffect, useMemo, useState } from "react";
import { FaEye } from "react-icons/fa";
import { Icon } from "@iconify/react";
import type {
  Paginated,
  PedidoListItem,
  ListPedidosHoyQuery,
  ListByEstadoQuery,
} from "@/services/repartidor/pedidos/pedidos.types";
import { Selectx, SelectxDate } from "@/shared/common/Selectx";
import Buttonx from "@/shared/common/Buttonx";
import { SearchInputx } from "@/shared/common/SearchInputx";

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
};

const PEN = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});
const two = (n: number) => String(n).padStart(2, "0");

/**
 * ✅ FIX TZ (solo render):
 * Si viene ISO tipo "2025-12-12T00:00:00.000Z", NO usar new Date()
 * porque en Perú lo corre al día anterior.
 * Mostramos siempre el YYYY-MM-DD como dd/mm/yyyy.
 */
function formatDateOnlyFromIso(isoOrYmd?: string | null): string {
  if (!isoOrYmd) return "—";

  const raw = String(isoOrYmd).trim();
  if (!raw) return "—";

  // "YYYY-MM-DDTHH:mm:ss..." -> "YYYY-MM-DD"
  const ymd = raw.slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    // fallback defensivo si no es ISO/ymd
    try {
      return new Date(raw).toLocaleDateString("es-PE");
    } catch {
      return "—";
    }
  }

  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

export default function BaseTablaPedidos({
  view,
  token,
  onVerDetalle,
  onCambiarEstado,
  fetcher,
  title,
  subtitle,
}: PropsBase) {
  const [page, setPage] = useState(1);
  const [perPage] = useState(5);

  const [filtroDistrito, setFiltroDistrito] = useState("");
  const [filtroCantidad, setFiltroCantidad] = useState("");
  const [searchProducto, setSearchProducto] = useState("");

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

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
      sortBy: "programada",
      order: "asc",
      ...(desde ? { desde } : {}),
      ...(hasta ? { hasta } : {}),
    }),
    [page, perPage, desde, hasta]
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
  }, [token, view, qHoy, qEstado, fetcher]);

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

    if (filtroDistrito) {
      arr = arr.filter((x) => x.cliente.distrito === filtroDistrito);
    }

    if (filtroCantidad) {
      const cant = Number(filtroCantidad);
      const byCount = (x: PedidoListItem) =>
        x.items_total_cantidad ??
        (x.items?.reduce((s, it) => s + it.cantidad, 0) ?? 0);
      arr = arr.filter((x) => byCount(x) === cant);
    }

    if (searchProducto.trim()) {
      const q = searchProducto.trim().toLowerCase();
      arr = arr.filter((x) =>
        (x.items ?? []).some((it) => it.nombre.toLowerCase().includes(q))
      );
    }

    return arr;
  }, [itemsBase, filtroDistrito, filtroCantidad, searchProducto]);

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

  function formatDateOnly(iso?: string | null) {
    if (!iso) return "—";
    // iso: "2025-12-20T00:00:00.000Z"
    return iso.slice(0, 10).split("-").reverse().join("/");
  }


  return (
    <div className="w-full min-w-0 overflow-visible">
      {/* Encabezado */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4 min-w-0">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-primary">
            {title}
          </h2>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded shadow-default border-b-4 border-gray90 mb-5 min-w-0">
        <div className="flex flex-wrap gap-3 items-end min-w-0">
          {(view === "hoy" || view === "pendientes" || view === "terminados") && (
            <>
              <div className="w-full sm:w-[180px] flex-1 min-w-[150px]">
                <SelectxDate
                  label="Fecha Inicio"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="w-full sm:w-[180px] flex-1 min-w-[150px]">
                <SelectxDate
                  label="Fecha Fin"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  className="w-full"
                />
              </div>
            </>
          )}


          {/* Distrito */}
          <div className="w-full sm:w-[220px] flex-1 min-w-[160px]">
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
          <div className="w-full sm:w-[180px] flex-1 min-w-[140px]">
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

          {/* Buscar producto */}
          <div className="w-full sm:min-w-[260px] flex-[2] min-w-[200px]">
            <SearchInputx
              value={searchProducto}
              onChange={(e) => setSearchProducto(e.target.value)}
              placeholder="Buscar productos por nombre"
              className="w-full"
            />
          </div>

          {/* Limpiar */}
          <div className="w-full sm:w-auto shrink-0">
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
              }}
            />
          </div>
        </div>
      </div>

      {/* Estados */}
      {loading && <div className="py-10 text-center text-gray-500">Cargando...</div>}
      {!loading && error && <div className="py-10 text-center text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="bg-white rounded-md overflow-hidden shadow-default border border-gray30 min-w-0 relative z-0">
          <div className="relative overflow-x-auto lg:overflow-x-visible bg-white">
            <table className="w-full min-w-[980px] lg:min-w-0 table-auto text-[12px] bg-white border-b border-gray30 rounded-t-md">
              <thead className="bg-[#E5E7EB]">
                <tr className="text-gray70 font-roboto font-medium">
                  <th className="px-4 py-3 whitespace-nowrap">Fec. Entrega</th>
                  <th className="px-4 py-3 whitespace-nowrap">Ecommerce</th>
                  <th className="px-4 py-3 whitespace-nowrap">Cliente</th>
                  <th className="px-4 py-3 whitespace-nowrap">Dirección de Entrega</th>
                  <th className="px-4 py-3 whitespace-nowrap">Cant. de productos</th>
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
                    <tr key={p.id} className="group hover:bg-gray10 transition-colors">
                      <td className="h-12 px-4 py-3 text-gray70 whitespace-nowrap">
<<<<<<< HEAD
                        {/* ✅ FIX TZ SOLO AQUÍ */}
                        {formatDateOnlyFromIso(fecha)}
=======
                        {formatDateOnly(fecha)}
>>>>>>> 671873a59cdf1a3555764cc4f1d98cb90ef301d7
                      </td>
                      <td className="h-12 px-4 py-3 text-gray70">
                        {p.ecommerce?.nombre_comercial ?? "—"}
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
                      <td className="h-12 px-4 py-3 text-gray70 whitespace-nowrap">
                        {p.estado_nombre}
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
                          <button
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            onClick={() => onVerDetalle?.(p.id)}
                          >
                            <FaEye />
                          </button>

                          {(view === "hoy" || view === "pendientes") && (
                            <button
                              className="text-amber-600 hover:text-amber-800 transition-colors"
                              onClick={() => onCambiarEstado?.(p)}
                            >
                              <Icon icon="mdi:swap-horizontal" className="text-lg" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!itemsFiltrados.length && (
                  <>
                    <tr className="lg:hidden">
                      <td colSpan={7} className="px-4 py-8 text-center text-gray70 italic">
                        No hay pedidos para esta etapa.
                      </td>
                      <td className="sticky right-0 z-10 bg-white border-l border-gray30 w-[120px]" />
                    </tr>

                    <tr className="hidden lg:table-row">
                      <td colSpan={8} className="px-4 py-8 text-center text-gray70 italic">
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
