import { useEffect, useMemo, useState } from 'react';
import {
  HiClock,
  HiX,
} from 'react-icons/hi';
import { useAuth } from '@/auth/context';
import type {
  AlmacenRef,
  EstadoRef,
  MovimientoDetalle,
  MovimientoItem,
} from '@/services/ecommerce/movimiento/movimiento.types';
import { fetchMovimientoDetalle } from '@/services/ecommerce/movimiento/movimiento.api';
import { Icon } from '@iconify/react/dist/iconify.js';

import truckLoop  from "@/assets/video/delivery-truck.mp4"
import AlmacenDesde from "@/assets/images/almacen_desde.webp"
import AlmacenHacia from "@/assets/images/almacen_hacia.webp"

/** ---------------- Props: soporta uuid (fetch interno) o data directa ---------------- */
type BaseProps = { open: boolean; onClose: () => void };
type PropsWithUuid = BaseProps & { uuid: string; data?: undefined };
type PropsWithData = BaseProps & {
  data: MovimientoDetalle | null;
  uuid?: undefined;
};
type Props = PropsWithUuid | PropsWithData;

/** ---------------- Helpers ---------------- */
const toText = (v: unknown) => (v == null ? '' : String(v));

const nombreAlmacen = (ref?: AlmacenRef | number | string | null) =>
  !ref && ref !== 0
    ? ''
    : typeof ref === 'object'
    ? toText(ref?.nombre_almacen ?? (ref as any)?.id)
    : toText(ref);

const nombreEstado = (ref?: EstadoRef | string | null) =>
  !ref
    ? ''
    : typeof ref === 'object'
    ? toText(ref?.nombre ?? (ref as any)?.id)
    : toText(ref);

const fechaLegible = (iso?: string, sep: string = ' - ') => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy}${sep}${hh}:${min}`;
};

function estadoBadgeClasses(estado: string) {
  const e = estado.toLowerCase();
  if (e.includes('valida'))
    return 'bg-green-100 text-green-700 ring-1 ring-green-200';
  if (e.includes('observ'))
    return 'bg-amber-100 text-amber-700 ring-1 ring-amber-200';
  if (e.includes('rechaz') || e.includes('anula'))
    return 'bg-red-100 text-red-700 ring-1 ring-red-200';
  return 'bg-gray-100 text-gray-700 ring-1 ring-gray-200';
}

/** ---------------- Modal ---------------- */
export default function VerMovimientoRealizadoModal(props: Props) {
  const { open, onClose } = props;
  const { token } = useAuth();

  // Estado interno cuando trabajamos con uuid
  const [detail, setDetail] = useState<MovimientoDetalle | null>(null);
  const [loading, setLoading] = useState(false);

  // Resolver la fuente del detalle (data directa o la que obtengamos por fetch)
  const resolved = useMemo<MovimientoDetalle | null>(() => {
    if ('data' in props) return props.data ?? null;
    return detail;
  }, [props, detail]);

  // Fetch cuando nos pasan uuid
  useEffect(() => {
    if (!open) return;
    if ('uuid' in props && props.uuid) {
      if (!token) return;
      setLoading(true);
      setDetail(null);
      fetchMovimientoDetalle(token, props.uuid)
        .then((d) => setDetail(d))
        .catch((e) => {
          console.error('Error al obtener movimiento:', e);
          setDetail(null);
        })
        .finally(() => setLoading(false));
    } else {
      // modo data directa
      setDetail(null);
      setLoading(false);
    }
  }, [open, token, 'uuid' in props ? props.uuid : undefined]);

  if (!open) return null;

  const data = resolved;
  if (!data) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative z-10 flex min-h-full items-center justify-center p-4">
          <div className="w-full max-w-[1200px] bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-start justify-between px-6 pt-5 pb-2 ">
              <div className="flex items-center gap-2">
                <Icon
                  icon="icon-park:cycle-movement"
                  width="24"
                  height="24"
                  className="text-primary"
                />
                <h2 className="text-2xl font-bold tracking-tight text-primary">
                  DETALLES DEL MOVIMIENTO
                </h2>
              </div>
              <button
                aria-label="Cerrar"
                onClick={onClose}
                className="p-2 rounded hover:bg-gray-100">
                <HiX className="h-5 w-5" />
              </button>
            </div>
            <div className="p-8 text-center text-slate-500">
              {loading ? 'Cargando…' : 'Sin datos'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const codigo = toText(data.codigo ?? data.id ?? '');
  const estado = nombreEstado(data.estado);
  const fechaGeneracion = fechaLegible(
    data.meta?.fecha_generacion ?? data.fecha
  );
  const fechaValidacion = fechaLegible(
    data.meta?.fecha_validacion ?? data.fecha
  );

  // días transcurridos si hay ambas fechas
  let diasTranscurridos: string | null = null;
  try {
    const g = data.meta?.fecha_generacion
      ? new Date(data.meta.fecha_generacion)
      : null;
    const v = data.meta?.fecha_validacion
      ? new Date(data.meta.fecha_validacion)
      : null;
    if (g && v && !isNaN(g.getTime()) && !isNaN(v.getTime())) {
      const diff = Math.max(
        0,
        Math.round((v.getTime() - g.getTime()) / (1000 * 60 * 60 * 24))
      );
      diasTranscurridos = diff.toString().padStart(2, '0');
    }
  } catch {
    diasTranscurridos = null;
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Contenido CENTRADO */}
      <div className="relative z-10 flex max-h-full items-center justify-center p-4">
        <div className="w-full max-w-[1180px] bg-white rounded-2xl shadow-xl overflow-hidden max-h-[92vh]">
          {/* Header con título + botón cerrar */}
          <div className="flex items-start justify-between px-6 pt-5">
            <div className="flex items-center gap-2">
              <Icon
                icon="icon-park:cycle-movement"
                width="24"
                height="24"
                className="text-primary"
              />
              <h2 className="text-2xl font-bold tracking-tight text-primary">
                DETALLES DEL MOVIMIENTO
              </h2>
            </div>
            <button
              aria-label="Cerrar"
              onClick={onClose}
              className="p-2 rounded hover:bg-gray-100">
              <HiX className="h-5 w-5" />
            </button>
          </div>

          {/* Subheader: Código (izq) + Estado (der) */}
          <div className="flex items-center justify-between px-6">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 font-semibold">Código :</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {codigo}
              </span>
              <button
                type="button"
                className="ml-1 p-1 rounded hover:bg-slate-100 text-slate-400"
                onClick={() => navigator.clipboard?.writeText(codigo)}
                title="Copiar código">
                <Icon icon="uiw:copy" width="12" height="12" />
              </button>
            </div>

            {!!estado && (
              <div
                className={`text-sm px-3 py-1  ${estadoBadgeClasses(
                  estado
                )}`}>
                Estado : <span className="font-semibold ml-1">{estado}</span>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="overflow-y-auto px-6  space-y-4">
            {/* Descripción */}
            <div>
              <div className="text-slate-800 font-semibold">Descripción</div>
              <p className="text-slate-600 mt-1">
                {toText(
                  data.descripcion ??
                    'Movimiento hecho para reabastecer el stock en el almacén destino.'
                )}
              </p>
            </div>

            {/* GRID principal 5/7 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Izquierda: Tarjeta Desde/Hacia */}
              <div className="lg:col-span-5">
                <div className="border rounded-sm bg-white border-gray-400">
                  <div className="p-5">
                    <div className="grid grid-cols-2 gap-4">
                      {/* DESDE */}
                      <div className="text-center">
                        <div className="text-slate-500 font-semibold mb-2">
                          Desde
                        </div>
                        <div className="mx-auto w-28 h-28 ">
                          <img src={AlmacenDesde} alt="Almacen desde" className='object-contain' />
                        </div>                        <div className="mt-2 text-lg font-semibold text-slate-800">
                          {nombreAlmacen(data.almacen_origen) ||
                            'Almacén Origen'}
                        </div>
                        <div className="mt-3 inline-flex items-center gap-2 rounded-sm bg-sky-50 px-3 py-1">
                          <span className="text-sky-700 text-xs font-semibold">
                            Fecha de Generación
                          </span>
                        </div>
                        <div className="mt-2 text-slate-600 text-sm">
                          {fechaGeneracion}
                        </div>
                      </div>

                      {/* HACIA */}
                      <div className="text-center">
                        <div className="text-slate-500 font-semibold mb-2">
                          Hacia
                        </div>
                        <div className="mx-auto w-28 h-28 ">
                          <img src={AlmacenHacia} alt="Almacen hacia" className='object-contain' />
                        </div>
                        <div className="mt-2 text-lg font-semibold text-slate-800">
                          {nombreAlmacen(data.almacen_destino) ||
                            'Almacén Destino'}
                        </div>
                        <div className="mt-3 inline-flex items-center gap-2 rounded-sm bg-amber-50 px-3 py-1">
                          <span className="text-amber-700 text-xs font-semibold">
                            Fecha de Validación
                          </span>
                        </div>
                        <div className="mt-2 text-slate-600 text-sm">
                          {fechaValidacion}
                        </div>
                      </div>
                    </div>

                    {/* Línea con camión y tiempo transcurrido */}
                    {/* Línea con animación y tiempo transcurrido */}
                    <div className="relative my-5">
                      <div className="h-0.5 bg-slate-300 mx-4" />

                      {/* Contenido centrado sobre la línea */}
                      <div className="absolute inset-x-0 -top-20 flex flex-col items-center justify-center gap-4">
                        {/* Animación arriba (mp4 o gif) */}
                        <video
                          src={truckLoop}
                          className="w-12 h-12 rounded-md"
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="auto"
                        />
                        {/* Si prefieres GIF, cambia por: */}
                        {/* <img src={truckLoop} className="w-12 h-12 rounded-md" alt="Animación" /> */}

                        {/* Texto y tiempo (tus estilos originales) */}
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-slate-500">
                            Tiempo transcurrido
                          </div>
                          {diasTranscurridos && (
                            <div className="flex items-center gap-1 text-xs text-slate-700">
                              <HiClock className="w-4 h-4" />
                              {diasTranscurridos} día
                              {diasTranscurridos === '01' ? '' : 's'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tarjeta inferior vacía */}
                <div className="mt-6 mb-2 border rounded-sm bg-white border-gray-400">
                  <div className="p-10 text-center text-slate-400">
                    <p>Sin datos que mostrar, no hay</p>
                    <p>descripción ni archivo adjuntado.</p>
                  </div>
                </div>
              </div>

              {/* Derecha: Tabla de detalle */}
              <div className="lg:col-span-7">
                <div className="border rounded-sm overflow-hidden bg-white border-gray-400">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="p-3 text-left font-semibold">Código</th>
                        <th className="p-3 text-left font-semibold">
                          Producto
                        </th>
                        <th className="p-3 text-left font-semibold">
                          Descripción
                        </th>
                        <th className="p-3 text-right font-semibold">
                          Cantidad
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.items ?? []).length > 0 ? (
                        (data.items as MovimientoItem[]).map((it, idx) => (
                          <tr
                            key={`${it.producto_uuid ?? it.producto_id ?? idx}`}
                            className="border-t">
                            <td className="p-3">
                              {toText(it.codigo_identificacion ?? '')}
                            </td>
                            <td className="p-3">
                              {toText(it.nombre_producto ?? '')}
                            </td>
                            <td className="p-3 text-slate-600">
                              {toText(it.descripcion ?? '')}
                            </td>
                            <td className="p-3 text-right">
                              {Number(it.cantidad ?? 0)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            className="p-6 text-center text-slate-500 italic"
                            colSpan={4}>
                            Sin ítems en este movimiento.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
