// src/shared/components/ecommerce/pedidos/Generado/EditarPedidoGeneradoModal.tsx
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/auth/context";
import {
  fetchPedidoById,
  actualizarPedidoGenerado,
  fetchProductosPorSede,
} from "@/services/ecommerce/pedidos/pedidos.api";
import { fetchProductos } from "@/services/ecommerce/producto/producto.api";

import type {
  Pedido,
  ProductoSede,
} from "@/services/ecommerce/pedidos/pedidos.types";

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
  const [productos, setProductos] = useState<ProductoSede[]>([]);
  const [detalles, setDetalles] = useState<DetalleForm[]>([]);
  const [saving, setSaving] = useState(false);
  const [montoEditado, setMontoEditado] = useState(false);

  /* ===================== FETCH ===================== */
  useEffect(() => {
    if (!open || !token || !pedidoId) return;

    let mounted = true;

    fetchPedidoById(pedidoId, token).then((p) => {
      if (!mounted || !p) return;

      setPedido(p);

      setDetalles(
        (p.detalles ?? []).map((d: any) => ({
          id: d.id,
          producto_id: d.producto_id,
          cantidad: d.cantidad,
          precio_unitario: Number(d.precio_unitario),
        }))
      );

      // Helper to merge fetched products with existing ones from details (to avoid missing options)
      const mergeProducts = (fetched: ProductoSede[], currentDetails: any[]) => {
        const detailProducts = currentDetails
          .map((d: any) => d.producto)
          .filter((p: any) => !!p)
          .map((p: any) => ({
            id: p.id,
            nombre_producto: p.nombre_producto,
            precio: 0, // precio might not be in producto info inside detalle, usually comes separately or we use detalle price
            stock: p.stock ?? 0,
            descripcion: p.descripcion,
            // other fields optional
          }));

        // Combine and deduplicate by ID
        const combined = [...fetched];
        detailProducts.forEach((dp: any) => {
          if (!combined.find(c => c.id === dp.id)) {
            combined.push(dp);
          }
        });
        return combined;
      };

      // 🔑 CLAVE: traer productos SOLO de la sede del pedido
      if (p.sede_id) {
        fetchProductosPorSede(p.sede_id, token)
          .then((prods) => {
            if (mounted) {
              const finalProds = mergeProducts(prods, p.detalles || []);
              setProductos(finalProds);
            }
          })
          .catch(console.error);
      } else {
        // Fallback: si no hay sede (legacy o bug), traer productos generales del ecommerce
        fetchProductos(token, { perPage: 100 }).then((res) => {
          if (mounted && res.data) {
            const mapped = res.data.map((prod) => ({
              id: prod.id,
              nombre_producto: prod.nombre_producto,
              precio: prod.precio,
              stock: prod.stock,
              descripcion: prod.descripcion,
              codigo_identificacion: prod.codigo_identificacion,
              imagen_url: prod.imagen_url
            }));
            const finalProds = mergeProducts(mapped, p.detalles || []);
            setProductos(finalProds);
          }
        }).catch(console.error);
      }
    });

    return () => {
      mounted = false;
    };
  }, [open, pedidoId, token]);

  /* ===================== HELPERS ===================== */
  const montoCalculado = detalles.reduce(
    (s, d) => s + d.cantidad * d.precio_unitario,
    0
  );

  const montoTotal = montoEditado
    ? montoCalculado
    : Number(pedido?.monto_recaudar ?? montoCalculado);


  const handleDetalleChange = (
    index: number,
    field: keyof DetalleForm,
    value: number
  ) => {
    setMontoEditado(true);
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

  const fechaEntregaStr = pedido.fecha_entrega_programada?.slice(0, 10) ?? "—";
  const totalItems = detalles.length;

  /* ===================== UI ===================== */
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex justify-end">
      <div
        ref={modalRef}
        className="h-full w-[520px] max-w-[95vw] bg-white shadow-2xl flex flex-col"
      >
        {/* ===================== HEADER (sin líneas, estilo pro) ===================== */}
        <div className="px-5 py-4 bg-slate-50">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Tittlex
                variant="modal"
                icon="lsicon:shopping-cart-filled"
                title="Editar Pedido"
                description={`Código: ${pedido.codigo_pedido}`}
              />

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-xs text-slate-700">
                  <span className="font-semibold text-slate-500">Entrega:</span>
                  <span className="font-bold tabular-nums">{fechaEntregaStr}</span>
                </span>

                <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs text-slate-700">
                  <span className="font-semibold">Ítems:</span>
                  <span className="font-bold tabular-nums">
                    {String(totalItems).padStart(2, "0")}
                  </span>
                </span>

                <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-xs text-emerald-900">
                  <span className="font-semibold">Total:</span>
                  <span className="font-extrabold tabular-nums">
                    S/. {montoTotal.toFixed(2)}
                  </span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-slate-50 shrink-0"
              title="Cerrar"
            >
              <span className="text-slate-700 text-xl leading-none">×</span>
            </button>
          </div>
        </div>

        {/* ===================== CONTENT ===================== */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 text-sm bg-[#F7F8FA]">
          {/* ===================== RESUMEN ===================== */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="text-sm font-bold text-slate-900">
                Resumen del pedido
              </div>
              <div className="text-xs text-slate-500">Datos principales</div>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-xs font-semibold text-slate-500">Cliente</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 break-words">
                    {pedido.nombre_cliente}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-xs font-semibold text-slate-500">
                    Fecha de entrega
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900 tabular-nums">
                    {fechaEntregaStr}
                  </p>
                </div>

                <div className="sm:col-span-2 rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-xs font-semibold text-slate-500">
                    Dirección
                  </p>
                  <p className="mt-1 text-sm text-slate-700 break-words">
                    {pedido.direccion_envio}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-xs font-semibold text-slate-500">Productos</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 tabular-nums">
                    {String(totalItems).padStart(2, "0")}
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                  <p className="text-xs font-semibold text-emerald-900">
                    Monto total
                  </p>
                  <p className="mt-1 text-sm font-extrabold text-emerald-900 tabular-nums">
                    S/. {montoTotal.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ===================== PRODUCTOS (tu lógica intacta) ===================== */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="text-sm font-bold text-slate-900">Productos</div>
              <div className="text-xs text-slate-500">
                Ajusta cantidad y precio
              </div>
            </div>

            <div className="bg-slate-100 px-4 py-3 text-xs font-semibold text-slate-700 grid grid-cols-[2fr_80px_100px_110px]">
              <span>Producto</span>
              <span className="text-center">Cant.</span>
              <span className="text-center">Precio</span>
              <span className="text-right">Subtotal</span>
            </div>

            {detalles.map((d, i) => (
              <div
                key={d.id}
                className="px-4 py-3 grid grid-cols-[2fr_80px_100px_110px] gap-3 items-center border-t border-gray-100"
              >
                <Selectx
                  label=""
                  labelVariant="left"
                  value={String(d.producto_id)}
                  onChange={(e) => {
                    const productoId = Number(e.target.value);
                    const producto = productos.find((p) => p.id === productoId);

                    setMontoEditado(true);

                    setDetalles((prev) =>
                      prev.map((det, idx) =>
                        idx === i
                          ? {
                            ...det,
                            producto_id: productoId,
                            precio_unitario:
                              producto?.precio ?? det.precio_unitario,
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
                    handleDetalleChange(i, "cantidad", Number(e.target.value))
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

                <div className="text-right font-semibold text-slate-900 tabular-nums">
                  S/. {(d.cantidad * d.precio_unitario).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===================== FOOTER (sin líneas) ===================== */}
        <div className="px-5 py-4 bg-white flex gap-3 shadow-md">
          <Buttonx
            variant="secondary"
            onClick={handleGuardar}
            disabled={saving}
            label={saving ? "Guardando..." : "Guardar cambios"}
            icon={
              saving
                ? "line-md:loading-twotone-loop"
                : "mdi:content-save-outline"
            }
            className={`text-sm flex-1 ${saving ? "[&_svg]:animate-spin" : ""}`}
          />

          <Buttonx
            variant="outlinedw"
            onClick={onClose}
            disabled={saving}
            label="Cancelar"
            className="text-sm flex-1"
          />
        </div>
      </div>
    </div>
  );
}
