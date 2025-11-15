import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { HiX } from 'react-icons/hi';
import { useAuth } from '@/auth/context';
import { useNotification } from '@/shared/context/notificacionesDeskop/useNotification';
import {
  fetchCourierMovimientoDetalle,
  validarCourierMovimiento,
} from '@/services/courier/movimiento/movimientoCourier.api';
import type { CourierMovimientoDetalle } from '@/services/courier/movimiento/movimientoCourier.type';

const detalleCache = new Map<string, CourierMovimientoDetalle>();

type Props = {
  open: boolean;
  uuid: string;
  onClose: () => void;
  onValidated?: () => void;
};

const estadoChip = (estado?: string) => {
  const name = (estado || '').toLowerCase();
  if (name.includes('validado'))
    return <span className="rounded px-2 py-0.5 text-xs bg-green-100 text-green-700">Validado</span>;
  if (name.includes('observado'))
    return <span className="rounded px-2 py-0.5 text-xs bg-red-100 text-red-600">Observado</span>;
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
  const [observaciones, setObservaciones] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [cantidades, setCantidades] = useState<Record<number, number>>({});

  const canValidate = useMemo(
    () =>
      (detalle?.estado?.nombre || '').toLowerCase().includes('proceso') ||
      (detalle?.estado?.nombre || '').toLowerCase() === 'activo',
    [detalle?.estado?.nombre]
  );

  // Cargar detalle
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

        // Inicializar cantidades
        const init: Record<number, number> = {};
        data.productos.forEach((p) => {
          init[p.producto.id] = p.cantidad ?? 0;
        });
        setCantidades(init);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Error al cargar el movimiento');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, uuid, token]);

  const handleCantidadChange = (productoId: number, value: number, max: number) => {
    const n = Number.isFinite(value) ? Math.trunc(value) : 0;
    const safe = Math.max(0, Math.min(n, max));
    setCantidades((prev) => ({ ...prev, [productoId]: safe }));
  };


  const handleValidate = async () => {
    if (!token || !detalle) return;
    try {
      setLoading(true);

      // Construir items con cantidades validadas


      // Verificar si se modificó alguna cantidad
      const editoAlgo = detalle.productos.some(
        (it) => cantidades[it.producto.id] !== it.cantidad
      );
      const obs = observaciones.trim() || undefined;

      // Enviar a backend
      await validarCourierMovimiento(uuid, token, {
        
        observaciones: obs,
        evidencia: file || undefined,
      });

      if (editoAlgo || obs) {
        notify('Movimiento observado. No se actualizó stock.', 'error');
      } else {
        notify('Movimiento validado correctamente. Stock actualizado.', 'success');
      }

      onValidated?.();
      onClose();
    } catch (e: any) {
      notify(e?.message || 'Error al validar el movimiento', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const codigo =
    (detalle?.uuid || '').slice(0, 10).toUpperCase() ||
    (detalle as any)?.codigo ||
    '—';

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-[980px] h-full bg-white shadow-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b">
          <div className="flex items-start justify-between px-6 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <Icon icon="icon-park-outline:cycle-movement" width="24" height="24" className="text-primary" />
              <h2 className="text-2xl font-extrabold tracking-tight text-primary">
                VALIDAR MOVIMIENTO
              </h2>
            </div>
            <button aria-label="Cerrar" onClick={onClose} className="p-2 rounded hover:bg-gray-100">
              <HiX className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center justify-between px-6 pb-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 font-semibold">Código :</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">{codigo}</span>
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
            <p className="text-slate-600 mt-1">
              {detalle?.descripcion || 'Movimiento para reabastecer stock en destino.'}
            </p>
          </div>

          {/* Tabla editable */}
          <div className="mt-4 border rounded-md overflow-hidden">
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
                {detalle?.productos?.map((dp) => {
                  const max = dp.cantidad ?? 0;
                  const val = cantidades[dp.producto.id] ?? max;

                  return (
                    <tr key={dp.id} className="border-t">
                      <td className="p-3">{dp.producto?.codigo_identificacion}</td>
                      <td className="p-3">{dp.producto?.nombre_producto}</td>
                      <td className="p-3 text-slate-600">{dp.producto?.descripcion || '—'}</td>
                      <td className="p-3">
                        <div className="flex justify-end items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={max}
                            step={1}
                            disabled={!canValidate}
                            value={val}
                            onChange={(e) =>
                              handleCantidadChange(dp.producto.id, Number(e.target.value), max)
                            }
                            className="w-[72px] h-8 border rounded px-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-100"
                          />
                          <span className="text-xs text-gray-500">/ {max}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
              placeholder="Ejem. Algunos productos llegaron con pequeñas diferencias."
              className={`w-full border rounded-md px-3 py-2 text-sm resize-none mt-2 ${
                canValidate ? 'bg-white' : 'bg-gray-50 cursor-not-allowed'
              }`}
            />
          </div>

          {/* Evidencia */}
          <div className="mt-5">
            <label className="block text-sm font-semibold text-gray-800">Adjuntar evidencia</label>
            <div className="mt-2 flex items-center justify-between gap-3 border-2 border-dashed rounded-md px-4 py-4">
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
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={!canValidate}
                />
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={!canValidate}
                  className={`px-3 py-2 text-sm rounded border ${
                    canValidate
                      ? 'hover:bg-gray-100'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Seleccione archivo
                </button>
                {file && (
                  <span className="text-xs text-gray-600 truncate max-w-[200px]">{file.name}</span>
                )}
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
              {loading ? 'Validando…' : 'Validar'}
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
