// src/shared/components/ecommerce/pedidos/Generado/EditarPedidoGeneradoModal.tsx
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/auth/context";
import {
  fetchPedidoById,
  actualizarPedidoGenerado,
} from "@/services/ecommerce/pedidos/pedidos.api";
import { fetchProductos } from "@/services/ecommerce/producto/producto.api";

import type { Pedido } from "@/services/ecommerce/pedidos/pedidos.types";
import type { Producto } from "@/services/ecommerce/producto/producto.types";

import Tittlex from "@/shared/common/Tittlex";
import { InputxNumber } from "@/shared/common/Inputx";
import { Selectx } from "@/shared/common/Selectx";
import Buttonx from "@/shared/common/Buttonx";

/* ===================== TYPES ===================== */
type DetalleForm = {
  id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  pedidoId: number | null;
  onUpdated?: () => void;
};

export default function EditarPedidoGeneradoModal({
  open,
  onClose,
  pedidoId,
  onUpdated,
}: Props) {
  const { token } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [detalles, setDetalles] = useState<DetalleForm[]>([]);
  const [saving, setSaving] = useState(false);

  /* ===================== FETCH ===================== */
  useEffect(() => {
    if (!open || !token || !pedidoId) return;

    fetchProductos(token).then((r: any) =>
      setProductos(Array.isArray(r) ? r : r?.data ?? [])
    );

    fetchPedidoById(pedidoId, token).then((p) => {
      setPedido(p);
      setDetalles(
        (p?.detalles ?? []).map((d: any) => ({
          id: d.id,
          producto_id: d.producto_id,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
        }))
      );
    });
  }, [open, pedidoId, token]);

  /* ===================== HELPERS ===================== */
  const montoTotal = detalles.reduce(
    (s, d) => s + d.cantidad * d.precio_unitario,
    0
  );

  const handleDetalleChange = (
    index: number,
    field: keyof DetalleForm,
    value: number
  ) => {
    setDetalles((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  };

  /* ===================== GUARDAR ===================== */
  const handleGuardar = async () => {
    if (!pedidoId || !token || saving) return;
    setSaving(true);

    try {
      await actualizarPedidoGenerado(
        pedidoId,
        {
          monto_recaudar: montoTotal,
          detalles: detalles.map((d) => ({
            id: d.id,
            producto_id: d.producto_id,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
          })),
        },
        token
      );

      onUpdated?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open || !pedido) return null;

  /* ===================== UI ===================== */
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex justify-end">
      <div
        ref={modalRef}
        className="h-full w-[520px] max-w-[95vw] bg-white shadow-2xl flex flex-col"
      >
        {/* ===================== HEADER ===================== */}
        <div className="border-b px-5 py-4">
          <Tittlex
            variant="modal"
            icon="lsicon:shopping-cart-filled"
            title="Editar Pedido"
            description={`Código: ${pedido.codigo_pedido}`}
          />
        </div>

        {/* ===================== CONTENT ===================== */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
          {/* ===================== RESUMEN ===================== */}
          <div className="bg-gray-50 border rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500">Cliente</p>
                <p className="font-medium">{pedido.nombre_cliente}</p>
              </div>

              <div>
                <p className="text-gray-500">Fecha de entrega</p>
                <p className="font-medium">
                  {pedido.fecha_entrega_programada?.slice(0, 10)}
                </p>
              </div>

              <div className="col-span-2">
                <p className="text-gray-500">Dirección</p>
                <p className="truncate">{pedido.direccion_envio}</p>
              </div>

              <div>
                <p className="text-gray-500">Productos</p>
                <p className="font-medium">{detalles.length}</p>
              </div>

              <div>
                <p className="text-gray-500">Monto total</p>
                <p className="font-semibold">
                  S/. {montoTotal.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* ===================== PRODUCTOS ===================== */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 text-xs font-medium grid grid-cols-[2fr_80px_100px_110px]">
              <span>Producto</span>
              <span className="text-center">Cant.</span>
              <span className="text-center">Precio</span>
              <span className="text-right">Subtotal</span>
            </div>


            {detalles.map((d, i) => (
              <div
                key={d.id}
                className="px-4 py-3 grid grid-cols-[2fr_80px_100px_110px]
  gap-3 items-center border-t"
              >
                <Selectx
                  label=""
                  labelVariant="left"
                  value={String(d.producto_id)}
                  onChange={(e) => {
                    const productoId = Number(e.target.value);
                    const producto = productos.find(p => p.id === productoId);

                    setDetalles(prev =>
                      prev.map((det, idx) =>
                        idx === i
                          ? {
                            ...det,
                            producto_id: productoId,
                            precio_unitario: producto?.precio ?? det.precio_unitario,
                          }
                          : det
                      )
                    );
                  }}
                >

                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre_producto}
                    </option>
                  ))}
                </Selectx>

                <InputxNumber
                  label=""
                  value={String(d.cantidad)}
                  min={1}
                  onChange={(e) =>
                    handleDetalleChange(
                      i,
                      "cantidad",
                      Number(e.target.value)
                    )
                  }
                />
                <div className="w-full">
                  <InputxNumber
                    label=""
                    value={String(d.precio_unitario)}
                    min={0}
                    step="0.01"
                    className="w-full text-right"
                    onChange={(e) =>
                      handleDetalleChange(
                        i,
                        "precio_unitario",
                        Number(e.target.value)
                      )
                    }
                  />
                </div>


                <div className="text-right font-medium">
                  S/. {(d.cantidad * d.precio_unitario).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===================== FOOTER ===================== */}
        <div className="border-t px-5 py-4 flex gap-3">
          <Buttonx
            variant="tertiary"
            onClick={handleGuardar}
            disabled={saving}
            label={saving ? "Guardando..." : "Guardar cambios"}
            icon={
              saving
                ? "line-md:loading-twotone-loop"
                : "mdi:content-save-outline"
            }
            className={`text-sm ${saving ? "[&_svg]:animate-spin" : ""}`}
          />

          <Buttonx
            variant="outlinedw"
            onClick={onClose}
            disabled={saving}
            label="Cancelar"
            className="text-sm"
          />
        </div>
      </div>
    </div>
  );
}
