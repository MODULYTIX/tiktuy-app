import { Icon } from "@iconify/react";
import type { PedidoListItem } from "@/services/repartidor/pedidos/pedidos.types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  pedido: PedidoListItem | null;
  loading?: boolean;
};

/* ---------------- Helpers (fuera del componente) ---------------- */

function pickText(...vals: any[]): string | undefined {
  for (const v of vals) {
    if (typeof v === "string") {
      const t = v.trim();
      if (t) return t;
    }
    if (typeof v === "number" && !Number.isNaN(v)) return String(v);
  }
  return undefined;
}

function pickMoney(...vals: any[]): number | undefined {
  for (const v of vals) {
    if (typeof v === "number" && !Number.isNaN(v)) return v;

    if (typeof v === "string") {
      // soporta: "S/ 98.00", "98.00", "1,250.50"
      const cleaned = v.replace(/[^\d.-]/g, "");
      if (!cleaned) continue;
      const n = Number(cleaned);
      if (!Number.isNaN(n)) return n;
    }
  }
  return undefined;
}

export default function ModalPedidoDetalle({
  isOpen,
  onClose,
  pedido,
  loading,
}: Props) {
  if (!isOpen) return null;

  const showSkeleton = Boolean(loading) && !pedido;

  // si está abierto pero aún no llegó pedido
  if (!pedido && showSkeleton) {
    return (
      <div className="fixed inset-0 z-[70]">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="absolute right-0 top-0 h-full w-full sm:w-[440px] bg-[#F4F5F7] shadow-2xl overflow-y-auto rounded-l-2xl border-l border-gray-200">
          <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-200">
            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Icon
                    icon="mdi:cart-outline"
                    className="text-emerald-600 text-xl"
                  />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    Detalle del Pedido
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Información del cliente y productos
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50"
                aria-label="Cerrar"
                title="Cerrar"
              >
                <Icon icon="mdi:close" className="text-xl" />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 w-40 bg-gray-200 rounded" />
                <div className="h-3 w-56 bg-gray-200 rounded" />
                <div className="h-3 w-48 bg-gray-200 rounded" />
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-3 w-52 bg-gray-200 rounded" />
                <div className="h-3 w-64 bg-gray-200 rounded" />
                <div className="h-3 w-56 bg-gray-200 rounded" />
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-9 bg-gray-200 rounded" />
                <div className="h-9 bg-gray-200 rounded" />
                <div className="h-9 bg-gray-200 rounded" />
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  // si está abierto pero pedido es null y no está cargando: muestra empty state (no deja todo en "—")
  if (!pedido && !showSkeleton) {
    return (
      <div className="fixed inset-0 z-[70]">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="absolute right-0 top-0 h-full w-full sm:w-[440px] bg-[#F4F5F7] shadow-2xl overflow-y-auto rounded-l-2xl border-l border-gray-200">
          <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-200">
            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Icon
                    icon="mdi:cart-outline"
                    className="text-emerald-600 text-xl"
                  />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    Detalle del Pedido
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Información del cliente y productos
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50"
                aria-label="Cerrar"
                title="Cerrar"
              >
                <Icon icon="mdi:close" className="text-xl" />
              </button>
            </div>
          </div>

          <div className="p-5">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-sm text-gray-700">
              No se encontró el detalle del pedido.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- Datos normalizados (pedido existe) ----------------
  const p: any = pedido;

  const clienteRaw = p.cliente;
  const ecommerceRaw = p.ecommerce;

  const codigo =
    pickText(p.codigo_pedido, p.codigo) ??
    `C${String(p.id ?? 0).padStart(2, "0")}`;

  const cliente =
    pickText(typeof clienteRaw === "string" ? clienteRaw : clienteRaw?.nombre) ??
    "—";

  const telefono =
    pickText(
      typeof clienteRaw === "object"
        ? clienteRaw?.celular ?? clienteRaw?.telefono
        : undefined,
      p.telefono,
      p.celular
    ) ?? "—";

  const distritoRaw =
    typeof clienteRaw === "object" ? clienteRaw?.distrito : undefined;

  const distrito =
    pickText(
      typeof distritoRaw === "string" ? distritoRaw : distritoRaw?.nombre,
      p.distrito
    ) ?? "—";

  const direccion =
    pickText(
      p.direccion_envio,
      p.direccion,
      p.direccion_entrega,
      p.direccionEntrega,
      typeof clienteRaw === "object" ? clienteRaw?.direccion : undefined
    ) ?? "—";

  const referencia =
    pickText(
      typeof clienteRaw === "object" ? clienteRaw?.referencia : undefined,
      p.referencia
    ) ?? "—";

  const ecommerce =
    pickText(
      typeof ecommerceRaw === "string"
        ? ecommerceRaw
        : ecommerceRaw?.nombre_comercial,
      p.ecommerce_nombre,
      p.nombre_ecommerce
    ) ?? "—";

  const estado =
    pickText(
      p.estado_nombre,
      p.estadoNombre,
      typeof p.estado === "string" ? p.estado : p.estado?.nombre
    ) ?? "—";

  const monto =
    pickMoney(
      p.monto_total_num,
      p.monto_total,
      p.monto_recaudar,
      p.items_total_monto,
      p.total
    ) ?? 0;

  const telHref =
    telefono !== "—" ? `tel:${String(telefono).replace(/\s/g, "")}` : undefined;

  const waHref =
    telefono !== "—"
      ? `https://wa.me/${String(telefono).replace(/\D/g, "")}`
      : undefined;

  const monto_total = new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(monto || 0);

  const items = (Array.isArray(p.items) ? p.items : []) as Array<any>;

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full sm:w-[440px] bg-[#F4F5F7] shadow-2xl overflow-y-auto rounded-l-2xl border-l border-gray-200">
        {/* Header (sticky) */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-200">
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <Icon
                  icon="mdi:cart-outline"
                  className="text-emerald-600 text-xl"
                />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Detalle del Pedido
                </div>
                <div className="text-[11px] text-gray-500">
                  Información del cliente y productos
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50"
              aria-label="Cerrar"
              title="Cerrar"
            >
              <Icon icon="mdi:close" className="text-xl" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Card: Resumen */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] text-gray-500">Cliente</div>
                  <div className="text-base font-semibold text-gray-900 truncate">
                    {cliente}
                  </div>
                  <div className="text-xs text-gray-600 truncate">{codigo}</div>
                </div>

                <span className="shrink-0 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {estado}
                </span>
              </div>

              {/* acciones rápidas */}
              <div className="mt-4 flex items-center gap-2">
                <a
                  href={telHref}
                  className={`flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 flex items-center justify-center gap-2 text-sm shadow-sm hover:bg-gray-50 ${!telHref ? "opacity-50 pointer-events-none" : ""
                    }`}
                >
                  <Icon
                    icon="mdi:phone"
                    className="text-lg text-emerald-600"
                  />
                  Llamar
                </a>

                <a
                  href={waHref}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 flex items-center justify-center gap-2 text-sm shadow-sm hover:bg-gray-50 ${!waHref ? "opacity-50 pointer-events-none" : ""
                    }`}
                >
                  <Icon
                    icon="mdi:whatsapp"
                    className="text-lg text-emerald-600"
                  />
                  WhatsApp
                </a>
              </div>
            </div>
          </section>

          {/* Card: Datos de entrega */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Icon
                  icon="mdi:map-marker-outline"
                  className="text-lg text-[#1D3F8C]"
                />
                <h3 className="text-sm font-semibold text-gray-900">
                  Datos de entrega
                </h3>
              </div>

              <div className="space-y-2 text-sm">
                <InfoRow icon="mdi:phone" label="Teléfono" value={telefono} />
                <InfoRow icon="mdi:map" label="Distrito" value={distrito} />
                <InfoRow
                  icon="mdi:home-outline"
                  label="Dirección"
                  value={direccion}
                  multiline
                />
                <InfoRow
                  icon="mdi:message-text-outline"
                  label="Referencia"
                  value={referencia}
                  multiline
                />
                <InfoRow
                  icon="mdi:store-outline"
                  label="Ecommerce"
                  value={ecommerce}
                />
                <InfoRow
                  icon="mdi:cash"
                  label="Monto"
                  value={monto_total}
                  valueClassName="text-emerald-700 font-semibold"
                />
              </div>
            </div>
          </section>

          {/* Card: Productos */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 pb-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon
                  icon="mdi:package-variant-closed"
                  className="text-lg text-[#1D3F8C]"
                />
                <h3 className="text-sm font-semibold text-gray-900">
                  Productos
                </h3>
              </div>

              <span className="text-xs text-gray-500">{items.length} item(s)</span>
            </div>

            <div className="p-4 pt-3">
              <div className="bg-white rounded-md overflow-hidden shadow-default border border-gray30">
                <table className="min-w-full table-fixed text-[13px] bg-white">
                  <thead className="bg-[#E5E7EB]">
                    <tr className="text-gray70 font-roboto font-medium">
                      <th className="px-4 py-2 text-left">Producto</th>
                      <th className="px-4 py-2 text-right w-16">Cant.</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray20">
                    {items.length ? (
                      items.map((it: any, idx: number) => (
                        <tr
                          key={idx}
                          className="hover:bg-gray10 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="font-medium">{it.nombre ?? "—"}</div>
                            {it.descripcion ? (
                              <div className="text-xs text-gray-500">
                                {it.descripcion}
                              </div>
                            ) : null}
                          </td>

                          <td className="px-4 py-3 text-right text-sm text-gray-800 font-medium">
                            {String(it.cantidad ?? 0).padStart(2, "0")}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={2}
                          className="px-4 py-4 text-center text-xs text-gray-500"
                        >
                          No hay productos en este pedido.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  multiline,
  valueClassName,
}: {
  icon: string;
  label: string;
  value: string;
  multiline?: boolean;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
        <Icon icon={icon} className="text-lg text-gray-700" />
      </div>

      <div className="min-w-0">
        <div className="text-[11px] text-gray-500">{label}</div>
        <div
          className={`text-sm text-gray-900 ${multiline ? "" : "truncate"
            } ${valueClassName ?? ""}`}
          title={!multiline ? value : undefined}
        >
          {value || "—"}
        </div>
      </div>
    </div>
  );
}
