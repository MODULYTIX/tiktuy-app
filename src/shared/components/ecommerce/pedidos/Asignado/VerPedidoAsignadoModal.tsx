// src/shared/components/ecommerce/pedidos/VerPedidoCompletadoModal.tsx
import { useEffect, useRef, useState } from "react";
import { fetchPedidoById } from "@/services/ecommerce/pedidos/pedidos.api";
import type { Pedido } from "@/services/ecommerce/pedidos/pedidos.types";
import { useAuth } from "@/auth/context";
import Tittlex from "@/shared/common/Tittlex";
import { Icon } from "@iconify/react";
import Buttonx from "@/shared/common/Buttonx";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onEditar?: (id: number) => void;
  pedidoId: number | null;
  detalle?: Pedido | null;
}

export default function VerPedidoAsignadoModal({
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
    : "—";

  const estado: string =
    (pedido as any)?.estado?.nombre ?? (pedido as any)?.estado_pedido ?? "";

  const estadoColor =
    estado?.toLowerCase() === "entregado"
      ? "bg-green-50 text-green-700 ring-green-600/20"
      : "bg-yellow-50 text-yellow-700 ring-yellow-600/20";

  const codigo = pedido?.codigo_pedido ?? "—";
  const courier = pedido?.courier?.nombre_comercial ?? "—";
  const cliente = pedido?.nombre_cliente ?? "—";
  const celular = pedido?.celular_cliente ? `+ 51 ${pedido.celular_cliente}` : "—";
  const distrito = pedido?.distrito ?? "—";
  const direccion = pedido?.direccion_envio ?? "—";
  const referencia = pedido?.referencia_direccion ?? "—";
  const productsCant = (pedido?.detalles ?? []).reduce(
    (sum, d) => sum + (Number(d.cantidad) || 0),
    0
  );

  const referenciaHref =
    referencia && referencia !== "—"
      ? referencia.startsWith("http")
        ? referencia
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          referencia
        )}`
      : undefined;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="flex-1 bg-black/40" />

      <div
        ref={modalRef}
        className={[
          "h-full bg-white shadow-default flex flex-col gap-5 p-5",
          "w-[520px]", // ✅ ancho fijo, un poco más ancho para el diseño nuevo
          "overflow-y-auto",
          "animate-slide-in-right",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <Tittlex
            variant="modal"
            title="DETALLE DEL PEDIDO"
            icon="lsicon:shopping-cart-filled"
            description="Consulta toda la información registrada de este pedido."
          />

          <div className="flex flex-col items-end gap-2">
            {/* Status Badge */}
            {estado && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium ring-1 ring-inset ${estadoColor}`}>
                {estado}
              </span>
            )}
            {/* Code Badge */}
            <div className="flex items-center gap-2 rounded-full bg-gray10 px-3 py-1 text-[11px] font-semibold text-gray-700 ring-1 ring-gray20">
              <Icon icon="mdi:barcode-scan" className="text-base text-gray-500" />
              {codigo}
            </div>
          </div>
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
          <div className="flex flex-col gap-5 text-sm h-full overflow-y-auto p-1">
            {/* ✅ BLOQUE INFO REDISEÑADO */}
            <div className="bg-white rounded-md shadow-default ring-1 ring-gray20 p-4">
              {/* Cliente Row */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center shrink-0">
                  <Icon icon="mdi:account" className="text-xl text-blue-700" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-gray-500">Cliente</div>
                  <div className="text-base font-semibold text-gray-900 leading-tight truncate">
                    {cliente}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{celular}</div>

                  {/* Dirección */}
                  <div className="mt-3 flex items-start gap-2 text-sm">
                    <Icon
                      icon="mdi:map-marker-outline"
                      className="text-lg text-gray-400 mt-px shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-[11px] text-gray-500">Dirección ({distrito})</div>
                      <div className="text-sm font-medium text-gray-800 break-words">
                        {direccion}
                      </div>
                    </div>
                  </div>
                  {/* Referencia */}
                  <div className="mt-2 flex items-start gap-2 text-sm">
                    <Icon
                      icon="mdi:map-marker-path"
                      className="text-lg text-gray-400 mt-px shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-[11px] text-gray-500">Referencia</div>
                      <a
                        className={`block ${!referenciaHref ? "pointer-events-none" : ""}`}
                        target="_blank"
                        href={referenciaHref}
                        rel="noreferrer"
                      >
                        <div className="text-sm font-medium text-gray-800 break-words hover:text-blue-600 hover:underline">
                          {referencia}
                        </div>
                      </a>
                    </div>
                  </div>

                  {/* Courier (Original field maintained) */}
                  <div className="mt-3 flex items-start gap-2 text-sm border-t border-gray10 pt-2">
                    <Icon
                      icon="mdi:truck-delivery-outline"
                      className="text-lg text-gray-400 mt-px shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-[11px] text-gray-500">Courier Asignado</div>
                      <div className="text-sm font-medium text-gray-800 break-words">
                        {courier}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="my-4 h-px bg-gray20" />

              {/* Resumen en cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Total */}
                <div className="rounded-md bg-gray10 ring-1 ring-gray20 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">Total</span>
                    <Icon icon="mdi:cash-multiple" className="text-lg text-gray-400" />
                  </div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">
                    {montoCalc ? `S/. ${Number(montoCalc).toLocaleString("es-PE", { minimumFractionDigits: 2 })}` : ""}
                  </div>
                </div>

                {/* Entrega */}
                <div className="rounded-md bg-gray10 ring-1 ring-gray20 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">Entrega</span>
                    <Icon
                      icon="mdi:calendar-check-outline"
                      className="text-lg text-gray-400"
                    />
                  </div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">
                    {fechaEntregaStr}
                  </div>
                  <div className="text-[11px] text-gray-500">Programada</div>
                </div>

                {/* Productos */}
                <div className="rounded-md bg-gray10 ring-1 ring-gray20 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">Productos</span>
                    <Icon icon="mdi:cart-outline" className="text-lg text-gray-400" />
                  </div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">
                    {String(productsCant).padStart(2, "0")}
                  </div>
                  <div className="text-[11px] text-gray-500">Cantidad</div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-md shadow-default mb-2">
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

            <div className="mt-auto flex items-center justify-end gap-3 pt-4 border-t border-gray20">
              <Buttonx
                variant="outlinedw"
                onClick={onClose}
                label="Cerrar"
                icon="mdi:close"
                className="px-4 text-sm border"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
