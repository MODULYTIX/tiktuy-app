import { useEffect, useRef } from "react";
import type { PedidoDetalle } from "@/services/courier/pedidos/pedidos.types";
import Tittlex from "@/shared/common/Tittlex";

interface Props {
  open: boolean;
  onClose: () => void;
  detalle: PedidoDetalle | null;
  loading?: boolean;
}

export default function DetallePedidoDrawer({
  open,
  onClose,
  detalle,
  loading = false,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="flex-1 bg-black/40" />
      {/* panel lateral */}
      <div ref={panelRef} className="w-[520px] h-full bg-white shadow-default flex flex-col gap-5 animate-slide-in-right p-5">
        {/* header */}
        <div className="flex gap-1 justify-between items-center">
          <Tittlex
            variant="modal"
            title="DETALLE DEL PEDIDO"
            icon="lsicon:shopping-cart-filled"
          />
          <div className="flex gap-1">
            <label className="block text-xs font-semibold text-gray-600">Cód. Pedido:</label>
            <div className="text-xs text-gray-600">{detalle?.codigo_pedido}</div>
          </div>
        </div>

        {/* body */}
        <div className="flex flex-col gap-5 text-sm h-full">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 bg-gray-200 animate-pulse rounded"
                />
              ))}
            </div>
          ) : !detalle ? (
            <p className="text-gray-600 text-sm">
              No se encontró el detalle del pedido.
            </p>
          ) : (
            <>
              {/* info básica */}
              <div className="flex flex-col gap-2">
                <div className="w-full items-center flex flex-col">
                  <label className="block text-xs font-light text-gray-500">
                    Cliente
                  </label>
                  <div className="text-gray-800 font-semibold text-base">{detalle.cliente}</div>
                </div>

                <div className="flex gap-1">
                  <label className="block text-sm font-light text-gray-500">
                    Dirección:
                  </label>
                  <div className="text-gray-800 text-sm">
                    {detalle.direccion_entrega}
                  </div>
                </div>

                <div className="flex gap-1">
                  <label className="block text-sm font-light text-gray-500">
                    F. Entrega:
                  </label>
                  <div className="text-gray-800 text-sm">
                    {detalle.fecha_entrega_programada
                      ? new Date(
                        detalle.fecha_entrega_programada
                      ).toLocaleDateString("es-PE")
                      : "—"}
                  </div>
                </div>

                <div className="flex gap-1">
                  <label className="block text-sm font-light text-gray-500">
                    Cant. de Productos:
                  </label>
                  <div className="text-gray-800 text-sm">
                    {detalle.cantidad_productos}
                  </div>
                </div>

                <div className="flex gap-1">
                  <label className="block text-sm font-light text-gray-500">Monto:</label>
                  <div className="text-gray-800 text-sm">
                    S/. {detalle.monto_total.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* productos */}
              <div className="shadow-default rounded h-full">
                <table className="w-full text-sm">
                  <thead className="bg-gray20">
                    <tr>
                      <th className="px-3 w-full py-2 font-normal text-left">Producto</th>
                      <th className="px-3 w-12 py-2 font-normal text-right">Cant.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.items.map((it) => (
                      <tr key={it.producto_id} className="border-y border-gray20">
                        <td className="px-3 py-2 w-full align-top">
                          <div className="font-normal">{it.nombre}</div>
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
                        <td className="px-3 py-2 w-12 text-gray60 text-center">{it.cantidad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}