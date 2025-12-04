import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { HiClock, HiX } from 'react-icons/hi';
import { Icon } from '@iconify/react/dist/iconify.js';
import { useAuth } from '@/auth/context';
import type {
  AlmacenRef,
  EstadoRef,
  MovimientoDetalle,
  MovimientoItem,
} from '@/services/ecommerce/movimiento/movimiento.types';
import { fetchMovimientoDetalle } from '@/services/ecommerce/movimiento/movimiento.api';

import truckLoop from '@/assets/video/delivery-truck.mp4';
import AlmacenDesde from '@/assets/images/almacen_desde.webp';
import AlmacenHacia from '@/assets/images/almacen_hacia.webp';

/** ---------------- Props: soporta uuid (fetch interno) o data directa ---------------- */
type BaseProps = { open: boolean; onClose: () => void };
type PropsWithUuid = BaseProps & { uuid: string; data?: undefined };
type PropsWithData = BaseProps & { data: MovimientoDetalle | null; uuid?: undefined };
type Props = PropsWithUuid | PropsWithData;

/** ---------------- Helpers ---------------- */
const toText = (v: unknown) => (v == null ? '' : String(v));

const nombreAlmacen = (ref?: AlmacenRef | number | string | null) =>
  !ref && ref !== 0
    ? ''
    : typeof ref === 'object'
      ? toText((ref as any)?.nombre_almacen ?? (ref as any)?.nombre ?? (ref as any)?.id)
      : toText(ref);

const nombreEstado = (ref?: EstadoRef | string | null) =>
  !ref ? '' : typeof ref === 'object' ? toText((ref as any)?.nombre ?? (ref as any)?.id) : toText(ref);

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

function estadoPillUI(estadoRaw: string) {
  const e = (estadoRaw || '').toLowerCase().trim();
  let label = estadoRaw || '—';
  let classes = 'bg-gray-100 text-gray-600';

  if (e.startsWith('vali')) {
    label = 'Validado';
    classes = 'bg-[#EAF8EF] text-[#139A43]';
  } else if (e.includes('proceso') || e.startsWith('proc')) {
    label = 'Proceso';
    classes = 'bg-[#FFF7D6] text-[#B98900]';
  } else if (e.startsWith('obser')) {
    label = 'Observado';
    classes = 'bg-[#FFE3E3] text-[#D64040]';
  }
  return { label, classes };
}

/** ---------------- Modal ---------------- */
export default function VerMovimientoRealizadoModal(props: Props) {
  const { open, onClose } = props;
  const { token } = useAuth();

  // Estado interno cuando trabajamos con uuid
  const [detail, setDetail] = useState<MovimientoDetalle | null>(null);
  const [loading, setLoading] = useState(false);

  // Resolver la fuente del detalle (data directa o la que obtengamos por fetch)
  const data = useMemo<MovimientoDetalle | null>(() => {
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

  // Placeholder sin datos
  if (!data) {
    return createPortal(
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative z-10 flex min-h-full items-center justify-center p-4">
          <div className="w-full max-w-[1500px] bg-white rounded-sm shadow-xl overflow-hidden">
            <div className="flex items-start justify-between px-6 pt-5 pb-2">
              <div className="flex items-center gap-2">
                <Icon icon="icon-park-outline:cycle-movement" width="24" height="24" className="text-primary" />
                <h2 className="text-2xl font-bold tracking-tight text-primary">DETALLES DEL MOVIMIENTO</h2>
              </div>
              <button aria-label="Cerrar" onClick={onClose} className="p-2 rounded hover:bg-gray-100">
                <HiX className="h-5 w-5" />
              </button>
            </div>
            <div className="p-8 text-center text-slate-500">{loading ? 'Cargando…' : 'Sin datos'}</div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  const codigo = toText(data.codigo ?? data.id ?? '');
  const estado = nombreEstado(data.estado);
  const fechaGeneracion = fechaLegible(
    data.meta?.fecha_generacion ?? data.fecha
  );
  const fecha_validacion = fechaLegible(
    data.meta?.fecha_validacion ?? data.fecha
  );

  // días transcurridos si hay ambas fechas
  let diasTranscurridos: string | null = null;
  try {
    const g = data.meta?.fecha_generacion ? new Date(data.meta.fecha_generacion) : null;
    const v = data.meta?.fecha_validacion ? new Date(data.meta.fecha_validacion) : null;
    if (g && v && !isNaN(g.getTime()) && !isNaN(v.getTime())) {
      const diff = Math.max(0, Math.round((v.getTime() - g.getTime()) / (1000 * 60 * 60 * 24)));
      diasTranscurridos = diff.toString().padStart(2, '0');
    }
  } catch {
    diasTranscurridos = null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Contenido CENTRADO tipo modal */}
      <div className="relative z-10 flex max-h-full items-center justify-center p-4">
        <div className="w-full max-w-[1500px] bg-white rounded-sm shadow-xl overflow-hidden max-h-[92vh] flex flex-col">

          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-5">
            <div className="flex items-center gap-2">
              <Icon icon="icon-park-outline:cycle-movement" width="24" height="24" className="text-primary" />
              <h2 className="text-2xl font-bold tracking-tight text-primary">DETALLES DEL MOVIMIENTO</h2>
            </div>
            <button aria-label="Cerrar" onClick={onClose} className="p-2 rounded hover:bg-gray-100">
              <HiX className="h-5 w-5" />
            </button>
          </div>

          {/* Subheader */}
          <div className="flex flex-wrap items-center justify-between px-6 pb-2 gap-3">
            {/* Código */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 font-semibold">Código :</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">{codigo || '—'}</span>

              {!!codigo && (
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

            {/* Estado */}
            {(() => {
              const { label, classes } = estadoPillUI(estado);
              return (
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 font-bold text-[12px] leading-none">Estado :</span>
                  <span className={[
                    'inline-flex items-center rounded-[16px] px-6 py-2',
                    'text-[12px] font-bold leading-none',
                    classes,
                  ].join(' ')}>
                    {label}
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Body con grid responsive */}
          <div className="overflow-y-auto px-6 pb-6 flex-1">
            <div className="text-slate-800 font-semibold">Descripción</div>
            <p className="text-slate-600 mt-1">
              {toText(
                data.descripcion ?? 'Movimiento hecho para reabastecer el stock en el almacén destino.'
              )}
            </p>

            {/* GRID 5/7 RESPONSIVE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">

              {/* IZQUIERDA */}
              <div className="lg:col-span-5">
                <div className="border rounded-sm bg-white border-gray-400">
                  <div className="px-8 py-6">

                    <div className="grid grid-cols-3 gap-10 place-items-center min-h-[300px]">

                      {/* DESDE */}
                      <div className="text-center">
                        <div className="text-slate-500 font-semibold mb-2">Desde</div>
                        <div className="mx-auto w-[100px] h-[100px]">
                          <img src={AlmacenDesde} className="object-contain w-full h-full" />
                        </div>
                        <div className="mt-2 text-[20px] font-semibold text-slate-800">
                          {nombreAlmacen((data as any)?.almacen_origen) || 'Almacén Origen'}
                        </div>

                        <div className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#E7F0FF] px-3 py-2">
                          <span className="text-[#2153A3] text-[12px] font-semibold">Fecha de Generación</span>
                        </div>

                        <div className="mt-3 text-slate-600 text-[14px]">{fechaGeneracion || '—'}</div>
                      </div>

                      {/* CAMIÓN */}
                      <div className="relative flex flex-col items-center mt-6 mx-4">
                        <video
                          src={truckLoop}
                          className="w-12 h-12 rounded-md"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                        <div className="text-xs text-slate-500 mt-2">Tiempo transcurrido</div>
                        <div className="flex items-center gap-1 text-xs text-slate-700 mt-1">
                          <HiClock className="w-4 h-4" />
                          {diasTranscurridos && `${diasTranscurridos} día${diasTranscurridos !== '1' ? 's' : ''}`}
                        </div>
                      </div>

                      {/* HACIA 1 */}
                      <div className="flex flex-col items-center">
                        <div className="text-slate-500 font-semibold mb-2">Hacia</div>
                        <div className="w-20 h-20">
                          <img src={AlmacenHacia} className="object-contain" />
                        </div>
                        <div className="mt-2 text-lg font-semibold text-slate-800">
                          {nombreAlmacen(data.almacen_destino) || 'Almacén Destino'}
                        </div>
                        <div className="mt-3 inline-flex items-center gap-2 rounded-sm bg-amber-50 px-3 py-1">
                          <span className="text-amber-700 text-xs font-semibold">Fecha de Validación</span>
                        </div>
                        <div className="mt-2 text-slate-600 text-sm">{fecha_validacion}</div>
                      </div>
                    </div>
                  </div>

                  {/* HACIA 2 (NO ELIMINO NADA) */}
                  <div className="text-center">
                    <div className="text-slate-500 font-semibold mb-2">Hacia</div>
                        <div className="mx-auto w-[100px] h-[100px]">
                      <img src={AlmacenHacia} className="object-contain w-full h-full" />
                    </div>
                    <div className="mt-2 text-[20px] font-semibold text-slate-800">
                      {nombreAlmacen((data as any)?.almacen_destino) || 'Almacén Destino'}
                    </div>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#FFF1BF] px-3 py-2">
                      <span className="text-[#B98900] text-[12px] font-semibold">Fecha de Validación</span>
                    </div>
                    <div className="mt-3 text-slate-600 text-[14px]">{fecha_validacion || '—'}</div>
                  </div>
                </div>

                {/* TARJETA INFERIOR */}
                <div className="mt-6 mb-4 border rounded-sm bg-white border-gray-400">
                  <div className="p-10 text-center text-slate-400">
                    <p>Sin datos que mostrar, no hay</p>
                    <p>descripción ni archivo adjuntado.</p>
                  </div>
                </div>
              </div>

              {/* DERECHA TABLA */}
              <div className="lg:col-span-7">
                <div className="h-full border rounded-sm overflow-hidden bg-white border-gray-400">
                  <table className="items-start w-full text-sm">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="p-3 text-left font-semibold"></th>
                        <th className="p-3 text-left font-semibold">Código</th>
                        <th className="p-3 text-left font-semibold">Producto</th>
                        <th className="p-3 text-left font-semibold">Descripción</th>
                        <th className="p-3 text-right font-semibold">Cantidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.items ?? []).length > 0 ? (
                        (data.items as MovimientoItem[]).map((it, idx) => (
                          <tr key={`${it.producto_uuid ?? it.producto_id ?? idx}`} className="border-t">
                            <td className="p-3">
                              <img src={it.imagen_url?? ''} className="w-12 h-12" />
                            </td>
                            <td className="p-3">{toText(it.codigo_identificacion ?? '')}</td>
                            <td className="p-3">{toText(it.nombre_producto ?? '')}</td>
                            <td className="p-3 text-slate-600">{toText(it.descripcion ?? '')}</td>
                            <td className="p-3 text-right">{Number(it.cantidad ?? 0)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="p-6 text-center text-slate-500 italic" colSpan={4}>
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
    </div>,
    document.body
  );
}
