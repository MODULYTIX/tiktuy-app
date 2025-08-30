import { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import type { PedidoListItem } from '@/services/repartidor/pedidos/pedidos.types';

type ResultadoContacto =
  | 'RECEPCION_HOY'
  | 'NO_RESPONDE'
  | 'REPROGRAMADO'
  | 'ANULO';

type ConfirmPayload = {
  pedidoId: number;
  resultado: ResultadoContacto;
  /** Solo cuando resultado = REPROGRAMADO */
  fecha_nueva?: string;
  observacion?: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  pedido: PedidoListItem | null;
  onConfirm?: (data: ConfirmPayload) => Promise<void> | void;
};

type Paso = 'seleccion' | 'reprogramar';

export default function ModalRepartidorMotorizado({
  isOpen,
  onClose,
  pedido,
  onConfirm,
}: Props) {
  const [seleccion, setSeleccion] = useState<ResultadoContacto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paso, setPaso] = useState<Paso>('seleccion');

  // campos para REPROGRAMADO
  const [fechaNueva, setFechaNueva] = useState<string>('');
  const [observacion, setObservacion] = useState<string>('');

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

    return {
      fechaProg,
      monto,
      distrito,
      telefono,
      codigo,
      direccion,
      cliente,
      ecommerce,
    };
  }, [pedido]);

  if (!isOpen || !pedido) return null;

  function resetEstadoInterno() {
    setSeleccion(null);
    setPaso('seleccion');
    setFechaNueva('');
    setObservacion('');
  }

  async function handleConfirm() {
    if (!seleccion || !pedido) return;

    // Si es reprogramado y estamos en el paso de formulario
    if (seleccion === 'REPROGRAMADO' && paso === 'reprogramar') {
      if (!fechaNueva) return;
      try {
        setSubmitting(true);
        await onConfirm?.({
          pedidoId: pedido.id,
          resultado: 'REPROGRAMADO',
          fecha_nueva: fechaNueva,
          observacion: observacion?.trim() || undefined,
        });
        onClose();
      } finally {
        setSubmitting(false);
        resetEstadoInterno();
      }
      return;
    }

    // Cualquier otro resultado
    try {
      setSubmitting(true);
      await onConfirm?.({
        pedidoId: pedido.id,
        resultado: seleccion,
      });
      onClose();
    } finally {
      setSubmitting(false);
      resetEstadoInterno();
    }
  }

  function handleContinuar() {
    if (seleccion === 'REPROGRAMADO') {
      setPaso('reprogramar');
    }
  }

  // helpers de acción rápida
  const telHref =
    resumen?.telefono && resumen.telefono !== '—'
      ? `tel:${resumen.telefono}`
      : undefined;

  const waHref =
    resumen?.telefono && resumen.telefono !== '—'
      ? `https://wa.me/${resumen.telefono.replace(/\D/g, '')}`
      : undefined;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[420px] bg-white rounded-t-2xl sm:rounded-none sm:rounded-l-2xl shadow-lg overflow-hidden">
        {/* header */}
        <div className="px-4 pt-4 pb-2 border-b">
          <div className="flex items-center gap-2 text-emerald-700">
            <Icon icon="mdi:check-decagram-outline" className="text-xl" />
            <h2 className="text-base font-semibold">
              Validar contacto con el cliente
            </h2>
          </div>
          <p className="text-xs text-gray-500 -mt-0.5">
            Validación de información para la entrega
          </p>
        </div>

        {/* contenido */}
        <div className="p-4 space-y-3 overflow-y-auto max-h-[75vh] sm:max-h-full">
          {/* resumen */}
          <div className="border rounded-xl p-3">
            <div className="text-xs text-gray-500">Cliente</div>
            <div className="font-medium">{resumen?.cliente}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-3 text-sm">
              <Item label="Código" icon="mdi:identifier">{resumen?.codigo}</Item>
              <Item label="Teléfono" icon="mdi:phone">{resumen?.telefono}</Item>
              <Item label="Distrito" icon="mdi:map-marker-outline">{resumen?.distrito}</Item>
              <Item label="Ecommerce" icon="mdi:store-outline">{resumen?.ecommerce}</Item>
              <Item label="Dirección" icon="mdi:home-map-marker">{resumen?.direccion}</Item>
              <Item label="Monto" icon="mdi:cash">
                {new Intl.NumberFormat('es-PE', {
                  style: 'currency',
                  currency: 'PEN',
                }).format(resumen?.monto || 0)}
              </Item>
              <Item label="Fecha" icon="mdi:calendar-blank-outline">
                {resumen?.fechaProg
                  ? new Date(resumen.fechaProg).toLocaleDateString('es-PE')
                  : '—'}
              </Item>
            </div>
            <div className="mt-3 flex items-center justify-center gap-4">
              <AccionCircular icon="mdi:phone" label="Llamar" href={telHref} />
              <AccionCircular icon="mdi:whatsapp" label="WhatsApp" href={waHref} />
              <AccionCircular icon="mdi:hard-hat" label="Otros" onClick={() => {}} />
            </div>
          </div>

          {/* pasos */}
          {paso === 'seleccion' ? (
            <div>
              <h3 className="text-sm font-semibold text-gray-800">
                ¿Cuál fue el resultado del contacto?
              </h3>
              <p className="text-xs text-gray-500">Elige una de estas opciones</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <OpcionCard
                  active={seleccion === 'RECEPCION_HOY'}
                  icon="mdi:check-circle-outline"
                  title="Recepcionará entrega hoy"
                  onClick={() => setSeleccion('RECEPCION_HOY')}
                />
                <OpcionCard
                  active={seleccion === 'NO_RESPONDE'}
                  icon="mdi:phone-off-outline"
                  title="No responde o número equivocado"
                  onClick={() => setSeleccion('NO_RESPONDE')}
                />
                <OpcionCard
                  active={seleccion === 'REPROGRAMADO'}
                  icon="mdi:calendar-clock"
                  title="Reprogramado"
                  onClick={() => setSeleccion('REPROGRAMADO')}
                />
                <OpcionCard
                  active={seleccion === 'ANULO'}
                  icon="mdi:close-circle-outline"
                  title="No hizo el pedido o anuló"
                  onClick={() => setSeleccion('ANULO')}
                />
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-semibold text-indigo-900">
                Reprogramar fecha de entrega
              </h3>
              <p className="text-xs text-gray-500">
                Elige una fecha y agrega una descripción
              </p>
              <div className="mt-3 space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-600">Fecha Entrega</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={fechaNueva}
                      onChange={(e) => setFechaNueva(e.target.value)}
                    />
                    <Icon icon="mdi:calendar" className="text-xl text-gray-400" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-600">Observación</label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 text-sm min-h-[84px] resize-y"
                    placeholder="Escribe aquí"
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        {paso === 'seleccion' ? (
          <div className="px-4 py-3 border-t flex items-center gap-3">
            <button
              className="flex-1 border rounded-lg py-2 text-gray-700"
              onClick={() => {
                onClose();
                resetEstadoInterno();
              }}
              disabled={submitting}>
              Cancelar
            </button>
            {seleccion === 'REPROGRAMADO' ? (
              <button
                className="flex-1 rounded-lg py-2 bg-primary text-white disabled:opacity-50"
                onClick={handleContinuar}
                disabled={submitting || !seleccion}>
                Continuar →
              </button>
            ) : (
              <button
                className="flex-1 rounded-lg py-2 bg-primary text-white disabled:opacity-50"
                onClick={handleConfirm}
                disabled={!seleccion || submitting}>
                {submitting ? 'Guardando...' : 'Confirmar'}
              </button>
            )}
          </div>
        ) : (
          <div className="px-4 py-3 border-t grid grid-cols-3 gap-3">
            <button
              className="border rounded-lg py-2 text-gray-700"
              onClick={() => setPaso('seleccion')}
              disabled={submitting}>
              ← Volver
            </button>
            <button
              className="border rounded-lg py-2 text-gray-700"
              onClick={() => {
                onClose();
                resetEstadoInterno();
              }}
              disabled={submitting}>
              Cancelar
            </button>
            <button
              className="rounded-lg py-2 bg-primary text-white disabled:opacity-50"
              onClick={handleConfirm}
              disabled={submitting || !fechaNueva}>
              {submitting ? 'Guardando...' : 'Confirmar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

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
    <div className="w-12 h-12 rounded-full bg-emerald-500/90 text-white flex items-center justify-center shadow">
      <Icon icon={icon} className="text-2xl" />
    </div>
  );
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex flex-col items-center gap-1">
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

function OpcionCard({
  active,
  icon,
  title,
  onClick,
}: {
  active: boolean;
  icon: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full border rounded-xl p-3 text-left flex items-center gap-3 ${
        active ? 'border-emerald-500 bg-emerald-50' : 'hover:bg-gray-50'
      }`}>
      <Icon icon={icon} className="text-2xl text-emerald-600" />
      <div className="text-sm">{title}</div>
      {active && (
        <Icon icon="mdi:check" className="ml-auto text-xl text-emerald-600" />
      )}
    </button>
  );
}
