import { useEffect, useRef, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { BsBoxSeam } from 'react-icons/bs';
import { useAuth } from '@/auth/context';
import { fetchPedidoById } from '@/services/ecommerce/pedidos/pedidos.api';
import type { Pedido } from '@/services/ecommerce/pedidos/pedidos.types';
import FieldX from '@/shared/common/FieldX';

type Props = {
  open: boolean;
  onClose: () => void;
  pedidoId: number | null;
  onEditar?: (pedidoId: number) => void;
};

export default function VerPedidoGeneradoModal({ open, onClose, pedidoId, onEditar }: Props) {
  const { token } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [pedido, setPedido] = useState<Pedido | null>(null);

  useEffect(() => {
    if (!open || !token || !pedidoId) return;
    setLoading(true);
    fetchPedidoById(pedidoId, token)
      .then((p) => setPedido(p ?? null))
      .catch(() => setPedido(null))
      .finally(() => setLoading(false));
  }, [open, pedidoId, token]);

  // Cerrar al click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const det = pedido?.detalles?.[0];
  const monto =
    det?.precio_unitario && det?.cantidad
      ? (Number(det.precio_unitario) * Number(det.cantidad)).toFixed(2)
      : (pedido?.monto_recaudar != null ? Number(pedido.monto_recaudar).toFixed(2) : '');

  const fechaEntrega = pedido?.fecha_entrega_programada
    ? new Date(pedido.fecha_entrega_programada)
    : null;

  const fechaEntregaStr = fechaEntrega
    ? fechaEntrega.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

  return (
    <div className="fixed inset-0 z-50 bg-black/20 bg-opacity-40 flex justify-end">
      <div
        ref={modalRef}
        className="w-full max-w-md h-full bg-white shadow-xl p-6 overflow-y-auto animate-slide-in-right"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-start gap-2">
            <BsBoxSeam className="text-primary text-2xl mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-[#0B3C6F]">DETALLE DEL PEDIDO</h2>
              <p className="text-sm text-gray-600 -mt-0.5">
                Consulta toda la información registrada de este pedido, incluyendo los datos del cliente, el producto y la entrega.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Loading / Empty */}
        {!pedidoId || !token ? (
          <p className="text-sm text-gray-600">Seleccione un pedido.</p>
        ) : loading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 animate-pulse rounded" />
            ))}
          </div>
        ) : !pedido ? (
          <p className="text-sm text-gray-600">No se encontró el pedido.</p>
        ) : (
          <>
            {/* Campos (2 columnas) */}
            <div className="grid grid-cols-2 gap-4">
              <FieldX label="Courier" value={pedido.courier?.nombre_comercial ?? ''} placeholder="—" />
              <FieldX label="Nombre" value={pedido.nombre_cliente} placeholder="Nombre del cliente" />

              <FieldX label="Teléfono" prefix="+ 51" value={pedido.celular_cliente} placeholder="987654321" />
              <FieldX label="Distrito" value={pedido.distrito} placeholder="Distrito" />

              <div className="col-span-2">
                <FieldX label="Dirección" value={pedido.direccion_envio} placeholder="Av. Grau J 499" />
              </div>

              <div className="col-span-2">
                <FieldX label="Referencia" value={pedido.referencia_direccion} placeholder="(opcional)" />
              </div>

              <FieldX label="Producto" value={det?.producto?.nombre_producto} placeholder="Producto" />
              <FieldX label="Cantidad" value={det?.cantidad != null ? String(det.cantidad) : ''} placeholder="0" />

              <FieldX
                label="Monto"
                value={monto ? `S/. ${Number(monto).toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : ''}
                placeholder="S/. 0.00"
              />
              <FieldX label="Fecha Entrega" value={fechaEntregaStr} placeholder="dd/mm/aaaa" />
            </div>

            {/* Footer: botón a la derecha */}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => { if (pedidoId && onEditar) onEditar(pedidoId); }}
                className="bg-gray-900 text-white px-4 py-2 rounded text-sm hover:bg-gray-800"
              >
                Editar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
