// src/shared/components/ecommerce/movimientos/VerMovimientoRealizadoModal.tsx
import { HiOutlineEye } from 'react-icons/hi';

type MovimientoItem = {
  producto_id?: number;
  producto_uuid?: string;
  codigo_identificacion?: string;
  nombre_producto?: string;
  descripcion?: string;
  cantidad?: number;
  stock_previo?: number;
  stock_posterior?: number;
};

type AlmacenRef = {
  id?: number | string;
  nombre_almacen?: string;
};

type UsuarioRef = {
  id?: number | string;
  nombre?: string;
  email?: string;
};

type EstadoRef = {
  id?: number | string;
  nombre?: string;
};

export type MovimientoRealizado = {
  id?: number | string;
  codigo?: string;
  fecha?: string; // ISO
  descripcion?: string;
  almacen_origen?: AlmacenRef | number | string | null;
  almacen_destino?: AlmacenRef | number | string | null;
  usuario?: UsuarioRef | number | string | null;
  estado?: EstadoRef | string | null;
  items?: MovimientoItem[];
  meta?: Record<string, unknown>;
};

type Props = {
  open: boolean;
  onClose: () => void;
  data: MovimientoRealizado | null;
};

export default function VerMovimientoRealizadoModal({ open, onClose, data }: Props) {
  if (!open || !data) return null;

  const nombreAlmacen = (ref?: AlmacenRef | number | string | null) => {
    if (!ref && ref !== 0) return '';
    if (typeof ref === 'object') return String(ref?.nombre_almacen ?? ref?.id ?? '');
    return String(ref);
  };


  const nombreEstado = (ref?: EstadoRef | string | null) => {
    if (!ref) return '';
    if (typeof ref === 'object') return String(ref?.nombre ?? ref?.id ?? '');
    return String(ref);
  };

  const fechaLegible = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-2xl bg-white shadow-lg h-full p-6 overflow-y-auto">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <HiOutlineEye />
          DETALLE DEL MOVIMIENTO
        </h2>
        <p className="text-sm text-gray-500 mt-1">Visualiza la información del movimiento realizado.</p>

        <div className="mt-6 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <Field label="ID / Código" value={String(data.codigo ?? data.id ?? '')} />
            <Field label="Fecha" value={fechaLegible(data.fecha)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Almacén Origen" value={nombreAlmacen(data.almacen_origen)} />
            <Field label="Almacén Destino" value={nombreAlmacen(data.almacen_destino)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Estado" value={nombreEstado(data.estado)} />
          </div>

          <Field label="Descripción" value={String(data.descripcion ?? '')} />

          {/* Detalle */}
          <div>
            <div className="text-xs text-gray-500 mb-1">Detalle</div>
            <div className="border border-gray-200 rounded overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="p-2">Código</th>
                    <th className="p-2">Producto</th>
                    <th className="p-2 text-right">Cantidad</th>
                    <th className="p-2 text-right">Stock previo</th>
                    <th className="p-2 text-right">Stock posterior</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.items ?? []).length > 0 ? (
                    (data.items ?? []).map((it, idx) => (
                      <tr key={`${it.producto_uuid ?? it.producto_id ?? idx}`} className="border-t">
                        <td className="p-2">{it.codigo_identificacion ?? ''}</td>
                        <td className="p-2">
                          <div className="font-medium">{it.nombre_producto ?? ''}</div>
                          {!!it.descripcion && (
                            <div className="text-gray-500 line-clamp-1">{it.descripcion}</div>
                          )}
                        </td>
                        <td className="p-2 text-right">{Number(it.cantidad ?? 0)}</td>
                        <td className="p-2 text-right">
                          {typeof it.stock_previo === 'number' ? it.stock_previo : ''}
                        </td>
                        <td className="p-2 text-right">
                          {typeof it.stock_posterior === 'number' ? it.stock_posterior : ''}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-3 text-center text-gray-500 italic" colSpan={5}>
                        Sin ítems en este movimiento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Meta opcional */}
          {data.meta && Object.keys(data.meta).length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(data.meta).map(([k, v]) => (
                <Field key={k} label={toLabel(k)} value={stringifyValue(v)} />
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="border px-4 py-2 text-sm rounded hover:bg-gray-50">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="border border-gray-200 rounded px-3 py-2">{value ?? ''}</div>
    </div>
  );
}

function toLabel(key: string) {
  const spaced = key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, (_m, a, b) => `${a} ${b}`);
  return spaced
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function stringifyValue(v: unknown) {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
