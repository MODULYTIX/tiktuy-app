// src/shared/components/courier/movimiento/TableMovimientoCourier.tsx
import { useEffect, useMemo, useState } from 'react';
import { FaEye, FaCheck } from 'react-icons/fa';
import Paginator from '@/shared/components/Paginator';
import { useAuth } from '@/auth/context';
import {
  fetchCourierMovimientos,
} from '@/services/courier/movimiento/movimientoCourier.api';
import type {
  CourierMovimientoItem,
  CourierMovimientosResponse,
} from '@/services/courier/movimiento/movimientoCourier.type';
import type { MovimientoCourierFilters } from '../../movimiento/MovimientoFilterCourier';
import MovimientoCourierModal from './MovimientoCourierModal';

interface Props {
  filters: MovimientoCourierFilters;
}

export default function TableMovimientoCourier({ filters }: Props) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<CourierMovimientoItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // paginación local (filtrada)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // modal
  const [openModal, setOpenModal] = useState(false);
  const [modalUuid, setModalUuid] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'ver' | 'validar'>('ver');

  const load = () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    fetchCourierMovimientos(token, { page: 1, limit: 500 })
      .then((res: CourierMovimientosResponse) => {
        setItems(res.items || []);
      })
      .catch((e) => setError(e?.message || 'Error al obtener movimientos'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // resetear a primera página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.estado, filters.fecha, filters.q]);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const fechaStr = filters.fecha; // YYYY-MM-DD
    const estadoSel = filters.estado.trim().toLowerCase();

    return items.filter((it) => {
      const byEstado = estadoSel
        ? (it.estado?.nombre || '').toLowerCase() === estadoSel
        : true;

      const byFecha = fechaStr
        ? new Date(it.fecha_movimiento).toISOString().slice(0, 10) === fechaStr
        : true;

      const textHaystack = [
        it.descripcion || '',
        it.almacen_origen?.nombre_almacen || '',
        it.almacen_destino?.nombre_almacen || '',
      ]
        .join(' ')
        .toLowerCase();

      const byQ = q ? textHaystack.includes(q) : true;

      return byEstado && byFecha && byQ;
    });
  }, [items, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentMovimientos = filtered.slice(indexOfFirst, indexOfLast);

  const renderEstado = (estado?: string) => {
    const name = (estado || '').toLowerCase();
    if (name === 'validado') {
      return <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-600">Validado</span>;
    }
    if (name === 'proceso' || name === 'en proceso') {
      return <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-600">Proceso</span>;
    }
    if (name === 'observado') {
      return <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-600">Observado</span>;
    }
    // fallback
    return <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-600">{estado || '-'}</span>;
  };

  const fmtFecha = (iso: string) =>
    new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
      new Date(iso)
    );

  const codigoFromUuid = (uuid: string) => (uuid ? uuid.slice(0, 8).toUpperCase() : '-');

  const openView = (uuid: string) => {
    setModalUuid(uuid);
    setModalMode('ver');
    setOpenModal(true);
  };

  const openValidate = (uuid: string) => {
    setModalUuid(uuid);
    setModalMode('validar');
    setOpenModal(true);
  };

  return (
    <>
      <div className="w-full bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b">
          {loading && <p className="text-sm text-gray-500">Cargando movimientos…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && !error && (
            <p className="text-sm text-gray-500">
              Mostrando {currentMovimientos.length} de {filtered.length} resultados
            </p>
          )}
        </div>

        <table className="w-full text-sm text-left text-gray-600">
          <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Desde</th>
              <th className="px-4 py-3">Hacia</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3">Fec. Generación</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentMovimientos.map((mov) => (
              <tr key={mov.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{codigoFromUuid(mov.uuid)}</td>
                <td className="px-4 py-3">{mov.almacen_origen?.nombre_almacen || '-'}</td>
                <td className="px-4 py-3">{mov.almacen_destino?.nombre_almacen || '-'}</td>
                <td className="px-4 py-3">{mov.descripcion || '-'}</td>
                <td className="px-4 py-3">{fmtFecha(mov.fecha_movimiento)}</td>
                <td className="px-4 py-3">{renderEstado(mov.estado?.nombre)}</td>
                <td className="px-4 py-3 flex items-center gap-2">
                  {(mov.estado?.nombre || '').toLowerCase() === 'proceso' && (
                    <button
                      className="text-green-500 hover:text-green-700"
                      title="Validar"
                      onClick={() => openValidate(mov.uuid)}
                    >
                      <FaCheck />
                    </button>
                  )}
                  <button
                    className="text-blue-500 hover:text-blue-700"
                    title="Ver detalle"
                    onClick={() => openView(mov.uuid)}
                  >
                    <FaEye />
                  </button>
                </td>
              </tr>
            ))}

            {!loading && !error && currentMovimientos.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-400" colSpan={7}>
                  No hay resultados para los filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="border-t p-4">
            <Paginator
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => {
                if (page >= 1 && page <= totalPages) setCurrentPage(page);
              }}
            />
          </div>
        )}
      </div>

      {/* Modal de detalle/validación */}
      {openModal && modalUuid && (
        <MovimientoCourierModal
          open={openModal}
          uuid={modalUuid}
          mode={modalMode}
          onClose={() => setOpenModal(false)}
          onValidated={() => {
            setOpenModal(false);
            load(); // refrescar la lista tras validar
          }}
        />
      )}
    </>
  );
}
