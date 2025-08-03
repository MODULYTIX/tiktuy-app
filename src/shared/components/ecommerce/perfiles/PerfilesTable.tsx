import { useEffect, useState } from 'react';
import { FaRegEdit } from 'react-icons/fa';
import Paginator from '../../Paginator';
import { Skeleton } from '../../ui/Skeleton';
import { fetchPerfilesTrabajador } from '@/services/ecommerce/perfiles/perfilesTrabajador.api';
import type { PerfilTrabajador } from '@/services/ecommerce/perfiles/perfilesTrabajador.types';

export default function PerfilesTable() {
  const [data, setData] = useState<PerfilTrabajador[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchPerfilesTrabajador();
        setData(res);
      } catch (error) {
        console.error('Error al cargar trabajadores', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentPage]);

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
              <th className="px-4 py-3">Módulo</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, idx) => (
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
              : data.map((item) => (
                  <tr key={item.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {new Date(item.fecha_creacion).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">{item.usuario.nombres}</td>
                    <td className="px-4 py-3">{item.usuario.apellidos}</td>
                    <td className="px-4 py-3">{item.usuario.DNI_CI}</td>
                    <td className="px-4 py-3">{item.usuario.correo}</td>
                    <td className="px-4 py-3">{item.usuario.telefono}</td>
                    <td className="px-4 py-3">{item.perfil.nombre_rol}</td>
                    <td className="px-4 py-3">{item.perfil.modulo_asignado}</td>

                    <td className="px-4 py-3">
                      <FaRegEdit className="text-yellow-600 cursor-pointer" />
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Paginador (opcional si haces paginación real) */}
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
