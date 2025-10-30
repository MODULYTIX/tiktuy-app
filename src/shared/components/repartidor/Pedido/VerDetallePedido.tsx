import { Icon } from '@iconify/react';
import type { PedidoListItem } from '@/services/repartidor/pedidos/pedidos.types';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  pedido: PedidoListItem | null;
};

const estadoColor: Record<string, string> = {
  Proceso: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
  Validado: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200',
  Entregado: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200',
  Observado: 'bg-rose-100 text-rose-800 ring-1 ring-rose-200',
  Cancelado: 'bg-gray-200 text-gray-700 ring-1 ring-gray-300',
  default: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
};

function money(n?: number | string) {
  if (n === undefined || n === null || n === '') return 'S/. 0.00';
  const v = typeof n === 'string' ? Number(n) : n;
  return `S/. ${v.toFixed(2)}`;
}
function phone(raw?: string) {
  if (!raw) return '—';
  const d = raw.replace(/\D/g, '');
  const num = d.startsWith('51') ? d.slice(2) : d;
  const pretty = num.length ? num.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1 $2 $3').trim() : '';
  return `+51 ${pretty}`.trim();
}
function fdate(iso?: string | Date) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(+d) ? '—' : d.toLocaleDateString('es-PE');
}

export default function ModalPedidoDetalle({ isOpen, onClose, pedido }: Props) {
  if (!isOpen || !pedido) return null;

  const badgeCls =
    estadoColor[pedido.estado_nombre as keyof typeof estadoColor] ?? estadoColor.default;

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full sm:w-[560px] bg-white shadow-2xl overflow-y-auto rounded-l-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <Icon icon="mdi:cart-outline" className="text-primary" width={26} height={26} />
              <h2 className="text-2xl font-extrabold tracking-wide text-primary">
                DETALLE DEL PEDIDO
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <span className="text-gray-600">Estado:</span>
                <span className={`px-3 py-1 rounded-full text-[13px] font-semibold ${badgeCls}`}>
                  {pedido.estado_nombre ?? '—'}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                aria-label="Cerrar"
                title="Cerrar"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 flex flex-col gap-6">
          {/* ====== SECCIÓN CLIENTE (2 columnas, sin componentes locales) ====== */}
          <section>
            {/* Título centrado + nombre */}
            <div className="flex flex-col items-center gap-1 mb-3">
              <div className="text-sm text-gray-600">Cliente</div>
              <div className="text-lg font-bold text-gray-900 text-center">
                {pedido.cliente?.nombre ?? '—'}
              </div>
            </div>

            {/* 2 columnas responsivas */}
            <div className="flex flex-col md:flex-row md:items-start md:gap-8">
              {/* Columna izquierda */}
              <div className="flex-1 flex flex-col gap-4">
                {/* Código */}
                <div className="flex items-start gap-2">
                  <Icon icon="mdi:barcode" className="text-primary mt-0.5" width={18} height={18} />
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600 mb-1">Código</span>
                    <span className="text-[15px] text-gray-900">{pedido.codigo_pedido ?? '—'}</span>
                  </div>
                </div>

                {/* Distrito */}
                <div className="flex items-start gap-2">
                  <Icon icon="mdi:map-marker-outline" className="text-primary mt-0.5" width={18} height={18} />
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600 mb-1">Distrito</span>
                    <span className="text-[15px] text-gray-900">{pedido.cliente?.distrito ?? '—'}</span>
                  </div>
                </div>

                {/* Dirección */}
                <div className="flex items-start gap-2">
                  <Icon icon="mdi:home-map-marker" className="text-primary mt-0.5" width={18} height={18} />
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600 mb-1">Dirección</span>
                    <span className="text-[15px] text-gray-900">{pedido.direccion_envio ?? '—'}</span>
                  </div>
                </div>

                {/* Referencia */}
                <div className="flex items-start gap-2">
                  <Icon icon="mdi:card-bulleted-outline" className="text-primary mt-0.5" width={18} height={18} />
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600 mb-1">Referencia</span>
                    <span className="text-[15px] text-gray-900">
                      {pedido.cliente?.referencia ?? '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Columna derecha */}
              <div className="flex-1 flex flex-col gap-4 mt-6 md:mt-0">
                {/* Teléfono */}
                <div className="flex items-start gap-2">
                  <Icon icon="mdi:phone" className="text-primary mt-0.5" width={18} height={18} />
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600 mb-1">&nbsp;</span>
                    <span className="text-[15px] text-gray-900 whitespace-nowrap">
                      {phone(pedido.cliente?.celular)}
                    </span>
                  </div>
                </div>

                {/* Ecommerce */}
                <div className="flex items-start gap-2">
                  <Icon icon="mdi:storefront-outline" className="text-primary mt-0.5" width={18} height={18} />
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600 mb-1">&nbsp;</span>
                    <span className="text-[15px] text-gray-900">
                      {pedido.ecommerce?.nombre_comercial ?? '—'}
                    </span>
                  </div>
                </div>

                {/* Monto */}
                <div className="flex items-start gap-2">
                  <Icon icon="mdi:tag-outline" className="text-primary mt-0.5" width={18} height={18} />
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600 mb-1">&nbsp;</span>
                    <span className="text-[15px] text-gray-900">{money(pedido.monto_recaudar)}</span>
                  </div>
                </div>

                {/* Fecha */}
                <div className="flex items-start gap-2">
                  <Icon icon="mdi:calendar-month-outline" className="text-primary mt-0.5" width={18} height={18} />
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600 mb-1">&nbsp;</span>
                    <span className="text-[15px] text-gray-900">
                      {fdate((pedido as any)?.fecha ?? (pedido as any)?.fecha_registro)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* ====== FIN SECCIÓN CLIENTE ====== */}

          {/* ====== TABLA (NO TOCAR) ====== */}
          <section className="bg-white rounded-md overflow-hidden shadow-default">
            <div className="overflow-x-auto bg-white">
              <table className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30 rounded-t-md">
                <colgroup>
                  <col className="w-[88%]" />
                  <col className="w-[12%]" />
                </colgroup>

                <thead className="bg-[#E5E7EB]">
                  <tr className="text-gray70 font-roboto font-medium">
                    <th className="px-4 py-3 text-left">Producto</th>
                    <th className="px-4 py-3 text-right">Cant.</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray20">
                  {pedido.items?.map((it, idx) => (
                    <tr key={idx} className="hover:bg-gray10 transition-colors">
                      <td className="px-4 py-3 text-gray70">
                        <div className="font-semibold text-[13px] text-gray-900">{it.nombre}</div>
                        <div className="text-gray-500 text-[12px]">{it.descripcion ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray70 font-[600]">
                        {String(it.cantidad ?? 0).padStart(2, '0')}
                      </td>
                    </tr>
                  ))}

                  {(!pedido.items || pedido.items.length === 0) && (
                    <tr>
                      <td className="px-4 py-6 text-center text-gray70 italic" colSpan={2}>
                        Sin productos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
          {/* ================================= */}
        </div>
      </div>
    </div>
  );
}
