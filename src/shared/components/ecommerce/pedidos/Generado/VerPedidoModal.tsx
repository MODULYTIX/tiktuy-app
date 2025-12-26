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
  const totalItems = detalles.length;

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
        className="h-full w-[520px] max-w-[95vw] bg-white shadow-2xl flex flex-col"
      >
        {/* ===================== HEADER (mismo formato) ===================== */}
        <div className="px-5 py-4 bg-slate-50">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Tittlex
                variant="modal"
                icon="lsicon:shopping-cart-filled"
                title="Detalle del Pedido"
                description={`Código: ${pedido?.codigo_pedido ?? "—"}`}
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

                <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs text-slate-700">
                  <span className="font-semibold">Cant.:</span>
                  <span className="font-bold tabular-nums">
                    {String(cantProductos).padStart(2, "0")}
                  </span>
                </span>

                <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-xs text-emerald-900">
                  <span className="font-semibold">Total:</span>
                  <span className="font-extrabold tabular-nums">
                    S/.{" "}
                    {montoTotal.toLocaleString("es-PE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
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
          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="text-slate-600 font-medium">Cargando pedido…</div>
              <div className="mt-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-4 bg-gray-200 animate-pulse rounded"
                  />
                ))}
              </div>
            </div>
          ) : !pedido ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-slate-600">
              <div className="font-semibold">No se encontró el pedido.</div>
              <div className="text-xs text-slate-400 mt-1">
                Verifica el código o vuelve a intentar.
              </div>
            </div>
          ) : (
            <>
              {/* ===================== RESUMEN (mismo formato) ===================== */}
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
                      <p className="text-xs font-semibold text-slate-500">
                        Cliente
                      </p>
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
                      <p className="text-xs font-semibold text-slate-500">
                        Cantidad de productos
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900 tabular-nums">
                        {String(cantProductos).padStart(2, "0")}
                      </p>
                    </div>

                    <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                      <p className="text-xs font-semibold text-emerald-900">
                        Monto total
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-emerald-900 tabular-nums">
                        S/.{" "}
                        {montoTotal.toLocaleString("es-PE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ===================== PRODUCTOS (tu lógica intacta) ===================== */}
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <div className="text-sm font-bold text-slate-900">Productos</div>
                  <div className="text-xs text-slate-500">Detalle por ítem</div>
                </div>

                <div className="bg-slate-100 px-4 py-3 text-xs font-semibold text-slate-700 grid grid-cols-[1fr_90px]">
                  <span>Producto</span>
                  <span className="text-center">Cantidad</span>
                </div>

                {detalles.map((d) => (
                  <div
                    key={d.id}
                    className="px-4 py-3 grid grid-cols-[1fr_90px] items-center border-t border-gray-100 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="font-semibold text-slate-900 truncate">
                        {d.producto?.nombre_producto ?? "—"}
                      </p>
                      {d.producto?.descripcion && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                          {d.producto.descripcion}
                        </p>
                      )}
                    </div>

                    <div className="text-center">
                      <span className="inline-flex items-center justify-center min-w-[44px] rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-800 tabular-nums">
                        {String(Number(d.cantidad) || 0).padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                ))}

                {detalles.length === 0 && (
                  <div className="px-4 py-8 text-center text-slate-500">
                    <div className="font-semibold">Sin productos en este pedido</div>
                    <div className="text-xs text-slate-400 mt-1">
                      No hay ítems registrados para mostrar.
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ===================== FOOTER (sin líneas) ===================== */}
        <div className="px-5 py-4 bg-white flex gap-3 shadow-md">
          {onEditar && pedidoId && (
            <Buttonx
              variant="secondary"
              onClick={() => onEditar(pedidoId)}
              label="Editar"
              icon="mdi:pencil-outline"
              className="text-sm flex-1"
            />
          )}

          <Buttonx
            variant="outlinedw"
            onClick={onClose}
            label="Cerrar"
            icon="mdi:close"
            className="text-sm flex-1"
          />
        </div>
      </div>
    </div>
  );
}
