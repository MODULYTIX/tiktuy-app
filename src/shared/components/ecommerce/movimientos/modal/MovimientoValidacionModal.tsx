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
  movimiento: MovimientoAlmacen | null;
  onValidated?: (mov: MovimientoAlmacen) => void;
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

  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [observaciones, setObservaciones] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !movimiento) return;
    const init: Record<number, number> = {};

    movimiento.productos.forEach((it) => {
      init[it.producto.id] = it.cantidad ?? 0;
      if (typeof it.cantidad_validada === 'number') {
        init[it.producto.id] = Math.max(
          0,
          Math.min(it.cantidad, it.cantidad_validada)
        );
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

  const closeByBackdrop = () => onClose();
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const puedeValidar = enProceso && !!token;

  // ⭐ ENVÍO FINAL: soporta archivo + JSON correctamente
  const handleValidar = async () => {
    if (!puedeValidar) return;

    const items = movimiento.productos.map((it) => ({
      producto_id: it.producto.id,
      cantidad_validada:
        typeof cantidades[it.producto.id] === 'number'
          ? cantidades[it.producto.id]
          : it.cantidad,
    }));

    const formData = new FormData();
    formData.append("items", JSON.stringify(items));
    formData.append("observaciones", observaciones?.trim() || "");

    if (archivo) {
      formData.append("evidencia", archivo); // 🔥 CAMBIO CORRECTO → el backend espera “evidencia”
    }

    setLoading(true);
    try {
      const actualizado = await validarMovimiento(
        movimiento.uuid,
        token!,
        formData
      );

      notify(
        actualizado?.estado?.nombre?.toLowerCase() === 'validado'
          ? 'Movimiento validado.'
          : 'Movimiento observado.',
        'success'
      );

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

  const descriptionText = `Código: ${movimiento.uuid
    .slice(0, 12)
    .toUpperCase()} • Estado: ${headerEstado || '-'}`;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/30"
      onClick={closeByBackdrop}
    >
      {/* Panel */}
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

        <div className="text-sm">
          <span className="text-gray-500 mr-1">Estado:</span>
          <span
            className={
              enProceso
                ? 'text-yellow-700'
                : headerEstado === 'Validado'
                ? 'text-black'
                : 'text-red-700'
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

        {/* Tabla */}
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full table-fixed text-sm border-separate border-spacing-0">
            <colgroup>
              <col className="w-[20%]" />
              <col className="w-[20%]" />
              <col className="w-[40%]" />
              <col className="w-[20%]" />
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
                  <tr
                    key={det.id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                      {det.producto?.codigo_identificacion ?? '-'}
                    </td>

                    <td className="px-4 py-3 text-gray-900">
                      <div className="max-w-[180px] truncate cursor-pointer">
                        {det.producto?.nombre_producto || '-'}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      <div className="max-w-[260px] truncate cursor-pointer">
                        {(det.producto as any)?.descripcion || '-'}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <input
                          type="number"
                          inputMode="numeric"
                          step={1}
                          min={0}
                          max={max}
                          value={val}
                          onChange={(e) =>
                            handleCantidadChange(
                              det.producto.id,
                              Number(e.target.value),
                              max
                            )
                          }
                          disabled={!enProceso}
                          className="w-[64px] h-9 rounded-lg border px-2 text-center text-sm shadow-sm"
                        />
                        <span className="text-sm text-gray-600">
                          / {max}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Observaciones */}
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

        {/* Evidencia */}
        <div>
          <p className="text-sm font-medium text-gray-800 mb-2">
            Adjuntar evidencia
          </p>

          <div className="border border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {archivo ? (
                <span className="font-medium">{archivo.name}</span>
              ) : (
                <>
                  Seleccione un archivo (JPG, PNG o PDF)
                </>
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
