import { useEffect, useRef, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { BsBoxSeam } from 'react-icons/bs';
import { useAuth } from '@/auth/context';
import { fetchPedidoById } from '@/services/ecommerce/pedidos/pedidos.api';
import type { Pedido } from '@/services/ecommerce/pedidos/pedidos.types';
import Tittlex from '@/shared/common/Tittlex';
import { Inputx, InputxPhone, InputxNumber } from '@/shared/common/Inputx';
import { Selectx } from '@/shared/common/Selectx';

type Props = {
  open: boolean;
  onClose: () => void;
  pedidoId: number | null;
  onEditar?: (pedidoId: number) => void;
};

export default function VerPedidoGeneradoModal({
  open,
  onClose,
  pedidoId,
  onEditar,
}: Props) {
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
        className="w-full max-w-md h-full bg-white shadow-xl p-6 overflow-y-auto animate-slide-in-right flex flex-col gap-5">
        {/* Header */}
        <Tittlex
          variant="modal"
          icon="lsicon:shopping-cart-filled"
          title="DETALLE DEL PEDIDO"
          description="Consulta toda la información registrada de este pedido, incluyendo los datos del cliente, el producto y la entrega."
        />

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
            <div className="flex flex-col gap-5 h-full">
              <div className='flex flex-row gap-5 w-full'>
                <Inputx
                  label="Courier"
                  value={pedido.courier?.nombre_comercial ?? ''}
                  placeholder="—"
                  readOnly
                />
                <Inputx
                  label="Nombre"
                  value={pedido.nombre_cliente}
                  placeholder="Nombre del cliente"
                  readOnly
                />
              </div>

              <div className='flex flex-row gap-5 w-full'>
                <InputxPhone
                  label="Teléfono"
                  countryCode="+51"
                  value={pedido.celular_cliente}
                  placeholder="987654321"
                  readOnly
                />
                <Inputx
                  label="Distrito"
                  value={pedido.distrito}
                  placeholder="Distrito"
                  readOnly
                />
              </div>

              <div className="col-span-2">
                <Inputx
                  label="Dirección"
                  value={pedido.direccion_envio}
                  placeholder="Av. Grau J 499"
                  readOnly
                />
              </div>

              <div className="col-span-2">
                <Inputx
                  label="Referencia"
                  value={pedido.referencia_direccion}
                  placeholder="(opcional)"
                  readOnly
                />
              </div>

              <div className='flex flex-row gap-5 w-full'>
                <Inputx
                  label="Producto"
                  value={det?.producto?.nombre_producto}
                  placeholder="Producto"
                  readOnly
                />
                <InputxNumber
                  label="Cantidad"
                  value={det?.cantidad != null ? String(det.cantidad) : ''}
                  placeholder="0"
                  readOnly
                  min={0}
                  max={10000}
                />
              </div>

              <div className='flex flex-row gap-5 w-full'>
                <InputxNumber
                  label="Monto"
                  value={
                    monto ? `S/. ${Number(monto).toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : ''
                  }
                  placeholder="S/. 0.00"
                  readOnly
                  min={0}
                  max={100000}
                />
                <Inputx
                  label="Fecha Entrega"
                  value={fechaEntregaStr}
                  placeholder="dd/mm/aaaa"
                  readOnly
                />
              </div>
            </div>

            {/* Footer: botón a la derecha */}
            <div className="flex justify-start">
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
