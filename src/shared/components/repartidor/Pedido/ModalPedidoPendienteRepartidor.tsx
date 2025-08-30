import { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import type { PedidoListItem } from '@/services/repartidor/pedidos/pedidos.types';

type ResultadoFinal = 'ENTREGADO' | 'RECHAZADO';
type MetodoPagoUI = 'EFECTIVO' | 'BILLETERA' | 'DIRECTO_ECOMMERCE';

type ConfirmPayload =
  | {
      pedidoId: number;
      resultado: 'RECHAZADO';
      observacion?: string;
    }
  | {
      pedidoId: number;
      resultado: 'ENTREGADO';
      metodo: MetodoPagoUI;
      observacion?: string;
      evidenciaFile?: File;
    };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  pedido: PedidoListItem | null;
  onConfirm?: (data: ConfirmPayload) => Promise<void> | void;
};

type Paso = 'resultado' | 'pago' | 'evidencia';

export default function ModalEntregaRepartidor({
  isOpen,
  onClose,
  pedido,
  onConfirm,
}: Props) {
  const [paso, setPaso] = useState<Paso>('resultado');
  const [submitting, setSubmitting] = useState(false);

  // resultado final
  const [resultado, setResultado] = useState<ResultadoFinal | null>(null);

  // cuando ENTREGADO
  const [metodo, setMetodo] = useState<MetodoPagoUI | null>(null);
  const [observacion, setObservacion] = useState<string>('');
  const [evidenciaFile, setEvidenciaFile] = useState<File | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const resumen = useMemo(() => {
    if (!pedido) return null;
    const fechaProg = pedido.fecha_entrega_programada || pedido.fecha_entrega_real;
    const distrito = pedido.cliente?.distrito || '—';
    const telefono = pedido.cliente?.celular || '—';
    const codigo = pedido.codigo_pedido || `C${String(pedido.id).padStart(2, '0')}`;
    const direccion = pedido.direccion_envio || '—';
    const cliente = pedido.cliente?.nombre || '—';
    const ecommerce = pedido.ecommerce?.nombre_comercial || '—';
    const monto = Number(pedido.monto_recaudar || 0);

    return { fechaProg, distrito, telefono, codigo, direccion, cliente, ecommerce, monto };
  }, [pedido]);

  if (!isOpen || !pedido) return null;

  function reset() {
    setPaso('resultado');
    setResultado(null);
    setMetodo(null);
    setObservacion('');
    setEvidenciaFile(undefined);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }

  function closeAll() {
    onClose();
    reset();
  }

  function handleNextFromResultado() {
    if (resultado === 'ENTREGADO') {
      setPaso('pago');
    } else if (resultado === 'RECHAZADO') {
      // se queda en resultado, solo confirmar
    }
  }

  function requiresEvidencia(m: MetodoPagoUI | null): boolean {
    return m === 'BILLETERA' || m === 'DIRECTO_ECOMMERCE';
  }

  function handleMetodo(m: MetodoPagoUI) {
    setMetodo(m);
    if (requiresEvidencia(m)) setPaso('evidencia');
  }

  function onFilePicked(file?: File) {
    setEvidenciaFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  async function handleConfirm() {
    if (!resultado) return;
    // ✅ Guard adicional para TS: garantiza que pedido no es null dentro del closure
    if (!pedido) return;

    const pid = pedido.id;

    try {
      setSubmitting(true);

      if (resultado === 'RECHAZADO') {
        await onConfirm?.({
          pedidoId: pid,
          resultado: 'RECHAZADO',
          observacion: observacion?.trim() || undefined,
        });
        closeAll();
        return;
      }

      // ENTREGADO:
      if (!metodo) return;
      if (requiresEvidencia(metodo) && !evidenciaFile) return;

      await onConfirm?.({
        pedidoId: pid,
        resultado: 'ENTREGADO',
        metodo,
        observacion: observacion?.trim() || undefined,
        evidenciaFile,
      });
      closeAll();
    } finally {
      setSubmitting(false);
    }
  }

  // helpers acción rápida
  const telHref =
    resumen?.telefono && resumen.telefono !== '—' ? `tel:${resumen.telefono}` : undefined;
  const waHref =
    resumen?.telefono && resumen.telefono !== '—'
      ? `https://wa.me/${resumen.telefono.replace(/\D/g, '')}`
      : undefined;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={closeAll} />

      <div className="absolute inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[460px] bg-white rounded-t-2xl sm:rounded-none sm:rounded-l-2xl shadow-lg overflow-hidden">
        {/* header */}
        <div className="px-4 pt-4 pb-2 border-b">
          <div className="flex items-center gap-2 text-emerald-700">
            <Icon icon="mdi:check-decagram-outline" className="text-xl" />
            <h2 className="text-base font-semibold">Validar contacto con el cliente</h2>
          </div>
          <p className="text-xs text-gray-500 -mt-0.5">Validación de información para la entrega</p>
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
                {new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN'}).format(resumen?.monto||0)}
              </Item>
              <Item label="Fecha" icon="mdi:calendar-blank-outline">
                {resumen?.fechaProg ? new Date(resumen.fechaProg).toLocaleDateString('es-PE') : '—'}
              </Item>
            </div>

            {/* acciones rápidas */}
            <div className="mt-3 flex items-center justify-center gap-4">
              <AccionCircular icon="mdi:phone" label="Llamar" href={telHref} />
              <AccionCircular icon="mdi:whatsapp" label="WhatsApp" href={waHref} />
              <AccionCircular icon="mdi:hard-hat" label="Otros" onClick={() => {}} />
            </div>
          </div>

          {/* PASO: Resultado final */}
          {paso === 'resultado' && (
            <div>
              <h3 className="text-sm font-semibold text-indigo-900">
                ¿Cuál fue el resultado final de la entrega?
              </h3>
              <p className="text-xs text-gray-500">Elige una de estas opciones</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <OpcionCard
                  active={resultado === 'ENTREGADO'}
                  icon="mdi:check-circle-outline"
                  title="Entregado"
                  onClick={() => setResultado('ENTREGADO')}
                />
                <OpcionCard
                  active={resultado === 'RECHAZADO'}
                  icon="mdi:close-circle-outline"
                  title="Pedido rechazado"
                  onClick={() => setResultado('RECHAZADO')}
                />
              </div>

              {/* Observación opcional visible siempre */}
              <div className="mt-4">
                <label className="text-xs text-gray-600">Observación (opcional)</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm min-h-[84px] resize-y"
                  placeholder="Escribe aquí"
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* PASO: Forma de pago (solo ENTREGADO) */}
          {paso === 'pago' && (
            <div>
              <h3 className="text-sm font-semibold text-indigo-900">Forma de pago</h3>
              <p className="text-xs text-gray-500">Elige una de estas opciones</p>

              <div className="grid grid-cols-1 gap-3 mt-3">
                <OpcionCard
                  active={metodo === 'EFECTIVO'}
                  icon="mdi:cash"
                  title="Efectivo"
                  onClick={() => handleMetodo('EFECTIVO')}
                />
                <OpcionCard
                  active={metodo === 'BILLETERA'}
                  icon="mdi:qrcode-scan"
                  title="Pago por Billetera Digital"
                  onClick={() => handleMetodo('BILLETERA')}
                />
                <OpcionCard
                  active={metodo === 'DIRECTO_ECOMMERCE'}
                  icon="mdi:store-outline"
                  title="Pago directo al Ecommerce"
                  onClick={() => handleMetodo('DIRECTO_ECOMMERCE')}
                />
              </div>

              {/* Observación opcional para Efectivo */}
              {metodo === 'EFECTIVO' && (
                <div className="mt-4">
                  <label className="text-xs text-gray-600">Observación (opcional)</label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 text-sm min-h-[84px] resize-y"
                    placeholder="Escribe aquí"
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {/* PASO: Evidencias (Billetera o Directo Ecommerce) */}
          {paso === 'evidencia' && (
            <div>
              <h3 className="text-sm font-semibold text-indigo-900">Subir evidencias</h3>
              <p className="text-xs text-gray-500">Sube una evidencia para verificación del pago</p>

              <div className="mt-3 space-y-3">
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onFilePicked(e.target.files?.[0])}
                  />
                  <div className="w-full border rounded-lg px-3 py-2 text-sm flex items-center gap-2 cursor-pointer">
                    <Icon icon="mdi:upload" className="text-xl" />
                    Adjuntar imagen
                  </div>
                </label>

                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => onFilePicked(e.target.files?.[0])}
                  />
                  <div className="w-full border rounded-lg px-3 py-2 text-sm flex items-center gap-2 cursor-pointer">
                    <Icon icon="mdi:camera-outline" className="text-xl" />
                    Tomar foto
                  </div>
                </label>

                {previewUrl && (
                  <div className="mt-2">
                    <img
                      src={previewUrl}
                      alt="Evidencia"
                      className="w-full max-h-60 object-contain rounded border"
                    />
                  </div>
                )}

                <div className="mt-3">
                  <label className="text-xs text-gray-600">Observación (opcional)</label>
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
        <div className="px-4 py-3 border-t flex items-center gap-3">
          {/* botón volver según paso */}
          {paso !== 'resultado' ? (
            <button
              className="border rounded-lg py-2 px-4 text-gray-700"
              onClick={() => {
                if (paso === 'pago') setPaso('resultado');
                else if (paso === 'evidencia') setPaso('pago');
              }}
              disabled={submitting}
            >
              ← Volver
            </button>
          ) : (
            <button
              className="border rounded-lg py-2 px-4 text-gray-700"
              onClick={closeAll}
              disabled={submitting}
            >
              Cancelar
            </button>
          )}

          {/* botón secundario (Cancelar cuando no es resultado) */}
          {paso !== 'resultado' && (
            <button
              className="border rounded-lg py-2 px-4 text-gray-700"
              onClick={closeAll}
              disabled={submitting}
            >
              Cancelar
            </button>
          )}

          {/* Acción principal */}
          {paso === 'resultado' && resultado === 'ENTREGADO' && (
            <button
              className="ml-auto rounded-lg py-2 px-4 bg-primary text-white disabled:opacity-50"
              onClick={handleNextFromResultado}
              disabled={!resultado || submitting}
            >
              Siguiente →
            </button>
          )}

          {paso === 'resultado' && resultado === 'RECHAZADO' && (
            <button
              className="ml-auto rounded-lg py-2 px-4 bg-primary text-white disabled:opacity-50"
              onClick={handleConfirm}
              disabled={!resultado || submitting}
            >
              {submitting ? 'Guardando...' : 'Confirmar'}
            </button>
          )}

          {paso === 'pago' && (
            <button
              className="ml-auto rounded-lg py-2 px-4 bg-primary text-white disabled:opacity-50"
              onClick={() => {
                if (metodo === 'EFECTIVO') {
                  // no requiere evidencia → confirmamos
                  handleConfirm();
                } else if (metodo && requiresEvidencia(metodo)) {
                  setPaso('evidencia');
                }
              }}
              disabled={submitting || !metodo}
            >
              {metodo === 'EFECTIVO' ? (submitting ? 'Guardando...' : 'Confirmar') : 'Siguiente →'}
            </button>
          )}

          {paso === 'evidencia' && (
            <button
              className="ml-auto rounded-lg py-2 px-4 bg-primary text-white disabled:opacity-50"
              onClick={handleConfirm}
              disabled={submitting || !evidenciaFile}
            >
              {submitting ? 'Guardando...' : 'Confirmar'}
            </button>
          )}
        </div>
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
    <a href={href} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1">
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
      }`}
    >
      <Icon icon={icon} className="text-2xl text-emerald-600" />
      <div className="text-sm">{title}</div>
      {active && <Icon icon="mdi:check" className="ml-auto text-xl text-emerald-600" />}
    </button>
  );
}
