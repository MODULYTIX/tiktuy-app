import { useEffect, useState, useCallback } from 'react';
import { FaRegEdit } from 'react-icons/fa';
import Paginator from '../../Paginator';
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

  // 👉 estado para edición
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
                  <tr key={item.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {item.fecha_creacion
                        ? new Date(item.fecha_creacion).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-4 py-3">{item.nombres || '-'}</td>
                    <td className="px-4 py-3">{item.apellidos || '-'}</td>
                    <td className="px-4 py-3">{item.DNI_CI || '-'}</td>
                    <td className="px-4 py-3">{item.correo || '-'}</td>
                    <td className="px-4 py-3">{item.telefono || '-'}</td>
                    <td className="px-4 py-3">{item.perfil || '-'}</td>

                    <td className="px-4 py-3">
                      {modulos.length > 0 ? (
                        <div className="relative group cursor-pointer">
                          <span className="capitalize">{modulos[0]}</span>
                          <div
                            className="
                              absolute left-0 top-full mt-1 hidden group-hover:block
                              bg-gray-800 text-white text-xs rounded p-2 shadow-lg z-10
                              max-w-xs whitespace-normal break-words
                            ">
                            {modulos
                              .map(
                                (mod: string) =>
                                  mod.charAt(0).toUpperCase() + mod.slice(1)
                              )
                              .join('\n')}
                          </div>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <FaRegEdit
                        className="text-yellow-600 cursor-pointer"
                        onClick={() => {
                          // 👇 abre el modal interno de edición y dispara el callback externo si existe
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

      {totalPages > 1 && (
        <div className="mt-4">
          <Paginator
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              if (page >= 1 && page <= totalPages) {
                setCurrentPage(page);
              }
            }}
          />
        </div>
      )}

      {/*  Modal de edición */}
      <PerfilEditModal
        isOpen={isEditOpen}
        onClose={() => {
          setEditOpen(false);
          setSelected(null);
        }}
        trabajador={selected}
        onUpdated={() => {
          // recarga la tabla al guardar cambios
          loadPerfiles();
        }}
      />
    </div>
  );
}
