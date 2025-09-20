// src/shared/components/ecommerce/movimiento/MovimientoValidacionTable.tsx
import { useEffect, useMemo, useState } from 'react';
import { FaEye } from 'react-icons/fa';
import { useAuth } from '@/auth/context';
import { fetchMovimientos } from '@/services/ecommerce/almacenamiento/almacenamiento.api';
import type { MovimientoAlmacen } from '@/services/ecommerce/almacenamiento/almacenamiento.types';
import VerMovimientoRealizadoModal, {
  type MovimientoRealizado,
} from '@/shared/components/ecommerce/movimientos/VerMovimientoRealizadoModal';

const PAGE_SIZE = 6;

type UnknownRecord = Record<string, unknown>;

function isRecord(v: unknown): v is UnknownRecord {
  return typeof v === 'object' && v !== null;
}

function pickFirstArray(obj: UnknownRecord, keys: string[]): unknown[] {
  for (const k of keys) {
    const v = obj[k];
    if (Array.isArray(v)) return v;
  }
  return [];
}

function pickString(obj: UnknownRecord, key: string): string | undefined {
  const v = obj[key];
  return typeof v === 'string' ? v : undefined;
}

function pickNumber(obj: UnknownRecord, key: string): number | undefined {
  const v = obj[key];
  return typeof v === 'number' ? v : undefined;
}

export default function MovimientoValidacionTable() {
  const { token } = useAuth();
  const [movimientos, setMovimientos] = useState<MovimientoAlmacen[]>([]);
  const [loading, setLoading] = useState(false);

  // modal "ver"
  const [verOpen, setVerOpen] = useState(false);
  const [verData, setVerData] = useState<MovimientoRealizado | null>(null);

  // paginación local
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchMovimientos(token)
      .then(setMovimientos)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  // Alias de compatibilidad: "Activo" → "Proceso"
  const normalizeEstado = (nombre?: string) => {
    if (!nombre) return '-';
    if (nombre.toLowerCase() === 'activo') return 'Proceso';
    return nombre;
  };

  const renderEstado = (estado?: { nombre?: string }) => {
    const nombreNorm = normalizeEstado(estado?.nombre);
    const nombre = nombreNorm.toLowerCase();
    const base =
      'inline-flex items-center justify-center px-3 py-[6px] rounded-full text-[12px] font-medium shadow-sm whitespace-nowrap';

    if (nombre === 'validado')
      return <span className={`${base} bg-black text-white`}>Validado</span>;
    if (nombre === 'proceso' || nombre === 'en proceso')
      return <span className={`${base} bg-yellow-100 text-yellow-700`}>Proceso</span>;
    if (nombre === 'observado')
      return <span className={`${base} bg-red-100 text-red-700`}>Observado</span>;
    return <span className={`${base} bg-gray30 text-gray80`}>{nombreNorm}</span>;
  };

  const fmtFecha = (iso?: string) =>
    iso
      ? new Intl.DateTimeFormat('es-PE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(new Date(iso))
      : '-';

  // Mapper seguro hacia el shape del modal (sin @ts-ignore)
  const mapMovimientoToRealizado = (m: MovimientoAlmacen): MovimientoRealizado => {
    const base = m as unknown as UnknownRecord;

    // Posibles nombres de colecciones de ítems
    const rawItems = pickFirstArray(base, ['items', 'detalles', 'movimiento_detalle']);

    const items = rawItems.map((raw) => {
      const it = raw as UnknownRecord;
      const prod = isRecord(it.producto) ? (it.producto as UnknownRecord) : undefined;

      const producto_id =
        pickNumber(it, 'producto_id') ?? (prod ? pickNumber(prod, 'id') : undefined);
      const producto_uuid =
        pickString(it, 'producto_uuid') ?? (prod ? pickString(prod, 'uuid') : undefined);

      const codigo_identificacion =
        pickString(it, 'codigo_identificacion') ??
        (prod ? pickString(prod, 'codigo_identificacion') : undefined) ??
        '';

      const nombre_producto =
        pickString(it, 'nombre_producto') ??
        (prod ? pickString(prod, 'nombre_producto') : undefined) ??
        '';

      const descripcion =
        pickString(it, 'descripcion') ?? (prod ? pickString(prod, 'descripcion') : undefined) ?? '';

      const cantidadRaw = pickNumber(it, 'cantidad');
      const cantidad = typeof cantidadRaw === 'number' ? cantidadRaw : 0;

      const stock_previo = pickNumber(it, 'stock_previo');
      const stock_posterior = pickNumber(it, 'stock_posterior');

      return {
        producto_id,
        producto_uuid,
        codigo_identificacion,
        nombre_producto,
        descripcion,
        cantidad,
        stock_previo,
        stock_posterior,
      };
    });

    // Origen/Destino: o el objeto, o fallback a nombre_* (string)
    const origen =
      (isRecord(base['almacen_origen']) ? (base['almacen_origen'] as UnknownRecord) : undefined) ??
      undefined;
    const destino =
      (isRecord(base['almacen_destino']) ? (base['almacen_destino'] as UnknownRecord) : undefined) ??
      undefined;

    const almacen_origen =
      origen ??
      (pickString(base, 'almacen_origen_nombre')
        ? { nombre_almacen: pickString(base, 'almacen_origen_nombre') }
        : undefined);

    const almacen_destino =
      destino ??
      (pickString(base, 'almacen_destino_nombre')
        ? { nombre_almacen: pickString(base, 'almacen_destino_nombre') }
        : undefined);

    // Usuario: puede venir como 'usuario' o 'creado_por'
    const usuario =
      (isRecord(base['usuario']) ? (base['usuario'] as UnknownRecord) : undefined) ??
      (isRecord(base['creado_por']) ? (base['creado_por'] as UnknownRecord) : undefined) ??
      null;

    // Estado: puede venir como objeto con nombre o como string
    const estadoObj = isRecord(base['estado']) ? (base['estado'] as UnknownRecord) : undefined;
    const estado =
      (estadoObj && pickString(estadoObj, 'nombre')) ??
      (typeof base['estado'] === 'string' ? (base['estado'] as string) : null);

    // Fechas tolerantes
    const fecha =
      pickString(base, 'fecha_movimiento') ??
      pickString(base, 'created_at') ??
      pickString(base, 'fecha') ??
      undefined;

    return {
      id: (typeof base['id'] === 'number' || typeof base['id'] === 'string') ? (base['id'] as number | string) : (pickString(base, 'uuid') ?? undefined),
      codigo: pickString(base, 'uuid') ?? undefined,
      fecha,
      descripcion: pickString(base, 'descripcion') ?? '',
      almacen_origen: almacen_origen ?? null,
      almacen_destino: almacen_destino ?? null,
      usuario,
      estado,
      items,
      meta: isRecord(base['meta']) ? (base['meta'] as UnknownRecord) : undefined,
    };
  };

  const handleVerClick = (mov: MovimientoAlmacen) => {
    const data = mapMovimientoToRealizado(mov);
    setVerData(data);
    setVerOpen(true);
  };

  const sorted = useMemo(
    () =>
      [...movimientos].sort(
        (a, b) =>
          new Date((a?.fecha_movimiento as unknown as string) ?? 0).getTime() <
          new Date((b?.fecha_movimiento as unknown as string) ?? 0).getTime()
            ? 1
            : -1
      ),
    [movimientos]
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const current = sorted.slice(start, start + PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // paginador estilo base (ventana de 5 con elipsis)
  const pagerItems = useMemo(() => {
    const maxButtons = 5;
    const pages: (number | string)[] = [];
    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, page - 2);
      let end = Math.min(totalPages, page + 2);
      if (page <= 3) {
        start = 1;
        end = maxButtons;
      } else if (page >= totalPages - 2) {
        start = totalPages - (maxButtons - 1);
        end = totalPages;
      }
      for (let i = start; i <= end; i++) pages.push(i);
      if (start > 1) {
        pages.unshift('...');
        pages.unshift(1);
      }
      if (end < totalPages) {
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  }, [page, totalPages]);

  // altura constante de la tabla
  const visibleCount = Math.max(1, current.length);
  const emptyRows = Math.max(0, PAGE_SIZE - visibleCount);

  return (
    <div className="bg-white rounded-md overflow-hidden shadow-default mt-4">
      <section className="flex-1 overflow-auto">
        <div className="overflow-x-auto bg-white">
          <table className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30 rounded-t-md">
            {/* Porcentajes por columna (suman 100%) */}
            <colgroup>
              <col className="w-[12%]" /> {/* Código */}
              <col className="w-[18%]" /> {/* Desde */}
              <col className="w-[18%]" /> {/* Hacia */}
              <col className="w-[28%]" /> {/* Descripción */}
              <col className="w-[12%]" /> {/* Fec. Movimiento */}
              <col className="w-[6%]" />  {/* Estado */}
              <col className="w-[6%]" />  {/* Acciones */}
            </colgroup>

            <thead className="bg-[#E5E7EB]">
              <tr className="text-gray70 font-roboto font-medium">
                <th className="px-4 py-3 text-left">CÓDIGO</th>
                <th className="px-4 py-3 text-left">DESDE</th>
                <th className="px-4 py-3 text-left">HACIA</th>
                <th className="px-4 py-3 text-left">DESCRIPCIÓN</th>
                <th className="px-4 py-3 text-left">FEC. MOVIMIENTO</th>
                <th className="px-4 py-3 text-center">ESTADO</th>
                <th className="px-4 py-3 text-center">ACCIONES</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray20">
              {current.map((m) => (
                <tr key={m.uuid} className="hover:bg-gray10 transition-colors">
                  <td className="px-4 py-3 text-gray70 font-[400]">
                    {m.uuid.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-gray70 font-[400]">
                    {m.almacen_origen?.nombre_almacen || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray70 font-[400]">
                    {m.almacen_destino?.nombre_almacen || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray70 font-[400]">
                    {m.descripcion || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray70 font-[400]">
                    {fmtFecha(m.fecha_movimiento as unknown as string)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {renderEstado(m.estado)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      <button
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => handleVerClick(m)}
                        title="Ver detalle"
                        aria-label={`Ver ${m.uuid}`}>
                        <FaEye />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Relleno para altura constante */}
              {emptyRows > 0 &&
                Array.from({ length: emptyRows }).map((_, idx) => (
                  <tr key={`empty-${idx}`} className="hover:bg-transparent">
                    {Array.from({ length: 7 }).map((__, i) => (
                      <td key={i} className="px-4 py-3">
                        &nbsp;
                      </td>
                    ))}
                  </tr>
                ))}

              {!loading && current.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-gray70 italic" colSpan={7}>
                    No hay movimientos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginador estilo base — visible si hay datos */}
        {sorted.length > 0 && (
          <div className="flex items-center justify-end gap-2 border-b-[4px] border-gray90 py-3 px-3 mt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10">
              &lt;
            </button>

            {pagerItems.map((p, i) =>
              typeof p === 'string' ? (
                <span key={`dots-${i}`} className="px-2 text-gray70">
                  {p}
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  aria-current={page === p ? 'page' : undefined}
                  className={[
                    'w-8 h-8 flex items-center justify-center rounded',
                    page === p
                      ? 'bg-gray90 text-white'
                      : 'bg-gray10 text-gray70 hover:bg-gray20',
                  ].join(' ')}>
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10">
              &gt;
            </button>
          </div>
        )}
      </section>

      {/* Modal de VER */}
      <VerMovimientoRealizadoModal
        open={verOpen}
        onClose={() => setVerOpen(false)}
        data={verData}
      />
    </div>
  );
}
