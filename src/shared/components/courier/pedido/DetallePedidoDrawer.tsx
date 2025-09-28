import { useEffect, useRef } from "react";
import { FaTimes } from "react-icons/fa";
import { BsBoxSeam } from "react-icons/bs";
import type { PedidoDetalle } from "@/services/courier/pedidos/pedidos.types";

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
      {/* panel lateral */}
      <div
        ref={panelRef}
        className="w-[420px] h-full bg-white shadow-xl flex flex-col animate-slide-in-right"
      >
        {/* header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-blue-900">
            <BsBoxSeam className="text-primary text-xl" />
            DETALLE DEL PEDIDO
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto p-4 text-sm">
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
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-gray-500">
                    Cód. Pedido
                  </label>
                  <div className="text-gray-800">{detalle.codigo_pedido}</div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500">
                    Cliente
                  </label>
                  <div className="text-gray-800">{detalle.cliente}</div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500">
                    Dirección
                  </label>
                  <div className="text-gray-800">
                    {detalle.direccion_entrega}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500">
                    F. Entrega
                  </label>
                  <div className="text-gray-800">
                    {detalle.fecha_entrega_programada
                      ? new Date(
                          detalle.fecha_entrega_programada
                        ).toLocaleDateString("es-PE")
                      : "—"}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500">
                    Productos
                  </label>
                  <div className="text-gray-800">
                    {detalle.cantidad_productos}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Monto</label>
                  <div className="text-gray-800">
                    S/. {detalle.monto_total.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* productos */}
              <div>
                <h3 className="font-medium text-gray-700 mb-2">
                  Productos del pedido
                </h3>
                <div className="border rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left">Producto</th>
                        <th className="px-3 py-2 text-right">Cant.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalle.items.map((it) => (
                        <tr key={it.producto_id} className="border-t">
                          <td className="px-3 py-2 align-top">
                            <div className="font-medium">{it.nombre}</div>
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
                          <td className="px-3 py-2 text-right">{it.cantidad}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
