import { useState } from 'react';
import type { CourierAsociado } from '@/services/ecommerce/ecommerceCourier.types';
import { Icon } from '@iconify/react';

export type ModalMode = 'view' | 'associate' | 'desassociate';

type ModalProps = {
  open: boolean;
  mode: ModalMode;
  token: string;
  entry: CourierAsociado;
  onClose: () => void;
  onAssociated: () => void;
  onDesassociated: () => void;
  crearRelacionCourier: (body: { courier_id: number }, token: string) => Promise<unknown>;
  asociarCourier: (relacionId: number, token: string) => Promise<unknown>;
  desasociarCourier: (relacionId: number, token: string) => Promise<unknown>;
};

export function ModalAsociarseCourier({
  open,
  mode,
  token,
  entry,
  onClose,
  onAssociated,
  onDesassociated,
  crearRelacionCourier,
  asociarCourier,
  desasociarCourier,
}: ModalProps) {
  const [confirmo, setConfirmo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  if (!open) return null;

  const asociado = entry.estado_asociacion === 'activo';
  const isView = mode === 'view';
  const isAssociate = mode === 'associate';
  const isDesassociate = mode === 'desassociate';

  const handleAsociar = async () => {
    if (!token) return;
    setSubmitting(true);
    setErrMsg('');
    try {
      if (!entry.id_relacion) {
        await crearRelacionCourier({ courier_id: entry.id }, token);
      } else {
        await asociarCourier(entry.id_relacion, token);
      }
      onAssociated();
    } catch {
      setErrMsg('Error al asociar courier');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDesasociar = async () => {
    if (!token || !entry.id_relacion) return;
    setSubmitting(true);
    setErrMsg('');
    try {
      await desasociarCourier(entry.id_relacion, token);
      onDesassociated();
    } catch {
      setErrMsg('Error al desasociar courier');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/30"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-[420px] max-w-[92vw] bg-white rounded-2xl shadow-xl p-6 animate-[slide-in-right_0.25s_ease]">
        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-yellow-400 grid place-items-center text-white text-xl font-extrabold" aria-hidden>
            {entry.nombre_comercial?.[0]?.toUpperCase() ?? 'C'}
          </div>
          <h2 id="modal-title" className="text-xl font-extrabold tracking-wide text-gray-900">
            {entry.nombre_comercial?.toUpperCase()}
          </h2>

          <div className="text-sm text-gray-700 space-y-1">
            <div><span className="font-semibold">Ciudad:</span> {entry.ciudad || '-'}</div>
            <div><span className="font-semibold">Teléfono:</span> {entry.telefono || '-'}</div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Estado actual:</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                asociado ? 'bg-black text-white' : 'bg-gray-200 text-gray-800'
              }`}>
                {entry.estado_asociacion || 'No Asociado'}
              </span>
            </div>
          </div>
        </div>

        {/* Beneficios */}
        <div className="mt-5">
          <p className="font-semibold mb-2">Beneficios:</p>
          <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
            <li>Almacenamiento de tu stock.</li>
            <li>Entrega y cobro para el día siguiente.</li>
            <li>Estado de entrega en tiempo real.</li>
          </ul>
        </div>

        {/* Mensajes / confirmaciones */}
        {isAssociate && (
          <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={confirmo}
              onChange={(e) => setConfirmo(e.target.checked)}
              aria-checked={confirmo}
            />
            Confirmo que quiero asociarme con este courier
          </label>
        )}

        {isDesassociate && (
          <div className="mt-4 text-sm text-gray-700">
            ¿Seguro que deseas <span className="font-semibold text-red-600">desasociarte</span> de este courier?
          </div>
        )}

        {errMsg && (
          <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {errMsg}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm"
            disabled={submitting}
            type="button"
          >
            Cerrar
          </button>

          {isAssociate && (
            <button
              onClick={handleAsociar}
              disabled={!confirmo || submitting}
              className={`px-4 py-2 rounded-lg text-white text-sm inline-flex items-center gap-2 ${
                !confirmo || submitting
                  ? 'bg-green-400/60 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              type="button"
            >
              {submitting && <Icon icon="mdi:reload" className="animate-spin" />}
              {submitting ? 'Asociando…' : 'Asociarme'}
            </button>
          )}

          {isDesassociate && (
            <button
              onClick={handleDesasociar}
              disabled={submitting || !entry.id_relacion}
              className="px-4 py-2 rounded-lg text-white text-sm bg-red-600 hover:bg-red-700 disabled:opacity-70 inline-flex items-center gap-2"
              type="button"
            >
              {submitting && <Icon icon="mdi:reload" className="animate-spin" />}
              {submitting ? 'Procesando…' : 'Desasociar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
