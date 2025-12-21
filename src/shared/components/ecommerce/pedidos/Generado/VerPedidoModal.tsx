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
  const cantProductos = detalles.reduce((s, d) => s + (Number(d.cantidad) || 0), 0);

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
        className={[
          "h-full bg-white shadow-2xl flex flex-col gap-6 p-5 overflow-y-auto",
          "w-[460px] max-w-[92vw]", // ✅ ancho fijo
        ].join(" ")}
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
                <p className="font-semibold text-base">{pedido.nombre_cliente}</p>
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
                    S/.{" "}
                    {montoTotal.toLocaleString("es-PE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
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

              {detalles.map((d: any) => (
                <div
                  key={d.id}
                  className="px-4 py-3 flex justify-between text-sm border-t"
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

                  <div className="font-medium whitespace-nowrap">
                    {Number(d.cantidad) || 0}
                  </div>
                </div>
              ))}

              {detalles.length === 0 && (
                <div className="px-4 py-6 text-sm text-gray-500 italic text-center">
                  No hay productos en este pedido.
                </div>
              )}
            </div>

            {/* ===================== FOOTER ===================== */}
            <div className="flex justify-start gap-3 mt-2">
              {onEditar && pedidoId && (
                <Buttonx
                  variant="tertiary"
                  onClick={() => onEditar(pedidoId)}
                  label="Editar"
                  icon="mdi:pencil-outline"
                  className="px-4 text-sm"
                />
              )}

              <Buttonx
                variant="outlinedw"
                onClick={onClose}
                label="Cerrar"
                icon="mdi:close"
                className="px-4 text-sm border"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
