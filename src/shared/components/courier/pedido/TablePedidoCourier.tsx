import { useEffect, useMemo, useRef, useState } from 'react';
import { FaEye } from 'react-icons/fa';
import { Icon } from '@iconify/react';
import { FiChevronDown } from 'react-icons/fi';

import type {
  Paginated,
  PedidoListItem,
  ListPedidosHoyQuery,
  ListByEstadoQuery,
  PedidoDetalle,
} from '@/services/courier/pedidos/pedidos.types';

import {
  fetchPedidosAsignadosHoy,
  fetchPedidosPendientes,
  fetchPedidosEntregados,
  fetchPedidoDetalle,
  reassignPedido, // fallback si NO se pasa onReasignar
} from '@/services/courier/pedidos/pedidos.api';

import DetallePedidoDrawer from './DetallePedidoDrawer';
import { Selectx } from '@/shared/common/Selectx';
import { Inputx } from '@/shared/common/Inputx';
import Buttonx from '@/shared/common/Buttonx';
import { SearchInputx } from '@/shared/common/SearchInputx';

type View = 'asignados' | 'pendientes' | 'terminados';

interface Props {
  view: View;
  token: string;
  onVerDetalle?: (id: number) => void;
  onAsignar?: (ids: number[]) => void;
  /** Si se provee, abre tu modal y NO se usa window.prompt */
  onReasignar?: (pedido: PedidoListItem) => void;
}

/* ---- utilidades de formato ---- */
const PEN = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
});
const two = (n: number) => String(n).padStart(2, '0');




export default function TablePedidoCourier({ view, token, onAsignar, onReasignar }: Props) {
  /* paginación (server-side) */
  const [page, setPage] = useState(1);
  const [perPage] = useState(6);

  /* filtros (client-side, visuales) */
  const [filtroDistrito, setFiltroDistrito] = useState('');
  const [filtroCantidad, setFiltroCantidad] = useState('');
  const [searchProducto, setSearchProducto] = useState('');

  /* data */
  const [data, setData] = useState<Paginated<PedidoListItem> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  /* selección (solo vista "asignados") */
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  /* detalle */
  const [detalle, setDetalle] = useState<PedidoDetalle | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* trigger para refetch luego de reasignar */
  const [reloadTick, setReloadTick] = useState(0);

  // reset cuando cambia la vista
  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
    setFiltroDistrito('');
    setFiltroCantidad('');
    setSearchProducto('');
  }, [view]);

  // querys para backend
  const qHoy: ListPedidosHoyQuery = useMemo(() => ({ page, perPage }), [page, perPage]);
  const qEstado: ListByEstadoQuery = useMemo(
    () => ({ page, perPage, sortBy: 'programada', order: 'asc' }),
    [page, perPage]
  );

  // fetch según vista
  useEffect(() => {
    const ac = new AbortController();

    async function load() {
      if (!token) {
        setError('No hay token');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        let resp: Paginated<PedidoListItem>;
        if (view === 'asignados') {
          resp = await fetchPedidosAsignadosHoy(token, qHoy, { signal: ac.signal });
        } else if (view === 'pendientes') {
          resp = await fetchPedidosPendientes(token, qEstado, { signal: ac.signal });
        } else {
          resp = await fetchPedidosEntregados(token, qEstado, { signal: ac.signal });
        }
        setData(resp);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setError(e instanceof Error ? e.message : 'Error al cargar pedidos');
        }
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => ac.abort();
  }, [token, view, qHoy, qEstado, reloadTick]);

  const itemsBase = data?.items ?? [];

  // distritos únicos para el filtro
  const distritos = useMemo(
    () => Array.from(new Set(itemsBase.map((x) => x.cliente?.distrito).filter(Boolean))).sort(),
    [itemsBase]
  );

  // filtros visuales (client-side)
  const itemsFiltrados = useMemo(() => {
    let arr = [...itemsBase];

    if (filtroDistrito) {
      arr = arr.filter((x) => x.cliente?.distrito === filtroDistrito);
    }
    if (filtroCantidad) {
      const cant = Number(filtroCantidad);
      const cantidadDeItems = (x: PedidoListItem) =>
        x.items_total_cantidad ?? x.items?.reduce((s, it) => s + it.cantidad, 0) ?? 0;
      arr = arr.filter((x) => cantidadDeItems(x) === cant);
    }
    if (searchProducto.trim()) {
      const q = searchProducto.trim().toLowerCase();
      arr = arr.filter((x) => (x.items ?? []).some((it) => it.nombre.toLowerCase().includes(q)));
    }

    return arr;
  }, [itemsBase, filtroDistrito, filtroCantidad, searchProducto]);

  // selección de items visibles
  const pageIds = itemsFiltrados.map((p) => p.id);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const someSelected = !allSelected && pageIds.some((id) => selectedIds.includes(id));

  // header checkbox indeterminate
  const headerCbRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headerCbRef.current) headerCbRef.current.indeterminate = someSelected;
  }, [someSelected]);

  const totalPages = data?.totalPages ?? 1;

  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  // Paginador: páginas a mostrar
  const pagerItems = useMemo<(number | string)[]>(() => {
    const maxButtons = 5;
    const pages: (number | string)[] = [];
    if (!totalPages || totalPages <= 1) return pages;

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
        pages.unshift('…');
        pages.unshift(1);
      }
      if (end < totalPages) {
        pages.push('…');
        pages.push(totalPages);
      }
    }
    return pages;
  }, [page, totalPages]);
  // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

  const goToPage = (p: number) => {
    if (!totalPages) return;
    if (p < 1 || p > totalPages || p === page || loading) return;
    setPage(p);
  };

  // 👁️ Ver detalle
  const handleVerDetalle = async (pedidoId: number) => {
    try {
      const data = await fetchPedidoDetalle(token, pedidoId);
      setDetalle(data);
      setDrawerOpen(true);
    } catch (err) {
      console.error('❌ Error al cargar detalle:', err);
    }
  };

  // 🔁 Reasignar
  const handleReasignar = async (p: PedidoListItem) => {
    // Si el padre pasó un modal, úsalo:
    if (onReasignar) return onReasignar(p);

    // Fallback (prompt) solo si NO hay modal conectado:
    try {
      const raw = window.prompt(
        `Reasignar pedido ${p.codigo_pedido}\n\nIngrese el ID del nuevo repartidor:`,
        ''
      );
      if (!raw) return;
      const nuevoId = Number(raw);
      if (!Number.isFinite(nuevoId) || nuevoId <= 0) {
        setError('ID de repartidor inválido');
        return;
      }
      setLoading(true);
      setError('');
      await reassignPedido(token, { pedido_id: p.id, motorizado_id: nuevoId });
      setReloadTick((t) => t + 1); // fuerza recarga
    } catch (e: any) {
      setError(e?.message ?? 'Error al reasignar pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-transparent overflow-visible">
      {/* Header */}
      <div className="flex items-center justify-between px-0 pt-0 pb-0 mb-5">
        <div>
          <h2 className="text-[20px] font-semibold text-primaryDark leading-tight">
            {view === 'asignados' && 'Pedidos Asignados'}
            {view === 'pendientes' && 'Pedidos Pendientes'}
            {view === 'terminados' && 'Pedidos Terminados'}
          </h2>
          <p className="text-sm text-gray-600">
            {view === 'asignados' && 'Selecciona y asigna pedidos a un repartidor.'}
            {view === 'pendientes' && 'Pedidos en gestión con el cliente (contacto, reprogramación, etc.).'}
            {view === 'terminados' && 'Pedidos completados (mostrar método de pago y evidencia si corresponde).'}
          </p>
        </div>

        <button
          onClick={() => onAsignar?.(selectedIds)}
          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={!selectedIds.length || loading || view !== 'asignados'}
          title={view !== 'asignados' ? 'Solo disponible en Asignados' : 'Asignar Repartidor'}
        >
          Asignar Repartidor
        </button>
      </div>

      {/* Filtros */}
      <div className="px-0 py-0 mb-5">
        <div className="bg-white p-5 rounded shadow-default flex flex-wrap gap-4 items-end border-b-4 border-gray90">
          {/* Distrito */}
          <div className="flex-1 min-w-[200px]">
            <Selectx
              label="Distrito"
              name="filtro_distrito"
              value={filtroDistrito}
              onChange={(e) => setFiltroDistrito(e.target.value)}
              placeholder="Seleccionar distrito"
            /* Estilos originales conservados */
            >
              {distritos.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Selectx>
          </div>

          {/* Cantidad */}
          <div className="flex-1 min-w-[200px]">
            <Selectx
              label="Cantidad"
              name="filtro_cantidad"
              value={filtroCantidad}
              onChange={(e) => setFiltroCantidad(e.target.value)}
              placeholder="Seleccionar cantidad"
            /* Estilos originales conservados */
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {two(n)}
                </option>
              ))}
            </Selectx>
          </div>

          {/* Búsqueda (SearchInputx sin label interno → añadimos label externo como en tu UI) */}
          <div className="flex-1 min-w-[240px] flex flex-col gap-[10px]">
            <label className="text-sm font-medium text-black block">
              Buscar productos por nombre
            </label>
            <SearchInputx
              placeholder="Buscar productos por nombre..."
              value={searchProducto}
              onChange={(e) => setSearchProducto(e.target.value)}
            /* Estilos originales conservados (override sobre los defaults del componente) */
            />
          </div>

          {/* Limpiar (tu botón por componente) */}
          <Buttonx
            variant="outlined"
            onClick={() => { setFiltroDistrito(''); setFiltroCantidad(''); setSearchProducto(''); }}
            label="Limpiar Filtros"
            icon="mynaui:delete"
          /* Mismo look & feel que tu botón previo */
          />
        </div>
      </div>

      {/* Estados */}
      {loading && <div className="py-10 text-center text-gray-500">Cargando...</div>}
      {!loading && error && <div className="py-10 text-center text-red-600">{error}</div>}

      {/* Tabla */}
      {!loading && !error && (
        <>
          <div className="bg-white rounded-md overflow-hidden shadow-default border border-gray30">
            <div className="overflow-x-auto bg-white">
              <table className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30 rounded-t-md">
                <colgroup>
                  <col className="w-[5%]" />
                  <col className="w-[12%]" />
                  <col className="w-[15%]" />
                  <col className="w-[15%]" />
                  <col className="w-[28%]" />
                  <col className="w-[10%]" />
                  <col className="w-[10%]" />
                  <col className="w-[5%]" />
                </colgroup>

                <thead className="bg-[#E5E7EB]">
                  <tr className="text-gray70 font-roboto font-medium">
                    <th className="px-4 py-3 text-left">
                      <input
                        ref={headerCbRef}
                        type="checkbox"
                        className="cursor-pointer"
                        checked={allSelected}
                        onChange={(e) => {
                          if (view !== 'asignados') return;
                          if (e.target.checked) {
                            setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
                          } else {
                            setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
                          }
                        }}
                        disabled={view !== 'asignados'}
                      />
                    </th>
                    <th className="px-4 py-3 text-left">Fec. Entrega</th>
                    <th className="px-4 py-3 text-left">Ecommerce</th>
                    <th className="px-4 py-3 text-left">Cliente</th>
                    <th className="px-4 py-3 text-left">Dirección de Entrega</th>
                    <th className="px-4 py-3 text-center">Cant. de productos</th>
                    <th className="px-4 py-3 text-left">Monto</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray20">
                  {itemsFiltrados.map((p) => {
                    const fecha =
                      view === 'terminados'
                        ? p.fecha_entrega_real ?? p.fecha_entrega_programada
                        : p.fecha_entrega_programada;

                    const cantidad =
                      p.items_total_cantidad ?? p.items?.reduce((s, it) => s + it.cantidad, 0) ?? 0;
                    const direccion = p.cliente?.direccion ?? '';
                    const montoNumber = Number(p.monto_recaudar || 0);

                    return (
                      <tr key={p.id} className="hover:bg-gray10 transition-colors">
                        <td className="h-12 px-4 py-3">
                          <input
                            type="checkbox"
                            className="cursor-pointer"
                            checked={selectedIds.includes(p.id)}
                            onChange={(e) => {
                              if (view !== 'asignados') return;
                              setSelectedIds((prev) =>
                                e.target.checked ? [...prev, p.id] : prev.filter((x) => x !== p.id)
                              );
                            }}
                            disabled={view !== 'asignados'}
                          />
                        </td>
                        <td className="h-12 px-4 py-3 text-gray70">
                          {fecha ? new Date(fecha).toLocaleDateString('es-PE') : '—'}
                        </td>
                        <td className="h-12 px-4 py-3 text-gray70">
                          {p.ecommerce?.nombre_comercial ?? '—'}
                        </td>
                        <td className="h-12 px-4 py-3 text-gray70">{p.cliente?.nombre ?? '—'}</td>
                        <td className="h-12 px-4 py-3 text-gray70 truncate max-w-[260px]" title={direccion}>
                          {direccion || '—'}
                        </td>
                        <td className="h-12 px-4 py-3 text-center text-gray70">{two(cantidad)}</td>
                        <td className="h-12 px-4 py-3 text-gray70">{PEN.format(montoNumber)}</td>
                        <td className="h-12 px-4 py-3">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              onClick={() => handleVerDetalle(p.id)}
                              title="Ver detalle"
                              aria-label={`Ver ${p.id}`}
                            >
                              <FaEye />
                            </button>

                            {view === 'pendientes' && (
                              <button
                                className="text-indigo-600 hover:text-indigo-800 transition-colors"
                                onClick={() => handleReasignar(p)}
                                title="Reasignar pedido"
                                aria-label={`Reasignar ${p.id}`}
                              >
                                <Icon icon="mdi:swap-horizontal" width={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {!itemsFiltrados.length && (
                    <tr className="hover:bg-transparent">
                      <td colSpan={8} className="px-4 py-8 text-center text-gray70 italic">
                        No hay pedidos para esta etapa.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-end gap-2 border-b-[4px] border-gray90 py-3 px-3 mt-2">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1 || loading}
                  className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
                  aria-label="Página anterior"
                >
                  &lt;
                </button>

                {pagerItems.map((p, i) =>
                  typeof p === 'string' ? (
                    <span key={`dots-${i}`} className="px-2 text-gray70">
                      {p}
                    </span>
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
                  aria-label="Página siguiente"
                >
                  &gt;
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Drawer del detalle */}
      <DetallePedidoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} detalle={detalle} />
    </div>
  );
}
