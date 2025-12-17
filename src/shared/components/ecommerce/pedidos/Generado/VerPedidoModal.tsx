import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/auth/context";
import { fetchPedidoById } from "@/services/ecommerce/pedidos/pedidos.api";
import type { Pedido } from "@/services/ecommerce/pedidos/pedidos.types";
import Tittlex from "@/shared/common/Tittlex";

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

  /* ===================== FETCH ===================== */
  useEffect(() => {
    if (!open || !token || !pedidoId) return;
    setLoading(true);
    fetchPedidoById(pedidoId, token)
      .then((p) => setPedido(p ?? null))
      .catch(() => setPedido(null))
      .finally(() => setLoading(false));
  }, [open, pedidoId, token]);

  /* ===================== CLICK FUERA ===================== */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open) return null;

  /* ===================== DERIVADOS ===================== */
  const detalles = pedido?.detalles ?? [];
  const cantProductos = detalles.reduce((s, d) => s + d.cantidad, 0);

  const montoTotal =
    pedido?.monto_recaudar != null
      ? Number(pedido.monto_recaudar).toFixed(2)
      : "0.00";

  const fechaEntregaStr = pedido?.fecha_entrega_programada
    ? new Date(pedido.fecha_entrega_programada).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

  /* ===================== UI ===================== */
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex justify-end">
      <div
        ref={modalRef}
        className="w-full max-w-lg h-full bg-white shadow-2xl p-6 overflow-y-auto animate-slide-in-right flex flex-col gap-6"
      >
        {/* HEADER */}
        <Tittlex
          variant="modal"
          icon="lsicon:shopping-cart-filled"
          title="DETALLE DEL PEDIDO"
          description={`Cód. Pedido: ${pedido?.codigo_pedido ?? "—"}`}
        />

        {/* LOADING / EMPTY */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 animate-pulse rounded" />
            ))}
          </div>
        ) : !pedido ? (
          <p className="text-sm text-gray-600">No se encontró el pedido.</p>
        ) : (
          <>
            {/* ===================== RESUMEN ===================== */}
            <div className="bg-gray-50 border rounded-lg p-4 space-y-2 text-sm">
              <div className="text-center">
                <p className="text-gray-500">Cliente</p>
                <p className="font-semibold text-base">
                  {pedido.nombre_cliente}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <p className="text-gray-500">Dirección</p>
                  <p>{pedido.direccion_envio}</p>
                </div>

                <div>
                  <p className="text-gray-500">F. Entrega</p>
                  <p>{fechaEntregaStr}</p>
                </div>

                <div>
                  <p className="text-gray-500">Cant. Productos</p>
                  <p>{cantProductos}</p>
                </div>

                <div>
                  <p className="text-gray-500">Monto</p>
                  <p className="font-semibold">
                    S/. {Number(montoTotal).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* ===================== TABLA PRODUCTOS ===================== */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 text-sm font-medium flex justify-between">
                <span>Producto</span>
                <span>Cant.</span>
              </div>

              {detalles.map((d) => (
                <div
                  key={d.id}
                  className="px-4 py-3 flex justify-between text-sm border-t"
                >
                  <div>
                    <p className="font-medium">
                      {d.producto?.nombre_producto}
                    </p>
                    {d.producto?.descripcion && (
                      <p className="text-xs text-gray-500">
                        {d.producto.descripcion}
                      </p>
                    )}
                  </div>

                  <div className="font-medium">{d.cantidad}</div>
                </div>
              ))}
            </div>

            {/* ===================== FOOTER ===================== */}
            <div className="flex justify-start gap-3 mt-2">
              {onEditar && pedidoId && (
                <button
                  onClick={() => onEditar(pedidoId)}
                  className="bg-gray-900 text-white px-4 py-2 rounded text-sm flex items-center gap-2 hover:bg-gray-800"
                >
                  <Icon icon="mdi:pencil-outline" />
                  Editar
                </button>
              )}

              <button
                onClick={onClose}
                className="px-4 py-2 border rounded text-sm text-gray-700 flex items-center gap-2"
              >
                <Icon icon="mdi:close" />
                Cerrar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
