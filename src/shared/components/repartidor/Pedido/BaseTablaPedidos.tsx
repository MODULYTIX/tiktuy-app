import { useEffect, useMemo, useState } from 'react';
import { FaEye } from 'react-icons/fa';
import { Icon } from '@iconify/react';
import type {
  Paginated,
  PedidoListItem,
  ListPedidosHoyQuery,
  ListByEstadoQuery,
} from '@/services/repartidor/pedidos/pedidos.types';
import { Selectx } from '@/shared/common/Selectx';
import Buttonx from '@/shared/common/Buttonx';
import { SearchInputx } from '@/shared/common/SearchInputx';

type ViewKind = 'hoy' | 'pendientes' | 'terminados';
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

const PEN = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 });
const two = (n: number) => String(n).padStart(2, '0');

export default function BaseTablaPedidos({
  view, token, onVerDetalle, onCambiarEstado, fetcher, title, subtitle,
}: PropsBase) {
  const [page, setPage] = useState(1);
  const [perPage] = useState(5); // 👈 bajé a 5 para que se vea el paginador fácil en pruebas

  const [filtroDistrito, setFiltroDistrito] = useState('');
  const [filtroCantidad, setFiltroCantidad] = useState('');
  const [searchProducto, setSearchProducto] = useState('');

  const [data, setData] = useState<Paginated<PedidoListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setPage(1);
    setFiltroDistrito('');
    setFiltroCantidad('');
    setSearchProducto('');
  }, [view]);

  const qHoy: ListPedidosHoyQuery = useMemo(() => ({ page, perPage }), [page, perPage]);
  const qEstado: ListByEstadoQuery = useMemo(() => ({ page, perPage, sortBy: 'programada', order: 'asc' }), [page, perPage]);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      if (!token) { setError('No hay token de sesión'); setLoading(false); return; }
      setLoading(true); setError('');
      try {
        const query = view === 'hoy' ? qHoy : qEstado;
        const resp = await fetcher(token, query, { signal: ac.signal });
        setData(resp);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError(e instanceof Error ? e.message : 'Error al cargar pedidos');
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [token, view, qHoy, qEstado, fetcher]);

  const itemsBase = data?.items ?? [];
  const distritos = useMemo(
    () => Array.from(new Set(itemsBase.map((x) => x.cliente.distrito).filter(Boolean))).sort(),
    [itemsBase]
  );

  const itemsFiltrados = useMemo(() => {
    let arr = [...itemsBase];
    if (filtroDistrito) arr = arr.filter((x) => x.cliente.distrito === filtroDistrito);
    if (filtroCantidad) {
      const cant = Number(filtroCantidad);
      const byCount = (x: PedidoListItem) => x.items_total_cantidad ?? (x.items?.reduce((s, it) => s + it.cantidad, 0) ?? 0);
      arr = arr.filter((x) => byCount(x) === cant);
    }
    if (searchProducto.trim()) {
      const q = searchProducto.trim().toLowerCase();
      arr = arr.filter((x) => (x.items ?? []).some((it) => it.nombre.toLowerCase().includes(q)));
    }
    return arr;
  }, [itemsBase, filtroDistrito, filtroCantidad, searchProducto]);

  // cálculo local de páginas 👇
  const totalItems = data?.totalItems ?? itemsBase.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  // paginador modelo base
  const pagerItems = useMemo(() => {
    const maxButtons = 5;
    const pages: (number | string)[] = [];
    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, page - 2);
      let end = Math.min(totalPages, page + 2);
      if (page <= 3) { start = 1; end = maxButtons; }
      else if (page >= totalPages - 2) { start = totalPages - (maxButtons - 1); end = totalPages; }
      for (let i = start; i <= end; i++) pages.push(i);
      if (start > 1) { pages.unshift('...'); pages.unshift(1); }
      if (end < totalPages) { pages.push('...'); pages.push(totalPages); }
    }
    return pages;
  }, [page, totalPages]);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    setPage(p);
  };

  return (
    <div className="w-full">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">{title}</h2>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-5 rounded shadow-default flex gap-4 items-end border-b-4 border-gray90 mb-5">
        <Selectx
          label="Distrito"
          value={filtroDistrito}
          onChange={(e) => setFiltroDistrito(e.target.value)}
          placeholder="Seleccionar distrito"
          className="w-full"
        >
          <option value="">Seleccionar distrito</option>
          {distritos.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </Selectx>

        <Selectx
          label="Cantidad"
          value={filtroCantidad}
          onChange={(e) => setFiltroCantidad(e.target.value)}
          placeholder="Seleccionar cantidad"
          className="w-full"
        >
          <option value="">Seleccionar cantidad</option>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{two(n)}</option>
          ))}
        </Selectx>

        <SearchInputx
                    value={searchProducto}
                    onChange={(e) => setSearchProducto(e.target.value)}
                    placeholder="Buscar productos por nombre" // Aquí defines el texto del placeholder
                    className="w-full"
                  />

        <Buttonx
              label="Limpiar Filtros"
              icon="mynaui:delete"
              variant="outlined" // Si deseas el fondo azul, usa la variante "primary"
              onClick={() => { setFiltroDistrito(''); setFiltroCantidad(''); setSearchProducto(''); }} // Asegúrate de que esto sea una función válida
              disabled={false}
            />
      </div>

      {/* Estados */}
      {loading && <div className="py-10 text-center text-gray-500">Cargando...</div>}
      {!loading && error && <div className="py-10 text-center text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="bg-white rounded-md overflow-hidden shadow-default border border-gray30">
          <div className="overflow-x-auto bg-white">
            <table className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30 rounded-t-md">
              <thead className="bg-[#E5E7EB]">
                <tr className="text-gray70 font-roboto font-medium">
                  <th className="px-4 py-3">Fec. Entrega</th>
                  <th className="px-4 py-3">Ecommerce</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Dirección de Entrega</th>
                  <th className="px-4 py-3">Cant. de productos</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray20">
                {itemsFiltrados.map((p) => {
                  const fecha = view === 'terminados'
                    ? p.fecha_entrega_real ?? p.fecha_entrega_programada
                    : p.fecha_entrega_programada;
                  const cant = p.items_total_cantidad ?? (p.items?.reduce((s, it) => s + it.cantidad, 0) ?? 0);

                  return (
                    <tr key={p.id} className="hover:bg-gray10 transition-colors">
                      <td className="h-12 px-4 py-3 text-gray70">{fecha ? new Date(fecha).toLocaleDateString('es-PE') : '—'}</td>
                      <td className="h-12 px-4 py-3 text-gray70">{p.ecommerce?.nombre_comercial ?? '—'}</td>
                      <td className="h-12 px-4 py-3 text-gray70">{p.cliente?.nombre ?? '—'}</td>
                      <td className="h-12 px-4 py-3 text-gray70 truncate max-w-[260px]" title={p.direccion_envio ?? ''}>{p.direccion_envio ?? '—'}</td>
                      <td className="h-12 px-4 py-3 text-gray70">{two(cant)}</td>
                      <td className="h-12 px-4 py-3 text-gray70">{PEN.format(Number(p.monto_recaudar || 0))}</td>
                      <td className="h-12 px-4 py-3 text-gray70">{p.estado_nombre}</td>
                      <td className="h-12 px-4 py-3">
                        <div className="flex items-center justify-center gap-3">
                          <button className="text-blue-600 hover:text-blue-800 transition-colors" onClick={() => onVerDetalle?.(p.id)}>
                            <FaEye />
                          </button>
                          {(view === 'hoy' || view === 'pendientes') && (
                            <button className="text-amber-600 hover:text-amber-800 transition-colors" onClick={() => onCambiarEstado?.(p)}>
                              <Icon icon="mdi:swap-horizontal" className="text-lg" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!itemsFiltrados.length && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray70 italic">
                      No hay pedidos para esta etapa.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 👇 paginador siempre visible */}
          <div className="flex items-center justify-end gap-2 border-b-[4px] border-gray90 py-3 px-3 mt-2">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 1 || loading}
              className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
            >
              &lt;
            </button>

            {pagerItems.map((p, i) =>
              typeof p === 'string' ? (
                <span key={`dots-${i}`} className="px-2 text-gray70">{p}</span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  aria-current={page === p ? 'page' : undefined}
                  className={[
                    'w-8 h-8 flex items-center justify-center rounded',
                    page === p ? 'bg-gray90 text-white' : 'bg-gray10 text-gray70 hover:bg-gray20',
                  ].join(' ')}
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
