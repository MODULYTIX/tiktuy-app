import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/auth/context';
import { useNotification } from '@/shared/context/notificacionesDeskop/useNotification';
import { validarMovimiento } from '@/services/ecommerce/almacenamiento/almacenamiento.api';
import type { MovimientoAlmacen } from '@/services/ecommerce/almacenamiento/almacenamiento.types';
import Tittlex from '@/shared/common/Tittlex';
import Buttonx from '@/shared/common/Buttonx';
import { InputxTextarea } from '@/shared/common/Inputx';

type Props = {
  open: boolean;
  onClose: () => void;
  movimiento: MovimientoAlmacen | null; // ya viene con productos incluidos desde la tabla
  onValidated?: (movimientoActualizado: MovimientoAlmacen) => void;
};

export default function ValidarMovimientoModal({
  open,
  onClose,
  movimiento,
  onValidated,
}: Props) {
  const { token } = useAuth();
  const { notify } = useNotification();

  const enProceso = useMemo(() => {
    const n = (movimiento?.estado?.nombre || '').toLowerCase();
    return n === 'proceso' || n === 'en proceso' || n === 'activo';
  }, [movimiento]);

  // cantidades validadas (por defecto: solicitadas)
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [observaciones, setObservaciones] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null); // UI only
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !movimiento) return;
    const init: Record<number, number> = {};
    movimiento.productos.forEach((it) => {
      // cantidad solicitada por default
      init[it.producto.id] = it.cantidad ?? 0;
      // si ya tienes cantidad_validada (auditoría), úsala:
      if (typeof it.cantidad_validada === 'number') {
        init[it.producto.id] = Math.max(0, Math.min(it.cantidad, it.cantidad_validada));
      }
    });
    setCantidades(init);
    setObservaciones('');
    setArchivo(null);
  }, [open, movimiento]);

  const handleCantidadChange = (productoId: number, value: number, max: number) => {
    const n = Number.isFinite(value) ? Math.trunc(value) : 0;
    const safe = Math.max(0, Math.min(n, max));
    setCantidades((prev) => ({ ...prev, [productoId]: safe }));
  };

  if (!open || !movimiento) return null;

  const closeByBackdrop = () => {
    // cerrar al clickear fuera
    onClose();
  };

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const puedeValidar = enProceso && !!token;

  const handleValidar = async () => {
    if (!puedeValidar) return;

    const items = movimiento.productos.map((it) => ({
      producto_id: it.producto.id,
      cantidad_validada:
        typeof cantidades[it.producto.id] === 'number'
          ? cantidades[it.producto.id]
          : it.cantidad,
    }));

    setLoading(true);
    try {
      const actualizado = await validarMovimiento(movimiento.uuid, token!, {
        items,
        observaciones: observaciones?.trim() || undefined,
      });
      notify(
        actualizado?.estado?.nombre?.toLowerCase() === 'validado'
          ? 'Movimiento validado.'
          : 'Movimiento observado.',
        'success'
      );

      // (Opcional) Manejar archivo: aún no hay backend; se omite.
      // TODO: subir evidencia si se implementa endpoint

      onValidated?.(actualizado);
    } catch (err) {
      console.error(err);
      notify('No se pudo validar el movimiento.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const headerEstado =
    (movimiento.estado?.nombre || '').charAt(0).toUpperCase() +
    (movimiento.estado?.nombre || '').slice(1);

  // Fix TS2322: Tittlex.description debe ser string, no un elemento
  const descriptionText = `Código: ${movimiento.uuid.slice(0, 12).toUpperCase()} • Estado: ${headerEstado || '-'}`;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={closeByBackdrop}>
      {/* Panel derecho */}
      <div
        className="h-screen w-[760px] bg-white shadow-xl flex flex-col gap-5 px-5 py-5"
        onClick={stop}
      >
        <Tittlex
          variant="modal"
          icon="solar:check-square-linear"
          title="VALIDAR MOVIMIENTO"
          description={descriptionText}
        />

        {/* (Opcional) Chip visual del estado, manteniendo el string en el título */}
        <div className="text-sm">
          <span className="text-gray-500 mr-1">Estado:</span>
          <span
            className={
              enProceso ? 'text-yellow-700' : headerEstado === 'Validado' ? 'text-black' : 'text-red-700'
            }
          >
            {headerEstado || '-'}
          </span>
        </div>

        {/* Descripción */}
        <div className="text-sm text-gray-800">
          <p className="font-medium mb-1">Descripción</p>
          <p className="text-gray-700">{movimiento.descripcion || '-'}</p>
        </div>

        {/* Tabla de items */}
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full table-fixed text-sm border-separate border-spacing-0">
            <colgroup>
              <col className="w-[20%]" /> {/* Código */}
              <col className="w-[20%]" /> {/* Producto */}
              <col className="w-[40%]" /> {/* Descripción */}
              <col className="w-[20%]" /> {/* Cantidad */}
            </colgroup>
            <thead className="bg-gray-100 text-gray-700">
              <tr className="h-12">
                <th className="px-4 text-left font-medium">Código</th>
                <th className="px-4 text-left font-medium">Producto</th>
                <th className="px-4 text-left font-medium">Descripción</th>
                <th className="px-4 text-right font-medium">Cantidad</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {movimiento.productos.map((det) => {
                const max = det.cantidad ?? 0;
                const val = cantidades[det.producto.id] ?? max;
                return (
                  <tr key={det.id} className="border-t last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                      {det.producto?.id ? det.producto.id : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                      {det.producto?.nombre_producto || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div className="line-clamp-2 leading-5 break-words">
                        {/* si tu backend trae descripcion del producto */}
                        {det.producto ? (det.producto as any).descripcion ?? '-' : '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="ml-auto flex w-full justify-end items-center gap-2">
                        <input
                          type="number"
                          inputMode="numeric"
                          step={1}
                          min={0}
                          max={max}
                          value={val}
                          onChange={(e) =>
                            handleCantidadChange(det.producto.id, Number(e.target.value), max)
                          }
                          disabled={!enProceso}
                          className="w-[64px] h-9 rounded-lg border border-gray-300 px-2 text-center text-sm shadow-sm
                                     focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:bg-gray-100"
                        />
                        <span className="text-sm text-gray-600 whitespace-nowrap">/ {max}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Observaciones (fix TS2741: label obligatorio en InputxTextarea) */}
        <div>
          <InputxTextarea
            label="Observaciones"
            name="observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ejem. Algunos productos vinieron con pequeños golpes."
            autoResize
            minRows={3}
            maxRows={6}
            disabled={!enProceso}
          />
        </div>

        {/* Adjuntar evidencia (UI) */}
        <div>
          <p className="text-sm font-medium text-gray-800 mb-2">Adjuntar evidencia</p>
          <div className="border border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {archivo ? (
                <span className="font-medium">{archivo.name}</span>
              ) : (
                <>Seleccione un archivo, arrástrelo o suéltelo. <span className="text-gray-400">JPG, PNG o PDF</span></>
              )}
            </div>
            <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-md text-sm cursor-pointer hover:bg-gray-50">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                className="hidden"
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                disabled={!enProceso}
              />
              <span>Seleccionar archivo</span>
            </label>
          </div>
          {/* Nota: aún no se sube; pendiente endpoint. */}
        </div>

        {/* Botones */}
        <div className="mt-auto flex items-center gap-4">
          <Buttonx
            variant="quartery"
            onClick={handleValidar}
            disabled={!puedeValidar || loading}
            label={loading ? 'Validando...' : 'Validar'}
            icon={loading ? 'line-md:loading-twotone-loop' : undefined}
            className={`px-4 text-sm ${loading ? '[&_svg]:animate-spin' : ''}`}
          />
          <Buttonx
            variant="outlinedw"
            onClick={onClose}
            label="Cancelar"
            className="px-4 text-sm border"
            disabled={loading}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
