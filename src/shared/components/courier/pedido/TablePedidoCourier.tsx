// src/shared/components/courier/pedido/TablePedidoCourier.tsx
import { useEffect, useMemo, useState } from 'react';
import { FaEye } from 'react-icons/fa';
import Paginator from '../../Paginator';

import type {
  Paginated,
  PedidoListItem,
  ListPedidosHoyQuery,
  ListByEstadoQuery,
} from '@/services/courier/pedidos/pedidos.types';

import {
  fetchPedidosAsignadosHoy,
  fetchPedidosPendientes,
  fetchPedidosEntregados,
} from '@/services/courier/pedidos/pedidos.api';

type View = 'asignados' | 'pendientes' | 'terminados';

interface Props {
  view: View;
  token: string;
  onVerDetalle?: (pedidoId: number) => void;
  onAsignar?: (ids: number[]) => void; // callback del botón "Asignar Repartidor"
}

/* ---- utilidades de formato ---- */
const PEN = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
});
const two = (n: number) => String(n).padStart(2, '0');

export default function TablePedidoCourier({ view, token, onVerDetalle, onAsignar }: Props) {
  /* paginación (server-side) */
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

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
          // agrupado: Pendiente, Recepcionará entrega hoy, No responde / número equivocado,
          // Reprogramado, No hizo el pedido / anuló
          resp = await fetchPedidosPendientes(token, qEstado, { signal: ac.signal });
        } else {
          // terminados: Entregados (si quieres incluir rechazados, crea endpoint /terminados o /rechazados)
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
  }, [token, view, qHoy, qEstado]);

  const itemsBase = data?.items ?? [];

  // distritos únicos para el filtro
  const distritos = useMemo(
    () => Array.from(new Set(itemsBase.map((x) => x.cliente?.distrito).filter(Boolean))).sort(),
    [itemsBase]
  );

  // filtros visuales (client-side) sobre el page cargado
  const itemsFiltrados = useMemo(() => {
    let arr = [...itemsBase];

    if (filtroDistrito) {
      arr = arr.filter((x) => x.cliente?.distrito === filtroDistrito);
    }

    if (filtroCantidad) {
      const cant = Number(filtroCantidad);
      const cantidadDeItems = (x: PedidoListItem) =>
        x.items_total_cantidad ?? (x.items?.reduce((s, it) => s + it.cantidad, 0) ?? 0);
      arr = arr.filter((x) => cantidadDeItems(x) === cant);
    }

    if (searchProducto.trim()) {
      const q = searchProducto.trim().toLowerCase();
      arr = arr.filter((x) => (x.items ?? []).some((it) => it.nombre.toLowerCase().includes(q)));
    }

    return arr;
  }, [itemsBase, filtroDistrito, filtroCantidad, searchProducto]);

  // selección de items visibles en la página actual
  const pageIds = itemsFiltrados.map((p) => p.id);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = () => {
    if (view !== 'asignados') return;
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectOne = (id: number) => {
    if (view !== 'asignados') return;
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="w-full bg-white rounded-lg shadow overflow-hidden">
      {/* Header interno + botón Asignar */}
      <div className="flex items-center justify-between px-4 pt-4">
        <div>
          <h2 className="text-lg font-semibold text-primaryDark">
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

      {/* Filtros visuales */}
      <div className="px-4 py-3">
        <div className="bg-white border rounded p-3 flex flex-wrap gap-3 items-end">
          <div className="min-w-[200px]">
            <label className="block text-xs text-gray-600 mb-1">Distrito</label>
            <select
              className="w-full border rounded px-3 py-2 text-sm"
              value={filtroDistrito}
              onChange={(e) => setFiltroDistrito(e.target.value)}
            >
              <option value="">Seleccionar distrito</option>
              {distritos.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[200px]">
            <label className="block text-xs text-gray-600 mb-1">Cantidad</label>
            <select
              className="w-full border rounded px-3 py-2 text-sm"
              value={filtroCantidad}
              onChange={(e) => setFiltroCantidad(e.target.value)}
            >
              <option value="">Seleccionar cantidad</option>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {two(n)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[240px]">
            <label className="block text-xs text-gray-600 mb-1">Buscar productos por nombre</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Buscar productos por nombre..."
              value={searchProducto}
              onChange={(e) => setSearchProducto(e.target.value)}
            />
          </div>

          <button
            className="inline-flex items-center gap-2 border px-3 py-2 rounded text-gray-600 hover:bg-gray-100"
            onClick={() => {
              setFiltroDistrito('');
              setFiltroCantidad('');
              setSearchProducto('');
            }}
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* barra superior: total & paginación */}
      <div className="flex justify-between items-center px-4 py-3 border-t">
        <div className="text-sm text-gray-600">
          Total: <b>{data?.totalItems ?? 0}</b> registros
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm">
            Página <b>{page}</b> de <b>{totalPages}</b>
          </span>
          <button
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* estados de carga */}
      {loading && <div className="py-10 text-center text-gray-500">Cargando...</div>}
      {!loading && error && <div className="py-10 text-center text-red-600">{error}</div>}

      {/* tabla */}
      {!loading && !error && (
        <>
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
              <tr>
                <th className="px-4 py-3">
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} disabled={view !== 'asignados'} />
                </th>
                <th className="px-4 py-3">Fec. Entrega</th>
                <th className="px-4 py-3">Ecommerce</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Dirección de Entrega</th>
                <th className="px-4 py-3">Cant. de productos</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {itemsFiltrados.map((p) => {
                const fecha =
                  view === 'terminados'
                    ? p.fecha_entrega_real ?? p.fecha_entrega_programada
                    : p.fecha_entrega_programada;

                const cantidad = p.items_total_cantidad ?? (p.items?.reduce((s, it) => s + it.cantidad, 0) ?? 0);
                const direccion = p.cliente?.direccion ?? ''; // viene del mapeo del service
                const montoNumber = Number(p.monto_recaudar || 0);

                return (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => toggleSelectOne(p.id)}
                        disabled={view !== 'asignados'}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {fecha ? new Date(fecha).toLocaleDateString('es-PE') : '—'}
                    </td>
                    <td className="px-4 py-3">{p.ecommerce?.nombre_comercial ?? '—'}</td>
                    <td className="px-4 py-3">{p.cliente?.nombre ?? '—'}</td>
                    <td className="px-4 py-3 truncate max-w-[260px]" title={direccion}>
                      {direccion || '—'}
                    </td>
                    <td className="px-4 py-3">{two(cantidad)}</td>
                    <td className="px-4 py-3">{PEN.format(montoNumber)}</td>
                    <td className="px-4 py-3">
                      <button
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => onVerDetalle?.(p.id)}
                        title="Ver detalle"
                      >
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!itemsFiltrados.length && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    No hay pedidos para esta etapa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Paginación inferior (opcional con tu componente) */}
          {totalPages > 1 && (
            <div className="border-t p-4">
              <Paginator
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(next) => {
                  if (!loading && next >= 1 && next <= totalPages) setPage(next);
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
