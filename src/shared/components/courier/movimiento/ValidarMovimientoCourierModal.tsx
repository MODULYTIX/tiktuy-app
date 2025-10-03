// src/shared/components/courier/movimiento/ValidarMovimientoCourierModal.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react/dist/iconify.js';
import { HiX } from 'react-icons/hi';
import { useAuth } from '@/auth/context';
import { useNotification } from '@/shared/context/notificacionesDeskop/useNotification';
import {
  fetchCourierMovimientoDetalle,
  validarCourierMovimiento,
} from '@/services/courier/movimiento/movimientoCourier.api';
import type { CourierMovimientoDetalle } from '@/services/courier/movimiento/movimientoCourier.type';

/** Cache simple por uuid para abrir más rápido al reingresar */
const detalleCache = new Map<string, CourierMovimientoDetalle>();

type Props = {
  open: boolean;
  uuid: string;
  onClose: () => void;
  onValidated?: () => void;
};

const estadoChip = (estado?: string) => {
  const name = (estado || '').toLowerCase();
  if (name.includes('validado')) {
    return <span className="rounded px-2 py-0.5 text-xs bg-green-100 text-green-700">Validado</span>;
  }
  if (name.includes('observado')) {
    return <span className="rounded px-2 py-0.5 text-xs bg-red-100 text-red-600">Observado</span>;
  }
  return <span className="rounded px-2 py-0.5 text-xs bg-amber-100 text-amber-700">Proceso</span>;
};

const fmtFecha = (iso?: string) =>
  iso
    ? new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
        new Date(iso),
      )
    : '—';

export default function ValidarMovimientoCourierModal({
  open,
  uuid,
  onClose,
  onValidated,
}: Props) {
  const { token } = useAuth();
  const { notify } = useNotification();

  const [loading, setLoading] = useState(false);
  const [detalle, setDetalle] = useState<CourierMovimientoDetalle | null>(
    () => detalleCache.get(uuid) || null
  );
  const [, setError] = useState<string | null>(null);

  // validación
  const [observaciones, setObservaciones] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const canValidate = useMemo(
    () => (detalle?.estado?.nombre || '').toLowerCase().includes('proceso'),
    [detalle?.estado?.nombre]
  );

  useEffect(() => {
    if (!open || !uuid || !token) return;
    let mounted = true;

    (async () => {
      try {
        setError(null);
        if (!detalleCache.get(uuid)) setLoading(true);
        const data = await fetchCourierMovimientoDetalle(uuid, token);
        if (!mounted) return;
        detalleCache.set(uuid, data);
        setDetalle(data);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Error al cargar el movimiento');
      } finally {
        if (mounted) setLoading(false); // <- sin warning eslint
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, uuid, token]);

  if (!open) return null;

  const codigo =
    (detalle?.uuid || '').slice(0, 10).toUpperCase() ||
    (detalle as any)?.codigo ||
    '—';

  const handlePick = () => inputRef.current?.click();

  const handleValidate = async () => {
    if (!token || !detalle) return;
    try {
      setLoading(true);
      await validarCourierMovimiento(uuid, token, {
        observaciones: observaciones.trim() || undefined,
        evidencia: file || undefined,
      });
      notify('Movimiento marcado como Validado.', 'success');
      onValidated?.();
      onClose();
    } catch (e: any) {
      notify(e?.message || 'Error al validar el movimiento', 'error');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    // Cierre al click fuera del panel (backdrop)
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      {/* Panel lateral derecho (sheet). Evita que el click burbujee para no cerrar */}
      <div
        className="w-full max-w-[980px] h-full bg-white shadow-xl overflow-y-auto transform transition-transform duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b">
          <div className="flex items-start justify-between px-6 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <Icon icon="icon-park-outline:cycle-movement" width="24" height="24" className="text-primary" />
              <h2 className="text-2xl font-extrabold tracking-tight text-primary">VALIDAR MOVIMIENTO</h2>
            </div>
            <button aria-label="Cerrar" onClick={onClose} className="p-2 rounded hover:bg-gray-100">
              <HiX className="h-5 w-5" />
            </button>
          </div>

          {/* Subheader */}
          <div className="flex items-center justify-between px-6 pb-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 font-semibold">Código :</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">{codigo}</span>
              {codigo !== '—' && (
                <button
                  type="button"
                  className="ml-1 p-1 rounded hover:bg-slate-100 text-slate-400"
                  onClick={() => navigator.clipboard?.writeText(codigo)}
                  title="Copiar código"
                >
                  <Icon icon="uiw:copy" width="12" height="12" />
                </button>
              )}
            </div>
            <div className="text-sm flex items-center gap-2">
              <span className="text-slate-500 font-semibold">Estado :</span>
              {estadoChip(detalle?.estado?.nombre)}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-6">
          {/* Descripción */}
          <div className="mt-4">
            <div className="text-slate-800 font-semibold">Descripción</div>
            {loading && !detalle ? (
              <div className="mt-2 h-4 w-2/3 bg-gray-100 animate-pulse rounded" />
            ) : (
              <p className="text-slate-600 mt-1">
                {detalle?.descripcion || 'Movimiento hecho para reabastecer el stock en el almacén destino.'}
              </p>
            )}
          </div>

          {/* Tabla */}
          <div className="mt-4 border rounded-sm overflow-hidden bg-white border-gray-300">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="p-3 text-left font-semibold">Código</th>
                  <th className="p-3 text-left font-semibold">Producto</th>
                  <th className="p-3 text-left font-semibold">Descripción</th>
                  <th className="p-3 text-right font-semibold">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {loading && !detalle && (
                  <>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <tr key={`sk-${i}`} className="border-t">
                        <td className="p-3"><div className="h-3 w-24 bg-gray-100 animate-pulse rounded" /></td>
                        <td className="p-3"><div className="h-3 w-28 bg-gray-100 animate-pulse rounded" /></td>
                        <td className="p-3"><div className="h-3 w-40 bg-gray-100 animate-pulse rounded" /></td>
                        <td className="p-3"><div className="ml-auto h-8 w-28 bg-gray-100 animate-pulse rounded" /></td>
                      </tr>
                    ))}
                  </>
                )}

                {detalle?.productos?.map((dp) => {
                  const cod = dp.producto?.codigo_identificacion ?? '';
                  const nombre = dp.producto?.nombre_producto ?? '';
                  const desc = dp.producto?.descripcion ?? '';
                  const cant = Number(dp.cantidad ?? 0);
                  const stock = Number(dp.producto?.stock ?? cant);

                  return (
                    <tr key={dp.id} className="border-t">
                      <td className="p-3">{cod}</td>
                      <td className="p-3">{nombre}</td>
                      <td className="p-3 text-slate-600">{desc || '—'}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-2">
                          <div className="relative">
                            <input
                              type="number"
                              value={cant}
                              readOnly
                              className="w-16 h-8 border rounded px-2 text-right bg-white"
                            />
                            <span className="pointer-events-none absolute right-1 top-1.5 text-gray-400">
                              <Icon icon="mdi:chevron-down" width="16" height="16" />
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">/ {stock}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {detalle && detalle.productos?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-gray-400">Sin productos</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Observaciones */}
          <div className="mt-5">
            <label className="block text-sm font-semibold text-gray-800">Observaciones</label>
            <textarea
              rows={3}
              disabled={!canValidate}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ejem. Algunos productos vinieron con pequeños golpes."
              className={`w-full border rounded-md px-3 py-2 text-sm resize-none mt-2 ${
                canValidate ? 'bg-white' : 'bg-gray-50 cursor-not-allowed'
              }`}
            />
          </div>

          {/* Evidencia */}
          <div className="mt-5">
            <label className="block text-sm font-semibold text-gray-800">Adjuntar evidencia</label>
            <div
              className={`mt-2 flex items-center justify-between gap-3 border-2 border-dashed rounded-md px-4 py-4 ${
                canValidate ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-gray-100">
                  <Icon icon="mdi:tray-arrow-up" width="20" height="20" />
                </span>
                <div>
                  Seleccione un archivo, arrástrelo o suéltelo. <span className="text-gray-400">JPG, PNG o PDF</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  disabled={!canValidate}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={handlePick}
                  disabled={!canValidate}
                  className={`px-3 py-2 text-sm rounded border ${
                    canValidate ? 'hover:bg-gray-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Seleccione archivo
                </button>
                {file && <span className="text-xs text-gray-600 truncate max-w-[200px]">{file.name}</span>}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-6 pb-4 flex items-center gap-3">
            <button
              onClick={handleValidate}
              disabled={!canValidate || loading}
              className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800 disabled:opacity-60"
            >
              {loading ? 'Enviando…' : 'Validar'}
            </button>
            <button onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">
              Cancelar
            </button>
            <div className="ml-auto text-xs text-gray-400">
              {detalle?.fecha_movimiento && <>Fec. generación: {fmtFecha(detalle.fecha_movimiento)}</>}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
