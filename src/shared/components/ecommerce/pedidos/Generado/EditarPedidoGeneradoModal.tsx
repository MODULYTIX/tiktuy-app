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
  const montoTotal = detalles.reduce((s, d) => s + d.cantidad * d.precio_unitario, 0);

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
        className={[
          "h-full bg-white shadow-xl flex flex-col gap-5 p-5",
          "w-[460px] max-w-[92vw]", // ✅ ancho fijo
          "overflow-y-auto",
        ].join(" ")}
      >
        <Tittlex
          variant="modal"
          icon="lsicon:shopping-cart-filled"
          title="DETALLE DEL PEDIDO"
          description={`Cód. Pedido: ${pedido.codigo_pedido}`}
        />

        {/* INFO */}
        <div className="text-sm text-gray-700 space-y-1">
          <p>
            <b>Cliente:</b> {pedido.nombre_cliente}
          </p>
          <p>
            <b>Dirección:</b> {pedido.direccion_envio}
          </p>
          <p>
            <b>F. Entrega:</b> {pedido.fecha_entrega_programada?.slice(0, 10)}
          </p>
          <p>
            <b>Cant. Productos:</b> {detalles.length}
          </p>
          <p className="font-semibold">
            <b>Monto:</b> S/. {montoTotal.toFixed(2)}
          </p>
        </div>

        {/* TABLA */}
        <div className="border rounded-lg overflow-hidden mt-1">
          <div className="grid grid-cols-3 bg-gray-100 px-3 py-2 text-sm font-medium">
            <span>Producto</span>
            <span>Cantidad</span>
            <span>Subtotal</span>
          </div>

          {detalles.map((d, i) => (
            <div
              key={d.id}
              className="grid grid-cols-3 gap-2 px-3 py-2 border-t items-center"
            >
              <Selectx
                label="Producto"
                labelVariant="left"
                value={String(d.producto_id)}
                onChange={(e) =>
                  handleDetalleChange(i, "producto_id", Number(e.target.value))
                }
              >
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre_producto}
                  </option>
                ))}
              </Selectx>

              <InputxNumber
                label="Cantidad"
                value={String(d.cantidad)}
                onChange={(e) =>
                  handleDetalleChange(i, "cantidad", Number(e.target.value))
                }
                min={1}
              />

              <span className="text-sm font-medium">
                S/. {(d.cantidad * d.precio_unitario).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="flex gap-3 mt-auto">
          <Buttonx
            variant="tertiary"
            onClick={handleGuardar}
            disabled={saving}
            label={saving ? "Guardando..." : "Guardar cambios"}
            icon={saving ? "line-md:loading-twotone-loop" : "mdi:content-save-outline"}
            className={`px-4 text-sm ${saving ? "[&_svg]:animate-spin" : ""}`}
          />

          <Buttonx
            variant="outlinedw"
            onClick={onClose}
            disabled={saving}
            label="Cancelar"
            className="px-4 text-sm border"
          />
        </div>
      </div>
    </div>
  );
}
