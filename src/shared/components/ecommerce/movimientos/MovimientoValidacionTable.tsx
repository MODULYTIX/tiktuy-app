// src/shared/components/ecommerce/movimiento/MovimientoValidacionTable.tsx
import { useEffect, useMemo, useState } from 'react';
import { FaEye } from 'react-icons/fa';
import { useAuth } from '@/auth/context';
import Paginator from '../../Paginator';
import { fetchMovimientos } from '@/services/ecommerce/almacenamiento/almacenamiento.api';
import type { MovimientoAlmacen } from '@/services/ecommerce/almacenamiento/almacenamiento.types';

export default function MovimientoValidacionTable() {
  const { token } = useAuth();
  const [movimientos, setMovimientos] = useState<MovimientoAlmacen[]>([]);
  const [loading, setLoading] = useState(false);

  // paginación local
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchMovimientos(token)
      .then(setMovimientos)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  // Alias de compatibilidad: "Activo" (movimiento viejo) → "Proceso"
  const normalizeEstado = (nombre?: string) => {
    if (!nombre) return '-';
    if (nombre.toLowerCase() === 'activo') return 'Proceso';
    return nombre;
  };

  const renderEstado = (estado?: { nombre?: string }) => {
    const nombreNorm = normalizeEstado(estado?.nombre);
    const nombre = nombreNorm.toLowerCase();

    if (nombre === 'validado') {
      return <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-600">Validado</span>;
    }
    if (nombre === 'proceso' || nombre === 'en proceso') {
      return <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700">Proceso</span>;
    }
    if (nombre === 'observado') {
      return <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-600">Observado</span>;
    }
    return <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-600">{nombreNorm}</span>;
  };

  const fmtFecha = (iso?: string) =>
    iso
      ? new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
          new Date(iso)
        )
      : '-';

  const handleVerClick = (mov: MovimientoAlmacen) => {
    // Aquí puedes abrir un modal con los detalles del movimiento
    console.log('Ver movimiento:', mov);
  };

  const sorted = useMemo(
    () =>
      [...movimientos].sort(
        (a, b) =>
          new Date(b.fecha_movimiento ?? b.fecha_movimiento ?? 0).getTime() -
          new Date(a.fecha_movimiento ?? a.fecha_movimiento ?? 0).getTime()
      ),
    [movimientos]
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const current = sorted.slice(indexOfFirst, indexOfLast);

  useEffect(() => {
    // si cambian los datos y la página actual queda fuera de rango, reajustar
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  return (
    <div className="bg-white rounded shadow-sm overflow-hidden mt-4">
      <div className="px-4 py-3 border-b text-sm text-gray-500">
        {loading ? 'Cargando movimientos…' : `Mostrando ${current.length} de ${sorted.length} resultados`}
      </div>

      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            {['Código', 'Desde', 'Hacia', 'Descripción', 'Fec. Movimiento', 'Estado', 'Acciones'].map((h) => (
              <th key={h} className="p-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {current.map((m) => (
            <tr key={m.uuid} className="border-t hover:bg-gray-50">
              <td className="p-3">{m.uuid.slice(0, 8).toUpperCase()}</td>
              <td className="p-3">{m.almacen_origen?.nombre_almacen || '-'}</td>
              <td className="p-3">{m.almacen_destino?.nombre_almacen || '-'}</td>
              <td className="p-3">{m.descripcion || '-'}</td>
              <td className="p-3">{fmtFecha(m.fecha_movimiento)}</td>
              <td className="p-3">{renderEstado(m.estado)}</td>
              <td className="p-3">
                <button
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                  onClick={() => handleVerClick(m)}
                  title="Ver detalle"
                >
                  <FaEye />
                  <span className="sr-only">Ver</span>
                </button>
              </td>
            </tr>
          ))}

          {!loading && current.length === 0 && (
            <tr>
              <td className="p-6 text-center text-gray-400" colSpan={7}>
                No hay movimientos.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="p-4 border-t flex justify-end">
        <Paginator
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={(p) => {
            if (p >= 1 && p <= totalPages) setCurrentPage(p);
          }}
        />
      </div>
    </div>
  );
}
