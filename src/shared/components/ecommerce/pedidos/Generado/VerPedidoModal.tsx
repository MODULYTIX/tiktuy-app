// src/shared/components/ecommerce/pedidos/Generado/VerPedidoGeneradoModal.tsx
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/auth/context";
import { fetchPedidoById } from "@/services/ecommerce/pedidos/pedidos.api";
import type { Pedido } from "@/services/ecommerce/pedidos/pedidos.types";
import Tittlex from "@/shared/common/Tittlex";
import Buttonx from "@/shared/common/Buttonx";

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

  /* ===================== FETCH (SIN CAMBIOS) ===================== */
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

  /* ===================== DERIVADOS (SIN CAMBIOS) ===================== */
  const detalles = pedido?.detalles ?? [];
  const cantProductos = detalles.reduce(
    (s, d) => s + (Number(d.cantidad) || 0),
    0
  );

  const montoTotal =
    pedido?.monto_recaudar != null ? Number(pedido.monto_recaudar) : 0;

  const fechaEntregaStr = pedido?.fecha_entrega_programada
    ? pedido.fecha_entrega_programada
        .slice(0, 10)
        .split("-")
        .reverse()
        .join("/")
    : "—";

  /* ===================== UI ===================== */
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex justify-end">
      <div
        ref={modalRef}
        className="h-full w-[480px] max-w-[95vw] bg-white shadow-2xl flex flex-col"
      >
        {/* ===================== HEADER ===================== */}
        <div className="border-b px-5 py-4">
          <Tittlex
            variant="modal"
            icon="lsicon:shopping-cart-filled"
            title="Detalle del Pedido"
            description={`Código: ${pedido?.codigo_pedido ?? "—"}`}
          />
        </div>

        {/* ===================== CONTENT ===================== */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 bg-gray-200 animate-pulse rounded"
                />
              ))}
            </div>
          ) : !pedido ? (
            <p className="text-gray-600 text-center">
              No se encontró el pedido.
            </p>
          ) : (
            <>
              {/* ===================== RESUMEN ===================== */}
              <div className="bg-gray-50 border rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500">Cliente</p>
                    <p className="font-medium">
                      {pedido.nombre_cliente}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Fecha de entrega</p>
                    <p className="font-medium">{fechaEntregaStr}</p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-gray-500">Dirección</p>
                    <p className="truncate">
                      {pedido.direccion_envio}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Cantidad de productos</p>
                    <p className="font-medium">{cantProductos}</p>
                  </div>

                  <div>
                    <p className="text-gray-500">Monto total</p>
                    <p className="font-semibold">
                      S/.{" "}
                      {montoTotal.toLocaleString("es-PE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* ===================== PRODUCTOS ===================== */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 text-xs font-medium grid grid-cols-[1fr_80px]">
                  <span>Producto</span>
                  <span className="text-center">Cantidad</span>
                </div>

                {detalles.map((d) => (
                  <div
                    key={d.id}
                    className="px-4 py-3 grid grid-cols-[1fr_80px] items-center border-t text-sm"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="font-medium truncate">
                        {d.producto?.nombre_producto ?? "—"}
                      </p>
                      {d.producto?.descripcion && (
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {d.producto.descripcion}
                        </p>
                      )}
                    </div>

                    <div className="text-center font-medium">
                      {Number(d.cantidad) || 0}
                    </div>
                  </div>
                ))}

                {detalles.length === 0 && (
                  <div className="px-4 py-6 text-center text-gray-500 italic">
                    No hay productos en este pedido.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ===================== FOOTER ===================== */}
        <div className="border-t px-5 py-4 flex gap-3">
          {onEditar && pedidoId && (
            <Buttonx
              variant="tertiary"
              onClick={() => onEditar(pedidoId)}
              label="Editar"
              icon="mdi:pencil-outline"
              className="text-sm"
            />
          )}

          <Buttonx
            variant="outlinedw"
            onClick={onClose}
            label="Cerrar"
            icon="mdi:close"
            className="text-sm"
          />
        </div>
      </div>
    </div>
  );
}
