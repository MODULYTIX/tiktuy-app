import { Icon } from '@iconify/react';
import type { PedidoListItem } from '@/services/repartidor/pedidos/pedidos.types';
import { useCallback, useMemo, useRef, useState } from 'react';

type ResultadoFinal = 'ENTREGADO' | 'RECHAZADO';
type MetodoPagoUI = 'EFECTIVO' | 'BILLETERA' | 'DIRECTO_ECOMMERCE';

type ConfirmPayload =
  | { pedidoId: number; resultado: 'RECHAZADO'; observacion?: string }
  | {
      pedidoId: number;
      resultado: 'ENTREGADO';
      metodo: MetodoPagoUI;
      observacion?: string;
      evidenciaFile?: File;
      fecha_entrega_real?: string;
    };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  pedido: PedidoListItem | null;
  onConfirm?: (data: ConfirmPayload) => Promise<void> | void;
};

type Paso = 'resultado' | 'pago' | 'evidencia' | 'rechazo';

export default function ModalEntregaRepartidor({
  isOpen,
  onClose,
  pedido,
  onConfirm,
}: Props) {
  // --- Hooks (orden estable) ---
  const [paso, setPaso] = useState<Paso>('resultado');
  const [submitting, setSubmitting] = useState(false);

  const [resultado, setResultado] = useState<ResultadoFinal | null>(null);
  const [metodo, setMetodo] = useState<MetodoPagoUI | null>(null);

  // evidencia
  const [evidenciaFile, setEvidenciaFile] = useState<File | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // solo para descargar/ver
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // compat (no usados para EFECTIVO)
  const [, setObservacion] = useState<string>('');
  const [, setFechaEntregaReal] = useState<string>(() => {
    const d = new Date();
    d.setSeconds(0, 0);
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60_000);
    return local.toISOString().slice(0, 16);
  });

  // rechazo
  const [obsRechazo, setObsRechazo] = useState<string>('');

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

  const requiresEvidencia = (m: MetodoPagoUI | null): boolean =>
    m === 'BILLETERA' || m === 'DIRECTO_ECOMMERCE';

  const handleMetodo = (m: MetodoPagoUI) => {
    setMetodo(m);
    if (requiresEvidencia(m)) setPaso('evidencia');
    else setPaso('pago');
  };

  const onFilePicked = useCallback(
    (file?: File) => {
      if (!file) {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setEvidenciaFile(undefined);
        return;
      }
      if (!file.type.startsWith('image/')) return;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setEvidenciaFile(file);
    },
    [previewUrl]
  );

  function reset() {
    setPaso('resultado');
    setResultado(null);
    setMetodo(null);
    setObservacion('');
    setObsRechazo('');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setEvidenciaFile(undefined);
    const d = new Date();
    d.setSeconds(0, 0);
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60_000);
    setFechaEntregaReal(local.toISOString().slice(0, 16));
  }

  function closeAll() {
    onClose();
    reset();
  }

  function handleNextFromResultado() {
    if (resultado === 'ENTREGADO') setPaso('pago');
    if (resultado === 'RECHAZADO') setPaso('rechazo');
  }

  async function handleConfirm() {
    if (!resultado || !pedido) return;

    const pid = pedido.id;
    try {
      setSubmitting(true);

      if (resultado === 'RECHAZADO') {
        const obs = obsRechazo.trim() || undefined;
        await onConfirm?.({ pedidoId: pid, resultado: 'RECHAZADO', observacion: obs });
        closeAll();
        return;
      }

      if (!metodo) return;
      if (requiresEvidencia(metodo) && !evidenciaFile) return;

      await onConfirm?.({
        pedidoId: pid,
        resultado: 'ENTREGADO',
        metodo,
        observacion: undefined,
        evidenciaFile,
        fecha_entrega_real: undefined,
      });
      closeAll();
    } finally {
      setSubmitting(false);
    }
  }

  // Guard después de hooks
  if (!isOpen || !pedido) return null;

  const telHref =
    resumen?.telefono && resumen.telefono !== '—' ? `tel:${resumen.telefono}` : undefined;
  const waHref =
    resumen?.telefono && resumen.telefono !== '—'
      ? `https://wa.me/${resumen.telefono.replace(/\D/g, '')}`
      : undefined;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={closeAll} />

      {/* Panel: layout en columna para header / contenido scroll / footer fijo */}
      <div className="absolute inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[460px] bg-white rounded-t-3xl sm:rounded-none sm:rounded-l-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] sm:h-full">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b bg-gray-50 shrink-0">
          <div className="flex items-center gap-2 text-emerald-700">
            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
              <Icon icon="mdi:check-decagram-outline" className="text-lg" />
            </div>
            <h2 className="text-[15px] font-semibold tracking-wide uppercase">
              Validar contacto con el cliente
            </h2>
          </div>
          <p className="text-xs text-gray-500">Validación de información para la entrega</p>
        </div>

        {/* Contenido (scrollable) */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 bg-white">
          {/* Resumen */}
          <section className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="text-[11px] text-gray-500">Cliente</div>
            <div className="font-medium text-gray-900">{resumen?.cliente}</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-3 text-sm">
              <Item label="Código" icon="mdi:identifier">{resumen?.codigo}</Item>
              <Item label="Teléfono" icon="mdi:phone">{resumen?.telefono}</Item>
              <Item label="Distrito" icon="mdi:map-marker-outline">{resumen?.distrito}</Item>
              <Item label="Ecommerce" icon="mdi:store-outline">{resumen?.ecommerce}</Item>
              <Item label="Dirección" icon="mdi:home-map-marker">{resumen?.direccion}</Item>
              <Item label="S/. Monto" icon="mdi:cash">
                {new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN'}).format(resumen?.monto||0)}
              </Item>
              <Item label="Fecha" icon="mdi:calendar-blank-outline">
                {resumen?.fechaProg ? new Date(resumen.fechaProg).toLocaleDateString('es-PE') : '—'}
              </Item>
            </div>

            {/* Acciones rápidas */}
            <div className="mt-4 flex items-center justify-center gap-5">
              <AccionCircular icon="mdi:phone" label="Llamar" href={telHref} />
              <AccionCircular icon="mdi:whatsapp" label="WhatsApp" href={waHref} />
              <AccionCircular icon="mdi:account-voice" label="Otros" onClick={() => {}} />
            </div>
          </section>

          {/* Paso: Resultado */}
          {paso === 'resultado' && (
            <section>
              <h3 className="text-sm font-semibold text-gray-900">¿Cuál fue el resultado final?</h3>
              <p className="text-xs text-gray-500">Elige una de estas opciones</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <OpcionCard
                  active={resultado === 'ENTREGADO'}
                  icon="mdi:check-circle-outline"
                  title="Entregado"
                  onClick={() => setResultado('ENTREGADO')}
                  activeColor="blue"
                  fill
                />
                <OpcionCard
                  active={resultado === 'RECHAZADO'}
                  icon="mdi:close-circle-outline"
                  title="Pedido rechazado"
                  onClick={() => setResultado('RECHAZADO')}
                  activeColor="red"
                  fill
                />
              </div>
            </section>
          )}

          {/* Paso: Forma de pago */}
          {paso === 'pago' && (
            <section>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Forma de pago</h3>
              <p className="text-xs text-gray-500">Elige una de estas opciones</p>

              <div className="grid grid-cols-1 gap-3 mt-3">
                <OpcionCard active={metodo === 'EFECTIVO'} icon="mdi:cash" title="Efectivo" onClick={() => handleMetodo('EFECTIVO')} activeColor="yellow" fill />
                <OpcionCard active={metodo === 'BILLETERA'} icon="mdi:qrcode-scan" title="Pago por Billetera Digital" onClick={() => handleMetodo('BILLETERA')} activeColor="lime" fill />
                <OpcionCard active={metodo === 'DIRECTO_ECOMMERCE'} icon="mdi:credit-card-outline" title="Pago directo al Ecommerce" onClick={() => handleMetodo('DIRECTO_ECOMMERCE')} activeColor="blue" fill />
              </div>
            </section>
          )}

          {/* Paso: Evidencias (sin dropzone ni preview grande) */}
          {paso === 'evidencia' && (
            <section>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Subir evidencias</h3>
              <p className="text-xs text-gray-500">Sube una evidencia para verificación del pago</p>

              {/* Solo botones */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onFilePicked(e.target.files?.[0])}
                  />
                  <div className="w-full border rounded-xl px-3 py-2 text-sm flex items-center gap-2 cursor-pointer shadow-sm hover:bg-gray-50">
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
                    ref={fileInputRef}
                    onChange={(e) => onFilePicked(e.target.files?.[0])}
                  />
                  <div className="w-full border rounded-xl px-3 py-2 text-sm flex items-center gap-2 cursor-pointer shadow-sm hover:bg-gray-50">
                    <Icon icon="mdi:camera-outline" className="text-xl" />
                    Tomar foto
                  </div>
                </label>
              </div>

              {/* Ficha del archivo (sin preview embebido) */}
              {evidenciaFile && (
                <div className="mt-3 flex items-center justify-between rounded-xl border bg-white px-3 py-2 shadow-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center">
                      <Icon icon="mdi:image-outline" className="text-lg text-gray-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-gray-900 truncate">{evidenciaFile.name || 'evidencia.jpg'}</div>
                      <div className="text-[11px] text-gray-500">{(evidenciaFile.size / 1024).toFixed(1)} KB</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Descargar */}
                    <button
                      type="button"
                      title="Descargar"
                      className="w-9 h-9 rounded-md bg-gray-900 text-white flex items-center justify-center hover:opacity-90"
                      onClick={() => {
                        if (!previewUrl) return;
                        const a = document.createElement('a');
                        a.href = previewUrl;
                        a.download = evidenciaFile.name || 'evidencia.jpg';
                        a.click();
                      }}
                    >
                      <Icon icon="mdi:download" className="text-base" />
                    </button>
                    {/* Ver en nueva pestaña */}
                    <button
                      type="button"
                      title="Ver"
                      className="w-9 h-9 rounded-md bg-gray-900 text-white flex items-center justify-center hover:opacity-90"
                      onClick={() => {
                        if (previewUrl) window.open(previewUrl, '_blank');
                      }}
                    >
                      <Icon icon="mdi:eye-outline" className="text-base" />
                    </button>
                    {/* Eliminar */}
                    <button
                      type="button"
                      title="Eliminar"
                      className="w-9 h-9 rounded-md bg-gray-900 text-white flex items-center justify-center hover:opacity-90"
                      onClick={() => onFilePicked(undefined)}
                    >
                      <Icon icon="mdi:trash-can-outline" className="text-base" />
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Paso: Rechazo */}
          {paso === 'rechazo' && (
            <section>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                ¿POR QUÉ EL PEDIDO FUE RECHAZADO?
              </h3>
              <p className="text-xs text-gray-500">Escribe la observación</p>

              <div className="mt-3">
                <label className="text-xs text-gray-600">Observación</label>
                <textarea
                  className="w-full border rounded-xl px-3 py-2 text-sm min-h-[110px] resize-y focus:outline-none focus:ring-2 focus:ring-red-300"
                  placeholder="Escribe aquí"
                  value={obsRechazo}
                  onChange={(e) => setObsRechazo(e.target.value)}
                />
              </div>
            </section>
          )}
        </div>

        {/* Footer fijo */}
        <div className="px-4 py-3 border-t bg-white flex items-center gap-3 shrink-0">
          {paso !== 'resultado' ? (
            <button
              className="border rounded-xl py-2 px-4 text-gray-700 hover:bg-gray-50"
              onClick={() => {
                if (paso === 'pago') setPaso('resultado');
                else if (paso === 'evidencia') setPaso('pago');
                else if (paso === 'rechazo') setPaso('resultado');
              }}
              disabled={submitting}
            >
              ← Volver
            </button>
          ) : (
            <button className="border rounded-xl py-2 px-4 text-gray-700 hover:bg-gray-50" onClick={closeAll} disabled={submitting}>
              Cancelar
            </button>
          )}

          {paso !== 'resultado' && (
            <button className="border rounded-xl py-2 px-4 text-gray-700 hover:bg-gray-50" onClick={closeAll} disabled={submitting}>
              Cancelar
            </button>
          )}

          {paso === 'resultado' && resultado && (
            <button
              className={`ml-auto rounded-xl py-2 px-4 text-white ${
                resultado === 'RECHAZADO' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
              } disabled:opacity-50`}
              onClick={handleNextFromResultado}
              disabled={!resultado || submitting}
            >
              Siguiente →
            </button>
          )}

          {paso === 'pago' && (
            <button
              className="ml-auto rounded-xl py-2 px-4 text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              onClick={() => {
                if (metodo === 'EFECTIVO') {
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
              className="ml-auto rounded-xl py-2 px-4 text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              onClick={handleConfirm}
              disabled={submitting || !evidenciaFile}
            >
              {submitting ? 'Guardando...' : 'Confirmar'}
            </button>
          )}

          {paso === 'rechazo' && (
            <button
              className="ml-auto rounded-xl py-2 px-4 text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              onClick={handleConfirm}
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : 'Confirmar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------- Subcomponentes ------- */

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
        <div className="text-[11px] text-gray-500">{label}</div>
        <div className="text-gray-900 truncate">{children}</div>
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
  const Circle = (
    <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
      <Icon icon={icon} className="text-2xl" />
    </div>
  );
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1">
      {Circle}
      <span className="text-[11px] text-gray-600">{label}</span>
    </a>
  ) : (
    <button onClick={onClick} className="flex flex-col items-center gap-1">
      {Circle}
      <span className="text-[11px] text-gray-600">{label}</span>
    </button>
  );
}

function OpcionCard({
  active,
  icon,
  title,
  onClick,
  activeColor = 'emerald',
  fill = false,
}: {
  active: boolean;
  icon: string;
  title: string;
  onClick: () => void;
  activeColor?: 'blue' | 'red' | 'emerald' | 'yellow' | 'lime';
  fill?: boolean;
}) {
  const palette = {
    blue: { ring: 'ring-blue-300', border: 'border-blue-500', bg: 'bg-blue-600', pale: 'bg-blue-50', text: 'text-blue-600' },
    red: { ring: 'ring-red-300', border: 'border-red-500', bg: 'bg-red-600', pale: 'bg-red-50', text: 'text-red-600' },
    emerald: { ring: 'ring-emerald-300', border: 'border-emerald-500', bg: 'bg-emerald-600', pale: 'bg-emerald-50', text: 'text-emerald-600' },
    yellow: { ring: 'ring-yellow-300', border: 'border-yellow-500', bg: 'bg-yellow-500', pale: 'bg-yellow-50', text: 'text-yellow-600' },
    lime: { ring: 'ring-lime-300', border: 'border-lime-500', bg: 'bg-lime-500', pale: 'bg-lime-50', text: 'text-lime-600' },
  }[activeColor];

  const activeFilled = `border ${palette.border} ${fill ? `${palette.bg} text-white` : `${palette.pale} ${palette.text}`} shadow-sm`;
  const inactive = 'border border-gray-200 hover:bg-gray-50 text-gray-800';

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl p-3 text-left flex items-center gap-3 transition focus:outline-none focus:ring-2 ${
        active ? `${palette.ring} ${activeFilled}` : `ring-gray-200 ${inactive}`
      }`}
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${active ? 'bg-white/20' : 'bg-gray-100'}`}>
        <Icon icon={icon} className={`text-xl ${active ? 'text-white' : 'text-gray-700'}`} />
      </div>
      <div className={`text-sm font-medium ${active ? 'opacity-95' : ''}`}>{title}</div>
      {active && <Icon icon="mdi:check" className="ml-auto text-xl text-white" />}
    </button>
  );
}
