import { useEffect, useMemo, useState } from 'react';
import { FaRegEdit } from 'react-icons/fa';
// ⛔️ Eliminado Paginator (usaremos el del modelo base)
// import Paginator from '../../Paginator';
import { Skeleton } from '../../ui/Skeleton';
import { useAuth } from '@/auth/context';
import { fetchPerfilTrabajadores } from '@/services/ecommerce/perfiles/perfilesTrabajador.api';
import type { PerfilTrabajador } from '@/services/ecommerce/perfiles/perfilesTrabajador.types';

type Props = {
  onEdit?: (perfil: PerfilTrabajador) => void;
};

const ROWS_PER_PAGE = 10; // modelo base

export default function PerfilesTable({ onEdit }: Props) {
  const { token } = useAuth();
  const [data, setData] = useState<PerfilTrabajador[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // totalPages y pageData (modelo base)
  const totalPages = Math.max(1, Math.ceil(data.length / ROWS_PER_PAGE));

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const pageData = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return data.slice(start, start + ROWS_PER_PAGE);
  }, [data, page]);

  // paginador (ventana 5 + elipsis)
  const pagerItems = useMemo(() => {
    const maxButtons = 5;
    const pages: (number | string)[] = [];
    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, page - 2);
      let end = Math.min(totalPages, page + 2);
      if (page <= 3) { start = 1; end = maxButtons; }
      else if (page >= totalPages - 2) { start = totalPages - (maxButtons - 1); end = totalPages; }
      for (let i = start; i <= end; i++) pages.push(i);
      if (start > 1) { pages.unshift('...'); pages.unshift(1); }
      if (end < totalPages) { pages.push('...'); pages.push(totalPages); }
    }
    return pages;
  }, [page, totalPages]);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    setPage(p);
  };

  // filas vacías para altura constante
  const emptyRows = !loading ? Math.max(0, ROWS_PER_PAGE - pageData.length) : 0;

  useEffect(() => {
    const loadPerfiles = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetchPerfilTrabajadores(token);
        setData(res || []);
        setPage(1); // reinicia a la primera página al cargar nuevos datos
      } catch (error) {
        console.error('Error al cargar perfiles de trabajadores', error);
      } finally {
        setLoading(false);
      }
    };

    loadPerfiles();
  }, [token]);

  return (
    <div className="mt-6">
      {/* Tabla — patrón base */}
      <div className="bg-white rounded-md overflow-hidden shadow-default">
        <section className="flex-1 overflow-auto">
          <div className="overflow-x-auto bg-white">
            <table className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30 rounded-t-md">
              {/* colgroup (100%) */}
              <colgroup>
                <col className="w-[12%]" /> {/* F. Creación */}
                <col className="w-[14%]" /> {/* Nombre */}
                <col className="w-[14%]" /> {/* Apellido */}
                <col className="w-[10%]" /> {/* DNI */}
                <col className="w-[20%]" /> {/* Correo */}
                <col className="w-[10%]" /> {/* Teléfono */}
                <col className="w-[12%]" /> {/* Rol - Perfil */}
                <col className="w-[6%]" />  {/* Módulo asignado */}
                <col className="w-[2%]" />  {/* Acciones */}
              </colgroup>

              <thead className="bg-[#E5E7EB]">
                <tr className="text-gray70 font-roboto font-medium">
                  <th className="px-4 py-3 text-left">F. CREACIÓN</th>
                  <th className="px-4 py-3 text-left">NOMBRE</th>
                  <th className="px-4 py-3 text-left">APELLIDO</th>
                  <th className="px-4 py-3 text-left">DNI</th>
                  <th className="px-4 py-3 text-left">CORREO</th>
                  <th className="px-4 py-3 text-left">TELÉFONO</th>
                  <th className="px-4 py-3 text-left">ROL - PERFIL</th>
                  <th className="px-4 py-3 text-left">MÓDULO ASIGNADO</th>
                  <th className="px-4 py-3 text-center">ACCIONES</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray20">
                {/* Skeletons */}
                {loading &&
                  Array.from({ length: ROWS_PER_PAGE }).map((_, idx) => (
                    <tr key={`sk-${idx}`} className="hover:bg-transparent">
                      {Array.from({ length: 9 }).map((__, i) => (
                        <td key={i} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))}

                {/* Sin datos */}
                {!loading && data.length === 0 && (
                  <tr className="hover:bg-transparent">
                    <td colSpan={9} className="px-4 py-6 text-center text-gray-500">
                      No hay perfiles registrados.
                    </td>
                  </tr>
                )}

                {/* Filas */}
                {!loading &&
                  pageData.map((item) => {
                    const modulos = (item.modulo_asignado || [])
                      .map((m: string) => m.trim())
                      .filter(Boolean);

                    return (
                      <tr key={item.id} className="hover:bg-gray10 transition-colors">
                        <td className="px-4 py-3 text-gray70 font-[400]">
                          {item.fecha_creacion
                            ? new Date(item.fecha_creacion).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray70 font-[400]">{item.nombres || '-'}</td>
                        <td className="px-4 py-3 text-gray70 font-[400]">{item.apellidos || '-'}</td>
                        <td className="px-4 py-3 text-gray70 font-[400]">{item.DNI_CI || '-'}</td>
                        <td className="px-4 py-3 text-gray70 font-[400]">{item.correo || '-'}</td>
                        <td className="px-4 py-3 text-gray70 font-[400]">{item.telefono || '-'}</td>
                        <td className="px-4 py-3 text-gray70 font-[400]">{item.perfil || '-'}</td>

                        <td className="px-4 py-3 text-gray70 font-[400]">
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

                        {/* Acciones — SIN CAMBIOS */}
                        <td className="px-4 py-3">
                          <FaRegEdit
                            className="text-yellow-600 cursor-pointer"
                            onClick={() => onEdit?.(item)}
                          />
                        </td>
                      </tr>
                    );
                  })}

                {/* Empty rows para altura constante */}
                {!loading && data.length > 0 && emptyRows > 0 &&
                  Array.from({ length: emptyRows }).map((_, idx) => (
                    <tr key={`empty-${idx}`} className="hover:bg-transparent">
                      {Array.from({ length: 9 }).map((__, i) => (
                        <td key={i} className="px-4 py-3">&nbsp;</td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Paginador base — visible si hay datos */}
          {!loading && data.length > 0 && (
            <div className="flex items-center justify-end gap-2 border-b-[4px] border-gray90 py-3 px-3 mt-2">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
              >
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
                    onClick={() => goToPage(p)}
                    aria-current={page === p ? 'page' : undefined}
                    className={[
                      'w-8 h-8 flex items-center justify-center rounded',
                      page === p ? 'bg-gray90 text-white' : 'bg-gray10 text-gray70 hover:bg-gray20',
                    ].join(' ')}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
              >
                &gt;
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
