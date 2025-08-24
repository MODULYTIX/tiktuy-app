import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { assignPedidos } from '@/services/courier/pedidos/pedidos.api';
import type { PedidoListItem } from '@/services/courier/pedidos/pedidos.types';

type Props = {
  open: boolean;
  onClose: () => void;
  token: string;
  /** IDs seleccionados desde la tabla */
  selectedIds: number[];
  /** Opcional: si pasas el pedido seleccionado podrás renderizar su resumen sin volver a pedirlo */
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
  monto_recaudar: string; // viene como string en tu listado
  items?: { nombre: string; cantidad: number }[];
  items_total_cantidad?: number;
};

const API_URL = import.meta.env.VITE_API_URL as string;
const ESTADO_ID_DISPONIBLE = 18; // Disponible

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
  const [detalle, setDetalle] = useState<PedidoDetalleMin | null>(null);

  const isMulti = selectedIds.length > 1;

  // Cargar motorizados del courier autenticado (SOLO DISPONIBLES)
  useEffect(() => {
    if (!open) return;
    const ac = new AbortController();

    async function loadMotos() {
      setMotosLoading(true);
      setError('');
      try {
        // Si tienes un endpoint dedicado: `${API_URL}/motorizado/disponibles`
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

        const opts: MotorizadoOption[] = soloDisponibles.map((m) => ({
          id: m.id,
          nombres: m.usuario?.nombres ?? '',
          apellidos: m.usuario?.apellidos ?? '',
        }));

        setMotorizados(opts);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setError((e as Error).message);
        }
      } finally {
        setMotosLoading(false);
      }
    }

    loadMotos();
    return () => ac.abort();
  }, [open, token]);

  // Si es selección única, intenta mostrar resumen del pedido
  useEffect(() => {
    if (!open) return;
    if (isMulti) {
      setDetalle(null);
      return;
    }
    // Si ya viene desde el padre, úsalo directo
    if (selectedPedido) {
      setDetalle({
        id: selectedPedido.id,
        codigo_pedido: selectedPedido.codigo_pedido,
        cliente: { nombre: selectedPedido.cliente.nombre },
        direccion_envio: selectedPedido.direccion_envio ?? null,
        fecha_entrega_programada: selectedPedido.fecha_entrega_programada,
        monto_recaudar: selectedPedido.monto_recaudar,
        items: selectedPedido.items ?? [],
        items_total_cantidad: selectedPedido.items_total_cantidad,
      });
      return;
    }
    // Si no viene, pide el detalle al backend
    const ac = new AbortController();
    async function loadDetalle() {
      try {
        const id = selectedIds[0];
        const res = await fetch(`${API_URL}/pedido/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: ac.signal,
        });
        if (!res.ok) throw new Error('Error al cargar detalle del pedido');
        const p = await res.json();
        const items: { nombre: string; cantidad: number }[] =
          p.detalles?.map((d: any) => ({
            nombre: d.producto?.nombre_producto ?? 'Producto',
            cantidad: d.cantidad ?? 0,
          })) ?? [];

        const cantCalc =
          p.items_total_cantidad ??
          items.reduce((s: number, it: { cantidad: number }) => s + (it.cantidad || 0), 0);

        const det: PedidoDetalleMin = {
          id: p.id,
          codigo_pedido: p.codigo_pedido,
          cliente: { nombre: p.nombre_cliente },
          direccion_envio: p.direccion_envio ?? null,
          fecha_entrega_programada: p.fecha_entrega_programada ?? null,
          monto_recaudar: String(p.monto_recaudar ?? '0'),
          items,
          items_total_cantidad: cantCalc,
        };
        setDetalle(det);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setError((e as Error).message);
        }
      }
    }
    loadDetalle();
    return () => ac.abort();
  }, [open, isMulti, selectedIds, selectedPedido, token]);

  const tituloCodigo = useMemo(() => {
    if (isMulti) return `(${selectedIds.length} pedidos seleccionados)`;
    return detalle?.codigo_pedido ? `Cód. Pedido : ${detalle.codigo_pedido}` : '';
  }, [isMulti, selectedIds.length, detalle?.codigo_pedido]);

  const totalItems = useMemo(() => {
    if (isMulti) return selectedIds.length;
    return detalle?.items_total_cantidad ?? 0;
  }, [isMulti, selectedIds.length, detalle?.items_total_cantidad]);

  const monto = useMemo(() => {
    if (isMulti) return '—';
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(
      Number(detalle?.monto_recaudar || 0)
    );
  }, [isMulti, detalle?.monto_recaudar]);

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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40">
      <div className="w-[680px] max-w-[94vw] bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Icon icon="mdi:cart" className="text-primary" width={20} height={20} />
            <h3 className="text-lg font-semibold text-primaryDark">ASIGNAR REPARTIDOR</h3>
          </div>
          {tituloCodigo && <span className="text-xs text-gray-500">{tituloCodigo}</span>}
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded bg-red-50 text-red-700 text-sm border border-red-200">
              {error}
            </div>
          )}

          {/* Resumen */}
          <div className="border rounded p-3">
            <h4 className="font-semibold mb-3">Resumen</h4>

            {/* fila 1 */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex gap-2">
                <span className="text-gray-500 min-w-[80px]">Cliente:</span>
                <span className="font-medium">
                  {isMulti ? '—' : detalle?.cliente?.nombre ?? '—'}
                </span>
              </div>
              <div className="flex gap-2 justify-end">
                <span className="text-gray-500">Monto:</span>
                <span className="font-medium">{monto}</span>
              </div>
            </div>

            {/* fila 2 */}
            <div className="mt-2 flex gap-2 text-sm">
              <span className="text-gray-500 min-w-[130px]">Dirección de Entrega:</span>
              <span className="font-medium">
                {isMulti ? '—' : detalle?.direccion_envio ?? '—'}
              </span>
            </div>

            {/* fila 3 */}
            <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
              <div className="flex gap-2">
                <span className="text-gray-500 min-w-[80px]">F. Entrega:</span>
                <span className="font-medium">
                  {isMulti
                    ? '—'
                    : detalle?.fecha_entrega_programada
                    ? new Date(detalle.fecha_entrega_programada).toLocaleDateString('es-PE')
                    : '—'}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 min-w-[130px]">Cant. de Productos:</span>
                <span className="font-medium">{String(totalItems).padStart(2, '0')}</span>
              </div>
            </div>

            {/* Lista de productos (solo selección única) */}
            {!isMulti && (
              <div className="mt-3 border rounded">
                <div className="px-3 py-2 text-xs uppercase text-gray-600 bg-gray-50 grid grid-cols-[1fr_80px]">
                  <span>Producto</span>
                  <span className="text-right">Cant.</span>
                </div>
                <div>
                  {(detalle?.items ?? []).map((it, idx) => (
                    <div
                      key={`${it.nombre}-${idx}`}
                      className="px-3 py-2 text-sm grid grid-cols-[1fr_80px] border-t"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{it.nombre}</span>
                      </div>
                      <div className="text-right">{String(it.cantidad).padStart(2, '0')}</div>
                    </div>
                  ))}
                  {!detalle?.items?.length && (
                    <div className="px-3 py-4 text-center text-gray-500 text-sm border-t">
                      Sin items para mostrar.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

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
