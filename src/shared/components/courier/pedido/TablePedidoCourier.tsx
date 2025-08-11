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
  fetchPedidosHoy,
  fetchPedidosReprogramados,
  fetchPedidosEntregados,
} from '@/services/courier/pedidos/pedidos.api';

type View = 'asignados' | 'pendientes' | 'terminados';

interface Props {
  view: View;
  token: string;
  onVerDetalle?: (pedidoId: number) => void;
  onAsignar?: (ids: number[]) => void; // botón "Asignar Repartidor"
}

/* ---- formateos ---- */
const PEN = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
});
const two = (n: number) => String(n).padStart(2, '0');

export default function TablePedidoCourier({ view, token, onVerDetalle, onAsignar }: Props) {
  /* server-side paginación */
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  /* filtros de la barra superior (client-side) */
  const [filtroDistrito, setFiltroDistrito] = useState('');
  const [filtroCantidad, setFiltroCantidad] = useState('');
  const [searchProducto, setSearchProducto] = useState('');

  /* datos */
  const [data, setData] = useState<Paginated<PedidoListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* selección */
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // reset cuando cambie la vista
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

  // fetch según etapa
  useEffect(() => {
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
          // por ahora usamos /hoy; cuando tengas /asignados, cámbialo aquí
          resp = await fetchPedidosHoy(token, qHoy);
        } else if (view === 'pendientes') {
          // ideal: endpoint /pendientes (pendiente, recepcionará hoy, no responde, reprogramado, anuló)
          // por ahora usamos reprogramados para no romper el flujo
          resp = await fetchPedidosReprogramados(token, qEstado);
        } else {
          // terminados -> entregados (si luego quieres incluir rechazados, crea /terminados y cámbialo)
          resp = await fetchPedidosEntregados(token, qEstado);
        }
        setData(resp);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al cargar pedidos');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, view, qHoy, qEstado]);

  const itemsBase = data?.items ?? [];

  // distritos únicos para el select
  const distritos = useMemo(
    () => Array.from(new Set(itemsBase.map((x) => x.cliente.distrito).filter(Boolean))).sort(),
    [itemsBase]
  );

  // filtros de la maqueta (en cliente)
  const itemsFiltrados = useMemo(() => {
    let arr = [...itemsBase];

    if (filtroDistrito) {
      arr = arr.filter((x) => x.cliente.distrito === filtroDistrito);
    }

    if (filtroCantidad) {
      const cant = Number(filtroCantidad);
      arr = arr.filter((x) => (x.items_total_cantidad ?? 0) === cant);
    }

    if (searchProducto.trim()) {
      const q = searchProducto.trim().toLowerCase();
      arr = arr.filter((x) => (x.items ?? []).some((it) => it.nombre.toLowerCase().includes(q)));
    }

    return arr;
  }, [itemsBase, filtroDistrito, filtroCantidad, searchProducto]);

  // selección
  const pageIds = itemsFiltrados.map((p) => p.id);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };
  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="w-full bg-white rounded-lg shadow overflow-hidden">
      {/* Título + botón Asignar */}
      <div className="flex items-center justify-between px-4 pt-4">
        <div>
          <h2 className="text-lg font-semibold text-primaryDark">
            {view === 'asignados' && 'Pedidos Asignados'}
            {view === 'pendientes' && 'Pedidos Pendientes'}
            {view === 'terminados' && 'Pedidos Terminados'}
          </h2>
          <p className="text-sm text-gray-600">
            {view === 'asignados' && 'Los pedidos serán asignados a un repartidor.'}
            {view === 'pendientes' && 'Pedidos en gestión de contacto/entrega.'}
            {view === 'terminados' && 'Pedidos completados o finalizados.'}
          </p>
        </div>

        <button
          onClick={() => onAsignar?.(selectedIds)}
          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={!selectedIds.length || loading || view !== 'asignados'}
          title={view !== 'asignados' ? 'Solo disponible en Asignados' : 'Asignar Repartidor'}
        >
          <span className="material-icons-outlined text-sm">credit_card</span>
          Asignar Repartidor
        </button>
      </div>

      {/* Filtros */}
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
            <div className="relative">
              <input
                className="w-full border rounded px-3 py-2 text-sm pr-8"
                placeholder="Buscar productos por nombre..."
                value={searchProducto}
                onChange={(e) => setSearchProducto(e.target.value)}
              />
              <span className="material-icons-outlined absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-base">
                search
              </span>
            </div>
          </div>

          <button
            className="inline-flex items-center gap-2 border px-3 py-2 rounded text-gray-600 hover:bg-gray-100"
            onClick={() => {
              setFiltroDistrito('');
              setFiltroCantidad('');
              setSearchProducto('');
            }}
          >
            <span className="material-icons-outlined text-sm">restart_alt</span>
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
            Página <b>{page}</b> de <b>{data?.totalPages ?? 1}</b>
          </span>
          <button
            disabled={(data?.totalPages ?? 1) <= page || loading}
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
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
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

                const cant =
                  p.items_total_cantidad ??
                  (p.items?.reduce((sum, it) => sum + it.cantidad, 0) ?? 0);

                return (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => toggleSelectOne(p.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {fecha ? new Date(fecha).toLocaleDateString('es-PE') : '—'}
                    </td>
                    <td className="px-4 py-3">{p.ecommerce?.nombre_comercial ?? '—'}</td>
                    <td className="px-4 py-3">{p.cliente?.nombre ?? '—'}</td>
                    <td
                      className="px-4 py-3 truncate max-w-[260px]"
                      title={p.direccion_envio ?? ''}
                    >
                      {p.direccion_envio ?? '—'}
                    </td>
                    <td className="px-4 py-3">{two(cant)}</td>
                    <td className="px-4 py-3">
                      {PEN.format(Number(p.monto_recaudar || 0))}
                    </td>
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

          {data && data.totalPages > 1 && (
            <div className="border-t p-4">
              <Paginator
                currentPage={page}
                totalPages={data.totalPages}
                onPageChange={(next) => {
                  if (!loading && next >= 1 && next <= (data.totalPages ?? 1)) setPage(next);
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
