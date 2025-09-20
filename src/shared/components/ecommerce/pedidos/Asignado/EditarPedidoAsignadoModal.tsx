import { useEffect, useRef, useState } from 'react';
import { fetchPedidoById, actualizarPedidoAsignado } from '@/services/ecommerce/pedidos/pedidos.api';
import type { Pedido } from '@/services/ecommerce/pedidos/pedidos.types';
import { useAuth } from '@/auth/context';
import { FiX } from 'react-icons/fi';
import { BsBoxSeam } from 'react-icons/bs';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pedidoId: number | null;
  onUpdated: () => void;
}

export default function EditarPedidoAsignadoModal({ isOpen, onClose, pedidoId, onUpdated }: Props) {
  const { token } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [form, setForm] = useState({
    nombre_cliente: '',
    direccion: '',
    referencia: '',
    distrito: '',
    monto_recaudar: '',
    courier_id: '',
    motorizado_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // cerrar por click afuera
  useEffect(() => {
    if (!isOpen) return;
    const clickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, [isOpen, onClose]);

  // cargar pedido
  useEffect(() => {
    if (!isOpen || !token || !pedidoId) return;
    setLoading(true);
    fetchPedidoById(pedidoId, token)
      .then((p) => {
        setPedido(p);
        setForm({
          nombre_cliente: p.nombre_cliente ?? '',
          direccion: (p as any).direccion ?? p.direccion_envio ?? '',
          referencia: (p as any).referencia ?? p.referencia_direccion ?? '',
          distrito: p.distrito ?? '',
          monto_recaudar: String(p.monto_recaudar ?? ''),
          courier_id: String(p.courier?.id ?? ''),
          motorizado_id: String((p.motorizado?.id as number | undefined) ?? ''),
        });
      })
      .finally(() => setLoading(false));
  }, [isOpen, token, pedidoId]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async () => {
    if (!token || !pedidoId) return;
    setSaving(true);
    try {
      await actualizarPedidoAsignado(
        pedidoId,
        {
          nombre_cliente: form.nombre_cliente.trim(),
          // Mapea a lo que espera el backend en updateAsignado:
          // ahí usaste campos 'direccion' y 'referencia'
          direccion: form.direccion.trim(),
          referencia: form.referencia.trim(),
          distrito: form.distrito,
          monto_recaudar: Number(form.monto_recaudar) || 0,
          courier_id: form.courier_id ? Number(form.courier_id) : undefined,
          motorizado_id: form.motorizado_id ? Number(form.motorizado_id) : undefined,
        } as any,
        token
      );
      onUpdated();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/20 bg-opacity-40 flex justify-end">
      <div ref={modalRef} className="w-full max-w-md h-full bg-white shadow-xl p-6 overflow-y-auto animate-slide-in-right">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-700">
            <BsBoxSeam className="text-primary text-2xl" />
            EDITAR PEDIDO (ASIGNADO)
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {loading || !pedido ? (
          <p className="text-sm text-gray-500">Cargando...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <input
                  name="nombre_cliente"
                  value={form.nombre_cliente}
                  onChange={onChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  name="direccion"
                  value={form.direccion}
                  onChange={onChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
                <input
                  name="referencia"
                  value={form.referencia}
                  onChange={onChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Distrito</label>
                <input
                  name="distrito"
                  value={form.distrito}
                  onChange={onChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto a recaudar</label>
                <input
                  name="monto_recaudar"
                  value={form.monto_recaudar}
                  onChange={onChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Courier (opcional)</label>
                <input
                  name="courier_id"
                  value={form.courier_id}
                  onChange={onChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="ID de courier"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motorizado (opcional)</label>
                <input
                  name="motorizado_id"
                  value={form.motorizado_id}
                  onChange={onChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="ID de motorizado"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={onSubmit}
                disabled={saving}
                className="bg-gray-900 text-white px-4 py-2 rounded text-sm hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
