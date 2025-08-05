import { useEffect, useState } from 'react';
import { FaRegEdit } from 'react-icons/fa';
import Paginator from '../../Paginator';
import { Skeleton } from '../../ui/Skeleton';
import { useAuth } from '@/auth/context';
import { fetchPerfilTrabajadores } from '@/services/ecommerce/perfiles/perfilesTrabajador.api';
import type { PerfilTrabajador } from '@/services/ecommerce/perfiles/perfilesTrabajador.types';

type Props = {
  onEdit?: (perfil: PerfilTrabajador) => void;
};

export default function PerfilesTable({ onEdit }: Props) {
  const { token } = useAuth();
  const [data, setData] = useState<PerfilTrabajador[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadPerfiles = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetchPerfilTrabajadores(token);
        setData(res); // En el futuro puedes paginar aquí
      } catch (error) {
        console.error('Error al cargar perfiles de trabajadores', error);
      } finally {
        setLoading(false);
      }
    };

    loadPerfiles();
  }, [currentPage, token]);

  return (
    <div className="mt-6">
      <div className="overflow-x-auto bg-white rounded shadow-md">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700 font-semibold">
            <tr>
              <th className="px-4 py-3">F. Creación</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Apellido</th>
              <th className="px-4 py-3">DNI</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Rol - Perfil</th>
              <th className="px-4 py-3">Módulo asignado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="border-t">
                  {Array(9)
                    .fill(null)
                    .map((_, i) => (
                      <td key={i} className="px-4 py-2">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr className="border-t">
                <td colSpan={9} className="px-4 py-6 text-center text-gray-500">
                  No hay perfiles registrados.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {item.fecha_creacion
                      ? new Date(item.fecha_creacion).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="px-4 py-3">{item.usuario?.nombre || '-'}</td>
                  <td className="px-4 py-3">{item.usuario?.apellido || '-'}</td>
                  <td className="px-4 py-3">{item.usuario?.DNI_CI || '-'}</td>
                  <td className="px-4 py-3">{item.usuario?.correo || '-'}</td>
                  <td className="px-4 py-3">{item.usuario?.telefono || '-'}</td>
                  <td className="px-4 py-3">{item.perfil?.nombre || '-'}</td>
                  <td className="px-4 py-3">{item.modulo_asignado || '-'}</td>
                  <td className="px-4 py-3">
                    <FaRegEdit
                      className="text-yellow-600 cursor-pointer"
                      onClick={() => onEdit?.(item)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <Paginator
          currentPage={currentPage}
          totalPages={1}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
