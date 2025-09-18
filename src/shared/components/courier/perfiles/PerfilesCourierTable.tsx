// src/shared/components/courier/perfiles/PerfilesCourierTable.tsx
import { useMemo, useState } from 'react';
import { FaRegEdit } from 'react-icons/fa';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import Paginator from '@/shared/components/Paginator';
import type { PerfilTrabajador } from '@/services/ecommerce/perfiles/perfilesTrabajador.types';
import PerfilesCourierEditModal from '@/shared/components/courier/perfiles/PerfilesCourierEditModal';

type Props = {
  data: PerfilTrabajador[];
  loading?: boolean;
  onReload?: () => void;             // <- lo llamamos después de editar
  onEdit?: (perfil: PerfilTrabajador) => void; // opcional: callback externo
};

export default function PerfilesCourierTable({ data, loading = false, onReload, onEdit }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [isEditOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<PerfilTrabajador | null>(null);

  const totalPages = useMemo(
    () => Math.ceil((data?.length || 0) / itemsPerPage),
    [data]
  );

  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return (data || []).slice(start, start + itemsPerPage);
  }, [data, currentPage]);

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
                    .map((__, i) => (
                      <td key={i} className="px-4 py-2">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                </tr>
              ))
            ) : !data || data.length === 0 ? (
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
                            "
                          >
                            {modulos
                              .map((mod: string) => mod.charAt(0).toUpperCase() + mod.slice(1))
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
                          setSelected(item);
                          setEditOpen(true);
                          onEdit?.(item); // mantiene tu callback externo si lo usas
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
              if (page >= 1 && page <= totalPages) setCurrentPage(page);
            }}
          />
        </div>
      )}

      {/* Modal de edición */}
      <PerfilesCourierEditModal
        isOpen={isEditOpen}
        onClose={() => {
          setEditOpen(false);
          setSelected(null);
        }}
        trabajador={selected}
        onUpdated={() => {
          // recargar data en el padre (si pasó onReload)
          onReload?.();
        }}
      />
    </div>
  );
}
