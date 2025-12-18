// src/shared/components/ecommerce/pedidos/VerPedidoCompletadoModal.tsx
import { useEffect, useRef, useState } from "react";
import { fetchPedidoById } from "@/services/ecommerce/pedidos/pedidos.api";
import type { Pedido } from "@/services/ecommerce/pedidos/pedidos.types";
import { useAuth } from "@/auth/context";
import Tittlex from "@/shared/common/Tittlex";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onEditar?: (id: number) => void;
  pedidoId: number | null;
  detalle?: Pedido | null;
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
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
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
        : "";

  const fechaEntrega = pedido?.fecha_entrega_programada
    ? new Date(pedido.fecha_entrega_programada)
    : null;

  const fechaEntregaStr = fechaEntrega
    ? fechaEntrega.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";

  const estado: string =
    (pedido as any)?.estado?.nombre ?? (pedido as any)?.estado_pedido ?? "";

  const estadoColor =
    estado?.toLowerCase() === "entregado" ? "text-green-600" : "text-yellow-600";

  return (
    <div className="fixed inset-0 z-50 bg-black/20 bg-opacity-40 flex justify-end">
      <div
        ref={modalRef}
        className={[
          "h-full bg-white shadow-xl flex flex-col gap-5 p-5",
          "w-[460px]", // ✅ ancho fijo para todos
          "overflow-y-auto", // mantiene scroll interno si crece
          "animate-slide-in-right", // no tocamos tu efecto actual
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-1 justify-between items-center">
            <Tittlex
              variant="modal"
              title="DETALLE DEL PEDIDO"
              icon="lsicon:shopping-cart-filled"
              description=""
            />
            {estado && (
              <div className="text-sm">
                <span className="text-gray-500">Estado : </span>
                <span className={`${estadoColor} font-medium`}>{estado}</span>
              </div>
            )}
          </div>
          <p className="text-base text-gray-600 -mt-0.5">
            Consulta toda la información registrada de este pedido, incluyendo
            los datos del cliente, el producto y la entrega.
          </p>
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
            {/* Cuerpo */}
            <div className="border border-gray-200 rounded-xl flex flex-col gap-2 p-3">
              <div className="w-full items-center flex flex-col">
                <label className="block text-xs font-light text-gray-500">
                  Courier
                </label>
                <div className="text-gray-800 font-semibold text-base">
                  {pedido.courier?.nombre_comercial ?? ""}
                </div>
              </div>

              <div className="flex gap-1">
                <label className="block text-sm font-light text-gray-500">
                  Cliente:
                </label>
                <div className="text-gray-800 text-sm">
                  {pedido.nombre_cliente}
                </div>
              </div>

              <div className="flex gap-1">
                <label className="block text-sm font-light text-gray-500">
                  Teléfono:
                </label>
                <div className="text-gray-800 text-sm">
                  + 51 {pedido.celular_cliente}
                </div>
              </div>

              <div className="flex gap-1">
                <label className="block text-sm font-light text-gray-500">
                  F. Entrega:
                </label>
                <div className="text-gray-800 text-sm">{fechaEntregaStr}</div>
              </div>

              <div className="flex gap-1">
                <label className="block text-sm font-light text-gray-500">
                  Distrito:
                </label>
                <div className="text-gray-800 text-sm">{pedido.distrito}</div>
              </div>

              <div className="flex gap-1">
                <label className="block text-sm font-light text-gray-500">
                  Dirección:
                </label>
                <div className="text-gray-800 text-sm">
                  {pedido.direccion_envio}
                </div>
              </div>

              <div className="flex gap-1">
                <label className="block text-sm font-light text-gray-500">
                  Referencia:
                </label>
                <div className="text-gray-800 text-sm">
                  {pedido.referencia_direccion ?? ""}
                </div>
              </div>

              <div className="flex gap-1">
                <label className="block text-sm font-light text-gray-500">
                  Cant. de Productos:
                </label>
                <div className="text-gray-800 text-sm">
                  {(pedido?.detalles ?? []).reduce(
                    (sum, d) => sum + (Number(d.cantidad) || 0),
                    0
                  )}
                </div>
              </div>

              <div className="flex gap-1">
                <label className="block text-sm font-light text-gray-500">
                  Monto:
                </label>
                <div className="text-gray-800 text-sm">
                  {montoCalc
                    ? `S/. ${Number(montoCalc).toLocaleString("es-PE", {
                        minimumFractionDigits: 2,
                      })}`
                    : ""}
                </div>
              </div>
            </div>

            <div className="shadow-default rounded h-full">
              <table className="w-full text-sm">
                <thead className="bg-gray20">
                  <tr>
                    <th className="px-3 w-full py-2 font-normal text-left">
                      Producto
                    </th>
                    <th className="px-3 w-12 py-2 font-normal text-right">
                      Cant.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(pedido?.detalles ?? []).map((it, i) => (
                    <tr
                      key={it.producto_id ?? it.producto?.id ?? i}
                      className="border-y border-gray20"
                    >
                      <td className="px-3 py-2 w-full align-top">
                        <div className="font-normal">
                          {it.producto?.nombre_producto}
                        </div>
                        {it.descripcion && (
                          <div className="text-gray-500 text-xs">
                            {it.descripcion}
                          </div>
                        )}
                        {it.marca && (
                          <div className="text-gray-400 text-xs">
                            Marca: {it.marca}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 w-12 text-gray60 text-center">
                        {it.cantidad}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
