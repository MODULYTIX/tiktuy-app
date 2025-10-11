import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/auth/context';
import {
  fetchCourierMovimientoDetalle,
  validarCourierMovimiento,
} from '@/services/courier/movimiento/movimientoCourier.api';
import type { CourierMovimientoDetalle } from '@/services/courier/movimiento/movimientoCourier.type';
import { FaTimes } from 'react-icons/fa';
import { useNotification } from '@/shared/context/notificacionesDeskop/useNotification';

interface Props {
  open: boolean;
  uuid: string;
  mode?: 'ver' | 'validar';
  onClose: () => void;
  onValidated?: () => void;
}

export default function MovimientoCourierModal({
  open,
  uuid,
  mode = 'ver',
  onClose,
  onValidated,
}: Props) {
  const { token } = useAuth();
  const { notify } = useNotification();

  const [loading, setLoading] = useState(false);
  const [mov, setMov] = useState<CourierMovimientoDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);

  // validación
  const [observaciones, setObservaciones] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const canValidate = mode === 'validar' && (mov?.estado.nombre || '').toLowerCase() === 'proceso';

  useEffect(() => {
    if (!open || !uuid || !token) return;
    let mounted = true;
    setLoading(true);
    setError(null);

    fetchCourierMovimientoDetalle(uuid, token)
      .then((data) => {
        if (!mounted) return;
        setMov(data);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e?.message || 'Error al cargar el detalle');
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [open, uuid, token]);

  if (!open) return null;

  const estadoChip = (estado?: string) => {
    const name = (estado || '').toLowerCase();
    if (name === 'validado') {
      return <span className="rounded px-2 py-0.5 text-xs bg-green-100 text-green-700">Validado</span>;
    }
    if (name === 'observado') {
      return <span className="rounded px-2 py-0.5 text-xs bg-red-100 text-red-600">Observado</span>;
    }
    return <span className="rounded px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700">Proceso</span>;
  };

  const fmtFecha = (iso: string) =>
    new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(iso));

  const handlePick = () => inputRef.current?.click();

  const handleValidate = async () => {
    if (!token || !mov) return;
    try {
      setLoading(true);
      await validarCourierMovimiento(uuid, token, {
        observaciones: observaciones.trim() || undefined,
        evidencia: file,
      });
      notify('Movimiento marcado como Observado.', 'success');
      onValidated?.();
      onClose();
    } catch (e: any) {
      notify(e?.message || 'Error al validar el movimiento', 'error');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      {/* Panel lateral (sheet) */}
      <div
        className="w-full max-w-3xl h-full bg-white shadow-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-indigo-700 font-extrabold tracking-wide">VALIDAR MOVIMIENTO</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>
                  <span className="text-gray-700 font-semibold">Código:</span>{' '}
                  {(mov?.uuid || '').slice(0, 8).toUpperCase() || '—'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-gray-700 font-semibold">Estado:</span> {estadoChip(mov?.estado?.nombre)}
                </span>
                {mov?.fecha_movimiento && (
                  <span>
                    <span className="text-gray-700 font-semibold">Fec. generación:</span> {fmtFecha(mov.fecha_movimiento)}
                  </span>
                )}
              </div>
            </div>

            <button
              className="inline-flex items-center justify-center rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              onClick={onClose}
              title="Cerrar"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-6">
          {loading && <p className="text-sm text-gray-500">Cargando…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Descripción */}
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-800">Descripción</h4>
            <p className="text-sm text-gray-600">
              {mov?.descripcion || '—'}
            </p>
          </section>

          {/* Tabla de productos */}
          <section className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="p-3 text-left">Código</th>
                  <th className="p-3 text-left">Producto</th>
                  <th className="p-3 text-left">Descripción</th>
                  <th className="p-3 text-right">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {mov?.productos.map((dp) => (
                  <tr key={dp.id} className="border-t">
                    <td className="p-3">{dp.producto.codigo_identificacion}</td>
                    <td className="p-3">{dp.producto.nombre_producto}</td>
                    <td className="p-3 text-gray-500">{dp.producto.descripcion || '—'}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        {/* Para ser fiel al diseño usamos input; en esta versión solo es de lectura */}
                        <input
                          type="number"
                          value={dp.cantidad}
                          readOnly
                          className="w-16 border rounded px-2 py-1 text-right bg-gray-50"
                        />
                        <span className="text-xs text-gray-400">/ {dp.producto.stock}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!mov || mov.productos.length === 0) && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-gray-400">
                      Sin productos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* Observaciones */}
          <section className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">Observaciones</label>
            <textarea
              rows={3}
              disabled={!canValidate}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ejem. Algunos productos vinieron con pequeños golpes."
              className={`w-full border rounded-lg px-3 py-2 text-sm resize-none ${
                canValidate ? 'bg-white' : 'bg-gray-50 cursor-not-allowed'
              }`}
            />
          </section>

          {/* Adjuntar evidencia */}
          <section className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">Adjuntar evidencia</label>
            <div
              className={`flex items-center justify-between gap-3 border-2 border-dashed rounded-lg px-4 py-4 ${
                canValidate ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="text-xs text-gray-500">
                Seleccione un archivo, arrástrelo o suéltelo. <span className="text-gray-400">JPG, PNG o PDF</span>
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
                    canValidate
                      ? 'hover:bg-gray-100'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Seleccione archivo
                </button>
                {file && (
                  <span className="text-xs text-gray-600 truncate max-w-[180px]">{file.name}</span>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky  bg-white px-6 py-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">
            Cancelar
          </button>
          {canValidate && (
            <button
              onClick={handleValidate}
              disabled={loading}
              className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800 disabled:opacity-60"
            >
              {loading ? 'Enviando…' : 'Validar'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
