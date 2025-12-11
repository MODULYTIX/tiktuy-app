// src/shared/components/courier/perfiles/PerfilesCourierTable.tsx
import { useMemo, useState } from "react";
import { FaRegEdit } from "react-icons/fa";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import Paginator from "@/shared/components/Paginator";
import type { PerfilTrabajador } from "@/services/ecommerce/perfiles/perfilesTrabajador.types";
import PerfilesCourierEditModal from "@/shared/components/courier/perfiles/PerfilesCourierEditModal";

type Props = {
  data: PerfilTrabajador[];
  loading?: boolean;
  onReload?: () => void; // <- lo llamamos después de editar
  onEdit?: (perfil: PerfilTrabajador) => void; // opcional: callback externo
};

export default function PerfilesCourierTable({
  data,
  loading = false,
  onReload,
  onEdit,
}: Props) {
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
      {/* Card tabla con el mismo formato que Ecommerce/Cuadre */}
      <div className="relative overflow-hidden rounded-md border border-gray30 bg-white shadow-default">
        <section className="flex-1 overflow-auto">
          <div className="overflow-x-auto bg-white">
            <table className="min-w-full table-fixed rounded-t-md border-b border-gray30 bg-white text-[12px]">
              <colgroup>
                <col className="w-[10%]" /> {/* F. Creación */}
                <col className="w-[14%]" /> {/* Nombre */}
                <col className="w-[14%]" /> {/* Apellido */}
                <col className="w-[10%]" /> {/* DNI */}
                <col className="w-[16%]" /> {/* Correo */}
                <col className="w-[12%]" /> {/* Teléfono */}
                <col className="w-[12%]" /> {/* Rol - Perfil */}
                <col className="w-[12%]" /> {/* Módulo asignado */}
                <col className="w-[10%]" /> {/* Acciones */}
              </colgroup>

              <thead className="bg-[#E5E7EB]">
                <tr className="font-roboto font-medium text-gray70">
                  <th className="px-4 py-3 text-left">F. Creación</th>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Apellido</th>
                  <th className="px-4 py-3 text-left">DNI</th>
                  <th className="px-4 py-3 text-left">Correo</th>
                  <th className="px-4 py-3 text-left">Teléfono</th>
                  <th className="px-4 py-3 text-left">Rol - Perfil</th>
                  <th className="px-4 py-3 text-left">Módulo asignado</th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray20">
                {loading ? (
                  Array.from({ length: itemsPerPage }).map((_, idx) => (
                    <tr key={idx} className="hover:bg-transparent">
                      {Array(9)
                        .fill(null)
                        .map((__, i) => (
                          <td key={i} className="px-4 py-3">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ))}
                    </tr>
                  ))
                ) : !data || data.length === 0 ? (
                  <tr className="hover:bg-transparent">
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center italic text-gray70"
                    >
                      No hay perfiles registrados.
                    </td>
                  </tr>
                ) : (
                  currentData.map((item) => {
                    const modulos = (item.modulo_asignado || [])
                      .map((m: string) => m.trim())
                      .filter(Boolean);

                    return (
                      <tr
                        key={item.id}
                        className="transition-colors hover:bg-gray10"
                      >
                        <td className="px-4 py-3 text-gray70">
                          {item.fecha_creacion
                            ? new Date(
                                item.fecha_creacion
                              ).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-gray80">
                          {item.nombres || "-"}
                        </td>
                        <td className="px-4 py-3 text-gray80">
                          {item.apellidos || "-"}
                        </td>
                        <td className="px-4 py-3 text-gray80">
                          {item.DNI_CI || "-"}
                        </td>
                        <td className="px-4 py-3 text-gray80">
                          {item.correo || "-"}
                        </td>
                        <td className="px-4 py-3 text-gray80">
                          {item.telefono || "-"}
                        </td>
                        <td className="px-4 py-3 text-gray80">
                          {item.perfil || "-"}
                        </td>

                        <td className="px-4 py-3 text-gray80">
                          {modulos.length > 0 ? (
                            <div className="group relative cursor-pointer">
                              <span className="capitalize">{modulos[0]}</span>
                              <div
                                className="
                                  absolute left-0 top-full z-10 mt-1 hidden max-w-xs whitespace-normal break-words
                                  rounded bg-gray-800 p-2 text-xs text-white shadow-lg group-hover:block
                                "
                              >
                                {modulos
                                  .map(
                                    (mod: string) =>
                                      mod.charAt(0).toUpperCase() +
                                      mod.slice(1)
                                  )
                                  .join("\n")}
                              </div>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <FaRegEdit
                            className="cursor-pointer text-yellow-600"
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
        </section>
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
