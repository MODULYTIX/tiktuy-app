import { useMemo } from 'react';
import { Icon } from '@iconify/react';
import type { PedidoListItem } from '@/services/repartidor/pedidos/pedidos.types';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  pedido: PedidoListItem | null;
  loading?: boolean;
};

export default function ModalPedidoDetalle({
  isOpen,
  onClose,
  pedido,
  loading,
}: Props) {
  if (!isOpen) return null;

  // Loader opcional
  if (loading) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40">
        <div className="bg-white px-5 py-4 rounded-xl shadow-md">
          <p className="text-sm text-gray-600">
            Cargando detalle del pedido...
          </p>
        </div>
      </div>
    );
  }

  if (!pedido) return null;

  // === RESUMEN (igual enfoque que en ModalRepartidorMotorizado) ===
  const resumen = useMemo(() => {
    if (!pedido) return null;

    const fechaProg =
      pedido.fecha_entrega_programada || pedido.fecha_entrega_real;
    const monto = Number(pedido.monto_recaudar || 0);
    const distrito = pedido.cliente?.distrito || '—';
    const telefono = pedido.cliente?.celular || '—';
    const codigo =
      pedido.codigo_pedido || `C${String(pedido.id).padStart(2, '0')}`;
    const direccion = pedido.direccion_envio || '—';
    const cliente = pedido.cliente?.nombre || '—';
    const ecommerce = pedido.ecommerce?.nombre_comercial || '—';
    const referencia = pedido.cliente?.referencia || '—';

    return {
      fechaProg,
      monto,
      distrito,
      telefono,
      codigo,
      direccion,
      cliente,
      ecommerce,
      referencia,
    };
  }, [pedido]);

  // helpers tel / whatsapp
  const telHref =
    resumen?.telefono && resumen.telefono !== '—'
      ? `tel:${resumen.telefono}`
      : undefined;

  const waHref =
    resumen?.telefono && resumen.telefono !== '—'
      ? `https://wa.me/${resumen.telefono.replace(/\D/g, '')}`
      : undefined;

  const productos = pedido.items ?? [];

  return (
    <div className="fixed inset-0 z-[70]">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* drawer / bottom-sheet */}
      <div className="absolute inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[420px] bg-white rounded-t-2xl sm:rounded-none sm:rounded-l-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Icon icon="mdi:cart-outline" className="text-primary text-xl" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-gray-900">
              Detalle del pedido
            </h2>
            <p className="text-xs text-gray-500">
              Revisa la información del cliente y los productos.
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-2 text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100"
            aria-label="Cerrar"
          >
            <Icon icon="mdi:close" className="text-lg" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 space-y-4 text-sm overflow-y-auto max-h-[75vh] sm:max-h-full">
          {/* Tarjeta de resumen */}
          <div className="border rounded-xl p-3 bg-gray-50/60">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-gray-500">Cliente</div>
                <div className="font-medium text-gray-900 truncate">
                  {resumen?.cliente}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Distrito
                </div>
                <div className="text-gray-800">
                  {resumen?.distrito}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Código</div>
                <div className="font-mono text-sm text-gray-900">
                  {resumen?.codigo}
                </div>
                <div className="mt-2 text-xs text-gray-500">Estado</div>
                <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-[11px] font-medium text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                  {pedido.estado_nombre || '—'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-3 text-sm">
              <Item label="Teléfono" icon="mdi:phone">
                {resumen?.telefono}
              </Item>
              <Item label="Ecommerce" icon="mdi:store-outline">
                {resumen?.ecommerce}
              </Item>
              <Item label="Dirección" icon="mdi:home-map-marker">
                {resumen?.direccion}
              </Item>
              <Item label="Referencia" icon="mdi:map-marker-distance">
                {resumen?.referencia}
              </Item>
              <Item label="Monto a recaudar" icon="mdi:cash">
                {new Intl.NumberFormat('es-PE', {
                  style: 'currency',
                  currency: 'PEN',
                }).format(resumen?.monto || 0)}
              </Item>
              <Item label="Fecha de entrega" icon="mdi:calendar-blank-outline">
                {resumen?.fechaProg
                  ? new Date(resumen.fechaProg).toLocaleDateString('es-PE')
                  : '—'}
              </Item>
            </div>

            {/* Acciones rápidas */}
            <div className="mt-3 flex items-center justify-center gap-4">
              <AccionCircular icon="mdi:phone" label="Llamar" href={telHref} />
              <AccionCircular
                icon="mdi:whatsapp"
                label="WhatsApp"
                href={waHref}
              />
              <AccionCircular
                icon="mdi:content-copy"
                label="Copiar dirección"
                onClick={() => {
                  if (!resumen?.direccion) return;
                  navigator.clipboard
                    .writeText(resumen.direccion)
                    .catch(() => {});
                }}
              />
            </div>
          </div>

          {/* Productos */}
          <div className="border rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-xs text-gray-500">Productos</div>
                <div className="text-sm font-semibold text-gray-900">
                  {productos.length} ítem
                  {productos.length === 1 ? '' : 's'}
                </div>
              </div>
            </div>

            {productos.length === 0 ? (
              <div className="text-xs text-gray-500 py-2">
                Este pedido no tiene productos asociados.
              </div>
            ) : (
              <div className="mt-1 border rounded-lg divide-y bg-gray-50/60">
                {productos.map((it, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between px-3 py-2 gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {it.nombre}
                      </div>
                      {it.descripcion && (
                        <div className="text-xs text-gray-500 line-clamp-2">
                          {it.descripcion}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-gray-500">Cant.</span>
                      <span className="text-sm font-semibold text-gray-800">
                        {String(it.cantidad).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ====== Subcomponentes UI reutilizables (copiados del otro modal) ====== */

function Item({
  label,
  icon,
  children,
}: {
  label: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon icon={icon} className="mt-0.5 text-base text-gray-500" />
      <div className="min-w-0">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-gray-800 truncate">{children}</div>
      </div>
    </div>
  );
}

function AccionCircular({
  icon,
  label,
  href,
  onClick,
}: {
  icon: string;
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const Comp = (
    <div className="w-11 h-11 rounded-full bg-emerald-500/90 text-white flex items-center justify-center shadow">
      <Icon icon={icon} className="text-[20px]" />
    </div>
  );
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex flex-col items-center gap-1"
    >
      {Comp}
      <span className="text-[11px] text-gray-600">{label}</span>
    </a>
  ) : (
    <button onClick={onClick} className="flex flex-col items-center gap-1">
      {Comp}
      <span className="text-[11px] text-gray-600">{label}</span>
    </button>
  );
}
