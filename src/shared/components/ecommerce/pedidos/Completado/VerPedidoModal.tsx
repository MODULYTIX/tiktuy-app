// src/shared/components/ecommerce/pedidos/modals/VerPedidoModal.tsx
import { useEffect, useRef, useState } from "react";
import { fetchPedidoById } from "@/services/ecommerce/pedidos/pedidos.api";
import type { Pedido } from "@/services/ecommerce/pedidos/pedidos.types";
import { useAuth } from "@/auth/context";
import Tittlex from "@/shared/common/Tittlex";
import { Icon } from "@iconify/react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pedidoId: number | null;
}

function formatFechaPE(fecha: string | null | undefined) {
  if (!fecha) return "—";

  //  SIEMPRE tomar SOLO la parte YYYY-MM-DD
  const dateOnly = fecha.slice(0, 10);

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    const [y, m, d] = dateOnly.split("-");
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    if (isNaN(date.getTime())) return "—";

    // Formato DD/MM/YYYY
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  return dateOnly;
}

export default function VerPedidoModal({ isOpen, onClose, pedidoId }: Props) {
  const { token } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(false);

  // cerrar por click fuera
  useEffect(() => {
    if (!isOpen) return;
    const clickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, [isOpen, onClose]);

  // cargar pedido
  useEffect(() => {
    if (!isOpen || !token || !pedidoId) return;
    setLoading(true);
    fetchPedidoById(pedidoId, token)
      .then((p) => setPedido(p ?? null))
      .catch(() => setPedido(null))
      .finally(() => setLoading(false));
  }, [isOpen, token, pedidoId]);

  if (!isOpen) return null;

  const codigo = pedido?.codigo_pedido ?? "—";
  const cliente = pedido?.nombre_cliente ?? "—";
  const direccion = pedido?.direccion_envio ?? "—";
  const fechaEntrega = pedido ? formatFechaPE(pedido.fecha_entrega_programada) : "—";
  const referencia = pedido?.referencia_direccion ?? "—";
  // Sumar cantidades de detalles
  const productos = (pedido?.detalles ?? []).reduce((acc, d) => acc + Number(d.cantidad), 0);

  const referenciaHref =
    referencia && referencia !== "—"
      ? referencia.startsWith("http")
        ? referencia
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          referencia
        )}`
      : undefined;

  // Total calculado (o usar monto_recaudar si es fiable)
  const total = pedido?.monto_recaudar ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="flex-1 bg-black/40" />

      {/* panel lateral */}
      <div
        ref={modalRef}
        className="w-[520px] h-full bg-white shadow-default flex flex-col gap-5 animate-slide-in-right p-5"
      >
        {/* header */}
        <div className="flex items-start justify-between gap-3">
          <Tittlex
            variant="modal"
            title="DETALLE DEL PEDIDO"
            icon="lsicon:shopping-cart-filled"
            description="Información detallada del pedido"
          />

          {/* Badge código */}
          <div className="flex flex-col items-end gap-1">
            <span className="text-[11px] text-gray-500">Cód. Pedido</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-gray10 px-3 py-1 text-[11px] font-semibold text-gray-700 ring-1 ring-gray20">
              <Icon icon="mdi:barcode-scan" className="text-base text-gray-500" />
              {codigo}
            </span>
          </div>
        </div>

        {/* body */}
        <div className="flex flex-col gap-5 text-sm h-full overflow-y-auto p-1">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 animate-pulse rounded" />
              ))}
            </div>
          ) : !pedido ? (
            <p className="text-gray-600 text-sm">
              No se encontró el detalle del pedido.
            </p>
          ) : (
            <>
              {/* ✅ BLOQUE INFO REDISEÑADO */}
              <div className="bg-white rounded-md shadow-default ring-1 ring-gray20 p-4">
                {/* Cliente (perfil) */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center">
                    <Icon icon="mdi:account" className="text-xl text-blue-700" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-gray-500">Cliente</div>
                    <div className="text-base font-semibold text-gray-900 leading-tight truncate">
                      {cliente}
                    </div>

                    {/* Dirección */}
                    <div className="mt-2 flex items-start gap-2 text-sm">
                      <Icon
                        icon="mdi:map-marker-outline"
                        className="text-lg text-gray-400 mt-[1px]"
                      />
                      <div className="min-w-0">
                        <div className="text-[11px] text-gray-500">Dirección</div>
                        <div className="text-sm font-medium text-gray-800 break-words">
                          {direccion}
                        </div>
                      </div>
                    </div>
                    {/* Referencia */}
                    <div className="mt-2 flex items-start gap-2 text-sm">
                      <Icon
                        icon="mdi:map-marker-outline"
                        className="text-lg text-gray-400 mt-[1px]"
                      />
                      <div className="min-w-0">
                        <div className="text-[11px] text-gray-500">Referencia</div>
                        <a
                          className={`block ${!referenciaHref ? "pointer-events-none" : ""}`}
                          target="_blank"
                          href={referenciaHref}
                          rel="noreferrer"
                        >
                          <div className="text-sm font-medium text-gray-800 break-words">
                            {referencia}
                          </div>
                        </a>
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
                      S/. {Number(total).toFixed(2)}
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
                      {fechaEntrega}
                    </div>
                    <div className="text-[11px] text-gray-500">Fecha programada</div>
                  </div>

                  {/* Productos */}
                  <div className="rounded-md bg-gray10 ring-1 ring-gray20 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500">Productos</span>
                      <Icon icon="mdi:cart-outline" className="text-lg text-gray-400" />
                    </div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">
                      {String(productos).padStart(2, "0")}
                    </div>
                    <div className="text-[11px] text-gray-500">Cantidad total</div>
                  </div>
                </div>
              </div>

              {/* productos */}
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
                    {(pedido.detalles ?? []).map((it) => (
                      <tr
                        key={it.id} // usando id único del detalle
                        className="border-y border-gray20"
                      >
                        <td className="px-3 py-2 w-full align-top">
                          <div className="font-normal">
                            {it.producto?.nombre_producto ?? "-"}
                          </div>
                          {/* Descripción: del detalle o del producto */}
                          {(it.descripcion || it.producto?.descripcion) && (
                            <div className="text-gray-500 text-xs">
                              {it.descripcion || it.producto?.descripcion}
                            </div>
                          )}
                          {/* Marca (si existiera en type ecommerce) */}
                          {it.marca && (
                            <div className="text-gray-400 text-xs">
                              Marca: {it.marca}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 w-12 text-gray60 text-center">
                          {Number(it.cantidad)}
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
    </div>
  );
}
