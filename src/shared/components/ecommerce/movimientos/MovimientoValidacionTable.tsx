import { useEffect, useMemo, useState } from 'react';
import { FaEye } from 'react-icons/fa';
import { useAuth } from '@/auth/context';
import { fetchMovimientos } from '@/services/ecommerce/almacenamiento/almacenamiento.api';
import type { MovimientoAlmacen } from '@/services/ecommerce/almacenamiento/almacenamiento.types';
import VerMovimientoRealizadoModal from './VerMovimientoRealizadoModal';

const PAGE_SIZE = 6;

export default function MovimientoValidacionTable() {
  const { token } = useAuth();
  const [movimientos, setMovimientos] = useState<MovimientoAlmacen[]>([]);
  const [loading, setLoading] = useState(false);

  // modal "ver"
  const [verOpen, setVerOpen] = useState(false);
  const [verUuid, setVerUuid] = useState<string | null>(null);

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
      return (
        <span className={`${base} bg-yellow-100 text-yellow-700`}>Proceso</span>
      );
    if (nombre === 'observado')
      return (
        <span className={`${base} bg-red-100 text-red-700`}>Observado</span>
      );
    return (
      <span className={`${base} bg-gray30 text-gray80`}>{nombreNorm}</span>
    );
  };

  const fmtFecha = (iso?: string) =>
    iso
      ? new Intl.DateTimeFormat('es-PE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(new Date(iso))
      : '-';

  const handleVerClick = (mov: MovimientoAlmacen) => {
    setVerUuid(mov.uuid);
    setVerOpen(true);
  };

  const sorted = useMemo(
    () =>
      [...movimientos].sort((a, b) =>
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
              <col className="w-[6%]" /> {/* Estado */}
              <col className="w-[6%]" /> {/* Acciones */}
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
                  <td
                    className="px-4 py-6 text-center text-gray70 italic"
                    colSpan={7}>
                    No hay movimientos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginador */}
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

      {/* Modal de VER — ahora pasa UUID para cargar el detalle desde la API */}
      <VerMovimientoRealizadoModal
        open={verOpen}
        onClose={() => {
          setVerOpen(false);
          setVerUuid(null);
        }}
        uuid={verUuid ?? ''}
      />
    </div>
  );
}
