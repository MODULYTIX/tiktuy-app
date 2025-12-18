// src/shared/components/ecommerce/pedidos/modals/VerPedidoModal.tsx
import { useEffect, useRef, useState } from "react";
import { fetchPedidoById } from "@/services/ecommerce/pedidos/pedidos.api";
import type { Pedido } from "@/services/ecommerce/pedidos/pedidos.types";
import { useAuth } from "@/auth/context";
import Tittlex from "@/shared/common/Tittlex";
import Buttonx from "@/shared/common/Buttonx";

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

  // cerrar por click fuera
  useEffect(() => {
    if (!isOpen) return;
    const clickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, [isOpen, onClose]);

  // cargar pedido
  useEffect(() => {
    if (!isOpen || !token || !pedidoId) return;
    setLoading(true);
    fetchPedidoById(pedidoId, token)
      .then((p) => setPedido(p ?? null))
      .catch(() => setPedido(null))
      .finally(() => setLoading(false));
  }, [isOpen, token, pedidoId]);

  if (!isOpen) return null;

  const total =
    (pedido?.detalles ?? []).reduce(
      (acc, d) => acc + Number(d.cantidad || 0) * Number(d.precio_unitario || 0),
      0
    ) || 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/20 bg-opacity-40 flex justify-end">
      <div
        ref={modalRef}
        className="h-full bg-white shadow-xl p-5 overflow-y-auto flex flex-col gap-5 w-[460px] max-w-[92vw]"
      >
        <Tittlex
          variant="modal"
          icon="mdi:package-variant-closed"
          title="DETALLES DEL PEDIDO"
          description="Consulta la información del pedido y su detalle."
        />

        {loading ? (
          <p className="text-sm text-gray-500">Cargando...</p>
        ) : !pedido ? (
          <p className="text-sm text-gray-500">No se pudo cargar el pedido.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Código</p>
                <p className="text-sm text-gray-800">{pedido.codigo_pedido}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Estado</p>
                <p className="text-sm text-gray-800">{pedido.estado_pedido}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Cliente</p>
                <p className="text-sm text-gray-800">{pedido.nombre_cliente}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Celular</p>
                <p className="text-sm text-gray-800">{pedido.celular_cliente}</p>
              </div>

              <div className="col-span-2">
                <p className="text-xs text-gray-500">Dirección</p>
                <p className="text-sm text-gray-800">{pedido.direccion_envio}</p>
              </div>

              {pedido.referencia_direccion && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Referencia</p>
                  <p className="text-sm text-gray-800">
                    {pedido.referencia_direccion}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-500">Distrito</p>
                <p className="text-sm text-gray-800">{pedido.distrito}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Courier</p>
                <p className="text-sm text-gray-800">
                  {pedido.courier?.nombre_comercial ?? "-"}
                </p>
              </div>
            </div>

            <div className="border-t pt-3">
              <p className="text-sm font-medium mb-2 text-gray-800">Detalle</p>

              <div className="space-y-2">
                {(pedido.detalles ?? []).map((d) => (
                  <div key={d.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {d.producto?.nombre_producto ?? `Prod ${d.producto_id}`}
                    </span>
                    <span className="text-gray-800">
                      {Number(d.cantidad)} x S/. {Number(d.precio_unitario).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-2 flex justify-between text-sm font-semibold">
                <span>Total</span>
                <span>S/. {total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-auto flex items-center gap-3">
          <Buttonx
            variant="outlinedw"
            onClick={onClose}
            label="Cerrar"
            icon="mdi:close"
            className="px-4 text-sm border"
          />
        </div>
      </div>
    </div>
  );
}
