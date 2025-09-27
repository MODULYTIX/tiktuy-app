import { useEffect, useState, useCallback, useMemo } from 'react';
import { FaRegEdit } from 'react-icons/fa';
import { Skeleton } from '../../ui/Skeleton';
import { useAuth } from '@/auth/context';
import { fetchPerfilTrabajadores } from '@/services/ecommerce/perfiles/perfilesTrabajador.api';
import type { PerfilTrabajador } from '@/services/ecommerce/perfiles/perfilesTrabajador.types';
import PerfilEditModal from './PerfilEditModal';

type Props = {
  onEdit?: (perfil: PerfilTrabajador) => void;
};

export default function PerfilesTable({ onEdit }: Props) {
  const { token } = useAuth();
  const [data, setData] = useState<PerfilTrabajador[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  //  estado para edición
  const [isEditOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<PerfilTrabajador | null>(null);

  const itemsPerPage = 6;
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentData = data.slice(indexOfFirst, indexOfLast);

  // 👉 función reutilizable para cargar (y recargar) la tabla
  const loadPerfiles = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetchPerfilTrabajadores(token);
      setData(res || []);
      setCurrentPage(1); // Reinicia a la primera página al cargar datos nuevos
    } catch (error) {
      console.error('Error al cargar perfiles de trabajadores', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadPerfiles();
  }, [loadPerfiles]);

  // Lógica del paginador (modelo base)
  const pagerItems = useMemo(() => {
    const maxButtons = 5; // Número máximo de botones
    const pages: (number | string)[] = [];

    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);

      if (currentPage <= 3) {
        start = 1;
        end = maxButtons;
      } else if (currentPage >= totalPages - 2) {
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
  }, [totalPages, currentPage]);

  // Filas vacías para mantener altura constante

  return (
    <div className="mt-6 bg-white rounded-md overflow-hidden shadow-default">
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed text-smborder-b border-gray30">
          <colgroup>
            <col className="w-[8%]" />
            <col className="w-[16%]" />
            <col className="w-[16%]" />
            <col className="w-[16%]" />
            <col className="w-[8%]" />
            <col className="w-[8%]" />
            <col className="w-[8%]" />
          </colgroup>
          <thead className="bg-[#E5E7EB]">
            <tr className="text-gray70 font-roboto font-medium text-xs">
              <th className="px-4 py-3 text-left">F. Creación</th>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Apellido</th>
              <th className="px-4 py-3 text-left">DNI</th>
              <th className="px-4 py-3 text-left">Correo</th>
              <th className="px-4 py-3 text-left">Teléfono</th>
              <th className="px-4 py-3 text-center">Rol - Perfil</th>
              <th className="px-4 py-3 text-center">Módulo asignado</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: itemsPerPage }).map((_, idx) => (
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
              currentData.map((item) => {
                const modulos = (item.modulo_asignado || [])
                  .map((m: string) => m.trim())
                  .filter(Boolean);

                return (
                  <tr key={item.id} className="border-b border-gray30 hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs">{item.fecha_creacion ? new Date(item.fecha_creacion).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3 text-xs">{item.nombres || '-'}</td>
                    <td className="px-4 py-3 text-xs">{item.apellidos || '-'}</td>
                    <td className="px-4 py-3 text-xs">{item.DNI_CI || '-'}</td>
                    <td className="px-4 py-3 text-xs">{item.correo || '-'}</td>
                    <td className="px-4 py-3 text-xs">{item.telefono || '-'}</td>
                    <td className="px-4 py-3 text-xs">{item.perfil || '-'}</td>
                    <td className="px-4 py-3 text-xs">
                      {modulos.length > 0 ? (
                        <div className="relative group cursor-pointer">
                          <span className="capitalize">{modulos[0]}</span>
                          <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 shadow-lg z-10 max-w-xs whitespace-normal break-words">
                            {modulos
                              .map((mod: string) => mod.charAt(0).toUpperCase() + mod.slice(1))
                              .join('\n')}
                          </div>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <FaRegEdit
                        className="text-yellow-600 cursor-pointer"
                        onClick={() => {
                          setSelected(item);
                          setEditOpen(true);
                          onEdit?.(item);
                        }}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginador */}
      {totalPages > 1 && (
        <div>
          <div className="flex items-center justify-end gap-2 border-b-[4px] border-gray90 py-3 px-3">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
            >
              &lt;
            </button>

            {pagerItems.map((p, i) =>
              typeof p === 'string' ? (
                <span key={`dots-${i}`} className="px-2 text-gray70">{p}</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  aria-current={currentPage === p ? 'page' : undefined}
                  className={[
                    'w-8 h-8 flex items-center justify-center rounded',
                    currentPage === p ? 'bg-gray90 text-white' : 'bg-gray10 text-gray70 hover:bg-gray20',
                  ].join(' ')}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
            >
              &gt;
            </button>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      <PerfilEditModal
        isOpen={isEditOpen}
        onClose={() => {
          setEditOpen(false);
          setSelected(null);
        }}
        trabajador={selected}
        onUpdated={() => {
          loadPerfiles();
        }}
      />
    </div>
  );
}
