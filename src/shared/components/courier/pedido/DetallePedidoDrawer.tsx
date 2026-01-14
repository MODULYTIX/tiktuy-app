import { useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import type { PedidoDetalle } from "@/services/courier/pedidos/pedidos.types";
import Tittlex from "@/shared/common/Tittlex";

interface Props {
  open: boolean;
  onClose: () => void;
  detalle: PedidoDetalle | null;
  loading?: boolean;
}


function formatFechaPE(fecha: string | null | undefined) {
  if (!fecha) return "—";

  //  SIEMPRE tomar SOLO la parte YYYY-MM-DD
  const dateOnly = fecha.slice(0, 10);

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    const [y, m, d] = dateOnly.split("-");
    return `${d}/${m}/${y}`; // 31/12/2025
  }

  return "—";
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

  const codigo = detalle?.codigo_pedido ?? "—";
  const cliente = detalle?.cliente ?? "—";
  const direccion = detalle?.direccion_entrega ?? "—";
  const fechaEntrega = detalle ? formatFechaPE(detalle.fecha_entrega_programada) : "—";
  const referencia = detalle?.referencia ?? "—";
  const productos = detalle?.cantidad_productos ?? 0;

  const referenciaHref =
    referencia && referencia !== "—"
      ? referencia.startsWith("http")
        ? referencia
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          referencia
        )}`
      : undefined;
  const total = detalle?.monto_total ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="flex-1 bg-black/40" />

      {/* panel lateral */}
      <div
        ref={panelRef}
        className="w-[520px] h-full bg-white shadow-default flex flex-col gap-5 animate-slide-in-right p-5"
      >
        {/* header */}
        <div className="flex items-start justify-between gap-3">
          <Tittlex
            variant="modal"
            title="DETALLE DEL PEDIDO"
            icon="lsicon:shopping-cart-filled"
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
          ) : !detalle ? (
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
                      S/. {total.toFixed(2)}
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

              {/* productos (NO TOCADO como pediste) */}
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
                    {detalle.items.map((it) => (
                      <tr
                        key={it.producto_id}
                        className="border-y border-gray20"
                      >
                        <td className="px-3 py-2 w-full align-top">
                          <div className="font-normal">{it.nombre}</div>
                          {it.descripcion && (
                            <div className="text-gray-500 text-xs">
                              {it.descripcion}
                            </div>
                          )}
                          {"marca" in it && (it as any).marca && (
                            <div className="text-gray-400 text-xs">
                              Marca: {(it as any).marca}
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
    </div>
  );
}
