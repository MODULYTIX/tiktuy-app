import { useEffect, useRef, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { BsBoxSeam } from 'react-icons/bs';
import { useAuth } from '@/auth/context';
import { fetchPedidoById } from '@/services/ecommerce/pedidos/pedidos.api';
import type { Pedido } from '@/services/ecommerce/pedidos/pedidos.types';

type Props = {
  open: boolean;
  onClose: () => void;
  pedidoId: number | null; // <- number | null
};

export default function VerPedidoModal({ open, onClose, pedidoId }: Props) {
  const { token } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [pedido, setPedido] = useState<Pedido | null>(null);

  useEffect(() => {
    if (!open || !pedidoId || !token) return;
    setLoading(true);
    fetchPedidoById(pedidoId, token)
      .then(setPedido)
      .catch(() => setPedido(null))
      .finally(() => setLoading(false));
  }, [open, pedidoId, token]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node))
        onClose();
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/20 bg-opacity-40 flex justify-end">
      <div
        ref={modalRef}
        className="w-full max-w-md h-full bg-white shadow-xl p-6 overflow-y-auto animate-slide-in-right">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-700">
            <BsBoxSeam className="text-primary text-2xl" />
            DETALLES DEL PEDIDO
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {!pedidoId || !token ? (
          <p className="text-sm text-gray-600">Seleccione un pedido.</p>
        ) : loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 animate-pulse rounded" />
            ))}
          </div>
        ) : !pedido ? (
          <p className="text-sm text-gray-600">No se encontró el pedido.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500">
                  Código
                </label>
                <div className="text-sm text-gray-800">
                  {pedido.codigo_pedido}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">
                  Estado
                </label>
                <div className="text-sm text-gray-800">
                  {pedido.estado_pedido}
                </div>
              </div>

              <div className="col-span-2 border-t my-2" />

              <div>
                <label className="block text-xs font-medium text-gray-500">
                  Cliente
                </label>
                <div className="text-sm text-gray-800">
                  {pedido.nombre_cliente}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">
                  Celular
                </label>
                <div className="text-sm text-gray-800">
                  {pedido.celular_cliente}
                </div>
              </div>
              {pedido.numero_cliente && (
                <div>
                  <label className="block text-xs font-medium text-gray-500">
                    Teléfono
                  </label>
                  <div className="text-sm text-gray-800">
                    {pedido.numero_cliente}
                  </div>
                </div>
              )}

              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500">
                  Dirección
                </label>
                <div className="text-sm text-gray-800">
                  {pedido.direccion_envio}
                </div>
              </div>
              {pedido.referencia_direccion && (
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500">
                    Referencia
                  </label>
                  <div className="text-sm text-gray-800">
                    {pedido.referencia_direccion}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-500">
                  Distrito
                </label>
                <div className="text-sm text-gray-800">{pedido.distrito}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">
                  Fecha entrega
                </label>
                <div className="text-sm text-gray-800">
                  {pedido.fecha_entrega_programada
                    ? new Date(
                        pedido.fecha_entrega_programada
                      ).toLocaleDateString()
                    : '—'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">
                  Monto
                </label>
                <div className="text-sm text-gray-800">
                  S/.{' '}
                  {pedido.monto_recaudar?.toFixed?.(2) ?? pedido.monto_recaudar}
                </div>
              </div>

              <div className="col-span-2 border-t my-2" />

              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500">
                  Detalle
                </label>
                <div className="text-sm text-gray-800">
                  {pedido.detalles?.length ? (
                    <ul className="list-disc pl-4 space-y-1">
                      {pedido.detalles.map((d) => {
                        const precio = Number(d.precio_unitario);
                        return (
                          <li key={d.id}>
                            <span className="font-medium">
                              {d.producto?.nombre_producto}
                            </span>{' '}
                            — {d.cantidad} x S/.{' '}
                            {isNaN(precio)
                              ? d.precio_unitario
                              : precio.toFixed(2)}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    '—'
                  )}
                </div>
              </div>

              <div className="col-span-2 border-t my-2" />

              <div>
                <label className="block text-xs font-medium text-gray-500">
                  Courier
                </label>
                <div className="text-sm text-gray-800">
                  {pedido.courier?.nombre_comercial ?? '—'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">
                  Motorizado
                </label>
                <div className="text-sm text-gray-800">
                  {pedido.motorizado
                    ? `${pedido.motorizado.usuario?.nombres} ${pedido.motorizado.usuario?.apellidos}`
                    : '—'}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50">
                Cerrar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
