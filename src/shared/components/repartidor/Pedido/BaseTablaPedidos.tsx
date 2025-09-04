import { useEffect, useMemo, useState } from 'react';
import { FaEye } from 'react-icons/fa';
import { Icon } from '@iconify/react';
import type {
  Paginated,
  PedidoListItem,
  ListPedidosHoyQuery,
  ListByEstadoQuery,
} from '@/services/repartidor/pedidos/pedidos.types';

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
  const [perPage] = useState(20);

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

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="w-full bg-white rounded-lg shadow overflow-hidden">
      {/* Encabezado */}
      <div className="flex items-center justify-between px-4 pt-4">
        <div>
          <h2 className="text-lg font-semibold text-primaryDark">{title}</h2>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="px-4 py-3">
        {/* Desktop */}
        <div className="hidden sm:flex bg-white border rounded p-3 flex-wrap gap-3 items-end">
          <div className="min-w-[200px]">
            <label className="block text-xs text-gray-600 mb-1">Distrito</label>
            <select className="w-full border rounded px-3 py-2 text-sm" value={filtroDistrito} onChange={(e) => setFiltroDistrito(e.target.value)}>
              <option value="">Seleccionar distrito</option>
              {distritos.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="min-w-[200px]">
            <label className="block text-xs text-gray-600 mb-1">Cantidad</label>
            <select className="w-full border rounded px-3 py-2 text-sm" value={filtroCantidad} onChange={(e) => setFiltroCantidad(e.target.value)}>
              <option value="">Seleccionar cantidad</option>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{two(n)}</option>)}
            </select>
          </div>

          <div className="flex-1 min-w-[240px]">
            <label className="block text-xs text-gray-600 mb-1">Buscar productos por nombre</label>
            <div className="relative">
              <input className="w-full border rounded px-3 py-2 text-sm pr-8" placeholder="Buscar productos por nombre..." value={searchProducto} onChange={(e) => setSearchProducto(e.target.value)} />
              <span className="material-icons-outlined absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
            </div>
          </div>

          <button
            className="inline-flex items-center gap-2 border px-3 py-2 rounded text-gray-600 hover:bg-gray-100"
            onClick={() => { setFiltroDistrito(''); setFiltroCantidad(''); setSearchProducto(''); }}
          >
            <span className="material-icons-outlined text-sm">restart_alt</span>
            Limpiar Filtros
          </button>
        </div>

        {/* Móvil */}
        <details className="sm:hidden border rounded">
          <summary className="list-none cursor-pointer px-3 py-2 flex items-center justify-between">
            <span className="text-sm font-medium">Filtros</span>
            <Icon icon="material-symbols:expand-all-rounded" width="24" height="24" />
          </summary>
          <div className="px-3 pb-3 grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Distrito</label>
              <select className="w-full border rounded px-3 py-2 text-sm" value={filtroDistrito} onChange={(e) => setFiltroDistrito(e.target.value)}>
                <option value="">Seleccionar distrito</option>
                {distritos.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Cantidad</label>
              <select className="w-full border rounded px-3 py-2 text-sm" value={filtroCantidad} onChange={(e) => setFiltroCantidad(e.target.value)}>
                <option value="">Seleccionar cantidad</option>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{two(n)}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Buscar productos por nombre</label>
              <div className="relative">
                <input className="w-full border rounded px-3 py-2 text-sm pr-8" placeholder="Buscar productos por nombre..." value={searchProducto} onChange={(e) => setSearchProducto(e.target.value)} />
                <span className="material-icons-outlined absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
              </div>
            </div>

            <button
              className="mt-1 inline-flex justify-center items-center gap-2 border px-3 py-2 rounded text-gray-700 hover:bg-gray-100"
              onClick={() => { setFiltroDistrito(''); setFiltroCantidad(''); setSearchProducto(''); }}
            >
              <span className="material-icons-outlined text-sm">restart_alt</span>
              Limpiar Filtros
            </button>
          </div>
        </details>
      </div>

      {/* Barra superior: paginación */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 px-4 py-3 border-t">
        <div className="text-sm text-gray-600">Total: <b>{data?.totalItems ?? 0}</b> registros</div>
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <button disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 border rounded disabled:opacity-50">Anterior</button>
          <span className="text-sm">Página <b>{page}</b> de <b>{totalPages}</b></span>
          <button disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Siguiente</button>
        </div>
      </div>

      {/* Estados */}
      {loading && <div className="py-10 text-center text-gray-500">Cargando...</div>}
      {!loading && error && <div className="py-10 text-center text-red-600">{error}</div>}

      {/* Listado */}
      {!loading && !error && (
        <>
          {/* Desktop */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-[900px] sm:min-w-0 w-full text-sm text-left text-gray-600">
              <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">Fec. Entrega</th>
                  <th className="px-4 py-3 whitespace-nowrap">Ecommerce</th>
                  <th className="px-4 py-3 whitespace-nowrap">Cliente</th>
                  <th className="px-4 py-3 whitespace-nowrap">Dirección de Entrega</th>
                  <th className="px-4 py-3 whitespace-nowrap">Cant. de productos</th>
                  <th className="px-4 py-3 whitespace-nowrap">Monto</th>
                  <th className="px-4 py-3 whitespace-nowrap">Estado</th>
                  <th className="px-4 py-3 whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {itemsFiltrados.map((p) => {
                  const fecha = view === 'terminados'
                    ? p.fecha_entrega_real ?? p.fecha_entrega_programada
                    : p.fecha_entrega_programada;
                  const cant = p.items_total_cantidad ?? (p.items?.reduce((s, it) => s + it.cantidad, 0) ?? 0);

                  return (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">{fecha ? new Date(fecha).toLocaleDateString('es-PE') : '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{p.ecommerce?.nombre_comercial ?? '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{p.cliente?.nombre ?? '—'}</td>
                      <td className="px-4 py-3 max-w-[320px] truncate" title={p.direccion_envio ?? ''}>{p.direccion_envio ?? '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{two(cant)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{PEN.format(Number(p.monto_recaudar || 0))}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{p.estado_nombre}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <button className="text-blue-600 hover:text-blue-800" title="Ver detalle" onClick={() => onVerDetalle?.(p.id)}>
                            <FaEye />
                          </button>
                          {(view === 'hoy' || view === 'pendientes') && (
                            <button className="text-amber-600 hover:text-amber-800" title="Cambiar estado" onClick={() => onCambiarEstado?.(p)}>
                              <Icon icon="mdi:swap-horizontal" className="text-lg" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!itemsFiltrados.length && (
                  <tr><td colSpan={8} className="py-8 text-center text-gray-500">No hay pedidos para esta etapa.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Móvil */}
          <div className="sm:hidden divide-y">
            {itemsFiltrados.map((p) => {
              const fecha = view === 'terminados'
                ? p.fecha_entrega_real ?? p.fecha_entrega_programada
                : p.fecha_entrega_programada;
              const cant = p.items_total_cantidad ?? (p.items?.reduce((s, it) => s + it.cantidad, 0) ?? 0);

              return (
                <div key={p.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm">
                      <div className="font-medium">{fecha ? new Date(fecha).toLocaleDateString('es-PE') : '—'}</div>
                      <div className="text-gray-500">{p.ecommerce?.nombre_comercial ?? '—'}</div>
                    </div>
                    <span className="inline-flex items-center rounded-full border px-2 py-1 text-xs text-gray-700">{p.estado_nombre}</span>
                  </div>

                  <div className="mt-3 space-y-1 text-sm">
                    <div><span className="text-gray-500">Cliente: </span><span className="font-medium">{p.cliente?.nombre ?? '—'}</span></div>
                    <div className="truncate" title={p.direccion_envio ?? ''}><span className="text-gray-500">Dirección: </span>{p.direccion_envio ?? '—'}</div>
                    <div className="flex justify-between"><span className="text-gray-500">Productos:</span><span className="font-medium">{two(cant)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Monto:</span><span className="font-semibold">{PEN.format(Number(p.monto_recaudar || 0))}</span></div>
                  </div>

                  <div className="mt-3 flex items-center gap-4">
                    <button className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800" onClick={() => onVerDetalle?.(p.id)}>
                      <FaEye /> <span className="text-sm">Ver</span>
                    </button>
                    {(view === 'hoy' || view === 'pendientes') && (
                      <button className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-800" onClick={() => onCambiarEstado?.(p)}>
                        <Icon icon="mdi:swap-horizontal" className="text-lg" />
                        <span className="text-sm">Estado</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {!itemsFiltrados.length && <div className="py-8 text-center text-gray-500">No hay pedidos para esta etapa.</div>}
          </div>
        </>
      )}
    </div>
  );
}
