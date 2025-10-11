import { useEffect, useRef, useState } from 'react';
import { fetchPedidoById } from '@/services/ecommerce/pedidos/pedidos.api';
import type { Pedido } from '@/services/ecommerce/pedidos/pedidos.types';
import { useAuth } from '@/auth/context';
import FieldX from '@/shared/common/FieldX';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onEditar?: (id: number) => void;
  pedidoId: number | null;
}

export default function VerPedidoCompletadoModal({
  isOpen,
  onClose,
  pedidoId,
}: Props) {
  const { token } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(false);

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!isOpen) return;
    const clickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node))
        onClose();
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, [isOpen, onClose]);

  // Cargar pedido
  useEffect(() => {
    if (!isOpen || !token || !pedidoId) return;
    setLoading(true);
    fetchPedidoById(pedidoId, token)
      .then((p) => setPedido(p ?? null))
      .catch(() => setPedido(null))
      .finally(() => setLoading(false));
  }, [isOpen, token, pedidoId]);

  if (!isOpen) return null;

  const det = pedido?.detalles?.[0];

  const montoCalc =
    det?.precio_unitario && det?.cantidad
      ? (Number(det.precio_unitario) * Number(det.cantidad)).toFixed(2)
      : pedido?.monto_recaudar != null
      ? Number(pedido.monto_recaudar).toFixed(2)
      : '';

  const fechaEntrega = pedido?.fecha_entrega_programada
    ? new Date(pedido.fecha_entrega_programada)
    : null;

  const fechaEntregaStr = fechaEntrega
    ? fechaEntrega.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';

  // Estado (verde si es Entregado)
  const estado: string =
    (pedido as any)?.estado?.nombre ?? (pedido as any)?.estado_pedido ?? '';

  const estadoColor =
    estado?.toLowerCase() === 'entregado'
      ? 'text-green-600'
      : 'text-yellow-600';

  return (
    <div className="fixed inset-0 z-50 bg-black/20 bg-opacity-40 flex justify-end">
      <div
        ref={modalRef}
        className="w-full max-w-md h-full bg-white shadow-xl p-6 overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-start gap-2">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-[#0B3C6F]">
                  DETALLE DEL PEDIDO
                </h2>
                {estado && (
                  <div className="text-sm">
                    <span className="text-gray-500">Estado : </span>
                    <span className={`${estadoColor} font-medium`}>
                      {estado}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 -mt-0.5">
                Consulta toda la información registrada de este pedido,
                incluyendo los datos del cliente, el producto y la entrega.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 animate-pulse rounded" />
            ))}
          </div>
        ) : !pedido ? (
          <p className="text-sm text-gray-500">No se pudo cargar el pedido.</p>
        ) : (
          <>
            {/* Cuerpo (2 columnas) */}
            <div className="grid grid-cols-2 gap-4">
              <FieldX
                label="Courier"
                value={pedido.courier?.nombre_comercial ?? ''}
                placeholder="—"
              />
              <FieldX
                label="Nombre"
                value={pedido.nombre_cliente}
                placeholder="Nombre del cliente"
              />

              <FieldX
                label="Teléfono"
                prefix="+ 51"
                value={pedido.celular_cliente}
                placeholder="987654321"
              />
              <FieldX
                label="Distrito"
                value={pedido.distrito}
                placeholder="Distrito"
              />

              <div className="col-span-2">
                <FieldX
                  label="Dirección"
                  value={pedido.direccion_envio}
                  placeholder="Av. Grau J 499"
                />
              </div>

              <div className="col-span-2">
                <FieldX
                  label="Referencia"
                  value={pedido.referencia_direccion ?? ''}
                  placeholder="(opcional)"
                />
              </div>

              <FieldX
                label="Producto"
                value={det?.producto?.nombre_producto}
                placeholder="Producto"
              />
              <FieldX
                label="Cantidad"
                value={det?.cantidad != null ? String(det.cantidad) : ''}
                placeholder="0"
              />

              <FieldX
                label="Monto"
                value={
                  montoCalc
                    ? `S/. ${Number(montoCalc).toLocaleString('es-PE', {
                        minimumFractionDigits: 2,
                      })}`
                    : ''
                }
                placeholder="S/. 0.00"
              />
              <FieldX
                label="Fecha Entrega"
                value={fechaEntregaStr}
                placeholder="dd/mm/aaaa"
              />
            </div>

            {/* Sin botones abajo (solo lectura) */}
          </>
        )}
      </div>
    </div>
  );
}
