import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { assignPedidos } from '@/services/courier/pedidos/pedidos.api';
import type { PedidoListItem } from '@/services/courier/pedidos/pedidos.types';

type Props = {
  open: boolean;
  onClose: () => void;
  token: string;
  selectedIds: number[];
  selectedPedido?: PedidoListItem | null;
  onAssigned?: () => void;
};

type MotorizadoOption = {
  id: number;
  nombres: string;
  apellidos: string;
};

type MotorizadoApi = {
  id: number;
  estado_id: number;
  estado?: { nombre?: string; tipo?: string } | null;
  usuario?: { nombres?: string; apellidos?: string } | null;
};

type PedidoDetalleMin = {
  id: number;
  codigo_pedido: string;
  cliente: { nombre: string };
  direccion_envio: string | null;
  fecha_entrega_programada: string | null;
  monto_recaudar: string;
  items?: { nombre: string; cantidad: number; marca?: string }[];
  items_total_cantidad?: number;
};

const API_URL = import.meta.env.VITE_API_URL as string;
const ESTADO_ID_DISPONIBLE = 18;

export default function AsignarRepartidor({
  open,
  onClose,
  token,
  selectedIds,
  selectedPedido = null,
  onAssigned,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [motosLoading, setMotosLoading] = useState(false);
  const [error, setError] = useState('');
  const [motorizados, setMotorizados] = useState<MotorizadoOption[]>([]);
  const [motorizadoId, setMotorizadoId] = useState<number | ''>('');
  const [detalles, setDetalles] = useState<PedidoDetalleMin[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const isMulti = selectedIds.length > 1;

  // Cargar motorizados disponibles
  useEffect(() => {
    if (!open) return;
    const ac = new AbortController();

    async function loadMotos() {
      setMotosLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_URL}/motorizado`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: ac.signal,
        });
        if (!res.ok) throw new Error('Error al cargar repartidores');
        const data: MotorizadoApi[] = await res.json();

        const soloDisponibles = data.filter(
          (m) =>
            m.estado_id === ESTADO_ID_DISPONIBLE ||
            (m.estado?.nombre && m.estado.nombre.toLowerCase() === 'disponible')
        );

        setMotorizados(
          soloDisponibles.map((m) => ({
            id: m.id,
            nombres: m.usuario?.nombres ?? '',
            apellidos: m.usuario?.apellidos ?? '',
          }))
        );
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError((e as Error).message);
      } finally {
        setMotosLoading(false);
      }
    }

    loadMotos();
    return () => ac.abort();
  }, [open, token]);

  // Cargar detalles pedidos seleccionados
  useEffect(() => {
    if (!open) return;

    async function loadDetalles() {
      setError('');
      try {
        const results: PedidoDetalleMin[] = [];
        for (const id of selectedIds) {
          const res = await fetch(`${API_URL}/pedido/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) continue;
          const p = await res.json();
          const items =
            p.detalles?.map((d: any) => ({
              nombre: d.producto?.nombre_producto ?? 'Producto',
              cantidad: d.cantidad ?? 0,
              marca: d.producto?.marca ?? '',
            })) ?? [];

          const cantCalc =
            p.items_total_cantidad ??
            items.reduce((s: number, it: { cantidad: number }) => s + (it.cantidad || 0), 0);

          results.push({
            id: p.id,
            codigo_pedido: p.codigo_pedido,
            cliente: { nombre: p.nombre_cliente },
            direccion_envio: p.direccion_envio ?? null,
            fecha_entrega_programada: p.fecha_entrega_programada ?? null,
            monto_recaudar: String(p.monto_recaudar ?? '0'),
            items,
            items_total_cantidad: cantCalc,
          });
        }
        setDetalles(results);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al cargar detalles');
      }
    }

    loadDetalles();
  }, [open, selectedIds, token]);

  async function handleAsignar() {
    if (!motorizadoId) return;
    setLoading(true);
    setError('');
    try {
      await assignPedidos(token, { motorizado_id: Number(motorizadoId), pedidos: selectedIds });
      onAssigned?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al asignar');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/40">
      <div className="h-full w-[480px] max-w-[90vw] bg-white rounded-l-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Icon icon="mdi:cart" className="text-primary" width={20} height={20} />
            <h3 className="text-lg font-semibold text-primaryDark">ASIGNAR REPARTIDOR</h3>
          </div>
          {isMulti ? (
            <span className="text-xs text-gray-500">
              {selectedIds.length} pedidos seleccionados
            </span>
          ) : (
            <span className="text-xs text-gray-500">
              {detalles[0]?.codigo_pedido ? `Cód. Pedido : ${detalles[0]?.codigo_pedido}` : ''}
            </span>
          )}
        </div>

        {/* Body con scroll */}
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          {error && (
            <div className="px-3 py-2 rounded bg-red-50 text-red-700 text-sm border border-red-200">
              {error}
            </div>
          )}

          {/* Resumen */}
          {!isMulti ? (
            detalles[0] && <PedidoCard pedido={detalles[0]} />
          ) : (
            <div className="space-y-2">
              {detalles.map((p) => (
                <div key={p.id} className="border rounded">
                  <button
                    onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                    className="w-full flex justify-between items-center px-3 py-2 bg-gray-50 text-sm font-medium"
                  >
                    <span>{p.codigo_pedido}</span>
                    <Icon
                      icon={expandedId === p.id ? 'mdi:chevron-up' : 'mdi:chevron-down'}
                      className="text-gray-500"
                    />
                  </button>
                  {expandedId === p.id && (
                    <div className="p-3">
                      <PedidoCard pedido={p} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Select repartidor */}
          <div className="space-y-1">
            <label className="text-sm text-gray-700">Repartidor</label>
            <div className="relative">
              <select
                className="w-full border rounded px-3 py-2 text-sm pr-8"
                value={motorizadoId}
                onChange={(e) => setMotorizadoId(e.target.value ? Number(e.target.value) : '')}
                disabled={motosLoading}
              >
                <option value="">Seleccione repartidor</option>
                {motorizados.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombres} {m.apellidos}
                  </option>
                ))}
              </select>
              <Icon
                icon="mdi:chevron-down"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-between">
          <div className="text-xs text-gray-500">
            {isMulti
              ? `${selectedIds.length} pedidos serán asignados al repartidor seleccionado.`
              : 'El pedido será asignado al repartidor seleccionado.'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleAsignar}
              disabled={!motorizadoId || loading}
              className="px-4 py-2 bg-primaryDark text-white rounded hover:bg-primary disabled:opacity-50 inline-flex items-center gap-2"
              title={!motorizadoId ? 'Seleccione un repartidor' : 'Asignar'}
            >
              <Icon icon="mdi:content-save-check-outline" />
              {loading ? 'Asignando...' : 'Asignar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Componente auxiliar para mostrar pedido */
function PedidoCard({ pedido }: { pedido: PedidoDetalleMin }) {
  return (
    <div className="border rounded p-3 text-sm">
      {/* Encabezado */}
      <div className="grid grid-cols-2 gap-4 mb-2">
        <div>
          <span className="text-gray-500">Cliente:</span> {pedido.cliente.nombre}
        </div>
        <div className="text-right">
          <span className="text-gray-500">Monto:</span>{' '}
          {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(
            Number(pedido.monto_recaudar || 0)
          )}
        </div>
      </div>

      <div className="mb-2">
        <span className="text-gray-500">Dirección de Entrega:</span>{' '}
        {pedido.direccion_envio ?? '—'}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-2">
        <div>
          <span className="text-gray-500">F. Entrega:</span>{' '}
          {pedido.fecha_entrega_programada
            ? new Date(pedido.fecha_entrega_programada).toLocaleDateString('es-PE')
            : '—'}
        </div>
        <div>
          <span className="text-gray-500">Cant. de Productos:</span>{' '}
          {String(pedido.items_total_cantidad ?? 0).padStart(2, '0')}
        </div>
      </div>

      {/* Lista de productos */}
      <div className="mt-2 border rounded">
        <div className="px-3 py-1 text-xs uppercase text-gray-600 bg-gray-50 grid grid-cols-[1fr_60px]">
          <span>Producto</span>
          <span className="text-right">Cant.</span>
        </div>
        {(pedido.items ?? []).map((it, idx) => (
          <div
            key={idx}
            className="px-3 py-2 grid grid-cols-[1fr_60px] border-t text-sm"
          >
            <div className="flex flex-col">
              <span className="font-medium">{it.nombre}</span>
              {it.marca && <span className="text-xs text-gray-500">Marca: {it.marca}</span>}
            </div>
            <span className="text-right">{String(it.cantidad).padStart(2, '0')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
