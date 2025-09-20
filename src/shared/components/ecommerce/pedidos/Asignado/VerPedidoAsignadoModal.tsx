import { useEffect, useRef, useState } from 'react';
import { fetchPedidoById } from '@/services/ecommerce/pedidos/pedidos.api';
import type { Pedido } from '@/services/ecommerce/pedidos/pedidos.types';
import { useAuth } from '@/auth/context';
import { FiX } from 'react-icons/fi';
import { BsBoxSeam } from 'react-icons/bs';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pedidoId: number | null;
}

export default function VerPedidoModal({ isOpen, onClose, pedidoId }: Props) {
  const { token } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const clickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !token || !pedidoId) return;
    setLoading(true);
    fetchPedidoById(pedidoId, token)
      .then(setPedido)
      .finally(() => setLoading(false));
  }, [isOpen, token, pedidoId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/20 bg-opacity-40 flex justify-end">
      <div ref={modalRef} className="w-full max-w-md h-full bg-white shadow-xl p-6 overflow-y-auto animate-slide-in-right">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-700">
            <BsBoxSeam className="text-primary text-2xl" />
            DETALLES DEL PEDIDO
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Cargando...</p>
        ) : !pedido ? (
          <p className="text-sm text-gray-500">No se pudo cargar el pedido.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-gray-500">Código</p><p className="text-sm">{pedido.codigo_pedido}</p></div>
              <div><p className="text-xs text-gray-500">Estado</p><p className="text-sm">{pedido.estado_pedido}</p></div>
              <div><p className="text-xs text-gray-500">Cliente</p><p className="text-sm">{pedido.nombre_cliente}</p></div>
              <div><p className="text-xs text-gray-500">Celular</p><p className="text-sm">{pedido.celular_cliente}</p></div>
              <div className="col-span-2"><p className="text-xs text-gray-500">Dirección</p><p className="text-sm">{pedido.direccion_envio}</p></div>
              {pedido.referencia_direccion && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Referencia</p>
                  <p className="text-sm">{pedido.referencia_direccion}</p>
                </div>
              )}
              <div><p className="text-xs text-gray-500">Distrito</p><p className="text-sm">{pedido.distrito}</p></div>
              <div><p className="text-xs text-gray-500">Courier</p><p className="text-sm">{pedido.courier?.nombre_comercial ?? '-'}</p></div>
            </div>

            <div className="border-t pt-3">
              <p className="text-sm font-medium mb-2">Detalle</p>
              <div className="space-y-2">
                {pedido.detalles?.map((d) => (
                  <div key={d.id} className="flex justify-between text-sm">
                    <span>{d.producto?.nombre_producto ?? `Prod ${d.producto_id}`}</span>
                    <span>
                      {Number(d.cantidad)} x S/. {Number(d.precio_unitario).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-sm font-semibold">
                <span>Total</span>
                <span>
                  S/.{' '}
                  {pedido.detalles?.reduce(
                    (acc, d) => acc + Number(d.cantidad) * Number(d.precio_unitario),
                    0
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
