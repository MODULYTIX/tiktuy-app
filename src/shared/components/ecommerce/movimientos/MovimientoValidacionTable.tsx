import { useEffect, useState } from 'react';
import { FaEye } from 'react-icons/fa';
import { useAuth } from '@/auth/context';
import Paginator from '../../Paginator';
import { fetchMovimientos } from '@/services/ecommerce/almacenamiento/almacenamiento.api';
import type { MovimientoAlmacen } from '@/services/ecommerce/almacenamiento/almacenamiento.types';

export default function MovimientoValidacionTable() {
  const { token } = useAuth();
  const [movimientos, setMovimientos] = useState<MovimientoAlmacen[]>([]);

  useEffect(() => {
    if (!token) return;
    fetchMovimientos(token)
      .then(setMovimientos)
      .catch(console.error);
  }, [token]);

  const renderEstado = (estado?: { nombre?: string }) => {
    const nombre = estado?.nombre?.toLowerCase();

    switch (nombre) {
      case 'activo':
        return (
          <span className="text-white bg-primaryDark p-1 rounded-sm text-xs font-medium">
            Activo
          </span>
        );
      case 'descontinuado':
        return (
          <span className="text-white bg-primaryDark/25 p-1 rounded-sm text-xs font-medium">
            Descontinuado
          </span>
        );
      case 'observado':
        return (
          <span className="text-red-600 text-sm font-medium">❗ Observado</span>
        );
      default:
        return <span className="text-gray-500 text-sm">-</span>;
    }
  };

  const handleVerClick = (mov: MovimientoAlmacen) => {
    // Aquí puedes abrir un modal con los detalles del movimiento
    console.log('Ver movimiento:', mov);
  };

  return (
    <div className="bg-white rounded shadow-sm overflow-hidden mt-4">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            {['Código', 'Desde', 'Hacia', 'Descripción', 'Fec. Movimiento', 'Estado', 'Acciones'].map((h) => (
              <th key={h} className="p-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {movimientos.map((m) => (
            <tr key={m.uuid} className="border-t">
              <td className="p-3">{m.uuid.slice(0, 8).toUpperCase()}</td>
              <td className="p-3">{m.almacen_origen?.nombre_almacen || '-'}</td>
              <td className="p-3">{m.almacen_destino?.nombre_almacen || '-'}</td>
              <td className="p-3">{m.descripcion || '-'}</td>
              <td className="p-3">
                {m.fecha_movimiento
                  ? new Date(m.fecha_movimiento).toLocaleDateString()
                  : '-'}
              </td>
              <td className="p-3 text-center">{renderEstado(m.estado)}</td>
              <td className="p-3 flex gap-2">
                <FaEye
                  className="text-blue-600 cursor-pointer"
                  onClick={() => handleVerClick(m)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="p-4 border-t flex justify-end">
        <Paginator totalPages={1} currentPage={1} onPageChange={() => {}} />
      </div>
    </div>
  );
}
