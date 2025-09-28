import { Icon } from '@iconify/react';
import type { PedidoListItem } from '@/services/repartidor/pedidos/pedidos.types';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  pedido: PedidoListItem | null;
};

export default function ModalPedidoDetalle({ isOpen, onClose, pedido }: Props) {
  if (!isOpen || !pedido) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[420px] bg-white shadow-lg overflow-y-auto rounded-l-2xl">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Icon icon="mdi:cart-outline" className="text-primary text-xl" />
            Detalle del Pedido
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 space-y-4 text-sm">
          <div>
            <div className="text-xs text-gray-500">Código</div>
            <div className="font-medium">{pedido.codigo_pedido}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Cliente</div>
            <div className="font-medium">{pedido.cliente?.nombre}</div>
            <div className="text-gray-600">{pedido.cliente?.celular}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Distrito</div>
            <div className="font-medium">{pedido.cliente?.distrito}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Dirección</div>
            <div className="font-medium">{pedido.direccion_envio}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Referencia</div>
            <div>{pedido.cliente?.referencia ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Ecommerce</div>
            <div>{pedido.ecommerce?.nombre_comercial ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Monto a Recaudar</div>
            <div className="font-semibold text-emerald-700">
              S/. {pedido.monto_recaudar}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Estado</div>
            <div className="font-medium">{pedido.estado_nombre}</div>
          </div>

          {/* Lista de productos */}
          <div>
            <h3 className="font-semibold mt-4 mb-2">Productos</h3>
            <div className="border rounded-md divide-y">
              {pedido.items?.map((it, i) => (
                <div key={i} className="flex justify-between px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium">{it.nombre}</div>
                    <div className="text-xs text-gray-500">{it.descripcion}</div>
                  </div>
                  <div className="text-gray-700">{String(it.cantidad).padStart(2, '0')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
