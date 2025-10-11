import  { useEffect, useMemo, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { fetchPedidoDetalle, reassignPedido } from '@/services/courier/pedidos/pedidos.api';
import type { PedidoListItem, PedidoDetalle } from '@/services/courier/pedidos/pedidos.types';

type MotorizadoBasic = { id: number; nombre: string };

type Props = {
  open: boolean;
  token: string;
  pedido: PedidoListItem;
  /** Si no lo pasas o viene vacío, el modal los cargará del API */
  motorizados?: MotorizadoBasic[];
  title?: string;
  onClose: () => void;
  onSuccess?: () => void;
};

/* ---- Tipos y constantes para cargar motorizados (como en Asignar) ---- */
type MotorizadoApi = {
  id: number;
  estado_id: number;
  estado?: { nombre?: string; tipo?: string } | null;
  usuario?: { nombres?: string; apellidos?: string } | null;
};

const API_URL = import.meta.env.VITE_API_URL as string;
const ESTADO_ID_DISPONIBLE = 18;

/* ---- utilidades de formato ---- */
const PEN = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 });
const two = (n: number) => String(n).padStart(2, '0');

export default function ReasignarRepartidorModal({
  open,
  token,
  pedido,
  motorizados: motorizadosProp,
  title = 'REASIGNAR REPARTIDOR',
  onClose,
  onSuccess,
}: Props) {
  const [detalle, setDetalle] = useState<PedidoDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [motosLoading, setMotosLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [motorizadoId, setMotorizadoId] = useState<number | ''>('');
  const [observacion, setObservacion] = useState(''); // 👈 NUEVO (obligatorio)
  const [error, setError] = useState<string | null>(null);

  // lista local (se usa si no llega por props)
  const [motorizadosLocal, setMotorizadosLocal] = useState<MotorizadoBasic[]>([]);

  // si vienen por props, úsalo
  useEffect(() => {
    if (Array.isArray(motorizadosProp) && motorizadosProp.length) {
      setMotorizadosLocal(motorizadosProp);
    }
  }, [motorizadosProp]);

  // cargar motorizados del API si no llegaron por props
  useEffect(() => {
    if (!open) return;
    if (Array.isArray(motorizadosProp) && motorizadosProp.length) return; // ya tenemos lista

    const ac = new AbortController();
    (async () => {
      setMotosLoading(true);
      setError(null);
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

        const mapped: MotorizadoBasic[] = soloDisponibles.map((m) => ({
          id: m.id,
          nombre: `${m.usuario?.nombres ?? ''} ${m.usuario?.apellidos ?? ''}`.trim() || `Motorizado ${m.id}`,
        }));

        setMotorizadosLocal(mapped);
      } catch (e: any) {
        if (e?.name !== 'AbortError') setError(e?.message ?? 'No se pudo cargar repartidores');
      } finally {
        setMotosLoading(false);
      }
    })();

    return () => ac.abort();
  }, [open, token, motorizadosProp]);

  // reset UI cuando se abre/cierra
  useEffect(() => {
    if (open) {
      setMotorizadoId('');
      setObservacion('');
      setError(null);
      setDetalle(null);
    }
  }, [open]);

  // cargar detalle al abrir
  useEffect(() => {
    if (!open) return;

    const ac = new AbortController();
    (async () => {
      setError(null);
      setDetalle(null);
      setLoading(true);
      try {
        const d = await fetchPedidoDetalle(token, pedido.id, { signal: ac.signal });
        setDetalle(d);
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        setError(e?.message ?? 'No se pudo cargar el detalle');
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [open, token, pedido.id]);

  const cantidad = useMemo(
    () =>
      detalle?.cantidad_productos ??
      pedido.items_total_cantidad ??
      (pedido.items ?? []).reduce((a, it) => a + it.cantidad, 0),
    [detalle, pedido]
  );

  async function handleSubmit() {
    if (!motorizadoId || submitting) return;

    if (pedido.motorizado?.id && pedido.motorizado.id === motorizadoId) {
      setError('El pedido ya está asignado a ese repartidor.');
      return;
    }

    if (!observacion.trim()) {
      setError('La observación es obligatoria.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await reassignPedido(token, {
        pedido_id: pedido.id,
        motorizado_id: Number(motorizadoId),
        observacion: observacion.trim(), // 👈 se envía al backend
      });
      onSuccess?.();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'Error al reasignar');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50">
      <div className="w-[420px] max-w-[92vw] bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 bg-indigo-600 rounded-full" />
            <h3 className="font-semibold">{title}</h3>
          </div>
          <div className="text-xs text-gray-500">
            Cód. Pedido : <b>{pedido.codigo_pedido}</b>
          </div>
          <button onClick={onClose} className="ml-2 text-gray-500 hover:text-gray-700" disabled={submitting}>
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Card resumen */}
          <div className="border rounded-md p-3 text-sm">
            <div className="flex items-start justify-between mb-1">
              <div className="text-gray-700">
                <div className="text-[13px]">
                  <span className="text-gray-500">Cliente:</span> {pedido.cliente?.nombre ?? '-'}
                </div>
                <div className="text-[12px] text-gray-500">
                  Dirección de Entrega:{' '}
                  <span className="text-gray-700">
                    {pedido.cliente?.direccion ?? pedido.direccion_envio ?? '-'}
                  </span>
                </div>
                <div className="text-[12px] text-gray-500">
                  F. Entrega:{' '}
                  <span className="text-gray-700">
                    {pedido.fecha_entrega_programada
                      ? new Date(pedido.fecha_entrega_programada).toLocaleDateString('es-PE')
                      : '-'}
                  </span>
                </div>
              </div>
              <div className="text-right text-[13px]">
                <div> Monto: <b>{PEN.format(Number(pedido.monto_recaudar || 0))}</b> </div>
                <div className="text-gray-500"> Cant. de Productos: <b>{two(cantidad || 0)}</b> </div>
              </div>
            </div>

            {/* Tabla productos mini */}
            <div className="border rounded mt-2">
              <div className="flex justify-between text-[11px] uppercase text-gray-500 px-2 py-1 border-b">
                <span>Producto</span>
                <span>Cant.</span>
              </div>
              <div className="max-h-28 overflow-y-auto">
                {loading && <div className="p-2 text-xs text-gray-500">Cargando productos…</div>}
                {!loading && (detalle?.items?.length ?? 0) === 0 && (
                  <div className="p-2 text-xs text-gray-400">Sin productos</div>
                )}
                {!loading &&
                  (detalle?.items ?? []).map((it, idx) => (
                    <div key={idx} className="flex justify-between px-2 py-1 text-sm">
                      <span className="truncate">{it.nombre}</span>
                      <span>{two(it.cantidad)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Selector de repartidor */}
          <div className="mt-2">
            <label className="block text-sm text-gray-700 mb-1">Repartidor</label>
            <select
              className="w-full h-10 px-3 pr-9 rounded-md border border-gray-200 bg-gray-50 text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-indigo-500"
              value={motorizadoId}
              onChange={(e) => setMotorizadoId(e.target.value ? Number(e.target.value) : '')}
              disabled={motosLoading || submitting}
            >
              <option value="">Seleccione repartidor</option>
              {motorizadosLocal.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
            {!motosLoading && motorizadosLocal.length === 0 && (
              <div className="text-xs text-gray-500 mt-1">No hay repartidores disponibles.</div>
            )}
          </div>

          {/* Observación (obligatoria) */}
          <div className="mt-2">
            <label className="block text-sm text-gray-700 mb-1">Observación</label>
            <textarea
              className="w-full min-h-[80px] px-3 py-2 rounded-md border border-gray-200 bg-gray-50 text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-indigo-500"
              placeholder="Motivo de la reasignación (p. ej., cambio de zona, capacidad, etc.)"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              maxLength={250}
              disabled={submitting}
            />
            <div className="text-xs text-gray-400 mt-1">{observacion.length}/250</div>
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="text-[11px] text-gray-500">
            El pedido original quedará en estado <b>Reasignado</b> y se creará un nuevo pedido para el
            repartidor seleccionado.
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t bg-gray-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border bg-white text-gray-700 hover:bg-gray-100"
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!motorizadoId || !observacion.trim() || submitting}
            className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {submitting ? 'Procesando…' : 'Reasignar'}
          </button>
        </div>
      </div>
    </div>
  );
}
